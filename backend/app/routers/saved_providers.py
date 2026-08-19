from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ProviderProfile, SavedProvider, Skill, Service
from app.auth import get_current_user

router = APIRouter(prefix="/api/saved-providers", tags=["Saved Providers"])

class SaveProviderPayload(BaseModel):
    provider_id: str

@router.post("", status_code=status.HTTP_201_CREATED)
def save_provider(
    payload: SaveProviderPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == payload.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    existing = db.query(SavedProvider).filter(
        SavedProvider.customer_id == current_user.id,
        SavedProvider.provider_id == payload.provider_id
    ).first()

    if not existing:
        saved = SavedProvider(
            customer_id=current_user.id,
            provider_id=payload.provider_id
        )
        db.add(saved)
        db.commit()
        db.refresh(saved)

    return {"status": "saved", "provider_id": payload.provider_id}

@router.delete("/{provider_id}")
def remove_saved_provider(
    provider_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(SavedProvider).filter(
        SavedProvider.customer_id == current_user.id,
        SavedProvider.provider_id == provider_id
    ).first()

    if saved:
        db.delete(saved)
        db.commit()

    return {"status": "removed", "provider_id": provider_id}

@router.get("/my")
def list_my_saved_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_items = db.query(SavedProvider).filter(SavedProvider.customer_id == current_user.id).order_by(SavedProvider.created_at.desc()).all()
    results = []

    for item in saved_items:
        prov = db.query(ProviderProfile).filter(ProviderProfile.id == item.provider_id).first()
        if prov and prov.user:
            skills = db.query(Skill).filter(Skill.provider_id == prov.id).all()
            services = db.query(Service).filter(Service.provider_id == prov.id).all()
            results.append({
                "id": prov.id,
                "user_id": prov.user_id,
                "title": prov.title or "Senior Service Specialist",
                "bio": prov.bio or "",
                "experience_years": prov.experience_years or 0,
                "languages": prov.languages or "Tamil, English",
                "availability": prov.availability or "Available",
                "status": prov.status or "PUBLISHED",
                "rating": prov.rating if (prov.rating and prov.total_reviews and prov.total_reviews > 0) else None,
                "total_reviews": prov.total_reviews or 0,
                "user": {
                    "id": prov.user.id,
                    "name": prov.user.name,
                    "location": prov.user.location or "Chennai, Tamil Nadu"
                },
                "skills": [{"name": s.name, "category": s.category} for s in skills],
                "services": [{"name": s.name, "description": s.description} for s in services]
            })

    return results
