"""
Automated Test Suite: SilverHands Workflow Hardening
Verifies:
1. TEST 1: New customer request list is empty.
2. TEST 2: Customer A cannot see Customer B requests.
3. TEST 3: Voice skill update modifies existing provider profile (no duplicate profile created).
4. TEST 4: Adding voice skill does not create duplicate provider profile.
5. TEST 5: Existing pricing and service offerings remain unchanged after voice skill update.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.domain import User, ProviderProfile, ServiceRequest, Skill, Service

client = TestClient(app)

class TestWorkflowHardening(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()
        self.db.query(ServiceRequest).delete()
        self.db.query(Skill).delete()
        self.db.query(Service).delete()
        self.db.query(ProviderProfile).delete()
        self.db.query(User).delete()
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_new_customer_empty_request_list(self):
        """TEST 1: New customer has an empty request list."""
        cust_id = "user_cust_new_101"
        new_cust = User(id=cust_id, name="New Customer", email="newcust@silverhands.app", role="CUSTOMER", phone="+919999900001")
        self.db.add(new_cust)
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{cust_id}"}
        res = client.get("/api/requests/my", headers=headers)
        self.assertEqual(res.status_code, 200)
        requests = res.json()
        self.assertIsInstance(requests, list)
        self.assertEqual(len(requests), 0, f"New customer request list must be empty, found {len(requests)}")

    def test_02_customer_request_isolation(self):
        """TEST 2: Customer A cannot see Customer B requests."""
        senior_id = "user_senior_isol_1"
        senior_user = User(id=senior_id, name="Senior Specialist", email="seniorisol@silverhands.app", role="SENIOR", phone="+919876500001")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(id="prof_senior_isol_1", user_id=senior_id, title="Expert Tutor", price=350.0, pricing_unit="per_hour", status="PUBLISHED")
        self.db.add(provider)
        self.db.commit()

        user_a = User(id="user_cust_a", name="Customer A", email="custa@silverhands.app", role="CUSTOMER", phone="+919700000001")
        user_b = User(id="user_cust_b", name="Customer B", email="custb@silverhands.app", role="CUSTOMER", phone="+919600000001")
        self.db.add(user_a)
        self.db.add(user_b)
        self.db.commit()

        req_a = ServiceRequest(
            customer_id="user_cust_a",
            provider_id="prof_senior_isol_1",
            title="Math Tutoring Grade 10",
            description="Need 2 hours algebra tutoring",
            category="Tutoring",
            status="PENDING"
        )
        self.db.add(req_a)
        self.db.commit()

        # Customer A fetches requests -> receives 1 request
        headers_a = {"Authorization": "Bearer mock_jwt_token_user_cust_a"}
        res_a = client.get("/api/requests/my", headers=headers_a)
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(len(res_a.json()), 1)

        # Customer B fetches requests -> receives 0 requests
        headers_b = {"Authorization": "Bearer mock_jwt_token_user_cust_b"}
        res_b = client.get("/api/requests/my", headers=headers_b)
        self.assertEqual(res_b.status_code, 200)
        self.assertEqual(len(res_b.json()), 0, "Customer B should not see Customer A requests!")

    def test_03_04_05_voice_skill_update_modifies_existing_provider(self):
        """
        TEST 3: Voice skill update modifies existing provider (no duplicate profile).
        TEST 4: Adding voice skill does not create duplicate provider profile.
        TEST 5: Existing pricing and service offerings remain unchanged.
        """
        senior_id = "user_senior_voice_200"
        senior_user = User(id=senior_id, name="Lakshmi Ammal", email="lakshmivoice@silverhands.app", role="SENIOR", location="Mylapore, Chennai", phone="+919500000001")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(
            id="prof_senior_voice_200",
            user_id=senior_id,
            title="Master Tailor & Embroidery Specialist",
            bio="30 years of traditional tailoring",
            experience_years=30,
            price=500.0,
            pricing_unit="per_service",
            availability="Monday - Saturday 9 AM to 5 PM",
            status="PUBLISHED"
        )
        self.db.add(provider)
        self.db.commit()

        self.db.add(Skill(provider_id="prof_senior_voice_200", name="Saree Blouse Stitching", category="Tailoring"))
        self.db.add(Skill(provider_id="prof_senior_voice_200", name="Hand Embroidery", category="Tailoring"))
        self.db.add(Service(provider_id="prof_senior_voice_200", name="Custom Blouse Stitching", description="Blouse stitching"))
        self.db.commit()

        initial_count = self.db.query(ProviderProfile).count()

        headers = {"Authorization": f"Bearer mock_jwt_token_{senior_id}"}
        payload = {"name": "Stone Work Embroidery", "category": "Embroidery"}

        res = client.post("/api/providers/me/skills", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        updated = res.json()

        # Test 3 & 4: Profile ID unchanged and no duplicate profile created
        self.assertEqual(updated["id"], "prof_senior_voice_200")
        current_count = self.db.query(ProviderProfile).count()
        self.assertEqual(current_count, initial_count, "Duplicate provider profile created!")

        # Verify skill list contains new skill and old skills
        skill_names = [s["name"] for s in updated["skills"]]
        self.assertIn("Stone Work Embroidery", skill_names)
        self.assertIn("Saree Blouse Stitching", skill_names)
        self.assertIn("Hand Embroidery", skill_names)
        self.assertEqual(len(skill_names), 3)

        # Duplicate skill addition test
        res_dup = client.post("/api/providers/me/skills", json=payload, headers=headers)
        self.assertEqual(res_dup.status_code, 200)
        dup_names = [s["name"] for s in res_dup.json()["skills"]]
        self.assertEqual(len(dup_names), 3)

        # Test 5: Pricing, title, experience, services preserved
        self.assertEqual(updated["price"], 500.0)
        self.assertEqual(updated["pricing_unit"], "per_service")
        self.assertEqual(updated["experience_years"], 30)
        self.assertEqual(updated["title"], "Master Tailor & Embroidery Specialist")
        service_names = [s["name"] for s in updated["services"]]
        self.assertIn("Custom Blouse Stitching", service_names)

if __name__ == "__main__":
    unittest.main()
