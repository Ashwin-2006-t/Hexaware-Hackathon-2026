from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.domain import User, Skill, ServiceListing, Review
from app.schemas.domain import UserResponse, SkillCreate, SkillResponse

router = APIRouter()

@router.get("", summary="List Senior Providers")
def list_providers(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "provider")
    providers = query.all()
    
    results = []
    for p in providers:
        skills = db.query(Skill).filter(Skill.user_id == p.id).all()
        services = db.query(ServiceListing).filter(ServiceListing.provider_id == p.id).all()
        reviews = db.query(Review).filter(Review.provider_id == p.id).all()
        
        avg_rating = 5.0
        if reviews:
            avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

        results.append({
            "id": p.id,
            "full_name": p.full_name,
            "email": p.email,
            "bio": p.bio,
            "avatar_url": p.avatar_url,
            "location_name": p.location_name,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "rating": avg_rating,
            "total_reviews": len(reviews),
            "skills": [s.title for s in skills],
            "services_count": len(services),
            "verified_badge": True
        })
    return results


@router.get("/{provider_id}", summary="Get Detailed Provider Profile")
def get_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(User).filter(User.id == provider_id, User.role == "provider").first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    services = db.query(ServiceListing).filter(ServiceListing.provider_id == provider.id).all()
    reviews = db.query(Review).filter(Review.provider_id == provider.id).all()

    avg_rating = 5.0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    return {
        "provider": {
            "id": provider.id,
            "full_name": provider.full_name,
            "email": provider.email,
            "phone": provider.phone,
            "bio": provider.bio,
            "avatar_url": provider.avatar_url,
            "location_name": provider.location_name,
            "latitude": provider.latitude,
            "longitude": provider.longitude,
            "rating": avg_rating,
            "total_reviews": len(reviews),
            "verified": True
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
                "location_name": s.location_name
            } for s in services
        ],
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "customer_name": r.customer.full_name if r.customer else "Verified Client",
                "created_at": r.created_at.isoformat()
            } for r in reviews
        ]
    }


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
