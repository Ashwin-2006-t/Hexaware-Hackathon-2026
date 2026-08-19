from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ProviderProfile, ServiceRequest
from app.auth import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/requests", tags=["Service Requests"])

class ServiceRequestCreatePayload(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    provider_id: str
    title: str
    description: str
    category: Optional[str] = None
    location: Optional[str] = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    preferred_date: Optional[str] = None
    requirement_quantity: Optional[int] = 1
    requirement_unit: Optional[str] = "units"

class ServiceRequestStatusUpdate(BaseModel):
    status: str  # 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'

class SendQuotePayload(BaseModel):
    quote_amount: float
    additional_charge: Optional[float] = 0.0
    note: Optional[str] = None

def auto_expire_stale_requests(db: Session):
    """
    Idempotent check auto-expiring PENDING requests older than 48 hours.
    """
    cutoff = datetime.utcnow() - timedelta(hours=48)
    db.query(ServiceRequest).filter(
        ServiceRequest.status == "PENDING",
        ServiceRequest.created_at < cutoff
    ).update({"status": "EXPIRED"}, synchronize_session=False)
    db.commit()

@router.post("", status_code=status.HTTP_201_CREATED)
def create_request(
    payload: ServiceRequestCreatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.role = "CUSTOMER"
    if payload.customer_name and payload.customer_name != "Neighbor Customer":
        current_user.name = payload.customer_name
    db.flush()

    # PHASE 6: Verify target provider is PUBLISHED and NOT Unavailable
    provider = db.query(ProviderProfile).filter(ProviderProfile.id == payload.provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target service provider not found.")

    if provider.status != "PUBLISHED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This provider is currently not accepting new bookings (Profile not published)."
        )

    if provider.availability and provider.availability.lower() in ["unavailable", "busy"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This provider is currently not accepting new bookings (Currently Unavailable)."
        )

    # PHASE 4: Duplicate Pending Request Protection
    existing_pending = db.query(ServiceRequest).filter(
        ServiceRequest.customer_id == current_user.id,
        ServiceRequest.provider_id == provider.id,
        ServiceRequest.status.in_(["PENDING", "QUOTED"])
    ).first()

    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active pending request with this provider. Please wait for their response."
        )

    # Obtain provider's current published price & pricing_unit from DB
    current_price = provider.price
    current_unit = provider.pricing_unit or "per_service"
    req_qty = max(1, payload.requirement_quantity or 1)
    req_unit = payload.requirement_unit or "units"

    req = ServiceRequest(
        customer_id=current_user.id,
        provider_id=provider.id,
        title=payload.title,
        description=payload.description,
        message=payload.description,
        category=payload.category or "General",
        location=payload.location or current_user.location or "Chennai, Tamil Nadu",
        latitude=payload.latitude or 13.0827,
        longitude=payload.longitude or 80.2707,
        preferred_date=payload.preferred_date,
        requirement_quantity=req_qty,
        requirement_unit=req_unit,
        status="PENDING",
        agreed_price=current_price,
        agreed_pricing_unit=current_unit,
        quote_status="PENDING",
        payment_status="NOT_REQUIRED"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # PROACTIVE NOTIFICATION ENGINE: Notify Senior via In-App + WhatsApp Mock
    try:
        if provider and provider.user_id:
            cust_name = current_user.name or "Customer"
            earning = (req.agreed_price or 500.0) * (req.requirement_quantity or 1)
            senior_phone = provider.user.phone if provider.user else None
            NotificationService.notify_new_request(
                db=db,
                service_request=req,
                customer_name=cust_name,
                senior_user_id=provider.user_id,
                senior_phone=senior_phone,
                estimated_earning=earning,
                location=req.location or "Chennai"
            )
    except Exception as e:
        print(f"[Notification Engine Error] {e}")

    return {
        "id": req.id,
        "customer_id": req.customer_id,
        "provider_id": req.provider_id,
        "title": req.title,
        "description": req.description,
        "requirement_quantity": req.requirement_quantity,
        "requirement_unit": req.requirement_unit,
        "status": req.status,
        "agreed_price": req.agreed_price,
        "agreed_pricing_unit": req.agreed_pricing_unit,
        "quote_status": req.quote_status,
        "payment_status": req.payment_status,
        "created_at": req.created_at
    }

@router.get("/my")
def list_my_customer_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    auto_expire_stale_requests(db)
    requests = db.query(ServiceRequest).filter(ServiceRequest.customer_id == current_user.id).order_by(ServiceRequest.created_at.desc()).all()
    results = []
    for r in requests:
        provider_data = None
        if r.provider_id:
            prov = db.query(ProviderProfile).filter(ProviderProfile.id == r.provider_id).first()
            if prov and prov.user:
                provider_data = {
                    "id": prov.id,
                    "title": prov.title,
                    "rating": prov.rating,
                    "user": {
                        "name": prov.user.name,
                        "location": prov.user.location
                    }
                }

        # Payment details are exposed ONLY after quote acceptance
        is_quote_accepted = r.quote_status == "ACCEPTED" or r.status in ["ACCEPTED", "COMPLETED"]

        results.append({
            "id": r.id,
            "customer_id": r.customer_id,
            "provider_id": r.provider_id,
            "title": r.title,
            "description": r.description,
            "preferred_date": r.preferred_date,
            "requirement_quantity": r.requirement_quantity or 1,
            "requirement_unit": r.requirement_unit or "units",
            "status": r.status,
            "agreed_price": r.agreed_price,
            "agreed_pricing_unit": r.agreed_pricing_unit or "per_service",
            "quote_amount": r.quote_amount,
            "quote_pricing_unit": r.quote_pricing_unit,
            "quote_additional_charge": r.quote_additional_charge or 0.0,
            "quote_note": r.quote_note,
            "quote_status": r.quote_status or "PENDING",
            "quoted_at": r.quoted_at,
            "quote_responded_at": r.quote_responded_at,
            "payment_status": r.payment_status or "NOT_REQUIRED",
            "payment_method": r.payment_method if is_quote_accepted else None,
            "payment_upi_id": r.payment_upi_id if is_quote_accepted else None,
            "payment_instructions": r.payment_instructions if is_quote_accepted else None,
            "payment_confirmation_at": r.payment_confirmation_at,
            "provider": provider_data,
            "created_at": r.created_at
        })
    return results

@router.get("/incoming")
def list_incoming_senior_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    auto_expire_stale_requests(db)
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        return []

    # STRICT ISOLATION: Senior receives ONLY requests directed specifically to their provider profile
    requests = db.query(ServiceRequest).filter(
        ServiceRequest.provider_id == profile.id
    ).order_by(ServiceRequest.created_at.desc()).all()

    results = []
    for r in requests:
        cust = r.customer
        # PHASE 7: Privacy Masking for PENDING requests
        is_unlocked = r.status in ["ACCEPTED", "COMPLETED"]
        
        customer_info = {
            "name": cust.name if cust else "Neighbor Customer",
            "location": cust.location if cust else "Chennai, Tamil Nadu",
            "phone": (cust.phone if cust and cust.phone else "Available after accept") if is_unlocked else "Contact details unlocked after acceptance",
            "is_unlocked": is_unlocked
        }

        results.append({
            "id": r.id,
            "customer_id": r.customer_id,
            "provider_id": r.provider_id,
            "title": r.title,
            "description": r.description,
            "location": r.location,
            "preferred_date": r.preferred_date,
            "requirement_quantity": r.requirement_quantity or 1,
            "requirement_unit": r.requirement_unit or "units",
            "status": r.status,
            "agreed_price": r.agreed_price,
            "agreed_pricing_unit": r.agreed_pricing_unit or "per_service",
            "quote_amount": r.quote_amount,
            "quote_pricing_unit": r.quote_pricing_unit,
            "quote_additional_charge": r.quote_additional_charge or 0.0,
            "quote_note": r.quote_note,
            "quote_status": r.quote_status or "PENDING",
            "quoted_at": r.quoted_at,
            "quote_responded_at": r.quote_responded_at,
            "payment_status": r.payment_status or "NOT_REQUIRED",
            "payment_method": r.payment_method,
            "payment_upi_id": r.payment_upi_id,
            "payment_instructions": r.payment_instructions,
            "payment_confirmation_at": r.payment_confirmation_at,
            "customer": customer_info,
            "created_at": r.created_at
        })
    return results

@router.put("/{request_id}/cancel")
def cancel_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    if req.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own service requests.")

    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel request with status '{req.status}'. Only PENDING requests can be cancelled.")

    # PHASE 3: Atomic State Transition (PENDING -> CANCELLED)
    rows_updated = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.customer_id == current_user.id,
        ServiceRequest.status == "PENDING"
    ).update({"status": "CANCELLED"}, synchronize_session=False)
    db.commit()

    if rows_updated == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request status was modified by another transaction.")

    return {
        "id": req.id,
        "status": "CANCELLED",
        "title": req.title
    }

@router.put("/{request_id}/status")
def update_request_status(
    request_id: str,
    payload: ServiceRequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile or req.provider_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage requests assigned to your provider profile.")

    new_status = payload.status.upper()
    
    # PHASE 3: Enforce Legal State Transitions
    valid_transitions = {
        "PENDING": ["ACCEPTED", "DECLINED"],
        "ACCEPTED": ["COMPLETED"]
    }

    allowed = valid_transitions.get(req.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition from '{req.status}' to '{new_status}'."
        )

    # PHASE 3: Atomic State Mutation & Payment Status Lock
    update_fields = {"status": new_status}
    if new_status == "ACCEPTED":
        update_fields["payment_status"] = "PAYMENT_PENDING"
        if req.agreed_price is None:
            update_fields["agreed_price"] = profile.price
            update_fields["agreed_pricing_unit"] = profile.pricing_unit or "per_service"

    rows_updated = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.provider_id == profile.id,
        ServiceRequest.status == req.status
    ).update(update_fields, synchronize_session=False)
    db.commit()

    if rows_updated == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request status was concurrently updated by another transaction.")

    db.refresh(req)

    return {
        "id": req.id,
        "status": new_status,
        "title": req.title,
        "agreed_price": req.agreed_price,
        "agreed_pricing_unit": req.agreed_pricing_unit,
        "payment_status": req.payment_status
    }

@router.post("/{request_id}/quote")
def send_quote(
    request_id: str,
    payload: SendQuotePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile or req.provider_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only quote requests assigned to your provider profile.")

    if payload.quote_amount < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quote amount cannot be negative.")

    if req.quote_status != "PENDING" or req.status in ["ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot send quote for request with quote_status '{req.quote_status}' and status '{req.status}'.")

    unit = profile.pricing_unit or "per_service"
    add_charge = float(payload.additional_charge or 0.0)

    rows = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.provider_id == profile.id,
        ServiceRequest.quote_status == "PENDING"
    ).update({
        "quote_amount": float(payload.quote_amount),
        "quote_pricing_unit": unit,
        "quote_additional_charge": add_charge,
        "quote_note": payload.note,
        "quoted_at": datetime.utcnow(),
        "status": "QUOTED",
        "quote_status": "PENDING"
    }, synchronize_session=False)
    db.commit()

    if rows == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Quote status was modified concurrently by another transaction.")

    db.refresh(req)

    # PROACTIVE NOTIFICATION: Notify Customer that Quote was submitted
    try:
        provider_name = current_user.name or "Senior Provider"
        NotificationService.notify_quote_received(
            db=db,
            service_request=req,
            customer_user_id=req.customer_id,
            provider_name=provider_name,
            quote_amount=float(payload.quote_amount)
        )
    except Exception as e:
        print(f"[Notification Quote Error] {e}")

    return {
        "id": req.id,
        "status": req.status,
        "quote_amount": req.quote_amount,
        "quote_pricing_unit": req.quote_pricing_unit,
        "quote_additional_charge": req.quote_additional_charge,
        "quote_note": req.quote_note,
        "quote_status": req.quote_status,
        "quoted_at": req.quoted_at
    }

@router.post("/{request_id}/quote/accept")
def accept_quote(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    if req.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only accept quotes for your own requests.")

    if req.quote_amount is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No quote has been provided for this request yet.")

    if req.quote_status != "PENDING":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot accept quote with status '{req.quote_status}'.")

    provider = db.query(ProviderProfile).filter(ProviderProfile.id == req.provider_id).first()

    rows = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.customer_id == current_user.id,
        ServiceRequest.quote_status == "PENDING"
    ).update({
        "quote_status": "ACCEPTED",
        "quote_responded_at": datetime.utcnow(),
        "status": "ACCEPTED",
        "agreed_price": req.quote_amount,
        "agreed_pricing_unit": req.quote_pricing_unit or (provider.pricing_unit if provider else "per_service"),
        "payment_status": "PAYMENT_PENDING",
        "payment_method": provider.payment_method if provider else "upi",
        "payment_upi_id": provider.payment_upi_id if provider else None,
        "payment_instructions": provider.payment_instructions if provider else None
    }, synchronize_session=False)
    db.commit()

    if rows == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Quote status was modified concurrently by another transaction.")

    db.refresh(req)

    # PROACTIVE NOTIFICATION: Notify Senior Provider that quote was ACCEPTED
    try:
        if provider and provider.user_id:
            cust_name = current_user.name or "Customer"
            NotificationService.notify_request_accepted(
                db=db,
                service_request=req,
                senior_user_id=provider.user_id,
                customer_name=cust_name
            )
    except Exception as e:
        print(f"[Notification Accept Error] {e}")

    return {
        "id": req.id,
        "status": req.status,
        "quote_status": req.quote_status,
        "payment_status": req.payment_status,
        "agreed_price": req.agreed_price,
        "agreed_pricing_unit": req.agreed_pricing_unit,
        "payment_method": req.payment_method,
        "payment_upi_id": req.payment_upi_id,
        "payment_instructions": req.payment_instructions
    }

@router.post("/{request_id}/quote/reject")
def reject_quote(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    if req.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only reject quotes for your own requests.")

    if req.quote_status != "PENDING":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot reject quote with status '{req.quote_status}'.")

    rows = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.customer_id == current_user.id,
        ServiceRequest.quote_status == "PENDING"
    ).update({
        "quote_status": "REJECTED",
        "quote_responded_at": datetime.utcnow(),
        "status": "DECLINED"
    }, synchronize_session=False)
    db.commit()

    if rows == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Quote status was modified concurrently by another transaction.")

    db.refresh(req)

    # PROACTIVE NOTIFICATION: Notify Senior Provider that quote was DECLINED
    try:
        provider = db.query(ProviderProfile).filter(ProviderProfile.id == req.provider_id).first()
        if provider and provider.user_id:
            cust_name = current_user.name or "Customer"
            NotificationService.notify_request_rejected(
                db=db,
                service_request=req,
                senior_user_id=provider.user_id,
                customer_name=cust_name
            )
    except Exception as e:
        print(f"[Notification Reject Error] {e}")

    return {
        "id": req.id,
        "status": req.status,
        "quote_status": req.quote_status
    }

@router.post("/{request_id}/payment/confirm")
def customer_confirm_payment(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    if req.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only confirm payment for your own requests.")

    if req.payment_status not in ["PAYMENT_PENDING", "NOT_REQUIRED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot confirm payment when payment status is '{req.payment_status}'.")

    rows = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.customer_id == current_user.id
    ).update({
        "payment_status": "PAYMENT_CONFIRMATION",
        "payment_confirmation_at": datetime.utcnow()
    }, synchronize_session=False)
    db.commit()

    db.refresh(req)

    # PROACTIVE NOTIFICATION: Notify Senior Provider of Payment Confirmation
    try:
        provider = db.query(ProviderProfile).filter(ProviderProfile.id == req.provider_id).first()
        if provider and provider.user_id:
            cust_name = current_user.name or "Customer"
            amount = req.agreed_price or 0.0
            NotificationService.notify_payment_confirmed(
                db=db,
                service_request=req,
                senior_user_id=provider.user_id,
                customer_name=cust_name,
                amount=amount
            )
    except Exception as e:
        print(f"[Notification Payment Error] {e}")

    return {
        "id": req.id,
        "payment_status": req.payment_status,
        "payment_confirmation_at": req.payment_confirmation_at
    }

@router.post("/{request_id}/payment/received")
def senior_confirm_payment_received(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile or req.provider_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage requests assigned to your provider profile.")

    rows = db.query(ServiceRequest).filter(
        ServiceRequest.id == request_id,
        ServiceRequest.provider_id == profile.id
    ).update({
        "payment_status": "PAID"
    }, synchronize_session=False)
    db.commit()

    db.refresh(req)
    return {
        "id": req.id,
        "payment_status": req.payment_status
    }

