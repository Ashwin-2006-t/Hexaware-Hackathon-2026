from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.domain import ServiceListing, User, Review, Skill
from app.schemas.domain import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter()

@router.get("", response_model=List[ServiceResponse], summary="List Marketplace Services")
def list_services(
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(ServiceListing).filter(ServiceListing.status == "active", ServiceListing.is_published == True)
    
    if category and category.lower() != "all":
        q = q.filter(ServiceListing.category.ilike(f"%{category}%"))
    if query:
        q = q.filter(
            (ServiceListing.title.ilike(f"%{query}%")) | 
            (ServiceListing.description.ilike(f"%{query}%")) |
            (ServiceListing.location_name.ilike(f"%{query}%"))
        )
    if min_price is not None:
        q = q.filter(ServiceListing.price_per_hour >= min_price)
    if max_price is not None:
        q = q.filter(ServiceListing.price_per_hour <= max_price)
        
    services = q.all()
    results = []
    
    for s in services:
        provider = db.query(User).filter(User.id == s.provider_id).first()
        reviews = db.query(Review).filter(Review.provider_id == s.provider_id).all()
        skills = db.query(Skill).filter(Skill.user_id == s.provider_id).all()
        years_exp = max([sk.years_experience for sk in skills], default=15)

        avg_rating = 4.9
        if reviews:
            avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

        if min_rating is not None and avg_rating < min_rating:
            continue

        user_type_label = "Senior Citizen"
        if provider and provider.user_type == "homemaker":
            user_type_label = "Skilled Homemaker"

        results.append(ServiceResponse(
            id=s.id,
            provider_id=s.provider_id,
            title=s.title,
            category=s.category,
            description=s.description,
            price_per_hour=s.price_per_hour,
            location_name=s.location_name or (provider.location_name if provider else "Mumbai, Maharashtra"),
            service_area=s.service_area or "Within 10 km",
            home_service=s.home_service if s.home_service is not None else True,
            availability=s.availability or "Flexible",
            latitude=s.latitude or (provider.latitude if provider else 19.0760),
            longitude=s.longitude or (provider.longitude if provider else 72.8777),
            status=s.status,
            is_published=s.is_published,
            created_at=s.created_at.isoformat(),
            provider_name=provider.full_name if provider else "Senior Provider",
            provider_avatar=provider.avatar_url if provider else None,
            provider_user_type=user_type_label,
            rating=avg_rating,
            total_reviews=len(reviews),
            completed_services=provider.completed_services_count if provider else 12,
            verified_badge=True,
            years_experience=years_exp,
            provider_video_url=provider.video_intro_url if provider else None
        ))
        
    return results


@router.post("", response_model=ServiceResponse, summary="Create Service Listing")
def create_service(service_in: ServiceCreate, provider_id: int = Query(1), db: Session = Depends(get_db)):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider user not found")

    new_service = ServiceListing(
        provider_id=provider.id,
        title=service_in.title,
        category=service_in.category,
        description=service_in.description,
        price_per_hour=service_in.price_per_hour,
        location_name=service_in.location_name or provider.location_name or "Mumbai, Maharashtra",
        service_area=service_in.service_area or "Within 10 km",
        home_service=service_in.home_service if service_in.home_service is not None else True,
        availability=service_in.availability or "Flexible",
        latitude=service_in.latitude or provider.latitude or 19.0760,
        longitude=service_in.longitude or provider.longitude or 72.8777,
        status="active",
        is_published=True
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return ServiceResponse(
        id=new_service.id,
        provider_id=new_service.provider_id,
        title=new_service.title,
        category=new_service.category,
        description=new_service.description,
        price_per_hour=new_service.price_per_hour,
        location_name=new_service.location_name,
        service_area=new_service.service_area,
        home_service=new_service.home_service,
        availability=new_service.availability,
        latitude=new_service.latitude,
        longitude=new_service.longitude,
        status=new_service.status,
        is_published=new_service.is_published,
        created_at=new_service.created_at.isoformat(),
        provider_name=provider.full_name,
        provider_avatar=provider.avatar_url,
        provider_user_type="Senior Citizen" if provider.user_type != "homemaker" else "Skilled Homemaker",
        rating=5.0,
        total_reviews=1,
        completed_services=provider.completed_services_count or 1,
        verified_badge=True,
        years_experience=20,
        provider_video_url=provider.video_intro_url
    )


@router.get("/{service_id}", response_model=ServiceResponse, summary="Get Single Service Detail")
def get_service_detail(service_id: int, db: Session = Depends(get_db)):
    service = db.query(ServiceListing).filter(ServiceListing.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service listing not found")

    provider = db.query(User).filter(User.id == service.provider_id).first()
    reviews = db.query(Review).filter(Review.provider_id == service.provider_id).all()
    avg_rating = 4.9
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    return ServiceResponse(
        id=service.id,
        provider_id=service.provider_id,
        title=service.title,
        category=service.category,
        description=service.description,
        price_per_hour=service.price_per_hour,
        location_name=service.location_name or (provider.location_name if provider else "Mumbai, Maharashtra"),
        service_area=service.service_area or "Within 10 km",
        home_service=service.home_service if service.home_service is not None else True,
        availability=service.availability or "Flexible",
        latitude=service.latitude or (provider.latitude if provider else 19.0760),
        longitude=service.longitude or (provider.longitude if provider else 72.8777),
        status=service.status,
        is_published=service.is_published,
        created_at=service.created_at.isoformat(),
        provider_name=provider.full_name if provider else "Senior Provider",
        provider_avatar=provider.avatar_url if provider else None,
        provider_user_type="Senior Citizen" if provider and provider.user_type != "homemaker" else "Skilled Homemaker",
        rating=avg_rating,
        total_reviews=len(reviews),
        completed_services=provider.completed_services_count if provider else 12,
        verified_badge=True,
        years_experience=20,
        provider_video_url=provider.video_intro_url if provider else None
    )


@router.put("/{service_id}", response_model=ServiceResponse, summary="Update Service Listing")
def update_service(service_id: int, service_in: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.query(ServiceListing).filter(ServiceListing.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service listing not found")

    if service_in.title is not None:
        service.title = service_in.title
    if service_in.category is not None:
        service.category = service_in.category
    if service_in.description is not None:
        service.description = service_in.description
    if service_in.price_per_hour is not None:
        service.price_per_hour = service_in.price_per_hour
    if service_in.location_name is not None:
        service.location_name = service_in.location_name
    if service_in.service_area is not None:
        service.service_area = service_in.service_area
    if service_in.home_service is not None:
        service.home_service = service_in.home_service
    if service_in.availability is not None:
        service.availability = service_in.availability
    if service_in.is_published is not None:
        service.is_published = service_in.is_published

    db.commit()
    db.refresh(service)

    provider = db.query(User).filter(User.id == service.provider_id).first()
    return ServiceResponse(
        id=service.id,
        provider_id=service.provider_id,
        title=service.title,
        category=service.category,
        description=service.description,
        price_per_hour=service.price_per_hour,
        location_name=service.location_name,
        service_area=service.service_area,
        home_service=service.home_service,
        availability=service.availability,
        latitude=service.latitude or 19.0760,
        longitude=service.longitude or 72.8777,
        status=service.status,
        is_published=service.is_published,
        created_at=service.created_at.isoformat(),
        provider_name=provider.full_name if provider else "Senior Provider",
        provider_avatar=provider.avatar_url if provider else None,
        provider_user_type="Senior Citizen",
        rating=5.0,
        total_reviews=1,
        completed_services=10,
        verified_badge=True,
        years_experience=20,
        provider_video_url=provider.video_intro_url if provider else None
    )


@router.delete("/{service_id}", summary="Delete Service Listing")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(ServiceListing).filter(ServiceListing.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service listing not found")

    db.delete(service)
    db.commit()
    return {"status": "success", "message": f"Service #{service_id} deleted successfully."}
