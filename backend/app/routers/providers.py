from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ProviderProfile, Skill, Service, ServiceRequest, Review
from app.schemas.domain import (
    ProviderRegisterRequest, ProviderDetailResponse, PublicProviderResponse,
    ProviderProfileUpdate, NLPUpdateProposal, LocationUpdatePayload
)
from app.agents.profile_update_agent import parse_profile_update
from app.auth import get_current_user

router = APIRouter(prefix="/api/providers", tags=["Providers"])

class ProfilePublishingStatusUpdate(BaseModel):
    status: str  # 'DRAFT', 'PUBLISHED', 'UNPUBLISHED'

class UpcomingServiceItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    customer_name: str
    customer_location: Optional[str] = None
    preferred_date: Optional[str] = None
    status: str
    agreed_price: Optional[float] = None
    agreed_pricing_unit: Optional[str] = "per_service"
    payment_status: Optional[str] = "PAYMENT_PENDING"

class RecentReviewItem(BaseModel):
    id: str
    rating: int
    comment: Optional[str] = None
    created_at: Optional[str] = None
    customer_name: str

class SeniorDashboardStatsResponse(BaseModel):
    pending_requests_count: int
    upcoming_services_count: int
    completed_services_count: int
    rating: Optional[float] = None
    total_reviews: int
    profile_status: str
    profile_setup_completed: bool
    upcoming_services: List[UpcomingServiceItem]
    recent_reviews: List[RecentReviewItem]

class IncrementalUpdatePayload(BaseModel):
    add_skills: Optional[List[str]] = None
    remove_skills: Optional[List[str]] = None
    add_services: Optional[List[str]] = None
    remove_services: Optional[List[str]] = None
    update_fields: Optional[dict] = None

class AddSkillPayload(BaseModel):
    name: str
    category: Optional[str] = "General"

@router.get("/me", response_model=ProviderDetailResponse)
def get_my_provider_profile(
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = user_id or current_user.id
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found for this user")
    return profile

def validate_price_and_unit(price: Optional[float], pricing_unit: Optional[str]):
    if price is not None:
        if price < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service price cannot be negative.")
        unit = (pricing_unit or "per_service").lower()
        if price == 0 and unit != "negotiable":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price cannot be zero unless pricing unit is explicitly 'negotiable'.")

@router.post("", response_model=ProviderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_provider(
    payload: ProviderRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    validate_price_and_unit(payload.price, payload.pricing_unit)
    user = db.query(User).filter((User.id == current_user.id) | (User.email == payload.email)).first()
    if not user:
        user = current_user
        user.name = payload.name
        user.email = payload.email
        user.location = payload.location
    else:
        user.name = payload.name
        user.location = payload.location

    user.role = "SENIOR"
    db.flush()

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user.id).first()
    if not profile:
        profile = ProviderProfile(
            user_id=user.id,
            title=payload.title,
            bio=payload.bio,
            experience_years=payload.experience_years or 0,
            languages=payload.languages or "Tamil, English",
            target_age_group=payload.target_age_group,
            availability=payload.availability or "Available",
            service_delivery_mode=payload.service_delivery_mode or "BOTH",
            status="PUBLISHED",
            readiness_score=85,
            rating=0.0,
            total_reviews=0,
            price=payload.price,
            pricing_unit=payload.pricing_unit or "per_service",
            payment_method=payload.payment_method or "upi",
            payment_upi_id=payload.payment_upi_id,
            payment_instructions=payload.payment_instructions
        )
        db.add(profile)
        db.flush()
    else:
        # Profile already exists — update specified fields while preserving existing values
        if payload.title:
            profile.title = payload.title
        if payload.bio:
            profile.bio = payload.bio
        if payload.experience_years is not None and payload.experience_years > 0:
            profile.experience_years = payload.experience_years
        if payload.languages:
            profile.languages = payload.languages
        if payload.availability:
            profile.availability = payload.availability
        if payload.price is not None and payload.price > 0:
            profile.price = payload.price
        if payload.pricing_unit:
            profile.pricing_unit = payload.pricing_unit

    for skill_name in payload.skills:
        if not any(existing.name.lower() == skill_name.lower() for existing in profile.skills):
            skill = Skill(
                provider_id=profile.id,
                name=skill_name,
                category="General",
                proficiency="Expert"
            )
            db.add(skill)

    for srv_name in payload.services:
        if not any(existing.name.lower() == srv_name.lower() for existing in profile.services):
            service = Service(
                provider_id=profile.id,
                name=srv_name,
                description=f"{srv_name} by {payload.name}",
                category="General",
                price_range="Custom"
            )
            db.add(service)

    db.commit()
    db.refresh(profile)
    return profile

from app.services.matching_service import haversine_distance

@router.get("", response_model=List[PublicProviderResponse])
def list_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    customer_lat: Optional[float] = None,
    customer_lon: Optional[float] = None,
    radius_km: Optional[str] = "All",
    db: Session = Depends(get_db)
):
    # Filter ONLY Published profiles for customer marketplace search! Draft profiles are excluded.
    query = db.query(ProviderProfile).filter(
        (ProviderProfile.status == "PUBLISHED") | (ProviderProfile.status == None)
    )

    if category and category.strip():
        query = query.join(Skill).filter(Skill.category.ilike(f"%{category}%"))

    if search and search.strip():
        search_term = f"%{search}%"
        query = query.join(User).filter(
            (User.name.ilike(search_term)) |
            (ProviderProfile.title.ilike(search_term)) |
            (ProviderProfile.bio.ilike(search_term))
        )

    profiles = query.distinct().all()

    # Apply real Haversine geodesic distance radius filtering
    if customer_lat is not None and customer_lon is not None and radius_km and radius_km.strip().lower() != "all":
        try:
            r_max = float(radius_km)
            filtered = []
            for p in profiles:
                p_lat = p.latitude if p.latitude is not None else (p.user.latitude if p.user else None)
                p_lon = p.longitude if p.longitude is not None else (p.user.longitude if p.user else None)
                if p_lat is not None and p_lon is not None:
                    dist = haversine_distance(customer_lat, customer_lon, p_lat, p_lon)
                    if dist <= r_max:
                        filtered.append(p)
                else:
                    # If provider coordinates missing, keep in results
                    filtered.append(p)
            profiles = filtered
        except ValueError:
            pass

    return profiles[skip : skip + limit]

@router.get("/{provider_id}", response_model=PublicProviderResponse)
def get_provider(provider_id: str, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return profile

@router.put("/{provider_id}/publishing-status", response_model=ProviderDetailResponse)
def update_publishing_status(
    provider_id: str,
    payload: ProfilePublishingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage publishing status for your own provider profile."
        )

    profile.status = payload.status
    db.commit()
    db.refresh(profile)
    return profile

@router.put("/{provider_id}", response_model=ProviderDetailResponse)
def update_provider(
    provider_id: str,
    payload: ProviderProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own provider profile."
        )

    validate_price_and_unit(payload.price, payload.pricing_unit or profile.pricing_unit)

    user = profile.user
    if user and payload.name:
        user.name = payload.name
    if user and payload.location:
        user.location = payload.location

    if payload.title is not None:
        profile.title = payload.title
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.experience_years is not None:
        profile.experience_years = payload.experience_years
    if payload.languages is not None:
        profile.languages = payload.languages
    if payload.target_age_group is not None:
        profile.target_age_group = payload.target_age_group
    if payload.availability is not None:
        profile.availability = payload.availability
    if payload.service_delivery_mode is not None:
        profile.service_delivery_mode = str(payload.service_delivery_mode)
    if payload.price is not None:
        profile.price = float(payload.price)
    if payload.pricing_unit is not None:
        profile.pricing_unit = str(payload.pricing_unit)
    if payload.payment_method is not None:
        profile.payment_method = str(payload.payment_method)
    if payload.payment_upi_id is not None:
        profile.payment_upi_id = str(payload.payment_upi_id)
    if payload.payment_instructions is not None:
        profile.payment_instructions = str(payload.payment_instructions)
    if payload.status is not None:
        profile.status = str(payload.status)

    if payload.skills is not None:
        target_skills_lower = [s.strip().lower() for s in payload.skills if s and s.strip()]
        # Delete skills not in the new payload list
        to_delete_skills = [s for s in profile.skills if s.name.lower() not in target_skills_lower]
        for s in to_delete_skills:
            db.delete(s)
        # Add new skills not already in profile.skills
        existing_skills_lower = [s.name.lower() for s in profile.skills if s not in to_delete_skills]
        for s_name in payload.skills:
            if s_name and s_name.strip() and s_name.strip().lower() not in existing_skills_lower:
                db.add(Skill(provider_id=profile.id, name=s_name.strip(), category="General"))
                existing_skills_lower.append(s_name.strip().lower())

    if payload.services is not None:
        target_srvs_lower = [s.strip().lower() for s in payload.services if s and s.strip()]
        # Delete services not in the new payload list
        to_delete_srvs = [srv for srv in profile.services if srv.name.lower() not in target_srvs_lower]
        for srv in to_delete_srvs:
            db.delete(srv)
        # Add new services not already in profile.services
        existing_srvs_lower = [srv.name.lower() for srv in profile.services if srv not in to_delete_srvs]
        for srv_name in payload.services:
            if srv_name and srv_name.strip() and srv_name.strip().lower() not in existing_srvs_lower:
                db.add(Service(provider_id=profile.id, name=srv_name.strip(), description=f"{srv_name.strip()} by {user.name if user else 'Provider'}"))
                existing_srvs_lower.append(srv_name.strip().lower())

    db.commit()
    db.refresh(profile)
    return profile

@router.delete("/{provider_id}", status_code=status.HTTP_200_OK)
def delete_provider(
    provider_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own provider profile."
        )

    user = profile.user
    db.delete(profile)
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Provider profile deleted successfully", "id": provider_id}

@router.post("/{provider_id}/nlp-update", response_model=NLPUpdateProposal)
def parse_nlp_update(provider_id: str, payload: dict, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    user_text = payload.get("command", "")
    proposal = parse_profile_update(user_text)
    return proposal

# ------------------------------------------------------------
# 100% REAL DATABASE-DRIVEN SENIOR DASHBOARD STATS API
# ------------------------------------------------------------
@router.get("/me/dashboard-stats", response_model=SeniorDashboardStatsResponse)
def get_my_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates Senior Dashboard statistics 100% dynamically from database records.
    Filters STRICTLY by authenticated user's provider ID.
    NO hardcoded/demo stats!
    """
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    provider_id = profile.id if profile else "NONE"

    # 1. Real Pending Requests Count
    pending_count = db.query(ServiceRequest).filter(
        ServiceRequest.provider_id == provider_id,
        ServiceRequest.status.in_(["PENDING", "open"])
    ).count()

    # 2. Real Upcoming (Accepted) Requests
    accepted_reqs = db.query(ServiceRequest).filter(
        ServiceRequest.provider_id == provider_id,
        ServiceRequest.status == "ACCEPTED"
    ).all()
    upcoming_count = len(accepted_reqs)

    # 3. Real Completed Requests Count
    completed_count = db.query(ServiceRequest).filter(
        ServiceRequest.provider_id == provider_id,
        ServiceRequest.status == "COMPLETED"
    ).count()

    # 4. Real Rating & Reviews from Review model
    reviews = db.query(Review).filter(Review.provider_id == provider_id).all()
    total_reviews = len(reviews)
    avg_rating = round(sum(r.rating for r in reviews) / total_reviews, 1) if total_reviews > 0 else None

    # Format upcoming services list
    upcoming_services_list = []
    for req in accepted_reqs:
        cust_name = req.customer.name if req.customer else "Customer"
        cust_loc = req.customer.location if req.customer else None
        upcoming_services_list.append(UpcomingServiceItem(
            id=req.id,
            title=req.title,
            description=req.description,
            customer_name=cust_name,
            customer_location=cust_loc,
            preferred_date=req.preferred_date,
            status=req.status,
            agreed_price=req.agreed_price,
            agreed_pricing_unit=req.agreed_pricing_unit or "per_service",
            payment_status=req.payment_status or "PAYMENT_PENDING"
        ))

    # Format recent reviews list
    recent_reviews_list = []
    for rev in reviews:
        cust_name = rev.customer.name if rev.customer else "Customer"
        recent_reviews_list.append(RecentReviewItem(
            id=rev.id,
            rating=rev.rating,
            comment=rev.comment,
            created_at=rev.created_at.isoformat() if rev.created_at else None,
            customer_name=cust_name
        ))

    return SeniorDashboardStatsResponse(
        pending_requests_count=pending_count,
        upcoming_services_count=upcoming_count,
        completed_services_count=completed_count,
        rating=avg_rating,
        total_reviews=total_reviews,
        profile_status=profile.status if profile else "DRAFT",
        profile_setup_completed=current_user.profile_setup_completed or False,
        upcoming_services=upcoming_services_list,
        recent_reviews=recent_reviews_list
    )

# ------------------------------------------------------------
# INCREMENTAL PROFILE & SKILL UPDATES
# ------------------------------------------------------------
@router.post("/me/incremental-update", response_model=ProviderDetailResponse)
def incremental_update_my_profile(
    payload: IncrementalUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Applies incremental ADD, REMOVE, or UPDATE operations to Senior profile.
    NEVER wipes or regenerates existing profile data!
    """
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found for current user")

    # 1. ADD SKILLS
    if payload.add_skills:
        for s_name in payload.add_skills:
            if s_name and s_name.strip():
                clean_s = s_name.strip()
                if not any(existing.name.lower() == clean_s.lower() for existing in profile.skills):
                    db.add(Skill(provider_id=profile.id, name=clean_s, category="General"))

    # 2. REMOVE SKILLS
    if payload.remove_skills:
        to_remove_names = [s.strip().lower() for s in payload.remove_skills if s and s.strip()]
        for existing in list(profile.skills):
            if existing.name.lower() in to_remove_names or any(rem in existing.name.lower() for rem in to_remove_names):
                db.delete(existing)

    # 3. ADD SERVICES
    if payload.add_services:
        for srv_name in payload.add_services:
            if srv_name and srv_name.strip():
                clean_srv = srv_name.strip()
                if not any(existing.name.lower() == clean_srv.lower() for existing in profile.services):
                    db.add(Service(provider_id=profile.id, name=clean_srv, description=f"{clean_srv} by {current_user.name}"))

    # 4. REMOVE SERVICES
    if payload.remove_services:
        to_remove_srvs = [s.strip().lower() for s in payload.remove_services if s and s.strip()]
        for existing in list(profile.services):
            if existing.name.lower() in to_remove_srvs or any(rem in existing.name.lower() for rem in to_remove_srvs):
                db.delete(existing)

    # 5. UPDATE SPECIFIC FIELDS
    if payload.update_fields:
        fields = payload.update_fields
        target_price = fields.get("price", profile.price)
        target_unit = fields.get("pricing_unit", profile.pricing_unit)
        if "price" in fields or "pricing_unit" in fields:
            validate_price_and_unit(float(target_price) if target_price is not None else None, str(target_unit) if target_unit else None)
            if "price" in fields and fields["price"] is not None:
                profile.price = float(fields["price"])
            if "pricing_unit" in fields and fields["pricing_unit"]:
                profile.pricing_unit = str(fields["pricing_unit"])

        if "payment_method" in fields and fields["payment_method"]:
            profile.payment_method = str(fields["payment_method"])
        if "payment_upi_id" in fields and fields["payment_upi_id"] is not None:
            profile.payment_upi_id = str(fields["payment_upi_id"])
        if "payment_instructions" in fields and fields["payment_instructions"] is not None:
            profile.payment_instructions = str(fields["payment_instructions"])

        if "experience_years" in fields and fields["experience_years"] is not None:
            profile.experience_years = int(fields["experience_years"])
        if "title" in fields and fields["title"]:
            profile.title = str(fields["title"])
        if "bio" in fields and fields["bio"]:
            profile.bio = str(fields["bio"])
        if "languages" in fields and fields["languages"]:
            profile.languages = str(fields["languages"])
        if "availability" in fields and fields["availability"]:
            profile.availability = str(fields["availability"])
        if "location" in fields and fields["location"]:
            current_user.location = str(fields["location"])
        if "status" in fields and fields["status"]:
            profile.status = str(fields["status"])
        if "name" in fields and fields["name"]:
            current_user.name = str(fields["name"])

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/me/skills", response_model=ProviderDetailResponse)
def add_my_skill(
    payload: AddSkillPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    skill_name = payload.name.strip()
    if not any(existing.name.lower() == skill_name.lower() for existing in profile.skills):
        db.add(Skill(provider_id=profile.id, name=skill_name, category=payload.category or "General"))
        db.commit()
        db.refresh(profile)
    return profile

@router.delete("/me/skills/{skill_name}", response_model=ProviderDetailResponse)
def remove_my_skill(
    skill_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    db.commit()
    db.refresh(profile)
    return profile

@router.patch("/me/location")
def update_my_location(
    payload: LocationUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated location update endpoint.
    Validates latitude (-90 to 90) and longitude (-180 to 180).
    Updates user & provider profile coordinates, city, state, country, and readable location string.
    """
    if payload.latitude < -90.0 or payload.latitude > 90.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90 degrees."
        )
    if payload.longitude < -180.0 or payload.longitude > 180.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180 degrees."
        )

    location_parts = []
    if payload.city and payload.city.strip():
        location_parts.append(payload.city.strip())
    if payload.state and payload.state.strip():
        location_parts.append(payload.state.strip())
    if payload.country and payload.country.strip():
        location_parts.append(payload.country.strip())

    readable = payload.readable_address or (", ".join(location_parts) if location_parts else "Detected Location")

    # Update User
    current_user.latitude = payload.latitude
    current_user.longitude = payload.longitude
    current_user.city = payload.city
    current_user.state = payload.state
    current_user.country = payload.country
    current_user.location = readable

    # Update Provider Profile if exists
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if profile:
        profile.latitude = payload.latitude
        profile.longitude = payload.longitude
        profile.city = payload.city
        profile.state = payload.state
        profile.country = payload.country
        profile.location = readable

    db.commit()

    return {
        "success": True,
        "location": readable,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "city": payload.city,
        "state": payload.state,
        "country": payload.country
    }
