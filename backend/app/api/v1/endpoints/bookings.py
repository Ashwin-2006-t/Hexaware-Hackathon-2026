from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.domain import Booking, ServiceListing, User
from app.schemas.domain import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter()

@router.post("", response_model=BookingResponse, summary="Create Service Booking")
def create_booking(
    booking_in: BookingCreate,
    customer_id: int = Query(2),
    db: Session = Depends(get_db)
):
    service = db.query(ServiceListing).filter(ServiceListing.id == booking_in.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    customer = db.query(User).filter(User.id == customer_id).first()
    provider = db.query(User).filter(User.id == booking_in.provider_id).first()

    booking = Booking(
        customer_id=customer_id,
        provider_id=booking_in.provider_id,
        service_id=booking_in.service_id,
        status="pending",
        total_price=booking_in.total_price,
        scheduled_date=booking_in.scheduled_date,
        notes=booking_in.notes
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return BookingResponse(
        id=booking.id,
        customer_id=booking.customer_id,
        provider_id=booking.provider_id,
        service_id=booking.service_id,
        status=booking.status,
        total_price=booking.total_price,
        scheduled_date=booking.scheduled_date,
        notes=booking.notes,
        created_at=booking.created_at.isoformat(),
        service_title=service.title,
        provider_name=provider.full_name if provider else "Senior Provider",
        customer_name=customer.full_name if customer else "Client"
    )


@router.get("", response_model=List[BookingResponse], summary="List User Bookings")
def list_user_bookings(user_id: int = Query(1), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(
        (Booking.customer_id == user_id) | (Booking.provider_id == user_id)
    ).order_by(Booking.created_at.desc()).all()

    results = []
    for b in bookings:
        service = db.query(ServiceListing).filter(ServiceListing.id == b.service_id).first()
        customer = db.query(User).filter(User.id == b.customer_id).first()
        provider = db.query(User).filter(User.id == b.provider_id).first()

        results.append(BookingResponse(
            id=b.id,
            customer_id=b.customer_id,
            provider_id=b.provider_id,
            service_id=b.service_id,
            status=b.status,
            total_price=b.total_price,
            scheduled_date=b.scheduled_date,
            notes=b.notes,
            created_at=b.created_at.isoformat(),
            service_title=service.title if service else "General Service",
            provider_name=provider.full_name if provider else "Senior Provider",
            customer_name=customer.full_name if customer else "Client"
        ))

    return results


@router.patch("/{booking_id}/status", response_model=BookingResponse, summary="Update Booking Status")
def update_booking_status(
    booking_id: int,
    status_in: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = status_in.status
    db.commit()
    db.refresh(booking)

    service = db.query(ServiceListing).filter(ServiceListing.id == booking.service_id).first()
    customer = db.query(User).filter(User.id == booking.customer_id).first()
    provider = db.query(User).filter(User.id == booking.provider_id).first()

    return BookingResponse(
        id=booking.id,
        customer_id=booking.customer_id,
        provider_id=booking.provider_id,
        service_id=booking.service_id,
        status=booking.status,
        total_price=booking.total_price,
        scheduled_date=booking.scheduled_date,
        notes=booking.notes,
        created_at=booking.created_at.isoformat(),
        service_title=service.title if service else "Service",
        provider_name=provider.full_name if provider else "Provider",
        customer_name=customer.full_name if customer else "Customer"
    )
