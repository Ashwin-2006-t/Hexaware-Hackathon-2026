import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.domain import Booking, ServiceListing, User, Notification, FamilyRelationship, FamilyPermission
from app.schemas.domain import BookingCreate, BookingResponse, BookingStatusUpdate, VirtualCallResponse, VirtualCallNotifyRequest
from app.api.deps import get_current_user, get_optional_current_user
from app.services.video_service import get_video_provider

router = APIRouter()

def is_authorized_booking_participant(user_id: int, booking: Booking, db: Session) -> bool:
    """
    Checks if a user is authorized to access a booking:
    1. Direct customer on booking
    2. Direct provider on booking
    3. Connected family member of customer with HELP_WITH_REQUESTS or VIEW_BOOKINGS permission
    """
    if booking.customer_id == user_id or booking.provider_id == user_id:
        return True

    # Check Family Circle permissions for customer
    rel = db.query(FamilyRelationship).filter(
        FamilyRelationship.senior_user_id == booking.customer_id,
        FamilyRelationship.family_user_id == user_id,
        FamilyRelationship.status == "active"
    ).first()

    if rel:
        perm = db.query(FamilyPermission).filter(
            FamilyPermission.relationship_id == rel.id,
            FamilyPermission.permission.in_(["HELP_WITH_REQUESTS", "VIEW_BOOKINGS", "VIEW_SERVICE_DETAILS"]),
            FamilyPermission.enabled == True
        ).first()
        if perm:
            return True

    return False


@router.post("", response_model=BookingResponse, summary="Create Service Booking")
def create_booking(
    booking_in: BookingCreate,
    customer_id: Optional[int] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    # Derive customer ID from authenticated session if available, else query param
    actual_customer_id = current_user.id if current_user else (customer_id or 2)

    service = db.query(ServiceListing).filter(ServiceListing.id == booking_in.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    customer = db.query(User).filter(User.id == actual_customer_id).first()
    provider = db.query(User).filter(User.id == booking_in.provider_id).first()

    booking = Booking(
        customer_id=actual_customer_id,
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

    # Notify provider of new booking
    try:
        notif = Notification(
            user_id=booking.provider_id,
            type="opportunity",
            title=f"New Service Booking Request (#{booking.id})",
            message=f"{customer.full_name if customer else 'A neighbor'} booked '{service.title}' for {booking.scheduled_date}.",
            action="view_opportunity",
            action_payload=json.dumps({"booking_id": booking.id}),
            read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

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
def list_user_bookings(
    user_id: Optional[int] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    target_id = current_user.id if current_user else (user_id or 1)

    bookings = db.query(Booking).filter(
        (Booking.customer_id == target_id) | (Booking.provider_id == target_id)
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

    prev_status = booking.status
    booking.status = status_in.status
    db.commit()
    db.refresh(booking)

    service = db.query(ServiceListing).filter(ServiceListing.id == booking.service_id).first()
    customer = db.query(User).filter(User.id == booking.customer_id).first()
    provider = db.query(User).filter(User.id == booking.provider_id).first()

    # Trigger Review Prompt notification when booking is marked COMPLETED
    if status_in.status.lower() == "completed" and prev_status != "completed":
        try:
            # Increment provider completed_services_count
            if provider:
                provider.completed_services_count = (provider.completed_services_count or 0) + 1
                db.commit()

            # Review nudge to customer
            cust_notif = Notification(
                user_id=booking.customer_id,
                type="review",
                title=f"Rate Your Experience with {provider.full_name if provider else 'Provider'}",
                message=f"Your booking for '{service.title if service else 'Service'}' is completed! Please leave a rating and share your review.",
                action="view_review",
                action_payload=json.dumps({"booking_id": booking.id}),
                read=False,
                created_at=datetime.datetime.utcnow()
            )
            db.add(cust_notif)
            db.commit()
        except Exception:
            pass

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


# --- Virtual Contact & Video Call Endpoints ---

@router.post("/{booking_id}/virtual-call/start", response_model=VirtualCallResponse, summary="Start or Join Virtual Call for Booking")
def start_virtual_call(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates / retrieves secure virtual meeting room for a confirmed or completed booking.
    Enforces strict access control:
    - User must be authenticated
    - User must be customer, provider, or authorized family member on this specific booking
    - Booking must be confirmed or completed
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # 1. Authorization check
    if not is_authorized_booking_participant(current_user.id, booking, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You are not an authorized participant for this booking's virtual call."
        )

    # 2. Status check: must be confirmed or completed
    if booking.status not in ["confirmed", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Virtual call cannot be started for booking in '{booking.status}' status. Booking must be confirmed."
        )

    service = db.query(ServiceListing).filter(ServiceListing.id == booking.service_id).first()
    customer = db.query(User).filter(User.id == booking.customer_id).first()
    provider = db.query(User).filter(User.id == booking.provider_id).first()

    service_title = service.title if service else "SilverHands Consultation"

    # 3. Generate meeting info via backend provider
    video_service = get_video_provider()
    meeting_info = video_service.generate_meeting(
        booking_id=booking.id,
        service_title=service_title,
        user_name=current_user.full_name
    )

    # Store meeting details on booking
    booking.virtual_meeting_id = meeting_info["room_id"]
    booking.virtual_meeting_url = meeting_info["meeting_url"]
    db.commit()

    # 4. Notify the other party that call has started
    target_notify_user_id = booking.provider_id if current_user.id == booking.customer_id else booking.customer_id
    try:
        notif = Notification(
            user_id=target_notify_user_id,
            type="video_call",
            title=f"📹 Virtual Call Ready: {service_title}",
            message=f"{current_user.full_name} has started the virtual call for your session. Click to join now.",
            action="join_call",
            action_payload=json.dumps({"booking_id": booking.id, "room_id": meeting_info["room_id"]}),
            read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return VirtualCallResponse(
        booking_id=booking.id,
        service_id=booking.service_id,
        service_title=service_title,
        provider_id=booking.provider_id,
        provider_name=provider.full_name if provider else "Provider",
        customer_id=booking.customer_id,
        customer_name=customer.full_name if customer else "Customer",
        scheduled_date=booking.scheduled_date,
        room_id=meeting_info["room_id"],
        meeting_url=meeting_info["meeting_url"],
        provider_type=meeting_info.get("provider", "jitsi"),
        is_authorized=True,
        status="active",
        created_at=datetime.datetime.utcnow().isoformat()
    )


@router.get("/{booking_id}/virtual-call", response_model=VirtualCallResponse, summary="Get Virtual Call Details for Booking")
def get_virtual_call_info(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves virtual call details if the caller is an authorized participant."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if not is_authorized_booking_participant(current_user.id, booking, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You are not authorized to view virtual call details for this booking."
        )

    service = db.query(ServiceListing).filter(ServiceListing.id == booking.service_id).first()
    customer = db.query(User).filter(User.id == booking.customer_id).first()
    provider = db.query(User).filter(User.id == booking.provider_id).first()
    service_title = service.title if service else "SilverHands Consultation"

    video_service = get_video_provider()
    meeting_info = video_service.generate_meeting(
        booking_id=booking.id,
        service_title=service_title,
        user_name=current_user.full_name
    )

    return VirtualCallResponse(
        booking_id=booking.id,
        service_id=booking.service_id,
        service_title=service_title,
        provider_id=booking.provider_id,
        provider_name=provider.full_name if provider else "Provider",
        customer_id=booking.customer_id,
        customer_name=customer.full_name if customer else "Customer",
        scheduled_date=booking.scheduled_date,
        room_id=meeting_info["room_id"],
        meeting_url=meeting_info["meeting_url"],
        provider_type=meeting_info.get("provider", "jitsi"),
        is_authorized=True,
        status="active",
        created_at=datetime.datetime.utcnow().isoformat()
    )


@router.post("/{booking_id}/virtual-call/notify", summary="Send Virtual Call Reminder Alert")
def notify_virtual_call_starting(
    booking_id: int,
    payload: Optional[VirtualCallNotifyRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sends a notification to the counterpart that the call is starting soon."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if not is_authorized_booking_participant(current_user.id, booking, db):
        raise HTTPException(status_code=403, detail="Not authorized.")

    service = db.query(ServiceListing).filter(ServiceListing.id == booking.service_id).first()
    target_user_id = booking.provider_id if current_user.id == booking.customer_id else booking.customer_id

    custom_msg = payload.message if payload and payload.message else f"{current_user.full_name} is getting ready for your virtual consultation for '{service.title if service else 'Service'}'."

    notif = Notification(
        user_id=target_user_id,
        type="video_call",
        title="📹 Virtual Consultation Starting Soon",
        message=custom_msg,
        action="join_call",
        action_payload=json.dumps({"booking_id": booking.id}),
        read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    return {"status": "success", "message": "Call reminder notification sent successfully."}
