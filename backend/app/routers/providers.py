from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, ProviderProfile, Skill, Service
from app.schemas.domain import ProviderRegisterRequest, ProviderDetailResponse

router = APIRouter(prefix="/api/providers", tags=["Providers"])

@router.post("", response_model=ProviderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_provider(payload: ProviderRegisterRequest, db: Session = Depends(get_db)):
    # Check existing user
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        user = User(
            name=payload.name,
            email=payload.email,
            role="provider",
            location=payload.location,
            latitude=payload.latitude,
            longitude=payload.longitude
        )
        db.add(user)
        db.flush()

    # Create profile
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user.id).first()
    if not profile:
        profile = ProviderProfile(
            user_id=user.id,
            title=payload.title,
            bio=payload.bio,
            experience_years=payload.experience_years,
            availability=payload.availability,
            rating=4.8,
            total_reviews=1
        )
        db.add(profile)
        db.flush()

    # Add skills
    for skill_name in payload.skills:
        skill = Skill(
            provider_id=profile.id,
            name=skill_name,
            category="General",
            proficiency="Expert"
        )
        db.add(skill)

    # Add services
    for srv_name in payload.services:
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

@router.get("", response_model=List[ProviderDetailResponse])
def list_providers(db: Session = Depends(get_db)):
    profiles = db.query(ProviderProfile).all()
    return profiles

@router.get("/{provider_id}", response_model=ProviderDetailResponse)
def get_provider(provider_id: str, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return profile
