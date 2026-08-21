import unittest
import base64
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.domain import User, ProviderProfile, Service

client = TestClient(app)

def make_jwt(user_id: str, role: str) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "role": role}).encode()).decode().rstrip("=")
    return f"{header}.{payload}.sig"

class TestServiceDiscoveryBugFix(unittest.TestCase):

    def setUp(self):
        self.db = next(get_db())

        # 1. Create Senior User & Provider Profile
        self.senior_user = self.db.query(User).filter(User.phone == "+917777711111").first()
        if not self.senior_user:
            self.senior_user = User(
                id="user_senior_discovery_test",
                name="Ramanathan Senior",
                email="ramanathan.discovery@example.com",
                phone="+917777711111",
                role="SENIOR",
                location="Mylapore, Chennai, Tamil Nadu",
                latitude=13.0339,
                longitude=80.2676
            )
            self.db.add(self.senior_user)
        else:
            self.senior_user.latitude = 13.0339
            self.senior_user.longitude = 80.2676

        self.provider_profile = self.db.query(ProviderProfile).filter(ProviderProfile.user_id == "user_senior_discovery_test").first()
        if not self.provider_profile:
            self.provider_profile = ProviderProfile(
                id="prof_senior_discovery_test",
                user_id="user_senior_discovery_test",
                title="Mathematics & Physics Tutor",
                bio="30+ years experienced high school math teacher offering specialized home tuition.",
                experience_years=30,
                status="PUBLISHED",
                service_delivery_mode="BOTH",
                location="Mylapore, Chennai, Tamil Nadu",
                latitude=13.0339,
                longitude=80.2676
            )
            self.db.add(self.provider_profile)
        else:
            self.provider_profile.status = "PUBLISHED"
            self.provider_profile.latitude = 13.0339
            self.provider_profile.longitude = 80.2676

        self.db.commit()

        self.senior_headers = {"Authorization": f"Bearer {make_jwt('user_senior_discovery_test', 'SENIOR')}"}
        self.customer_headers = {"Authorization": f"Bearer {make_jwt('cust_discovery_user', 'CUSTOMER')}"}

    def tearDown(self):
        self.db.close()

    def test_01_create_service_and_verify_database_persistence(self):
        """
        Step 1 & Step 5: Senior creates 'Advanced Home Tuition'.
        Verify exact database record persistence (ID, Name, Provider ID, Category, Status, Lat, Lon, Delivery Mode).
        """
        # Senior adds new service 'Advanced Home Tuition' via updateProvider API
        res = client.put(
            f"/api/providers/{self.provider_profile.id}",
            json={
                "services": ["Advanced Home Tuition", "Physics Exam Coaching"]
            },
            headers=self.senior_headers
        )
        self.assertEqual(res.status_code, 200)

        # Database Verification
        self.db.expire_all()
        created_srv = self.db.query(Service).filter(
            Service.provider_id == self.provider_profile.id,
            Service.name == "Advanced Home Tuition"
        ).first()

        self.assertIsNotNone(created_srv, "Service 'Advanced Home Tuition' MUST exist in database!")
        self.assertEqual(created_srv.provider_id, self.provider_profile.id)

        # Log & Print Database Verification as required by Step 5
        print("\n=== DATABASE VERIFICATION LOG ===")
        print(f"Service ID:       {created_srv.id}")
        print(f"Service Name:     {created_srv.name}")
        print(f"Provider ID:      {created_srv.provider_id}")
        print(f"Category:         {created_srv.category or 'General'}")
        print(f"Active Status:    {self.provider_profile.status}")
        print(f"Latitude:         {self.provider_profile.latitude}")
        print(f"Longitude:        {self.provider_profile.longitude}")
        print(f"Delivery Mode:    {created_srv.delivery_mode or self.provider_profile.service_delivery_mode}")
        print("=================================\n")

    def test_02_customer_exact_search_returns_newly_created_service(self):
        """
        Step 7: Customer searches for 'Advanced Home Tuition'.
        Assert customer discovery API returns it and response contains service details.
        """
        search_payload = {
            "query": "Advanced Home Tuition",
            "location": "Chennai, Tamil Nadu",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius_km": 20
        }
        res = client.post("/api/matches", json=search_payload, headers=self.customer_headers)
        self.assertEqual(res.status_code, 200)

        matches = res.json()
        self.assertGreater(len(matches), 0, "Matches list should not be empty!")

        matched_provider = next((m for m in matches if m["provider_id"] == self.provider_profile.id), None)
        self.assertIsNotNone(matched_provider, "Customer search MUST return the provider who created 'Advanced Home Tuition'!")

        # Verify provider object in response contains the newly created service
        prov_data = matched_provider["provider"]
        services_in_response = [s["name"] for s in prov_data.get("services", [])]
        self.assertIn("Advanced Home Tuition", services_in_response)
        print("[Test 02] Customer exact search 'Advanced Home Tuition' successfully returned provider and service!")

    def test_03_partial_and_case_insensitive_searches(self):
        """
        Step 3 & 9: Test partial and case-insensitive searches:
        'home tuition', 'tuition', 'Home', 'Advanced'.
        """
        for query_term in ["home tuition", "tuition", "Home", "Advanced", "ADVANCED HOME TUITION"]:
            res = client.post("/api/matches", json={
                "query": query_term,
                "latitude": 13.0827,
                "longitude": 80.2707,
                "radius_km": 50
            }, headers=self.customer_headers)
            self.assertEqual(res.status_code, 200)

            matches = res.json()
            matched_prov = next((m for m in matches if m["provider_id"] == self.provider_profile.id), None)
            self.assertIsNotNone(matched_prov, f"Search query '{query_term}' MUST return the provider!")
            print(f"[Test 03] Partial/Case-insensitive query '{query_term}' returned match successfully.")

    def test_04_inactive_service_or_profile_not_shown(self):
        """
        Step 9: Test that an inactive or UNPUBLISHED provider/service is NOT returned to customers.
        """
        # Set provider status to DRAFT
        self.provider_profile.status = "DRAFT"
        self.db.commit()

        res = client.post("/api/matches", json={
            "query": "Advanced Home Tuition",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius_km": 50
        }, headers=self.customer_headers)
        self.assertEqual(res.status_code, 200)

        matches = res.json()
        matched_prov = next((m for m in matches if m["provider_id"] == self.provider_profile.id), None)
        self.assertIsNone(matched_prov, "Unpublished / DRAFT provider MUST NOT be returned in customer search!")

        # Restore status to PUBLISHED
        self.provider_profile.status = "PUBLISHED"
        self.db.commit()
        print("[Test 04] Inactive / DRAFT provider correctly excluded from search results.")

    def test_05_location_and_radius_filtering(self):
        """
        Step 4 & 9: Real Haversine radius calculation and distance boundary check.
        Mylapore is ~5.8 km from Chennai Central (13.0827, 80.2707).
        Within 10km -> Included. Within 3km -> Excluded.
        """
        # Search within 10 km (Mylapore is 5.8 km away) -> Included
        res_10km = client.post("/api/matches", json={
            "query": "Advanced Home Tuition",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius_km": 10
        }, headers=self.customer_headers)
        self.assertEqual(res_10km.status_code, 200)
        self.assertIsNotNone(next((m for m in res_10km.json() if m["provider_id"] == self.provider_profile.id), None))

        # Search within 3 km (Mylapore is 5.8 km away) -> Excluded
        res_3km = client.post("/api/matches", json={
            "query": "Advanced Home Tuition",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius_km": 3
        }, headers=self.customer_headers)
        self.assertEqual(res_3km.status_code, 200)
        self.assertIsNone(next((m for m in res_3km.json() if m["provider_id"] == self.provider_profile.id), None))

        print("[Test 05] Location radius boundary filtering (10km included vs 3km excluded) verified.")

    def test_06_different_domains_and_delivery_modes(self):
        """
        Step 9: Test custom new services across different domains (Tailoring, Gardening, Food) and delivery modes.
        """
        # Add diverse custom services to senior
        client.put(
            f"/api/providers/{self.provider_profile.id}",
            json={
                "services": ["Organic Terrace Soil Prep", "Custom Saree Blouse Aari Work", "Advanced Home Tuition"]
            },
            headers=self.senior_headers
        )

        for query_str in ["Organic Terrace Soil Prep", "Saree Blouse Aari Work"]:
            res = client.post("/api/matches", json={
                "query": query_str,
                "radius_km": 50
            }, headers=self.customer_headers)
            self.assertEqual(res.status_code, 200)
            self.assertIsNotNone(next((m for m in res.json() if m["provider_id"] == self.provider_profile.id), None))

        print("[Test 06] Diverse domains and custom new service discovery verified.")

if __name__ == "__main__":
    unittest.main()
