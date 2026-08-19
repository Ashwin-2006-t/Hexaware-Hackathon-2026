from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ProviderProfile, ServiceRequest, Review
from app.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

class ReviewCreatePayload(BaseModel):
    request_id: str
    rating: int  # 1 to 5
    comment: Optional[str] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    # PHASE 8: Verify that current authenticated user is the requesting customer
    if req.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the customer who requested this service can submit a review."
        )

    # PHASE 8: STRICT REQUIREMENT - Request MUST be COMPLETED before reviewing
    if req.status != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only completed service requests can be reviewed. Current status is '{req.status}'."
        )

    if not req.provider_id:
        raise HTTPException(status_code=400, detail="Service request has no assigned provider to review.")

    # Prevent duplicate reviews for the same request
    existing = db.query(Review).filter(Review.request_id == payload.request_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A review has already been submitted for this service request."
        )

    provider = db.query(ProviderProfile).filter(ProviderProfile.id == req.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Assigned provider profile not found.")

    rating_val = max(1, min(5, payload.rating))

    review = Review(
        request_id=req.id,
        customer_id=current_user.id,
        provider_id=provider.id,
        rating=rating_val,
        comment=payload.comment
    )
    db.add(review)
    db.flush()

    # Recalculate provider rating & total reviews count from real DB records
    all_reviews = db.query(Review).filter(Review.provider_id == provider.id).all()
    if all_reviews:
        total_count = len(all_reviews)
        avg_rating = sum(r.rating for r in all_reviews) / float(total_count)
        provider.total_reviews = total_count
        provider.rating = round(avg_rating, 1)

    db.commit()
    db.refresh(review)

    # PROACTIVE NOTIFICATION: Notify Senior Provider of New Customer Review
    try:
        from app.services.notification_service import NotificationService
        if provider and provider.user_id:
            cust_name = current_user.name or "Customer"
            NotificationService.notify_new_review(
                db=db,
                senior_user_id=provider.user_id,
                customer_name=cust_name,
                rating=rating_val,
                comment=payload.comment
            )
    except Exception as e:
        print(f"[Notification Review Error] {e}")

    return {
        "id": review.id,
        "request_id": review.request_id,
        "provider_id": review.provider_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at
    }

@router.get("/provider/{provider_id}")
def get_provider_reviews(provider_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.provider_id == provider_id).order_by(Review.created_at.desc()).all()
    results = []
    for r in reviews:
        cust = r.customer
        results.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "customer_name": cust.name if cust else "Verified Customer",
            "created_at": r.created_at
        })
    return results
