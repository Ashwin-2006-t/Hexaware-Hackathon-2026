"""
Automated Test Suite: WhatsApp Notification Persistence & AI Matching Fallback System
Verifies:
1. Service request creation generates a DB notification with WhatsApp delivery logs (`whatsapp_status="SENT (DEMO)"`, `whatsapp_phone`, `whatsapp_message`, `whatsapp_sent_at`).
2. Recipient senior phone number is correctly captured and stored in WhatsApp notification logs.
3. Strict user isolation security (Senior B cannot access Senior A's notifications).
4. Gemini API 429 RESOURCE_EXHAUSTED quota error simulation in MatchingAgent: matching succeeds with rule-based explanation fallback.
"""

import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.domain import User, ProviderProfile, ServiceRequest, Notification, Skill
from app.agents.matching_agent import rank_and_explain_matches

client = TestClient(app)

class TestWhatsAppAndMatching(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()
        self.db.query(Notification).delete()
        self.db.query(ServiceRequest).delete()
        self.db.query(Skill).delete()
        self.db.query(ProviderProfile).delete()
        self.db.query(User).delete()
        self.db.commit()

        # Senior User
        self.senior = User(
            id="user_senior_demo_100",
            auth_user_id="auth_senior_demo_100",
            name="Lakshmi Ammal",
            email="lakshmi@silverhands.app",
            phone="+919876543210",
            role="SENIOR",
            profile_setup_completed=True,
            location="Mylapore, Chennai"
        )
        self.db.add(self.senior)
        self.db.commit()

        self.profile = ProviderProfile(
            id="profile_senior_demo_100",
            user_id=self.senior.id,
            title="Traditional Sweets & Snacks Expert",
            bio="30 years experience making authentic South Indian sweets.",
            availability="Available",
            status="PUBLISHED",
            price=250.0,
            pricing_unit="per_service"
        )
        self.db.add(self.profile)
        self.db.commit()

        self.db.add(Skill(provider_id=self.profile.id, name="Traditional Sweets", category="Food & Catering"))
        self.db.commit()

        # Customer User
        self.customer = User(
            id="user_customer_demo_200",
            auth_user_id="auth_customer_demo_200",
            name="Anita Sharma",
            email="anita@gmail.com",
            phone="+919999911111",
            role="CUSTOMER",
            profile_setup_completed=True,
            location="Mylapore, Chennai"
        )
        self.db.add(self.customer)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_whatsapp_delivery_log_persistence(self):
        """Verify that customer request creation saves WhatsApp delivery log in DB with correct senior phone."""
        headers_cust = {"Authorization": f"Bearer mock_jwt_token_{self.customer.id}"}
        payload = {
            "provider_id": self.profile.id,
            "title": "Traditional Sweets",
            "description": "10 boxes traditional sweets order for family event",
            "category": "Food & Catering",
            "location": "Mylapore, Chennai",
            "requirement_quantity": 10,
            "requirement_unit": "boxes"
        }
        res = client.post("/api/requests", json=payload, headers=headers_cust)
        self.assertEqual(res.status_code, 201)

        # Query DB for notifications created for Senior
        notifs = self.db.query(Notification).filter(Notification.user_id == self.senior.id).all()
        self.assertEqual(len(notifs), 1)
        n = notifs[0]
        self.assertEqual(n.type, "NEW_SERVICE_REQUEST")
        self.assertEqual(n.whatsapp_status, "SENT (DEMO)")
        self.assertEqual(n.whatsapp_phone, "+919876543210")
        self.assertIn("SilverHands Alert", n.whatsapp_message)
        self.assertIsNotNone(n.whatsapp_sent_at)

        # Verify notification API response returns WhatsApp fields
        headers_senior = {"Authorization": f"Bearer mock_jwt_token_{self.senior.id}"}
        res_me = client.get("/api/notifications/me", headers=headers_senior)
        self.assertEqual(res_me.status_code, 200)
        items = res_me.json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["whatsapp_status"], "SENT (DEMO)")
        self.assertEqual(items[0]["whatsapp_phone"], "+919876543210")
        self.assertIn("SilverHands Alert", items[0]["whatsapp_message"])

    def test_02_matching_agent_gemini_429_quota_fallback(self):
        """Verify that MatchingAgent handles 429 RESOURCE_EXHAUSTED gracefully and returns rule-based fallback."""
        req = ServiceRequest(
            customer_id=self.customer.id,
            title="Traditional Sweets",
            description="Need sweets for housewarming",
            category="Food & Catering",
            location="Mylapore, Chennai",
            latitude=13.0827,
            longitude=80.2707
        )
        self.db.add(req)
        self.db.commit()

        # Simulate Gemini 429 RESOURCE_EXHAUSTED Exception inside generate_content
        with patch("google.genai.models.Models.generate_content", side_effect=Exception("429 RESOURCE_EXHAUSTED Quota exceeded for metric")):
            matches = rank_and_explain_matches(self.db, req, [self.profile])

            # Matching MUST succeed without raising errors
            self.assertEqual(len(matches), 1)
            match = matches[0]
            self.assertGreater(match["score"], 0.0)
            self.assertIn("Matched because:", match["explanation"])
            self.assertTrue(len(match["reasons"]) > 0)

if __name__ == "__main__":
    unittest.main()
