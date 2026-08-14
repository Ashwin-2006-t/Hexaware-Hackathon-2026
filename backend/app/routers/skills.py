from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import ProviderProfile, Skill
from app.schemas.domain import SkillCreate, SkillResponse

router = APIRouter(prefix="/api/providers", tags=["Skills"])

@router.post("/{provider_id}/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill(provider_id: str, payload: SkillCreate, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")

    skill = Skill(
        provider_id=provider_id,
        name=payload.name,
        category=payload.category,
        proficiency=payload.proficiency
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.get("/{provider_id}/skills", response_model=List[SkillResponse])
def get_skills(provider_id: str, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    return profile.skills
