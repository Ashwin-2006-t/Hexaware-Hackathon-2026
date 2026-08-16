from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.domain import Review, Booking, User
from app.schemas.domain import ReviewCreate, ReviewResponse

router = APIRouter()

@router.post("", response_model=ReviewResponse, summary="Submit Rating & Review")
def create_review(review_in: ReviewCreate, customer_id: int = Query(2), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == review_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing = db.query(Review).filter(Review.booking_id == review_in.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already submitted for this booking")

    review = Review(
        booking_id=booking.id,
        customer_id=customer_id,
        provider_id=booking.provider_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    customer = db.query(User).filter(User.id == customer_id).first()

    return ReviewResponse(
        id=getattr(review, "id"),
        booking_id=getattr(review, "booking_id"),
        customer_id=getattr(review, "customer_id"),
        provider_id=getattr(review, "provider_id"),
        rating=getattr(review, "rating"),
        comment=getattr(review, "comment"),
        created_at=review.created_at.isoformat() if review.created_at else "",
        customer_name=str(customer.full_name) if (customer and customer.full_name) else "Client"
    )


@router.get("/provider/{provider_id}", response_model=List[ReviewResponse], summary="Get Provider Reviews")
def get_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.provider_id == provider_id).all()
    results = []
    for r in reviews:
        cust = db.query(User).filter(User.id == r.customer_id).first()
        results.append(ReviewResponse(
            id=getattr(r, "id"),
            booking_id=getattr(r, "booking_id"),
            customer_id=getattr(r, "customer_id"),
            provider_id=getattr(r, "provider_id"),
            rating=getattr(r, "rating"),
            comment=getattr(r, "comment"),
            created_at=r.created_at.isoformat() if r.created_at else "",
            customer_name=str(cust.full_name) if (cust and cust.full_name) else "Verified Client"
        ))
    return results
