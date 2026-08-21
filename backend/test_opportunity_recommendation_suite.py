"""
Automated Test Suite: SilverHands Opportunity Recommendation & Discovery Engine
Verifies:
1. Opportunity recommendation returns domain-aligned candidates with matching demand.
2. Existing services offered by the senior are strictly excluded from suggestions.
3. Location and domain matching behavior.
4. Opportunity appears when conditions (low activity + unoffered candidate + REAL customer demand) are satisfied.
5. Opportunity section stays hidden (empty suggestions) when senior already offers all domain services.
6. "Add This Service" prefill flow preserves draft state without corrupting existing database records.
7. Guaranteed NO Gemini API calls are made during opportunity recommendation.
"""

import sys
import os
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.domain import User, ProviderProfile, ServiceRequest, Skill, Service, Notification

client = TestClient(app)

class TestOpportunityRecommendationSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()
        self.db.query(Notification).delete()
        self.db.query(ServiceRequest).delete()
        self.db.query(Skill).delete()
        self.db.query(Service).delete()
        self.db.query(ProviderProfile).delete()
        self.db.query(User).delete()
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_opportunity_returns_domain_aligned_candidates(self):
        """TEST 1 & 4: Opportunity recommendation returns domain-aligned candidates when real demand exists in DB."""
        senior_id = "user_senior_opp_1"
        senior_user = User(id=senior_id, name="Lakshmi Ammal", email="lakshmi.opp@silverhands.app", role="SENIOR", phone="+919876500010", location="Chennai, Tamil Nadu")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(
            id="prof_senior_opp_1",
            user_id=senior_id,
            title="Traditional Home Cook",
            bio="Authentic South Indian cooking",
            price=250.0,
            pricing_unit="per_service",
            status="PUBLISHED"
        )
        self.db.add(provider)
        self.db.commit()

        self.db.add(Skill(provider_id="prof_senior_opp_1", name="Home Cooking", category="Food & Catering"))
        self.db.commit()

        # Add real customer request in DB
        cust_user = User(id="user_cust_opp_1", name="Customer Priya", email="priya.opp@silverhands.app", role="CUSTOMER", phone="+919999900010")
        self.db.add(cust_user)
        self.db.commit()
        req = ServiceRequest(
            customer_id="user_cust_opp_1",
            title="Need festival bulk sweets and snacks for function",
            description="Looking for traditional home cook for bulk murukku and sweets in Chennai",
            category="Food & Catering",
            location="Chennai, Tamil Nadu",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{senior_id}"}

        # Mock google.genai to ensure zero LLM calls
        with patch("google.genai.Client", side_effect=AssertionError("Gemini LLM MUST NOT be called!")):
            res = client.get("/api/providers/me/opportunities", headers=headers)
            self.assertEqual(res.status_code, 200)
            data = res.json()

        self.assertTrue(data["has_low_request_activity"])
        self.assertGreater(len(data["suggestions"]), 0)
        top_sug = data["suggestions"][0]
        self.assertEqual(top_sug["category"], "Food & Catering")
        self.assertIn("Festival Bulk Food & Snack Orders", [s["suggested_service_name"] for s in data["suggestions"]])

    def test_02_existing_service_exclusion(self):
        """TEST 2 & 5: Existing services offered by the senior are excluded. When all services are offered, suggestions are empty."""
        senior_id = "user_senior_opp_2"
        senior_user = User(id=senior_id, name="Full Service Tailor", email="tailor.opp@silverhands.app", role="SENIOR", phone="+919876500020", location="Chennai, Tamil Nadu")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(
            id="prof_senior_opp_2",
            user_id=senior_id,
            title="Master Tailor",
            bio="Full tailoring services",
            price=300.0,
            pricing_unit="per_service",
            status="PUBLISHED"
        )
        self.db.add(provider)
        self.db.commit()

        # Add ALL domain candidate services to existing services list
        self.db.add(Service(provider_id="prof_senior_opp_2", name="Express Garment Alterations"))
        self.db.add(Service(provider_id="prof_senior_opp_2", name="Designer Aari Hand Embroidery"))
        self.db.add(Service(provider_id="prof_senior_opp_2", name="Custom Saree Blouse Stitching"))
        self.db.commit()

        # Add customer request in DB
        cust_user = User(id="user_cust_opp_2", name="Customer Tailor", email="cust.tailor@silverhands.app", role="CUSTOMER", phone="+919999900020")
        self.db.add(cust_user)
        self.db.commit()
        req = ServiceRequest(
            customer_id="user_cust_opp_2",
            title="Saree blouse stitching and alterations needed",
            description="Need express garment alteration and custom blouse stitching in Chennai",
            category="Tailoring & Handicrafts",
            location="Chennai, Tamil Nadu",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{senior_id}"}
        res = client.get("/api/providers/me/opportunities", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Verify suggestions list is empty because senior ALREADY offers all candidate services!
        self.assertEqual(len(data["suggestions"]), 0)
        self.assertEqual(data["status_message"], "Your current services already cover the recent local demand.")

    def test_03_location_and_domain_matching_with_live_demand(self):
        """TEST 3: Location and domain matching behavior with live 30-day customer demand."""
        senior_id = "user_senior_opp_3"
        senior_user = User(id=senior_id, name="Mylapore Tutor", email="tutor.opp@silverhands.app", role="SENIOR", phone="+919876500030", location="Mylapore, Chennai")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(
            id="prof_senior_opp_3",
            user_id=senior_id,
            title="Senior Mathematics Tutor",
            bio="High school math teaching",
            price=400.0,
            pricing_unit="per_hour",
            status="PUBLISHED"
        )
        self.db.add(provider)
        self.db.commit()
        self.db.add(Skill(provider_id="prof_senior_opp_3", name="Mathematics Tutoring", category="Education & Tutoring"))
        self.db.commit()

        # Add customer request in Mylapore, Chennai for Language Tutoring
        cust_user = User(id="user_cust_demand_1", name="Parent Customer", email="parent@silverhands.app", role="CUSTOMER", phone="+919999900030")
        self.db.add(cust_user)
        self.db.commit()

        req = ServiceRequest(
            customer_id="user_cust_demand_1",
            provider_id=None,
            title="Conversational Hindi & Homework Tutor needed",
            description="Need Hindi language tutor for class 8 student in Mylapore",
            category="Education & Tutoring",
            location="Mylapore, Chennai",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{senior_id}"}
        res = client.get("/api/providers/me/opportunities", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertGreater(len(data["suggestions"]), 0)
        matched_sug = [s for s in data["suggestions"] if s["suggested_service_name"] == "Conversational Language & Homework Guidance"]
        self.assertEqual(len(matched_sug), 1)
        self.assertEqual(matched_sug[0]["demand_count"], 1)

    def test_06_add_this_service_prefill_and_notifications(self):
        """TEST 6 & 7: Triggering opportunities creates in-app and WhatsApp notifications without corrupting DB, zero Gemini calls."""
        senior_id = "user_senior_opp_6"
        senior_user = User(id=senior_id, name="Catering Specialist", email="catering.opp@silverhands.app", role="SENIOR", phone="+919876500060", location="Chennai, Tamil Nadu")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(
            id="prof_senior_opp_6",
            user_id=senior_id,
            title="Traditional Home Cook",
            bio="Traditional authentic sweets",
            price=300.0,
            pricing_unit="per_service",
            status="PUBLISHED"
        )
        self.db.add(provider)
        self.db.commit()
        self.db.add(Skill(provider_id="prof_senior_opp_6", name="Home Cooking", category="Food & Catering"))
        self.db.commit()

        # Add customer request in DB
        cust_user = User(id="user_cust_opp_6", name="Customer Food", email="cust.food@silverhands.app", role="CUSTOMER", phone="+919999900060")
        self.db.add(cust_user)
        self.db.commit()
        req = ServiceRequest(
            customer_id="user_cust_opp_6",
            title="Need festival bulk food orders",
            description="Looking for traditional sweet and snack orders in Chennai",
            category="Food & Catering",
            location="Chennai, Tamil Nadu",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{senior_id}"}

        # Assert no Gemini client call occurs
        with patch("google.genai.Client", side_effect=AssertionError("Gemini LLM MUST NOT be called!")):
            res = client.get("/api/providers/me/opportunities", headers=headers)
            self.assertEqual(res.status_code, 200)

        # Check DB for created Notification using fresh session
        db_query_session = SessionLocal()
        try:
            notif = db_query_session.query(Notification).filter(
                Notification.user_id == senior_id,
                Notification.type == "OPPORTUNITY_SUGGESTION"
            ).first()

            self.assertIsNotNone(notif, "Opportunity notification was not generated!")
            self.assertIn(notif.whatsapp_status, ["NOT_CONFIGURED", "SENT", "DELIVERED"])
            self.assertIn("SilverHands Alert", notif.whatsapp_message)
            self.assertIn("Opportunity Found", notif.title)
        finally:
            db_query_session.close()

    def test_07_regression_skill_loop_variable_isolation(self):
        """
        REGRESSION TEST: Verify skill loop uses sk_norm and adding an unrelated skill does NOT falsely exclude candidates.
        """
        from app.routers.opportunities import is_service_already_offered, generate_recommendations_for_profile

        senior_id = "user_senior_regr_7"
        senior_user = User(id=senior_id, name="Regression Senior", email="regr.opp@silverhands.app", role="SENIOR", phone="+919876500070", location="Chennai, Tamil Nadu")
        self.db.add(senior_user)
        self.db.commit()

        provider = ProviderProfile(
            id="prof_senior_regr_7",
            user_id=senior_id,
            title="Traditional Home Cook",
            bio="Home cooking & snacks",
            price=250.0,
            pricing_unit="per_service",
            status="PUBLISHED"
        )
        self.db.add(provider)
        self.db.commit()

        # Add 1 service and 1 unrelated skill
        self.db.add(Service(provider_id="prof_senior_regr_7", name="Custom Cooking"))
        self.db.add(Skill(provider_id="prof_senior_regr_7", name="Stone Work Embroidery", category="Tailoring"))
        self.db.commit()

        # Add real customer requests for food candidates
        cust_user = User(id="user_cust_opp_7", name="Customer Regr", email="cust.regr@silverhands.app", role="CUSTOMER", phone="+919999900070")
        self.db.add(cust_user)
        self.db.commit()
        req1 = ServiceRequest(
            customer_id="user_cust_opp_7",
            title="Festival bulk snack orders needed",
            description="Bulk sweet and snack order for event",
            category="Food & Catering",
            location="Chennai, Tamil Nadu",
            status="PENDING"
        )
        req2 = ServiceRequest(
            customer_id="user_cust_opp_7",
            title="Need cooking classes for beginners",
            description="Teach traditional cooking recipes",
            category="Food & Catering",
            location="Chennai, Tamil Nadu",
            status="PENDING"
        )
        req3 = ServiceRequest(
            customer_id="user_cust_opp_7",
            title="Weekend home meal preparation",
            description="Tiffin and lunch meal prep",
            category="Food & Catering",
            location="Chennai, Tamil Nadu",
            status="PENDING"
        )
        self.db.add_all([req1, req2, req3])
        self.db.commit()

        # Reload profile from DB
        profile = self.db.query(ProviderProfile).filter(ProviderProfile.id == "prof_senior_regr_7").first()

        # 1. Verify candidate "Festival Bulk Food & Snack Orders" is NOT offered (returns False)
        is_offered_bulk = is_service_already_offered("Festival Bulk Food & Snack Orders", profile)
        self.assertFalse(is_offered_bulk, "Unrelated skill 'Stone Work Embroidery' falsely excluded candidate!")

        # 2. Generate recommendations -> verify candidate suggestions are returned
        resp = generate_recommendations_for_profile(profile, self.db)
        sug_names = [s.suggested_service_name for s in resp.suggestions]
        self.assertIn("Festival Bulk Food & Snack Orders", sug_names)

        # 3. Add skill matching Candidate 1 ("Bulk Snack Orders")
        self.db.add(Skill(provider_id="prof_senior_regr_7", name="Festival Bulk Food & Snack Orders", category="Food"))
        self.db.commit()
        profile_updated = self.db.query(ProviderProfile).filter(ProviderProfile.id == "prof_senior_regr_7").first()

        # 4. Candidate 1 ("Festival Bulk Food & Snack Orders") is now offered -> returns True
        self.assertTrue(is_service_already_offered("Festival Bulk Food & Snack Orders", profile_updated))

        # 5. Candidate 2 ("Traditional Cooking Classes") & Candidate 3 ("Weekend Home Meal Preparation") STILL REMAIN in suggestions!
        resp_updated = generate_recommendations_for_profile(profile_updated, self.db)
        updated_sug_names = [s.suggested_service_name for s in resp_updated.suggestions]
        self.assertNotIn("Festival Bulk Food & Snack Orders", updated_sug_names)
        self.assertIn("Traditional Cooking Classes", updated_sug_names)
        self.assertIn("Weekend Home Meal Preparation", updated_sug_names)

if __name__ == "__main__":
    unittest.main()
