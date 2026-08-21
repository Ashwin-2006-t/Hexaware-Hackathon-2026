import os
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, Notification
from app.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def mask_phone_number(phone: Optional[str]) -> Optional[str]:
    """Format phone number to masked representation e.g. +91 987****099"""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 10:
        cc = digits[:-10] or "91"
        main = digits[-10:]
        return f"+{cc} {main[:3]}****{main[-3:]}"
    return phone

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool
    is_cleared: Optional[bool] = False
    related_request_id: Optional[str] = None
    whatsapp_status: Optional[str] = "NOT_CONFIGURED"
    whatsapp_phone: Optional[str] = None
    whatsapp_message: Optional[str] = None
    whatsapp_sent_at: Optional[str] = None
    whatsapp_delivered_at: Optional[str] = None
    whatsapp_read_at: Optional[str] = None
    whatsapp_failed_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

@router.get("/me", response_model=List[NotificationResponse])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve active (non-cleared) notifications for the current authenticated user only.
    Strict user isolation: Senior A cannot view Senior B's or Customer's notifications.
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        (Notification.is_cleared == False) | (Notification.is_cleared == None)
    ).order_by(Notification.created_at.desc()).all()

    result = []
    for n in notifications:
        raw_phone = n.whatsapp_phone or current_user.phone
        result.append(NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            is_cleared=n.is_cleared or False,
            related_request_id=n.related_request_id,
            whatsapp_status=n.whatsapp_status or "NOT_CONFIGURED",
            whatsapp_phone=mask_phone_number(raw_phone),
            whatsapp_message=n.whatsapp_message,
            whatsapp_sent_at=n.whatsapp_sent_at.isoformat() if n.whatsapp_sent_at else None,
            whatsapp_delivered_at=n.whatsapp_delivered_at.isoformat() if n.whatsapp_delivered_at else None,
            whatsapp_read_at=n.whatsapp_read_at.isoformat() if n.whatsapp_read_at else None,
            whatsapp_failed_at=n.whatsapp_failed_at.isoformat() if n.whatsapp_failed_at else None,
            created_at=n.created_at.isoformat() if n.created_at else datetime.utcnow().isoformat()
        ))
    return result

@router.delete("/me", status_code=status.HTTP_200_OK)
def clear_all_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft-clears all notifications belonging strictly to current authenticated user.
    Sets is_cleared = True so unread count becomes 0 and list becomes empty.
    Returns cleared_count.
    """
    cleared_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        (Notification.is_cleared == False) | (Notification.is_cleared == None)
    ).update({"is_cleared": True, "is_read": True}, synchronize_session=False)
    db.commit()
    return {"success": True, "cleared_count": cleared_count}

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def clear_single_notification(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft-clears individual notification after verifying user ownership.
    """
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    if notif.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot clear notifications belonging to another user."
        )

    notif.is_cleared = True
    notif.is_read = True
    db.commit()
    return {"success": True, "id": id}

@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read.
    Enforces strict security ownership check.
    """
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    if notif.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot modify notifications belonging to another user."
        )

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    raw_phone = notif.whatsapp_phone or current_user.phone
    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        is_cleared=notif.is_cleared or False,
        related_request_id=notif.related_request_id,
        whatsapp_status=notif.whatsapp_status or "NOT_CONFIGURED",
        whatsapp_phone=mask_phone_number(raw_phone),
        whatsapp_message=notif.whatsapp_message,
        whatsapp_sent_at=notif.whatsapp_sent_at.isoformat() if notif.whatsapp_sent_at else None,
        whatsapp_delivered_at=notif.whatsapp_delivered_at.isoformat() if notif.whatsapp_delivered_at else None,
        whatsapp_read_at=notif.whatsapp_read_at.isoformat() if notif.whatsapp_read_at else None,
        whatsapp_failed_at=notif.whatsapp_failed_at.isoformat() if notif.whatsapp_failed_at else None,
        created_at=notif.created_at.isoformat() if notif.created_at else datetime.utcnow().isoformat()
    )

@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all unread notifications for current authenticated user as read.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read."}

@router.get("/whatsapp/webhook")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Meta WhatsApp Cloud API Webhook Verification Endpoint.
    """
    expected_verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "silverhands_webhook_token")
    if hub_mode == "subscribe" and hub_verify_token == expected_verify_token:
        return Response(content=hub_challenge or "", media_type="text/plain", status_code=200)
    raise HTTPException(status_code=403, detail="Webhook verification failed. Invalid verify token.")

@router.post("/whatsapp/webhook")
async def handle_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Meta WhatsApp Cloud API Webhook Event Handler.
    Updates notification delivery status (SENT -> DELIVERED -> READ / FAILED) in DB based on wamid ID.
    """
    try:
        data = await request.json()
        entry_list = data.get("entry", [])
        updated_count = 0

        for entry in entry_list:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                statuses = value.get("statuses", [])
                for status_item in statuses:
                    msg_id = status_item.get("id")
                    status_name = (status_item.get("status") or "").upper()  # SENT, DELIVERED, READ, FAILED
                    errors = status_item.get("errors", [])

                    if msg_id:
                        notif = db.query(Notification).filter(Notification.whatsapp_message_id == msg_id).first()
                        if notif:
                            notif.whatsapp_status = status_name
                            now = datetime.utcnow()
                            if status_name == "DELIVERED":
                                notif.whatsapp_delivered_at = now
                            elif status_name == "READ":
                                notif.whatsapp_read_at = now
                            elif status_name == "FAILED":
                                notif.whatsapp_failed_at = now

                            if errors:
                                notif.whatsapp_error_details = str(errors)
                            db.commit()
                            updated_count += 1

        return {"status": "success", "processed_events": updated_count}
    except Exception as e:
        return {"status": "error", "message": str(e)}
