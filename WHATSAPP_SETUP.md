# SilverHands — Meta WhatsApp Cloud API Setup & Integration Guide

This guide explains how to configure real Meta WhatsApp Cloud API credentials and webhooks for SilverHands.

---

## 1. Meta Developer & WhatsApp Business Setup

1. **Create a Meta Developer Account**:
   - Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook account.
2. **Create a New Meta App**:
   - Click **My Apps** → **Create App**.
   - Select **Other** → **Business** app type.
   - Set App Name (e.g., `SilverHands Notifications`).
3. **Add WhatsApp Product**:
   - On the App Dashboard, locate **WhatsApp** and click **Set up**.
   - Select or create a **Meta Business Portfolio**.
4. **Obtain Test Credentials**:
   - Navigate to **WhatsApp** → **API Setup** in the left sidebar.
   - Copy the following values into `backend/.env`:
     ```env
     WHATSAPP_ACCESS_TOKEN=EAAG...
     WHATSAPP_PHONE_NUMBER_ID=1092...
     WHATSAPP_BUSINESS_ACCOUNT_ID=1083...
     WHATSAPP_VERIFY_TOKEN=silverhands_webhook_token
     WHATSAPP_API_VERSION=v20.0
     ```

> [!WARNING]
> Do NOT place WhatsApp access tokens in frontend code. Access tokens must remain strictly in `backend/.env`.

---

## 2. Configurable Message Templates

For business-initiated conversations, Meta requires pre-approved WhatsApp message templates.

1. Navigate to **WhatsApp** → **Template Manager** in Meta Business Manager.
2. Create the following templates:
   - `silverhands_opportunity`: Livelihood opportunity notification
   - `silverhands_booking_confirmation`: Booking request confirmation
   - `silverhands_booking_accepted`: Request accepted alert
   - `silverhands_booking_reminder`: Service reminder alert
   - `silverhands_important_notification`: Priority alert
3. Add the template names to `backend/.env`:
   ```env
   WHATSAPP_TEMPLATE_OPPORTUNITY=silverhands_opportunity
   WHATSAPP_TEMPLATE_BOOKING_CONFIRMATION=silverhands_booking_confirmation
   WHATSAPP_TEMPLATE_BOOKING_ACCEPTED=silverhands_booking_accepted
   WHATSAPP_TEMPLATE_BOOKING_REMINDER=silverhands_booking_reminder
   WHATSAPP_TEMPLATE_IMPORTANT=silverhands_important_notification
   ```

---

## 3. Webhook Setup for Local Development

Meta requires a publicly accessible HTTPS URL for webhooks. For local development, expose your FastAPI backend (`port 8000`) using `ngrok` or an approved HTTPS tunnel.

```bash
# Expose port 8000 via ngrok
ngrok http 8000
```

1. Copy the generated HTTPS Forwarding URL (e.g. `https://a1b2-34-56-78-90.ngrok-free.app`).
2. In Meta App Dashboard, navigate to **WhatsApp** → **Configuration** → **Edit Webhook**.
3. Set **Callback URL**:
   `https://a1b2-34-56-78-90.ngrok-free.app/api/v1/notifications/whatsapp/webhook`
4. Set **Verify Token**: `silverhands_webhook_token` (matches `WHATSAPP_VERIFY_TOKEN` in `.env`).
5. Click **Verify and Save**.
6. Under **Webhook Fields**, subscribe to `messages`.

---

## 4. Webhook Status Lifecycle

When a WhatsApp alert is sent, status transitions through the following stages:

```
Database Notification (STATUS: QUEUED / SENT)
                      ↓
Meta Dispatch (Message ID: wamid.HBg...)
                      ↓
Webhook: messages (status: delivered) → DB Status: DELIVERED
                      ↓
Webhook: messages (status: read)      → DB Status: READ
```

If Meta rejects the payload or phone number is invalid:
```
Meta API Error 400/401 → DB Status: FAILED (stored in whatsapp_error_details)
```

---

## 5. End-to-End Test Execution

1. Start FastAPI backend:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
2. Trigger an opportunity notification or booking alert in SilverHands.
3. Inspect database status:
   - If `.env` credentials are missing: status displays `NOT_CONFIGURED` in drawer.
   - If credentials are valid: status updates to `SENT`, then `DELIVERED` when received on recipient phone.
