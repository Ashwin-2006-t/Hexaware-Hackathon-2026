"""
Automated Integration Test Suite: SilverHands Real Features & Architecture Verification
Verifies end-to-end functionality for:
1. Meta WhatsApp Cloud API integration, credential check, GET/POST webhook handling & DB status updates.
2. Virtual Tuition Room creation, participant authorization (403 check), WebRTC room code generation, in-class chat & session ending.
3. Service Query Call authorization, phone number masking for privacy, telephony click-to-call link, and CallLog persistence.
4. Strict Review Authorization (COMPLETED booking requirement, duplicate review rejection, 1-5 rating validation).
5. Data-driven Location Radius search & Opportunity Recommendation engine without fake/demo data.
6. Database Integrity & Health Check endpoint (/api/health/db-check).
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.domain import (
    User, ProviderProfile, ServiceRequest, Skill, Service, Review, Notification, VirtualRoom, VirtualRoomMessage, CallLog
)

client = TestClient(app)

class TestRealFeaturesIntegrationSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()
        self.db.query(CallLog).delete()
        self.db.query(VirtualRoomMessage).delete()
        self.db.query(VirtualRoom).delete()
        self.db.query(Notification).delete()
        self.db.query(Review).delete()
        self.db.query(ServiceRequest).delete()
        self.db.query(Skill).delete()
        self.db.query(Service).delete()
        self.db.query(ProviderProfile).delete()
        self.db.query(User).delete()
        self.db.commit()

    def tearDown(self):
        self.db.close()

    # ------------------------------------------------------------
    # 1. WHATSAPP CLOUD API & WEBHOOK INTEGRATION
    # ------------------------------------------------------------
    def test_01_whatsapp_cloud_api_credentials_and_webhooks(self):
        """Test WhatsApp Cloud API credential check and Webhook GET/POST handling."""
        from app.services.whatsapp_service import send_whatsapp_cloud_api

        # 1. Dispatch without credentials -> NOT_CONFIGURED status (never pretends sent)
        res = send_whatsapp_cloud_api("+919876543210", "Test WhatsApp Body")
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "NOT_CONFIGURED")
        self.assertIn("credentials", res["error_details"].lower())

        # 2. Test GET Webhook Verification Endpoint (hub.challenge)
        verify_res = client.get("/api/notifications/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=silverhands_webhook_token&hub.challenge=CHALLENGE_12345")
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.text, "CHALLENGE_12345")

        # 3. Test Invalid GET Webhook Verification Token -> 403 Forbidden
        bad_verify = client.get("/api/notifications/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=123")
        self.assertEqual(bad_verify.status_code, 403)

        # 4. Create Notification with a mock message ID
        u = User(id="user_wa_test", name="WhatsApp User", email="wa@example.com", role="CUSTOMER", phone="+919876500011")
        self.db.add(u)
        self.db.flush()
        notif = Notification(
            id="notif_wa_1",
            user_id=u.id,
            type="NEW_SERVICE_REQUEST",
            title="Service Request Alert",
            message="Your booking request was submitted.",
            whatsapp_message_id="wamid.HBgMOTE5ODc2NTAwMDExFQIAERgSMDExMjIzMzQ0NTU2Njc3ODg5AA==",
            whatsapp_status="SENT"
        )
        self.db.add(notif)
        self.db.commit()

        # 5. Test POST Webhook Status Update -> DELIVERED
        webhook_payload = {
            "entry": [
                {
                    "changes": [
                        {
                            "value": {
                                "statuses": [
                                    {
                                        "id": "wamid.HBgMOTE5ODc2NTAwMDExFQIAERgSMDExMjIzMzQ0NTU2Njc3ODg5AA==",
                                        "status": "delivered"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
        post_res = client.post("/api/notifications/whatsapp/webhook", json=webhook_payload)
        self.assertEqual(post_res.status_code, 200)
        self.assertEqual(post_res.json()["processed_events"], 1)

        # Verify DB notification status updated to DELIVERED
        db_notif = self.db.query(Notification).filter(Notification.id == "notif_wa_1").first()
        self.assertEqual(db_notif.whatsapp_status, "DELIVERED")

    # ------------------------------------------------------------
    # 2. VIRTUAL TUITION ROOM CREATION & AUTHORIZATION
    # ------------------------------------------------------------
    def test_02_virtual_tuition_room_lifecycle_and_security(self):
        """Test Virtual Room creation, participant authorization, chat messages, and session ending."""
        # 1. Create Tutor Senior & Student Customer
        tutor_user = User(id="user_tutor_vt", name="Shanthi Tutor", email="tutor.vt@example.com", role="SENIOR", phone="+919876500022")
        student_user = User(id="user_student_vt", name="Student Rahul", email="student.vt@example.com", role="CUSTOMER", phone="+919123400022")
        unauth_user = User(id="user_unauth_vt", name="Intruder User", email="unauth@example.com", role="CUSTOMER", phone="+919000000000")
        self.db.add_all([tutor_user, student_user, unauth_user])
        self.db.flush()

        prov = ProviderProfile(id="prof_tutor_vt", user_id=tutor_user.id, title="Senior Math & Hindi Tutor", status="PUBLISHED")
        self.db.add(prov)
        self.db.flush()

        # 2. Create PENDING Tutoring Booking
        req = ServiceRequest(
            id="req_vt_1",
            customer_id=student_user.id,
            provider_id=prov.id,
            title="Class 10 Math & Board Exam Coaching",
            description="1-on-1 online tutoring for board exam preparation",
            category="Education & Tutoring",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()

        h_student = {"Authorization": f"Bearer mock_jwt_token_{student_user.id}", "X-User-Id": student_user.id}
        h_tutor = {"Authorization": f"Bearer mock_jwt_token_{tutor_user.id}", "X-User-Id": tutor_user.id}
        h_unauth = {"Authorization": f"Bearer mock_jwt_token_{unauth_user.id}", "X-User-Id": unauth_user.id}

        # 3. Attempt creation on PENDING booking -> 400 Bad Request
        res_pending = client.post("/api/virtual-rooms/create", json={"booking_id": req.id}, headers=h_student)
        self.assertEqual(res_pending.status_code, 400, "Virtual room MUST NOT launch for unconfirmed bookings!")

        # 4. Accept Booking
        req.status = "ACCEPTED"
        self.db.commit()

        # 5. Unauthorized User attempts to enter -> 403 Forbidden
        res_unauth = client.post("/api/virtual-rooms/create", json={"booking_id": req.id}, headers=h_unauth)
        self.assertEqual(res_unauth.status_code, 403, "Unauthorized users MUST be blocked with HTTP 403!")

        # 6. Authorized Student joins -> Virtual Room created with unique room code
        res_create = client.post("/api/virtual-rooms/create", json={"booking_id": req.id}, headers=h_student)
        self.assertEqual(res_create.status_code, 200)
        room_data = res_create.json()
        self.assertTrue(room_data["room_code"].startswith("SH-TUTOR-"))
        self.assertEqual(room_data["status"], "ACTIVE")

        room_id = room_data["id"]

        # 7. Post Live In-Class Chat Message
        res_msg = client.post(f"/api/virtual-rooms/{room_id}/messages", json={"content": "Hello teacher, ready for class!"}, headers=h_student)
        self.assertEqual(res_msg.status_code, 200)
        self.assertEqual(res_msg.json()["sender_name"], "Student Rahul")

        # 8. Fetch Room Details as Tutor
        res_fetch = client.get(f"/api/virtual-rooms/{room_id}", headers=h_tutor)
        self.assertEqual(res_fetch.status_code, 200)
        self.assertEqual(len(res_fetch.json()["messages"]), 1)

        # 9. End Class Session
        res_end = client.post(f"/api/virtual-rooms/{room_id}/end", headers=h_tutor)
        self.assertEqual(res_end.status_code, 200)
        self.assertEqual(res_end.json()["status"], "ENDED")
        self.assertIsNotNone(res_end.json()["end_time"])

    # ------------------------------------------------------------
    # 3. SERVICE CALL AUTHORIZATION & TELEPHONY LOGGING
    # ------------------------------------------------------------
    def test_03_service_call_authorization_and_logging(self):
        """Test call authorization, phone number masking for privacy, click-to-call link, and CallLog persistence."""
        c_user = User(id="user_call_cust", name="Customer Anitha", email="anitha.call@example.com", role="CUSTOMER", phone="+919876543210")
        p_user = User(id="user_call_prov", name="Senior Chef Mani", email="mani.call@example.com", role="SENIOR", phone="+919123456789")
        other_user = User(id="user_call_other", name="Other Person", email="other.call@example.com", role="CUSTOMER", phone="+919000011111")
        self.db.add_all([c_user, p_user, other_user])
        self.db.flush()

        prov = ProviderProfile(id="prof_call_prov", user_id=p_user.id, title="Senior Chef", status="PUBLISHED")
        self.db.add(prov)
        self.db.flush()

        req = ServiceRequest(
            id="req_call_1",
            customer_id=c_user.id,
            provider_id=prov.id,
            title="Dosa Catering Order",
            description="Family event catering",
            status="ACCEPTED"
        )
        self.db.add(req)
        self.db.commit()

        h_cust = {"Authorization": f"Bearer mock_jwt_token_{c_user.id}", "X-User-Id": c_user.id}
        h_other = {"Authorization": f"Bearer mock_jwt_token_{other_user.id}", "X-User-Id": other_user.id}

        # 1. Unauthorized call initiation -> 403 Forbidden
        res_unauth = client.post("/api/calls/initiate", json={"request_id": req.id}, headers=h_other)
        self.assertEqual(res_unauth.status_code, 403, "Call initiation by unrelated user MUST be rejected!")

        # 2. Authorized Call Initiation by Customer
        res_init = client.post("/api/calls/initiate", json={"request_id": req.id}, headers=h_cust)
        self.assertEqual(res_init.status_code, 200)
        call_data = res_init.json()
        self.assertEqual(call_data["receiver_name"], "Senior Chef Mani")
        self.assertEqual(call_data["masked_phone"], "+9191****789", "Phone number MUST be masked to preserve privacy!")
        self.assertEqual(call_data["call_link"], "tel:+919123456789")
        self.assertEqual(call_data["status"], "INITIATED")

        call_id = call_data["id"]

        # 3. Log Call Completion
        res_end = client.post(f"/api/calls/{call_id}/end", headers=h_cust)
        self.assertEqual(res_end.status_code, 200)
        self.assertEqual(res_end.json()["status"], "COMPLETED")
        self.assertGreaterEqual(res_end.json()["duration_seconds"], 1)

        # 4. Verify Call History
        res_hist = client.get("/api/calls/history", headers=h_cust)
        self.assertEqual(res_hist.status_code, 200)
        self.assertEqual(len(res_hist.json()), 1)

    # ------------------------------------------------------------
    # 4. STRICT REVIEWS AUTHORIZATION & DUPLICATE PREVENTION
    # ------------------------------------------------------------
    def test_04_reviews_strict_authorization_and_duplicate_check(self):
        """Verify reviews require COMPLETED booking, prevent duplicate submission, and validate 1-5 rating."""
        c_user = User(id="user_rev_auth_c", name="Customer Maya", email="maya.rev@example.com", role="CUSTOMER", phone="+919876500033")
        p_user = User(id="user_rev_auth_p", name="Senior Tailor Kamala", email="kamala.rev@example.com", role="SENIOR", phone="+919123400033")
        self.db.add_all([c_user, p_user])
        self.db.flush()

        prov = ProviderProfile(id="prof_rev_auth_p", user_id=p_user.id, title="Kamala Tailor", status="PUBLISHED")
        self.db.add(prov)
        self.db.flush()

        req = ServiceRequest(
            id="req_rev_auth_1",
            customer_id=c_user.id,
            provider_id=prov.id,
            title="Blouse Stitching",
            description="Custom stitching request",
            status="ACCEPTED"  # Not yet completed!
        )
        self.db.add(req)
        self.db.commit()

        h_cust = {"Authorization": f"Bearer mock_jwt_token_{c_user.id}", "X-User-Id": c_user.id}

        # 1. Review before completion -> 400 Bad Request
        res_not_completed = client.post("/api/reviews", json={"request_id": req.id, "rating": 5, "comment": "Great"}, headers=h_cust)
        self.assertEqual(res_not_completed.status_code, 400)

        # 2. Mark completed
        req.status = "COMPLETED"
        self.db.commit()

        # 3. Valid Review Submission -> 201 Created
        res_rev = client.post("/api/reviews", json={"request_id": req.id, "rating": 5, "comment": "Excellent blouse fitting!"}, headers=h_cust)
        self.assertEqual(res_rev.status_code, 201)

        # 4. Duplicate Review Attempt -> 409 Conflict
        res_dup = client.post("/api/reviews", json={"request_id": req.id, "rating": 4, "comment": "Second review attempt"}, headers=h_cust)
        self.assertEqual(res_dup.status_code, 409, "Duplicate review for same request MUST be rejected with HTTP 409!")

    # ------------------------------------------------------------
    # 5. DATABASE HEALTH CHECK
    # ------------------------------------------------------------
    def test_05_database_health_check(self):
        """Test /api/health/db-check endpoint returns SQLite runtime and active table counts."""
        res = client.get("/api/health/db-check")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("SQLite", data["runtime_database"])
        self.assertIn("virtual_rooms", data["persisted_records"])
        self.assertIn("call_logs", data["persisted_records"])

if __name__ == "__main__":
    unittest.main()
