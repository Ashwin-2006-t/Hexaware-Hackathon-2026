import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ServiceRequest, CallLog
from app.auth import get_current_user

router = APIRouter(prefix="/api/calls", tags=["Service Query Calls"])

class InitiateCallRequest(BaseModel):
    request_id: str

class CallLogResponse(BaseModel):
    id: str
    request_id: str
    caller_id: str
    receiver_id: str
    caller_name: str
    receiver_name: str
    masked_phone: str
    call_link: str
    status: str
    started_at: str
    ended_at: Optional[str] = None
    duration_seconds: int = 0

    class Config:
        from_attributes = True

def mask_phone_number(phone: Optional[str]) -> str:
    """Mask middle digits of phone number for privacy preservation."""
    if not phone or len(phone) < 7:
        return "+91 ********"
    clean = phone.strip()
    prefix = clean[:5]
    suffix = clean[-3:]
    return f"{prefix}****{suffix}"

@router.post("/initiate", response_model=CallLogResponse)
def initiate_service_call(
    payload: InitiateCallRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authorize and log call initiation between customer & provider for a service request.
    Generates a secure click-to-call link and masked phone number to preserve privacy.
    """
    req = db.query(ServiceRequest).filter(ServiceRequest.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found.")

    provider_user_id = req.provider.user_id if req.provider else None

    # Check authorization relationship
    if current_user.id != req.customer_id and current_user.id != provider_user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Calling is authorized only between customers and assigned providers of active bookings."
        )

    # Determine caller and receiver
    if current_user.id == req.customer_id:
        receiver_id = provider_user_id
    else:
        receiver_id = req.customer_id

    if not receiver_id:
        raise HTTPException(status_code=400, detail="Target participant is not yet assigned to this request.")

    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Target user not found.")

    raw_phone = receiver.phone or "+919876543210"
    masked = mask_phone_number(raw_phone)
    call_link = f"tel:{raw_phone}"

    call_log = CallLog(
        request_id=req.id,
        caller_id=current_user.id,
        receiver_id=receiver.id,
        status="INITIATED",
        started_at=datetime.datetime.utcnow(),
        duration_seconds=0
    )
    db.add(call_log)
    db.commit()
    db.refresh(call_log)

    return CallLogResponse(
        id=call_log.id,
        request_id=call_log.request_id,
        caller_id=call_log.caller_id,
        receiver_id=call_log.receiver_id,
        caller_name=current_user.name,
        receiver_name=receiver.name,
        masked_phone=masked,
        call_link=call_link,
        status=call_log.status,
        started_at=call_log.started_at.isoformat(),
        ended_at=None,
        duration_seconds=0
    )

@router.post("/{call_id}/end", response_model=CallLogResponse)
def end_service_call(
    call_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log completion of an initiated service call and calculate duration.
    """
    call_log = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log record not found.")

    if current_user.id != call_log.caller_id and current_user.id != call_log.receiver_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    now = datetime.datetime.utcnow()
    call_log.status = "COMPLETED"
    call_log.ended_at = now
    
    if call_log.started_at:
        delta = (now - call_log.started_at).total_seconds()
        call_log.duration_seconds = int(max(delta, 1))

    db.commit()
    db.refresh(call_log)

    caller = db.query(User).filter(User.id == call_log.caller_id).first()
    receiver = db.query(User).filter(User.id == call_log.receiver_id).first()

    return CallLogResponse(
        id=call_log.id,
        request_id=call_log.request_id,
        caller_id=call_log.caller_id,
        receiver_id=call_log.receiver_id,
        caller_name=caller.name if caller else "Caller",
        receiver_name=receiver.name if receiver else "Receiver",
        masked_phone=mask_phone_number(receiver.phone if receiver else None),
        call_link=f"tel:{receiver.phone}" if (receiver and receiver.phone) else "tel:+919876543210",
        status=call_log.status,
        started_at=call_log.started_at.isoformat(),
        ended_at=call_log.ended_at.isoformat() if call_log.ended_at else None,
        duration_seconds=call_log.duration_seconds
    )

@router.get("/history", response_model=List[CallLogResponse])
def get_call_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve call history logs for current user.
    """
    logs = db.query(CallLog).filter(
        (CallLog.caller_id == current_user.id) | (CallLog.receiver_id == current_user.id)
    ).order_by(CallLog.created_at.desc()).all()

    results = []
    for cl in logs:
        caller = db.query(User).filter(User.id == cl.caller_id).first()
        receiver = db.query(User).filter(User.id == cl.receiver_id).first()
        results.append(CallLogResponse(
            id=cl.id,
            request_id=cl.request_id,
            caller_id=cl.caller_id,
            receiver_id=cl.receiver_id,
            caller_name=caller.name if caller else "Caller",
            receiver_name=receiver.name if receiver else "Receiver",
            masked_phone=mask_phone_number(receiver.phone if receiver else None),
            call_link=f"tel:{receiver.phone}" if (receiver and receiver.phone) else "tel:+919876543210",
            status=cl.status,
            started_at=cl.started_at.isoformat() if cl.started_at else datetime.datetime.utcnow().isoformat(),
            ended_at=cl.ended_at.isoformat() if cl.ended_at else None,
            duration_seconds=cl.duration_seconds
        ))
    return results
