import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.domain import Notification, User, ServiceRequest

logger = logging.getLogger("silverhands.notifications")

class WhatsAppNotificationProvider:
    """
    Demo-ready WhatsApp Notification Provider abstraction.
    Simulates sending messages via WhatsApp Cloud API / Twilio WhatsApp API.
    Can be easily connected to Meta WhatsApp API or Twilio in production.
    """
    @staticmethod
    def send_message(phone_number: str, message: str) -> Dict[str, Any]:
        timestamp = datetime.utcnow().isoformat()
        log_entry = f"[WhatsApp Mock Delivery] To: {phone_number} | Time: {timestamp}\nMessage:\n{message}"
        try:
            print(log_entry)
        except Exception:
            print(log_entry.encode("ascii", "replace").decode("ascii"))
        logger.info(log_entry)
        return {
            "status": "SENT",
            "provider": "MockWhatsAppCloudAPI",
            "to": phone_number,
            "timestamp": timestamp,
            "message_snippet": message[:100]
        }

class InAppNotificationProvider:
    """
    In-App Notification Provider that persists notifications in DB.
    """
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        related_request_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            is_read=False,
            related_request_id=related_request_id,
            created_at=datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

class NotificationService:
    """
    Unified Notification Service orchestrating In-App and WhatsApp notifications.
    """
    @staticmethod
    def notify_user(
        db: Session,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        related_request_id: Optional[str] = None,
        phone_number: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Create In-App Notification record in DB
        in_app = InAppNotificationProvider.create_notification(
            db=db,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_request_id=related_request_id
        )

        # 2. Retrieve user phone if not provided directly
        if not phone_number:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                phone_number = user.phone

        # 3. Trigger WhatsApp Notification Simulation & Persist Log to DB
        whatsapp_result = None
        if phone_number:
            whatsapp_text = f"🔔 *SilverHands Alert*\n\n*{title}*\n\n{message}\n\n[Open SilverHands App to respond]"
            whatsapp_result = WhatsAppNotificationProvider.send_message(phone_number, whatsapp_text)

            # Persist WhatsApp Delivery Log in DB
            in_app.whatsapp_status = "SENT (DEMO)"
            in_app.whatsapp_phone = phone_number
            in_app.whatsapp_message = whatsapp_text
            in_app.whatsapp_sent_at = datetime.utcnow()
            db.commit()
            db.refresh(in_app)

        return {
            "in_app_notification": in_app,
            "notification_id": in_app.id,
            "type": in_app.type,
            "title": in_app.title,
            "is_read": in_app.is_read,
            "whatsapp_status": in_app.whatsapp_status,
            "whatsapp_phone": in_app.whatsapp_phone,
            "whatsapp_message": in_app.whatsapp_message,
            "whatsapp_sent_at": in_app.whatsapp_sent_at.isoformat() if in_app.whatsapp_sent_at else None,
            "created_at": in_app.created_at.isoformat(),
            "whatsapp_delivery": whatsapp_result
        }

    @staticmethod
    def notify_new_request(
        db: Session,
        service_request: ServiceRequest,
        customer_name: str,
        senior_user_id: str,
        senior_phone: Optional[str],
        estimated_earning: float,
        location: str
    ):
        title = "New Service Request"
        message = (
            f"{customer_name} requested '{service_request.title}' service.\n\n"
            f"Expected earning:\n₹{int(estimated_earning)}\n\n"
            f"Location:\n{location}\n\n"
            f"Open SilverHands to respond."
        )
        return NotificationService.notify_user(
            db=db,
            user_id=senior_user_id,
            notification_type="NEW_SERVICE_REQUEST",
            title=title,
            message=message,
            related_request_id=service_request.id,
            phone_number=senior_phone
        )

    @staticmethod
    def notify_quote_received(db: Session, service_request: ServiceRequest, customer_user_id: str, provider_name: str, quote_amount: float):
        title = "Quote Received"
        message = f"Senior Provider {provider_name} submitted a quote of ₹{int(quote_amount)} for '{service_request.title}'. Open SilverHands to accept or review details."
        return NotificationService.notify_user(
            db=db,
            user_id=customer_user_id,
            notification_type="QUOTE_RECEIVED",
            title=title,
            message=message,
            related_request_id=service_request.id
        )

    @staticmethod
    def notify_request_accepted(db: Session, service_request: ServiceRequest, senior_user_id: str, customer_name: str):
        title = "Request Accepted"
        message = f"Customer {customer_name} accepted your quote for '{service_request.title}'. You may proceed with the service delivery."
        return NotificationService.notify_user(
            db=db,
            user_id=senior_user_id,
            notification_type="REQUEST_ACCEPTED",
            title=title,
            message=message,
            related_request_id=service_request.id
        )

    @staticmethod
    def notify_request_rejected(db: Session, service_request: ServiceRequest, senior_user_id: str, customer_name: str):
        title = "Request Declined"
        message = f"Customer {customer_name} declined the quote for '{service_request.title}'."
        return NotificationService.notify_user(
            db=db,
            user_id=senior_user_id,
            notification_type="REQUEST_REJECTED",
            title=title,
            message=message,
            related_request_id=service_request.id
        )

    @staticmethod
    def notify_payment_confirmed(db: Session, service_request: ServiceRequest, senior_user_id: str, customer_name: str, amount: float):
        title = "Payment Confirmed"
        message = f"Customer {customer_name} confirmed payment of ₹{int(amount)} for '{service_request.title}'."
        return NotificationService.notify_user(
            db=db,
            user_id=senior_user_id,
            notification_type="PAYMENT_CONFIRMED",
            title=title,
            message=message,
            related_request_id=service_request.id
        )

    @staticmethod
    def notify_service_completed(db: Session, service_request: ServiceRequest, customer_user_id: str, provider_name: str):
        title = "Service Completed"
        message = f"Senior Provider {provider_name} marked '{service_request.title}' as completed. Please leave a rating & review!"
        return NotificationService.notify_user(
            db=db,
            user_id=customer_user_id,
            notification_type="SERVICE_COMPLETED",
            title=title,
            message=message,
            related_request_id=service_request.id
        )

    @staticmethod
    def notify_new_review(db: Session, senior_user_id: str, customer_name: str, rating: int, comment: Optional[str]):
        title = "New Customer Review"
        message = f"Customer {customer_name} left a {rating}★ review for your service: '{comment or 'Great service!'}'"
        return NotificationService.notify_user(
            db=db,
            user_id=senior_user_id,
            notification_type="NEW_REVIEW",
            title=title,
            message=message
        )

    @staticmethod
    def notify_opportunity(db: Session, senior_user_id: str, service_name: str, match_score: int, estimated_earning: float):
        title = "Opportunity Found"
        message = (
            f"Customers near your location are looking for {service_name} services.\n\n"
            f"Skill Match: {match_score}%\n"
            f"Estimated earning opportunity: ₹{int(estimated_earning)}"
        )
        return NotificationService.notify_user(
            db=db,
            user_id=senior_user_id,
            notification_type="OPPORTUNITY_SUGGESTION",
            title=title,
            message=message
        )
