from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models.domain import User, Notification
from app.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool
    related_request_id: Optional[str] = None
    whatsapp_status: Optional[str] = "SENT (DEMO)"
    whatsapp_phone: Optional[str] = None
    whatsapp_message: Optional[str] = None
    whatsapp_sent_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

@router.get("/me", response_model=List[NotificationResponse])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve notifications for the current authenticated user only.
    Strict isolation: Senior A cannot view Senior B's or Customer's notifications.
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    result = []
    for n in notifications:
        result.append(NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            related_request_id=n.related_request_id,
            whatsapp_status=n.whatsapp_status or "SENT (DEMO)",
            whatsapp_phone=n.whatsapp_phone or current_user.phone,
            whatsapp_message=n.whatsapp_message,
            whatsapp_sent_at=n.whatsapp_sent_at.isoformat() if n.whatsapp_sent_at else None,
            created_at=n.created_at.isoformat() if n.created_at else datetime.utcnow().isoformat()
        ))
    return result

@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read.
    Enforces strict security ownership check: 403 Forbidden if accessing another user's notification.
    """
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    # STRICT USER ISOLATION SECURITY CHECK
    if notif.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot modify notifications belonging to another user."
        )

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        related_request_id=notif.related_request_id,
        whatsapp_status=notif.whatsapp_status or "SENT (DEMO)",
        whatsapp_phone=notif.whatsapp_phone or current_user.phone,
        whatsapp_message=notif.whatsapp_message,
        whatsapp_sent_at=notif.whatsapp_sent_at.isoformat() if notif.whatsapp_sent_at else None,
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
