from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import ProviderProfile, Service
from app.schemas.domain import ServiceCreate, ServiceResponse

router = APIRouter(prefix="/api/providers", tags=["Services"])

@router.post("/{provider_id}/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def add_service(provider_id: str, payload: ServiceCreate, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")

    srv = Service(
        provider_id=provider_id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        price_range=payload.price_range
    )
    db.add(srv)
    db.commit()
    db.refresh(srv)
    return srv

@router.get("/{provider_id}/services", response_model=List[ServiceResponse])
def get_services(provider_id: str, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    return profile.services
