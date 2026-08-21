import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ServiceRequest, ProviderProfile, VirtualRoom, VirtualRoomMessage
from app.auth import get_current_user

router = APIRouter(prefix="/api/virtual-rooms", tags=["Virtual Tuition Rooms"])

class CreateRoomRequest(BaseModel):
    booking_id: str

class SendMessageRequest(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: str

    class Config:
        from_attributes = True

class VirtualRoomResponse(BaseModel):
    id: str
    booking_id: str
    room_code: str
    host_user_id: str
    participant_user_id: str
    host_name: str
    participant_name: str
    status: str
    start_time: str
    end_time: Optional[str] = None
    service_title: str
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

@router.post("/create", response_model=VirtualRoomResponse)
def create_or_join_virtual_room(
    payload: CreateRoomRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or retrieve a WebRTC virtual tuition classroom for a confirmed booking.
    Only authorized customer or provider participants may access the room.
    """
    req = db.query(ServiceRequest).filter(ServiceRequest.id == payload.booking_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Booking request not found.")

    if req.status not in ["ACCEPTED", "COMPLETED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Virtual classroom can only be launched for confirmed bookings (current status: {req.status})."
        )

    # Check Delivery Mode: IN_PERSON bookings cannot launch Virtual Live Room
    effective_mode = (req.delivery_mode or "").upper()
    if not effective_mode or effective_mode == "BOTH":
        if req.provider and req.provider.service_delivery_mode:
            effective_mode = req.provider.service_delivery_mode.upper()

    if effective_mode == "IN_PERSON":
        raise HTTPException(
            status_code=400,
            detail="This booking is configured for in-person delivery only and does not support Virtual Live Room."
        )

    # Determine provider user ID
    provider_user_id = None
    if req.provider:
        provider_user_id = req.provider.user_id

    # Check authorization
    if current_user.id != req.customer_id and current_user.id != provider_user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only authorized participants (customer or assigned provider) may enter this virtual room."
        )

    # Check existing room
    room = db.query(VirtualRoom).filter(VirtualRoom.booking_id == req.id).first()
    if not room:
        host_id = provider_user_id or req.customer_id
        participant_id = req.customer_id if host_id != req.customer_id else provider_user_id
        room_code = f"SH-TUTOR-{str(uuid.uuid4())[:8].upper()}"

        room = VirtualRoom(
            booking_id=req.id,
            room_code=room_code,
            host_user_id=host_id,
            participant_user_id=participant_id,
            status="ACTIVE",
            start_time=datetime.datetime.utcnow()
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    # Load host & participant names
    host_user = db.query(User).filter(User.id == room.host_user_id).first()
    part_user = db.query(User).filter(User.id == room.participant_user_id).first()

    msgs = db.query(VirtualRoomMessage).filter(VirtualRoomMessage.room_id == room.id).order_by(VirtualRoomMessage.timestamp.asc()).all()

    return VirtualRoomResponse(
        id=room.id,
        booking_id=room.booking_id,
        room_code=room.room_code,
        host_user_id=room.host_user_id,
        participant_user_id=room.participant_user_id,
        host_name=host_user.name if host_user else "Host",
        participant_name=part_user.name if part_user else "Participant",
        status=room.status,
        start_time=room.start_time.isoformat() if room.start_time else datetime.datetime.utcnow().isoformat(),
        end_time=room.end_time.isoformat() if room.end_time else None,
        service_title=req.title,
        messages=[
            MessageResponse(
                id=m.id,
                room_id=m.room_id,
                sender_id=m.sender_id,
                sender_name=m.sender_name,
                content=m.content,
                timestamp=m.timestamp.isoformat() if m.timestamp else datetime.datetime.utcnow().isoformat()
            ) for m in msgs
        ]
    )

@router.get("/{room_id}", response_model=VirtualRoomResponse)
def get_virtual_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve virtual room status, details, and chat message history for authorized participants.
    """
    room = db.query(VirtualRoom).filter(VirtualRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Virtual room not found.")

    if current_user.id != room.host_user_id and current_user.id != room.participant_user_id:
        raise HTTPException(status_code=403, detail="Access denied. You are not an authorized participant of this virtual room.")

    req = db.query(ServiceRequest).filter(ServiceRequest.id == room.booking_id).first()
    host_user = db.query(User).filter(User.id == room.host_user_id).first()
    part_user = db.query(User).filter(User.id == room.participant_user_id).first()
    msgs = db.query(VirtualRoomMessage).filter(VirtualRoomMessage.room_id == room.id).order_by(VirtualRoomMessage.timestamp.asc()).all()

    return VirtualRoomResponse(
        id=room.id,
        booking_id=room.booking_id,
        room_code=room.room_code,
        host_user_id=room.host_user_id,
        participant_user_id=room.participant_user_id,
        host_name=host_user.name if host_user else "Host",
        participant_name=part_user.name if part_user else "Participant",
        status=room.status,
        start_time=room.start_time.isoformat() if room.start_time else datetime.datetime.utcnow().isoformat(),
        end_time=room.end_time.isoformat() if room.end_time else None,
        service_title=req.title if req else "Virtual Classroom",
        messages=[
            MessageResponse(
                id=m.id,
                room_id=m.room_id,
                sender_id=m.sender_id,
                sender_name=m.sender_name,
                content=m.content,
                timestamp=m.timestamp.isoformat() if m.timestamp else datetime.datetime.utcnow().isoformat()
            ) for m in msgs
        ]
    )

@router.post("/{room_id}/messages", response_model=MessageResponse)
def post_virtual_room_message(
    room_id: str,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Post a text chat message in an active virtual tuition room.
    """
    room = db.query(VirtualRoom).filter(VirtualRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Virtual room not found.")

    if current_user.id != room.host_user_id and current_user.id != room.participant_user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if room.status == "ENDED":
        raise HTTPException(status_code=400, detail="Cannot send message in an ended virtual room session.")

    msg = VirtualRoomMessage(
        room_id=room.id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        content=payload.content,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        room_id=msg.room_id,
        sender_id=msg.sender_id,
        sender_name=msg.sender_name,
        content=msg.content,
        timestamp=msg.timestamp.isoformat()
    )

@router.post("/{room_id}/end", response_model=VirtualRoomResponse)
def end_virtual_room_session(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    End an active virtual tuition classroom session.
    """
    room = db.query(VirtualRoom).filter(VirtualRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Virtual room not found.")

    if current_user.id != room.host_user_id and current_user.id != room.participant_user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    room.status = "ENDED"
    room.end_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(room)

    return get_virtual_room(room_id, current_user, db)
