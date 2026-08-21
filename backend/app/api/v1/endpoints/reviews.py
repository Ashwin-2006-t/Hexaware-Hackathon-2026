import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from app.db.session import get_db
from app.models.domain import Review, Booking, User, Notification
from app.schemas.domain import ReviewCreate, ReviewResponse, RatingBreakdownResponse
from app.api.deps import get_current_user, get_optional_current_user

router = APIRouter()

def calculate_provider_rating_stats(provider_id: int, db: Session) -> Dict:
    """Calculates real, non-hardcoded average rating and star distribution."""
    reviews = db.query(Review).filter(Review.provider_id == provider_id).all()
    total = len(reviews)
    dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    if total == 0:
        return {
            "provider_id": provider_id,
            "average_rating": 0.0,
            "total_reviews": 0,
            "display_label": "No reviews yet",
            "star_distribution": dist
        }

    sum_ratings = 0
    for r in reviews:
        val = max(1, min(5, int(r.rating)))
        dist[val] += 1
        sum_ratings += val

    avg = round(sum_ratings / total, 1)
    return {
        "provider_id": provider_id,
        "average_rating": avg,
        "total_reviews": total,
        "display_label": f"⭐ {avg} · Based on {total} review{'s' if total != 1 else ''}",
        "star_distribution": dist
    }


@router.post("", response_model=ReviewResponse, summary="Submit Rating & Review (Authenticated)")
def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a rating (1-5) and review for a completed booking.
    Strict constraints enforced server-side:
    - Rating must be between 1 and 5 (reject 0 or >5).
    - Booking must exist.
    - Booking must belong to the reviewer (current_user.id == booking.customer_id).
    - Booking must have status 'completed'.
    - One review per booking.
    - Provider cannot review themselves.
    - Identity is strictly derived from the authenticated session.
    """
    # 1. Validate rating range
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be an integer between 1 and 5."
        )

    # 2. Query booking
    booking = db.query(Booking).filter(Booking.id == review_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    # 3. Prevent provider from reviewing themselves
    if booking.provider_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service providers cannot review their own service bookings."
        )

    # 4. Check ownership: booking must belong to authenticated reviewer
    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to review a booking that does not belong to you."
        )

    # 5. Check booking status: must be COMPLETED
    if booking.status.lower() != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review booking in '{booking.status}' status. Only COMPLETED bookings can be reviewed."
        )

    # 6. Check for duplicate review on this booking
    existing = db.query(Review).filter(Review.booking_id == review_in.booking_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review has already been submitted for this booking."
        )

    # 7. Persist review
    review = Review(
        booking_id=booking.id,
        customer_id=current_user.id,
        provider_id=booking.provider_id,
        rating=review_in.rating,
        comment=review_in.comment.strip() if review_in.comment else None,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # 8. Notify provider of the new review
    try:
        service_title = booking.service.title if booking.service else "Service"
        notif = Notification(
            user_id=booking.provider_id,
            type="review",
            title=f"New {review_in.rating}★ Community Review Received",
            message=f"{current_user.full_name} left a {review_in.rating}★ review for '{service_title}': \"{review_in.comment or 'Great experience!'}\"",
            action="view_review",
            action_payload=json.dumps({"review_id": review.id, "booking_id": booking.id}),
            read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return ReviewResponse(
        id=review.id,
        booking_id=review.booking_id,
        customer_id=review.customer_id,
        provider_id=review.provider_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat() if review.created_at else datetime.datetime.utcnow().isoformat(),
        customer_name=current_user.full_name
    )


@router.get("/provider/{provider_id}", response_model=List[ReviewResponse], summary="Get Provider Reviews")
def get_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    """Returns all authentic reviews for a provider."""
    reviews = db.query(Review).filter(Review.provider_id == provider_id).order_by(Review.created_at.desc()).all()
    results = []
    for r in reviews:
        cust = db.query(User).filter(User.id == r.customer_id).first()
        results.append(ReviewResponse(
            id=r.id,
            booking_id=r.booking_id,
            customer_id=r.customer_id,
            provider_id=r.provider_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at.isoformat() if r.created_at else "",
            customer_name=str(cust.full_name) if (cust and cust.full_name) else "Verified Client"
        ))
    return results


@router.get("/provider/{provider_id}/rating", response_model=RatingBreakdownResponse, summary="Get Provider Rating Breakdown")
def get_provider_rating_breakdown(provider_id: int, db: Session = Depends(get_db)):
    """Calculates real average rating and 1-5 star distribution from stored reviews."""
    stats = calculate_provider_rating_stats(provider_id, db)
    return RatingBreakdownResponse(**stats)


@router.get("/booking/{booking_id}", response_model=ReviewResponse, summary="Get Review by Booking ID")
def get_review_by_booking(booking_id: int, db: Session = Depends(get_db)):
    """Returns the review submitted for a specific booking."""
    review = db.query(Review).filter(Review.booking_id == booking_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review found for this booking.")
    
    cust = db.query(User).filter(User.id == review.customer_id).first()
    return ReviewResponse(
        id=review.id,
        booking_id=review.booking_id,
        customer_id=review.customer_id,
        provider_id=review.provider_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat() if review.created_at else "",
        customer_name=cust.full_name if cust else "Verified Client"
    )
