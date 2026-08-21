"""
Automated Test Suite: SilverHands Data-Driven Hardening Verification
Verifies end-to-end data-driven behavior:
1. Location + Radius Search: Haversine distance, radius filtering, changing radius alters results.
2. Reviews + Ratings: Review persistence, aggregate average rating and count calculation, invalid rating rejection.
3. Opportunity Recommendation: 0 requests returns empty state ("No matching local demand found yet"), adding real customer request creates recommendation with computed demand count, estimated earnings, and match score, adding unrelated skill does not remove opportunities.
4. Database Verification: DB health check endpoint returns persisted records and identifies SQLite runtime.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.domain import User, ProviderProfile, ServiceRequest, Skill, Service, Review, Notification

client = TestClient(app)

class TestDataDrivenHardeningSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()
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
    # 1. LOCATION + SEARCH RADIUS TESTS
    # ------------------------------------------------------------
    def test_01_location_radius_filtering_inside_and_outside(self):
        """Test Haversine distance calculation and radius filtering."""
        # Provider 1: Mylapore (lat: 13.0339, lon: 80.2687)
        u1 = User(id="user_prov_mylapore", name="Mylapore Chef", email="mylapore@example.com", role="provider", location="Mylapore, Chennai", latitude=13.0339, longitude=80.2687)
        self.db.add(u1)
        self.db.flush()
        p1 = ProviderProfile(id="prof_mylapore", user_id=u1.id, title="Mylapore Food Specialist", status="PUBLISHED", price=300.0)
        self.db.add(p1)
        self.db.add(Skill(provider_id=p1.id, name="Home Cooking", category="Food & Catering"))

        # Provider 2: Velachery (lat: 12.9815, lon: 80.2180, approx 7.8 km from Mylapore)
        u2 = User(id="user_prov_velachery", name="Velachery Chef", email="velachery@example.com", role="provider", location="Velachery, Chennai", latitude=12.9815, longitude=80.2180)
        self.db.add(u2)
        self.db.flush()
        p2 = ProviderProfile(id="prof_velachery", user_id=u2.id, title="Velachery Food Specialist", status="PUBLISHED", price=350.0)
        self.db.add(p2)
        self.db.add(Skill(provider_id=p2.id, name="Home Cooking", category="Food & Catering"))
        self.db.commit()

        # Customer searching from Mylapore (lat: 13.0350, lon: 80.2670) with 5.0 km radius
        payload_5km = {
            "query": "Home Cooking",
            "latitude": 13.0350,
            "longitude": 80.2670,
            "radius_km": 5.0
        }
        res_5km = client.post("/api/matches", json=payload_5km)
        self.assertEqual(res_5km.status_code, 200)
        matches_5km = res_5km.json()
        prov_ids_5km = [m["provider_id"] for m in matches_5km]
        
        self.assertIn("prof_mylapore", prov_ids_5km, "Provider inside 5 km radius MUST appear!")
        self.assertNotIn("prof_velachery", prov_ids_5km, "Provider outside 5 km radius MUST NOT appear!")

        # Search with 10.0 km radius -> Both providers MUST appear!
        payload_10km = {
            "query": "Home Cooking",
            "latitude": 13.0350,
            "longitude": 80.2670,
            "radius_km": 10.0
        }
        res_10km = client.post("/api/matches", json=payload_10km)
        self.assertEqual(res_10km.status_code, 200)
        matches_10km = res_10km.json()
        prov_ids_10km = [m["provider_id"] for m in matches_10km]

        self.assertIn("prof_mylapore", prov_ids_10km)
        self.assertIn("prof_velachery", prov_ids_10km, "Provider inside 10 km radius MUST appear when radius increased!")
        self.assertNotEqual(len(matches_5km), len(matches_10km), "Changing search radius MUST produce different results!")

    def test_02_missing_coordinates_handled_safely(self):
        """Test search gracefully handles providers with missing coordinates without crashing."""
        u_no_coords = User(id="user_prov_no_coords", name="No Coords Senior", email="nocoords@example.com", role="provider", location="Unknown")
        self.db.add(u_no_coords)
        self.db.flush()
        p_no_coords = ProviderProfile(id="prof_no_coords", user_id=u_no_coords.id, title="General Senior", status="PUBLISHED")
        self.db.add(p_no_coords)
        self.db.add(Skill(provider_id=p_no_coords.id, name="General Support", category="General"))
        self.db.commit()

        payload = {
            "query": "General Support",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius_km": 10.0
        }
        res = client.post("/api/matches", json=payload)
        self.assertEqual(res.status_code, 200)

    # ------------------------------------------------------------
    # 2. REVIEWS + RATINGS LIFECYCLE TESTS
    # ------------------------------------------------------------
    def test_03_reviews_lifecycle_and_rating_calculation(self):
        """Test complete review lifecycle: submission, rating calculation, invalid rating rejection."""
        # 1. Create Senior Provider & Customer
        p_user = User(id="user_senior_rev", name="Senior Chef Lakshmi", email="lakshmi.rev@example.com", role="SENIOR", phone="+919876500099")
        c_user = User(id="user_cust_rev", name="Customer Priya", email="priya.rev@example.com", role="CUSTOMER", phone="+919123400099")
        self.db.add_all([p_user, c_user])
        self.db.flush()

        prov = ProviderProfile(id="prof_senior_rev", user_id=p_user.id, title="Chef Lakshmi", status="PUBLISHED", rating=0.0, total_reviews=0)
        self.db.add(prov)
        self.db.flush()

        # 2. Create COMPLETED service request
        req = ServiceRequest(
            id="req_completed_1",
            customer_id=c_user.id,
            provider_id=prov.id,
            title="Tamil Wedding Sweets",
            description="Preparation of traditional sweets",
            status="COMPLETED"
        )
        self.db.add(req)
        self.db.commit()

        h_cust = {"Authorization": f"Bearer mock_jwt_token_{c_user.id}", "X-User-Id": c_user.id, "X-User-Phone": "+919123400099"}

        # 3. Test Invalid Rating Rejection (rating = 6) -> 400 Bad Request
        res_invalid = client.post("/api/reviews", json={"request_id": req.id, "rating": 6, "comment": "Invalid rating"}, headers=h_cust)
        self.assertEqual(res_invalid.status_code, 400, "Rating > 5 MUST be rejected with HTTP 400!")

        # 4. Submit Valid Review (rating = 5)
        res_rev = client.post("/api/reviews", json={"request_id": req.id, "rating": 5, "comment": "Authentic delicious sweets!"}, headers=h_cust)
        self.assertEqual(res_rev.status_code, 201)

        # 5. Verify DB record and provider aggregate calculation
        db_prov = self.db.query(ProviderProfile).filter(ProviderProfile.id == prov.id).first()
        self.assertEqual(db_prov.total_reviews, 1)
        self.assertEqual(db_prov.rating, 5.0)

        # 6. Verify rating appears in provider search results
        search_res = client.post("/api/matches", json={"query": "Chef Lakshmi", "radius_km": 50.0})
        self.assertEqual(search_res.status_code, 200)
        matches = search_res.json()
        target_match = [m for m in matches if m["provider_id"] == prov.id]
        self.assertEqual(len(target_match), 1)
        self.assertEqual(target_match[0]["provider"]["rating"], 5.0)

    # ------------------------------------------------------------
    # 3. OPPORTUNITY RECOMMENDATION TESTS (NO FAKE DEMO DATA)
    # ------------------------------------------------------------
    def test_04_zero_demand_returns_empty_state_without_inventing_data(self):
        """Verify that a Senior with 0 live customer DB requests receives NO invented fake demand."""
        s_user = User(id="user_opp_zero", name="Senior Zero", email="zero@example.com", role="SENIOR", phone="+919876543210", location="Mylapore, Chennai")
        self.db.add(s_user)
        self.db.flush()

        prov = ProviderProfile(id="prof_opp_zero", user_id=s_user.id, title="Senior Tailor", status="PUBLISHED")
        self.db.add(prov)
        self.db.add(Skill(provider_id=prov.id, name="Stitching", category="Tailoring & Handicrafts"))
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{s_user.id}"}
        res = client.get("/api/providers/me/opportunities", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Zero DB requests MUST produce empty suggestions list
        self.assertEqual(len(data["suggestions"]), 0, "Zero DB requests MUST NOT generate fake opportunity suggestions!")
        self.assertEqual(data["status_message"], "No matching local demand found yet.", "Empty state message MUST be clear!")

    def test_05_real_customer_request_generates_calculated_recommendation(self):
        """Verify adding a real customer request dynamically generates calculated recommendation."""
        s_user = User(id="user_opp_real", name="Senior Real", email="real@example.com", role="SENIOR", phone="+919876543211", location="Adyar, Chennai")
        c_user = User(id="user_cust_real", name="Customer Anand", email="anand@example.com", role="CUSTOMER", phone="+919123456789")
        self.db.add_all([s_user, c_user])
        self.db.flush()

        prov = ProviderProfile(id="prof_opp_real", user_id=s_user.id, title="Senior Math Tutor", status="PUBLISHED", price=500.0)
        self.db.add(prov)
        self.db.add(Skill(provider_id=prov.id, name="Mathematics Tutoring", category="Education & Tutoring"))
        self.db.commit()

        # 1. Create 1 real customer request for Hindi Tutoring in Adyar
        req = ServiceRequest(
            customer_id=c_user.id,
            title="Need Hindi tutoring for class 8 student",
            description="Looking for patient tutor for Hindi homework",
            category="Education & Tutoring",
            location="Adyar, Chennai",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()

        headers = {"Authorization": f"Bearer mock_jwt_token_{s_user.id}"}
        res = client.get("/api/providers/me/opportunities", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Should find 1 matching suggestion for "Conversational Language & Homework Guidance"
        self.assertEqual(len(data["suggestions"]), 1)
        top = data["suggestions"][0]
        self.assertEqual(top["suggested_service_name"], "Conversational Language & Homework Guidance")
        self.assertEqual(top["demand_count"], 1, "Demand count MUST equal actual matching DB records count (1)!")
        self.assertEqual(top["estimated_earning"], 500.0, "Estimated earning MUST be calculated from DB price data!")

    def test_06_unrelated_skill_does_not_remove_opportunities(self):
        """Verify adding an unrelated skill does NOT falsely remove candidate opportunities."""
        from app.routers.opportunities import is_service_already_offered

        s_user = User(id="user_opp_sk", name="Senior Skill Isolation", email="sk@example.com", role="SENIOR", phone="+919876543212", location="Chennai")
        self.db.add(s_user)
        self.db.flush()

        prov = ProviderProfile(id="prof_opp_sk", user_id=s_user.id, title="Craft Specialist", status="PUBLISHED")
        self.db.add(prov)
        self.db.add(Skill(provider_id=prov.id, name="Pottery Craft", category="Arts"))
        self.db.commit()

        profile = self.db.query(ProviderProfile).filter(ProviderProfile.id == prov.id).first()
        is_offered = is_service_already_offered("Festival Bulk Food & Snack Orders", profile)
        self.assertFalse(is_offered, "Unrelated skill 'Pottery Craft' MUST NOT falsely match 'Festival Bulk Food & Snack Orders'!")

    # ------------------------------------------------------------
    # 4. DATABASE HEALTH CHECK & PERSISTENCE
    # ------------------------------------------------------------
    def test_07_database_health_check_endpoint(self):
        """Test /api/health/db-check endpoint identifies SQLite runtime and persisted records."""
        res = client.get("/api/health/db-check")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("SQLite", data["runtime_database"], "Runtime DB MUST be correctly identified as SQLite!")
        self.assertIn("persisted_records", data)
        self.assertIn("provider_profiles", data["persisted_records"])

if __name__ == "__main__":
    unittest.main()
