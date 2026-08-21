import os
import re
import logging
from typing import Dict, Any, Optional, List
import httpx

logger = logging.getLogger(__name__)

def sanitize_phone_number(phone: str) -> str:
    """Normalize phone number to international format without leading + sign."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    # Default to India 91 prefix if 10-digit number provided
    if len(digits) == 10 and not digits.startswith("91"):
        digits = "91" + digits
    return digits

def get_whatsapp_config() -> Dict[str, Optional[str]]:
    """Retrieve WhatsApp Cloud API configuration from environment."""
    token = os.getenv("WHATSAPP_ACCESS_TOKEN") or os.getenv("WHATSAPP_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    api_version = os.getenv("WHATSAPP_API_VERSION") or "v20.0"
    
    return {
        "token": token,
        "phone_number_id": phone_number_id,
        "business_account_id": business_account_id,
        "verify_token": verify_token,
        "api_version": api_version,
        "is_configured": bool(token and phone_number_id)
    }

def send_whatsapp_cloud_api(
    recipient_phone: str, 
    text_body: str,
    template_name: Optional[str] = None,
    template_language: str = "en",
    template_components: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Real Meta WhatsApp Cloud API Service integration.
    Sends actual WhatsApp message (text or template) if credentials are configured in backend/.env.
    Otherwise returns status NOT_CONFIGURED.
    """
    config = get_whatsapp_config()
    token = config["token"]
    phone_number_id = config["phone_number_id"]
    api_version = config["api_version"]

    sanitized_to = sanitize_phone_number(recipient_phone)

    if not config["is_configured"]:
        error_msg = "WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID) not configured in .env"
        logger.info(f"[WhatsApp Cloud API] {error_msg}")
        return {
            "success": False,
            "status": "NOT_CONFIGURED",
            "message_id": None,
            "recipient": sanitized_to or recipient_phone,
            "error_details": error_msg
        }

    if not sanitized_to:
        error_msg = f"Invalid or missing recipient phone number: '{recipient_phone}'"
        logger.error(f"[WhatsApp Cloud API] {error_msg}")
        return {
            "success": False,
            "status": "FAILED",
            "message_id": None,
            "recipient": recipient_phone,
            "error_details": error_msg
        }

    url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Format payload (Template vs Free-form Text)
    if template_name:
        payload: Dict[str, Any] = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": sanitized_to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": template_language}
            }
        }
        if template_components:
            payload["template"]["components"] = template_components
    else:
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": sanitized_to,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": text_body
            }
        }

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(url, headers=headers, json=payload)
            res_json = res.json()

            if res.status_code in [200, 201] and "messages" in res_json and len(res_json["messages"]) > 0:
                msg_id = res_json["messages"][0]["id"]
                logger.info(f"[WhatsApp Cloud API] Message dispatched to {sanitized_to}. Message ID: {msg_id}")
                return {
                    "success": True,
                    "status": "SENT",
                    "message_id": msg_id,
                    "recipient": sanitized_to,
                    "error_details": None
                }
            else:
                err_obj = res_json.get("error", {})
                err_text = err_obj.get("message") or res.text
                error_msg = f"API Error HTTP {res.status_code}: {err_text}"
                logger.error(f"[WhatsApp Cloud API Failed] {error_msg}")
                return {
                    "success": False,
                    "status": "FAILED",
                    "message_id": None,
                    "recipient": sanitized_to,
                    "error_details": error_msg
                }

    except Exception as e:
        error_msg = f"Network/Integration Exception: {str(e)}"
        logger.error(f"[WhatsApp Cloud API Exception] {error_msg}")
        return {
            "success": False,
            "status": "FAILED",
            "message_id": None,
            "recipient": sanitized_to,
            "error_details": error_msg
        }

def send_whatsapp_template(
    recipient_phone: str,
    template_type: str,
    parameters: Dict[str, str],
    fallback_text: str
) -> Dict[str, Any]:
    """
    Sends predefined WhatsApp template message based on configured template mappings in .env.
    Falls back to free-form text if template is not specified.
    """
    env_template_key = f"WHATSAPP_TEMPLATE_{template_type.upper()}"
    template_name = os.getenv(env_template_key)

    if template_name:
        # Build text parameters components
        components = [{
            "type": "body",
            "parameters": [{"type": "text", "text": val} for val in parameters.values()]
        }]
        return send_whatsapp_cloud_api(
            recipient_phone=recipient_phone,
            text_body=fallback_text,
            template_name=template_name,
            template_language="en",
            template_components=components
        )
    else:
        return send_whatsapp_cloud_api(
            recipient_phone=recipient_phone,
            text_body=fallback_text
        )
