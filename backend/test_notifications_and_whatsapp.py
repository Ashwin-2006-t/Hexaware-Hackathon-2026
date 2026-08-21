import unittest
import base64
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, engine
from app.models.domain import User, Notification
from app.services.whatsapp_service import send_whatsapp_cloud_api, sanitize_phone_number

client = TestClient(app)

def make_test_jwt(user_id: str, role: str = "SENIOR_SERVICE_PROVIDER") -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "role": role}).encode()).decode().rstrip("=")
    return f"{header}.{payload}.sig"

class TestNotificationsAndWhatsApp(unittest.TestCase):

    def setUp(self):
        self.db = next(get_db())
        
        # User 1 (Senior A)
        self.user1 = self.db.query(User).filter(User.phone == "+919999911111").first()
        if not self.user1:
            self.user1 = User(
                id="user_notif_test_1",
                name="Senior A",
                email="seniorA.test@example.com",
                phone="+919999911111",
                role="SENIOR_SERVICE_PROVIDER"
            )
            self.db.add(self.user1)
        else:
            self.user1.role = "SENIOR_SERVICE_PROVIDER"

        # User 2 (Senior B)
        self.user2 = self.db.query(User).filter(User.phone == "+919999922222").first()
        if not self.user2:
            self.user2 = User(
                id="user_notif_test_2",
                name="Senior B",
                email="seniorB.test@example.com",
                phone="+919999922222",
                role="SENIOR_SERVICE_PROVIDER"
            )
            self.db.add(self.user2)
        else:
            self.user2.role = "SENIOR_SERVICE_PROVIDER"

        self.db.commit()

        self.user1_headers = {"Authorization": f"Bearer {make_test_jwt(self.user1.id)}"}
        self.user2_headers = {"Authorization": f"Bearer {make_test_jwt(self.user2.id)}"}

        # Seed test notifications for User 1
        self.n1 = Notification(
            id="notif_test_1",
            user_id=self.user1.id,
            type="NEW_SERVICE_REQUEST",
            title="Cooking Request in Mylapore",
            message="Customer requested dinner catering.",
            is_read=False,
            is_cleared=False,
            whatsapp_status="NOT_CONFIGURED",
            whatsapp_phone="+919999911111"
        )
        self.n2 = Notification(
            id="notif_test_2",
            user_id=self.user1.id,
            type="OPPORTUNITY_SUGGESTION",
            title="Math Tutoring Opportunity",
            message="Local students need math coaching.",
            is_read=False,
            is_cleared=False,
            whatsapp_status="SENT",
            whatsapp_message_id="wamid.HBgLMTIzNDU2Nzg5MA==",
            whatsapp_phone="+919999911111"
        )

        # Seed notification for User 2
        self.n3 = Notification(
            id="notif_test_3",
            user_id=self.user2.id,
            type="NEW_SERVICE_REQUEST",
            title="Tailoring Request",
            message="Customer requested saree blouse stitching.",
            is_read=False,
            is_cleared=False,
            whatsapp_status="NOT_CONFIGURED",
            whatsapp_phone="+919999922222"
        )

        for n in [self.n1, self.n2, self.n3]:
            existing = self.db.query(Notification).filter(Notification.id == n.id).first()
            if not existing:
                self.db.add(n)
            else:
                existing.is_cleared = False
                existing.is_read = False
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_whatsapp_not_configured_when_env_missing(self):
        """Test WhatsApp returns NOT_CONFIGURED when env credentials are empty."""
        with patch.dict("os.environ", {}, clear=True):
            res = send_whatsapp_cloud_api("+919999911111", "Hello SilverHands")
            self.assertFalse(res["success"])
            self.assertEqual(res["status"], "NOT_CONFIGURED")
            print("\n[Test 1] WhatsApp NOT_CONFIGURED returned when credentials missing")

    @patch("httpx.Client.post")
    def test_02_whatsapp_successful_meta_dispatch(self, mock_post):
        """Test successful Meta WhatsApp Cloud API response parsing."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "messaging_product": "whatsapp",
            "messages": [{"id": "wamid.TEST_DISPATCH_123"}]
        }
        mock_post.return_value = mock_resp

        env_mock = {
            "WHATSAPP_ACCESS_TOKEN": "EAAG_TEST_TOKEN",
            "WHATSAPP_PHONE_NUMBER_ID": "1092837465"
        }
        with patch.dict("os.environ", env_mock):
            res = send_whatsapp_cloud_api("+919999911111", "Testing WhatsApp Alert")
            self.assertTrue(res["success"])
            self.assertEqual(res["status"], "SENT")
            self.assertEqual(res["message_id"], "wamid.TEST_DISPATCH_123")
            print("[Test 2] Meta API success parsed message ID wamid.TEST_DISPATCH_123")

    @patch("httpx.Client.post")
    def test_03_whatsapp_meta_failure_handling(self, mock_post):
        """Test Meta API error response handling."""
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.json.return_value = {
            "error": {"message": "Invalid OAuth access token."}
        }
        mock_post.return_value = mock_resp

        env_mock = {
            "WHATSAPP_ACCESS_TOKEN": "INVALID_TOKEN",
            "WHATSAPP_PHONE_NUMBER_ID": "1092837465"
        }
        with patch.dict("os.environ", env_mock):
            res = send_whatsapp_cloud_api("+919999911111", "Testing Error")
            self.assertFalse(res["success"])
            self.assertEqual(res["status"], "FAILED")
            self.assertIn("Invalid OAuth access token", res["error_details"])
            print("[Test 3] Meta API error captured with status FAILED")

    def test_04_webhook_verification_get(self):
        """Test Meta GET webhook verification challenge."""
        env_mock = {"WHATSAPP_VERIFY_TOKEN": "my_secret_token"}
        with patch.dict("os.environ", env_mock):
            res = client.get("/api/notifications/whatsapp/webhook?hub.mode=subscribe&hub.challenge=115820120&hub.verify_token=my_secret_token")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.text, "115820120")

            # Invalid verify token
            res_bad = client.get("/api/notifications/whatsapp/webhook?hub.mode=subscribe&hub.challenge=115820120&hub.verify_token=wrong_token")
            self.assertEqual(res_bad.status_code, 403)
            print("[Test 4] Webhook verification GET challenge verified")

    def test_05_webhook_status_update_post(self):
        """Test POST webhook updates whatsapp_status in database."""
        payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "changes": [{
                    "value": {
                        "statuses": [{
                            "id": "wamid.HBgLMTIzNDU2Nzg5MA==",
                            "status": "delivered",
                            "recipient_id": "919999911111"
                        }]
                    }
                }]
            }]
        }
        res = client.post("/api/notifications/whatsapp/webhook", json=payload)
        self.assertEqual(res.status_code, 200)

        # Check DB update
        self.db.expire_all()
        notif = self.db.query(Notification).filter(Notification.id == "notif_test_2").first()
        self.assertEqual(notif.whatsapp_status, "DELIVERED")
        print("[Test 5] Webhook POST updated DB status to DELIVERED")

    def test_06_bulk_clear_own_notifications(self):
        """Test DELETE /api/notifications/me clears user's notifications."""
        res = client.delete("/api/notifications/me", headers=self.user1_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["cleared_count"], 1)

        # Verify active notifications list is now empty for User 1
        res_list = client.get("/api/notifications/me", headers=self.user1_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 0)

        # Verify User 2 notifications were NOT affected
        res_user2 = client.get("/api/notifications/me", headers=self.user2_headers)
        self.assertEqual(res_user2.status_code, 200)
        self.assertGreaterEqual(len(res_user2.json()), 1)
        print("[Test 6] Bulk notification clear succeeded and preserved other user notifications")

    def test_07_individual_notification_clear_and_ownership(self):
        """Test DELETE /api/notifications/{id} with ownership security check."""
        # User 1 attempts to clear User 2's notification (Forbidden)
        res_forbidden = client.delete("/api/notifications/notif_test_3", headers=self.user1_headers)
        self.assertEqual(res_forbidden.status_code, 403)

        # User 2 clears own notification
        res_ok = client.delete("/api/notifications/notif_test_3", headers=self.user2_headers)
        self.assertEqual(res_ok.status_code, 200)
        self.assertTrue(res_ok.json()["success"])
        print("[Test 7] Individual notification clear ownership security verified")

if __name__ == "__main__":
    unittest.main()
