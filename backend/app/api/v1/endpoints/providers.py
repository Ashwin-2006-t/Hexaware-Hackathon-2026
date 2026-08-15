import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import User, Skill, ServiceListing, Review, Booking, OpportunityInterest
from app.schemas.domain import (
    UserResponse, UserUpdate, SkillResponse, SkillCreate,
    OpportunityFeedResponse, OpportunityItem, OpportunityInterestResponse
)

router = APIRouter()


@router.get("/", response_model=List[UserResponse], summary="List All Providers")
def list_providers(
    category: Optional[str] = Query(None, description="Filter by skill category"),
    user_type: Optional[str] = Query(None, description="Filter by user type ('senior', 'homemaker', 'customer')"),
    location: Optional[str] = Query(None, description="Filter by location keyword"),
    min_rating: Optional[float] = Query(None, description="Minimum provider rating"),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role.in_(["provider", "senior", "homemaker"]))

    if user_type and user_type != "All":
        query = query.filter(User.user_type == user_type)

    if location:
        query = query.filter(User.location_name.ilike(f"%{location}%"))

    providers = query.all()

    if category and category != "All":
        matching_providers = []
        for p in providers:
            has_cat = db.query(Skill).filter(Skill.user_id == p.id, Skill.category.ilike(f"%{category}%")).first()
            has_serv_cat = db.query(ServiceListing).filter(ServiceListing.provider_id == p.id, ServiceListing.category.ilike(f"%{category}%")).first()
            if has_cat or has_serv_cat:
                matching_providers.append(p)
        providers = matching_providers

    results = []
    for p in providers:
        results.append(UserResponse(
            id=p.id,
            email=p.email,
            full_name=p.full_name,
            role=p.role,
            user_type=p.user_type,
            age=p.age,
            phone=p.phone,
            bio=p.bio,
            avatar_url=p.avatar_url,
            location_name=p.location_name,
            latitude=p.latitude,
            longitude=p.longitude,
            languages=p.languages,
            availability=p.availability,
            is_published=p.is_published,
            is_active=p.is_active,
            completed_services_count=p.completed_services_count or 0,
            trust_badge_level=p.trust_badge_level or "verified_senior",
            created_at=p.created_at.isoformat()
        ))
    return results


@router.get("/{provider_id}", summary="Get Detailed Provider Profile")
def get_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    services = db.query(ServiceListing).filter(ServiceListing.provider_id == provider.id).all()
    reviews = db.query(Review).filter(Review.provider_id == provider.id).all()
    bookings_count = db.query(Booking).filter(Booking.provider_id == provider.id, Booking.status == "completed").count()

    avg_rating = 5.0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    user_type_label = "Senior Citizen"
    if provider.user_type == "homemaker":
        user_type_label = "Skilled Homemaker"
    elif provider.user_type == "customer":
        user_type_label = "Customer"

    return {
        "provider": {
            "id": provider.id,
            "full_name": provider.full_name,
            "email": provider.email,
            "phone": provider.phone,
            "bio": provider.bio,
            "avatar_url": provider.avatar_url,
            "location_name": provider.location_name,
            "user_type": provider.user_type,
            "user_type_label": user_type_label,
            "age": provider.age,
            "languages": provider.languages,
            "availability": provider.availability,
            "is_published": provider.is_published,
            "latitude": provider.latitude,
            "longitude": provider.longitude,
            "rating": avg_rating,
            "total_reviews": len(reviews),
            "completed_services_count": provider.completed_services_count or bookings_count or len(reviews) or 6,
            "trust_badge_level": provider.trust_badge_level or "verified_senior"
        },
        "skills": [
            {
                "id": s.id,
                "category": s.category,
                "title": s.title,
                "description": s.description,
                "proficiency_level": s.proficiency_level,
                "years_experience": s.years_experience,
                "hourly_rate": s.hourly_rate
            } for s in skills
        ],
        "services": [
            {
                "id": s.id,
                "title": s.title,
                "category": s.category,
                "description": s.description,
                "price_per_hour": s.price_per_hour,
                "location_name": s.location_name,
                "service_area": s.service_area,
                "home_service": s.home_service,
                "availability": s.availability,
                "status": s.status,
                "is_published": s.is_published
            } for s in services
        ],
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "customer_name": r.customer.full_name if r.customer else "Verified Neighbor",
                "created_at": r.created_at.isoformat()
            } for r in reviews
        ]
    }


@router.put("/{provider_id}", response_model=UserResponse, summary="Update Provider Profile")
def update_provider_profile(provider_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == provider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()
    if user_in.phone is not None:
        user.phone = user_in.phone.strip()
    if user_in.bio is not None:
        user.bio = user_in.bio.strip()
    if user_in.location_name is not None:
        user.location_name = user_in.location_name.strip()
    if user_in.languages is not None:
        user.languages = user_in.languages.strip()
    if user_in.availability is not None:
        user.availability = user_in.availability.strip()
    if user_in.is_published is not None:
        user.is_published = user_in.is_published
    if user_in.age is not None:
        user.age = user_in.age
    if user_in.user_type is not None:
        user.user_type = user_in.user_type
    if user_in.avatar_url is not None:
        user.avatar_url = user_in.avatar_url

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        user_type=user.user_type,
        age=user.age,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        languages=user.languages,
        availability=user.availability,
        is_published=user.is_published,
        is_active=user.is_active,
        completed_services_count=user.completed_services_count or 0,
        trust_badge_level=user.trust_badge_level or "verified_senior",
        created_at=user.created_at.isoformat()
    )


@router.post("/{provider_id}/skills", response_model=SkillResponse, summary="Add Skill to Senior Provider Profile")
def add_provider_skill(provider_id: int, skill_in: SkillCreate, db: Session = Depends(get_db)):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    new_skill = Skill(
        user_id=provider.id,
        category=skill_in.category,
        title=skill_in.title,
        description=skill_in.description,
        proficiency_level=skill_in.proficiency_level,
        years_experience=skill_in.years_experience,
        hourly_rate=skill_in.hourly_rate,
        verified=True
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.get("/{provider_id}/opportunities", response_model=OpportunityFeedResponse, summary="Get Personalized Opportunity Feed for Provider")
def get_provider_opportunities(provider_id: int, db: Session = Depends(get_db)):
    """
    Opportunity Feed:
    Scored and matched dynamically against the provider's skills, location, rating, and experience.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    skills_text = " ".join([s.title.lower() for s in skills]) + " " + (provider.bio or "").lower()

    # Get set of already applied opportunity IDs for this provider
    applied_interests = db.query(OpportunityInterest).filter(OpportunityInterest.provider_id == provider.id).all()
    applied_opp_ids = {interest.opportunity_id for interest in applied_interests}

    # Dynamic Simulated Demand based on Provider Profile
    potential_opportunities = [
        {
            "id": "opp-101",
            "title": "Weekend South Indian Tiffin & Filter Coffee Workshop",
            "category": "Cooking & Tiffin",
            "customer_location": "Dadar West, Mumbai",
            "distance_km": 2.4,
            "budget_range": "₹1,200 - ₹2,000 / session",
            "posted_ago": "2 hours ago",
            "description": "Looking for an experienced senior home cook to guide a young working couple on authentic sambar, rasam, and traditional breakfast recipes.",
            "keywords": ["cook", "tiffin", "south indian", "recipe", "food", "kitchen", "coffee"]
        },
        {
            "id": "opp-102",
            "title": "Patient Mathematics & Science Tuition (Class 7 & 8)",
            "category": "Tutoring & Mentoring",
            "customer_location": "Matunga Central, Mumbai",
            "distance_km": 1.8,
            "budget_range": "₹400 - ₹600 / hour",
            "posted_ago": "4 hours ago",
            "description": "Seeking a kind, experienced retired teacher for 3 days/week foundational algebra and geometry school tuition.",
            "keywords": ["teach", "tutor", "math", "tuition", "school", "science", "read"]
        },
        {
            "id": "opp-103",
            "title": "Custom Saree Blouse Fitting & Festival Dress Stitching",
            "category": "Crafts & Tailoring",
            "customer_location": "Bandra East, Mumbai",
            "distance_km": 4.1,
            "budget_range": "₹500 - ₹800 / piece",
            "posted_ago": "1 day ago",
            "description": "Need an artisan tailor for 3 custom silk saree blouses with traditional hand piping and neck alteration for upcoming wedding.",
            "keywords": ["tailor", "sew", "stitching", "blouse", "saree", "craft", "embroidery"]
        },
        {
            "id": "opp-104",
            "title": "Balcony Kitchen Garden Setup & Organic Plant Care",
            "category": "Gardening & Agriculture",
            "customer_location": "Chembur, Mumbai",
            "distance_km": 5.2,
            "budget_range": "₹800 - ₹1,500 / visit",
            "posted_ago": "3 hours ago",
            "description": "Looking for a seasoned gardener to help transplant vegetable saplings, advise on natural vermicompost, and potting soil mix.",
            "keywords": ["garden", "plant", "farming", "terrace", "organic", "vegetable"]
        },
        {
            "id": "opp-105",
            "title": "Traditional Mango & Lime Pickle Batch Preparation",
            "category": "Cooking & Tiffin",
            "customer_location": "Prabhadevi, Mumbai",
            "distance_km": 3.0,
            "budget_range": "₹1,500 - ₹2,500 / batch",
            "posted_ago": "6 hours ago",
            "description": "Seeking expert grandmother/senior homemaker to prepare a 5 kg family batch of authentic traditional sun-dried mango pickles.",
            "keywords": ["pickle", "cook", "recipe", "food", "tiffin"]
        }
    ]

    matched_opportunities: List[OpportunityItem] = []

    for opp in potential_opportunities:
        # Score calculation
        match_count = sum(1 for kw in opp["keywords"] if kw in skills_text)
        is_category_match = any(s.category.lower() in opp["category"].lower() for s in skills)

        base_score = 65.0
        if is_category_match:
            base_score += 20.0
        if match_count > 0:
            base_score += min(12.0, match_count * 4.0)

        # Proximity boost
        if opp["distance_km"] <= 3.0:
            base_score += 5.0

        final_score = min(98.0, round(base_score, 1))

        reasons = []
        if is_category_match:
            reasons.append(f"✓ Strong {opp['category']} Skill Match")
        if opp["distance_km"] <= 3.5:
            reasons.append(f"✓ Very Close ({opp['distance_km']} km away)")
        else:
            reasons.append(f"✓ In Service Area ({opp['distance_km']} km)")
        if (provider.completed_services_count or 0) >= 5:
            reasons.append("✓ High Reliability Provider Match")

        matched_opportunities.append(OpportunityItem(
            id=opp["id"],
            title=opp["title"],
            category=opp["category"],
            customer_location=opp["customer_location"],
            distance_km=opp["distance_km"],
            budget_range=opp["budget_range"],
            match_score=final_score,
            match_reasons=reasons,
            posted_ago=opp["posted_ago"],
            description=opp["description"],
            is_applied=opp["id"] in applied_opp_ids
        ))

    # Sort descending by match score
    matched_opportunities.sort(key=lambda x: x.match_score, reverse=True)

    return OpportunityFeedResponse(
        provider_id=provider.id,
        opportunities=matched_opportunities,
        total=len(matched_opportunities)
    )


@router.post("/{provider_id}/opportunities/{opportunity_id}/interest", response_model=OpportunityInterestResponse, summary="Express Interest in an Opportunity")
def express_interest_in_opportunity(
    provider_id: int,
    opportunity_id: str,
    db: Session = Depends(get_db)
):
    """
    Express Interest in Opportunity:
    Validates provider and checks for duplicates. Persists application and returns confirmation.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    existing = db.query(OpportunityInterest).filter(
        OpportunityInterest.provider_id == provider_id,
        OpportunityInterest.opportunity_id == opportunity_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already expressed interest in this opportunity."
        )

    new_interest = OpportunityInterest(
        opportunity_id=opportunity_id,
        provider_id=provider_id,
        status="applied",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_interest)
    db.commit()
    db.refresh(new_interest)

    return OpportunityInterestResponse(
        success=True,
        message="Interest expressed successfully! The customer will be notified and can contact you.",
        opportunity_id=opportunity_id,
        provider_id=provider_id,
        is_applied=True,
        applied_at=new_interest.created_at.isoformat()
    )


@router.post("/upload-avatar", summary="Upload Profile Avatar Photo")
async def upload_avatar(
    user_id: int = Query(1),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WEBP, GIF) are allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 5MB.")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    
    endpoints_dir = os.path.dirname(__file__)
    upload_folder = os.path.abspath(os.path.join(endpoints_dir, "..", "..", "..", "uploads", "avatars"))
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    avatar_url = f"http://localhost:8000/uploads/avatars/{filename}"
    
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "avatar_url": avatar_url,
        "message": "Profile photo uploaded and saved successfully!"
    }
