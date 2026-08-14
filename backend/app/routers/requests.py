from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, ServiceRequest
from app.schemas.domain import ServiceRequestCreate, ServiceRequestResponse, ServiceRequestBase

router = APIRouter(prefix="/api/requests", tags=["Service Requests"])

class QuickRequestPayload(ServiceRequestBase):
    customer_name: str = "Demo Customer"
    customer_email: str = "customer@example.com"

@router.post("", response_model=ServiceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(payload: QuickRequestPayload, db: Session = Depends(get_db)):
    # Find or create demo customer
    customer = db.query(User).filter(User.email == payload.customer_email).first()
    if not customer:
        customer = User(
            name=payload.customer_name,
            email=payload.customer_email,
            role="customer",
            location=payload.location or "Chennai, Tamil Nadu",
            latitude=payload.latitude or 13.0827,
            longitude=payload.longitude or 80.2707
        )
        db.add(customer)
        db.flush()

    req = ServiceRequest(
        customer_id=customer.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location or customer.location,
        latitude=payload.latitude or customer.latitude,
        longitude=payload.longitude or customer.longitude,
        preferred_date=payload.preferred_date,
        status="open"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("", response_model=List[ServiceRequestResponse])
def list_requests(db: Session = Depends(get_db)):
    return db.query(ServiceRequest).all()
