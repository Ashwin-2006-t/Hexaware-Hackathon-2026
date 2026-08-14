from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.domain import ServiceListing, User, Review
from app.schemas.domain import ServiceCreate, ServiceResponse

router = APIRouter()

@router.get("", response_model=List[ServiceResponse], summary="List Marketplace Services")
def list_services(
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(ServiceListing).filter(ServiceListing.status == "active")
    
    if category and category.lower() != "all":
        q = q.filter(ServiceListing.category.ilike(f"%{category}%"))
    if query:
        q = q.filter(
            (ServiceListing.title.ilike(f"%{query}%")) | 
            (ServiceListing.description.ilike(f"%{query}%"))
        )
        
    services = q.all()
    results = []
    
    for s in services:
        provider = db.query(User).filter(User.id == s.provider_id).first()
        reviews = db.query(Review).filter(Review.provider_id == s.provider_id).all()
        avg_rating = 4.9
        if reviews:
            avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

        results.append(ServiceResponse(
            id=s.id,
            provider_id=s.provider_id,
            title=s.title,
            category=s.category,
            description=s.description,
            price_per_hour=s.price_per_hour,
            location_name=s.location_name or (provider.location_name if provider else "Downtown"),
            latitude=s.latitude or (provider.latitude if provider else 37.7749),
            longitude=s.longitude or (provider.longitude if provider else -122.4194),
            status=s.status,
            created_at=s.created_at.isoformat(),
            provider_name=provider.full_name if provider else "Senior Provider",
            provider_avatar=provider.avatar_url if provider else None,
            rating=avg_rating
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
        location_name=service_in.location_name or provider.location_name,
        latitude=service_in.latitude or provider.latitude,
        longitude=service_in.longitude or provider.longitude,
        status="active"
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
        latitude=new_service.latitude,
        longitude=new_service.longitude,
        status=new_service.status,
        created_at=new_service.created_at.isoformat(),
        provider_name=provider.full_name,
        provider_avatar=provider.avatar_url,
        rating=5.0
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
        location_name=service.location_name or (provider.location_name if provider else "Downtown"),
        latitude=service.latitude or (provider.latitude if provider else 37.7749),
        longitude=service.longitude or (provider.longitude if provider else -122.4194),
        status=service.status,
        created_at=service.created_at.isoformat(),
        provider_name=provider.full_name if provider else "Senior Provider",
        provider_avatar=provider.avatar_url if provider else None,
        rating=avg_rating
    )
