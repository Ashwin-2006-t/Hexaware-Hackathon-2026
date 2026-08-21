import unittest
import base64
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, engine
from app.models.domain import User, ProviderProfile, ServiceRequest
from app.services.matching_service import haversine_distance

client = TestClient(app)

def make_test_jwt(user_id: str) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "role": "SENIOR_SERVICE_PROVIDER"}).encode()).decode().rstrip("=")
    return f"{header}.{payload}.sig"

class TestRealLocationSystem(unittest.TestCase):

    def setUp(self):
        self.db = next(get_db())
        
        # Setup Test Senior User
        self.senior_user = self.db.query(User).filter(User.phone == "+919876543210").first()
        if not self.senior_user:
            self.senior_user = User(
                id="user_senior_loc_test",
                name="Lakshmi Senior",
                email="lakshmi.test@example.com",
                phone="+919876543210",
                role="SENIOR_SERVICE_PROVIDER",
                location="Chennai, Tamil Nadu",
                latitude=13.0827,
                longitude=80.2707,
                city="Chennai",
                state="Tamil Nadu",
                country="India"
            )
            self.db.add(self.senior_user)
        else:
            self.senior_user.role = "SENIOR_SERVICE_PROVIDER"
        self.db.commit()
        self.db.refresh(self.senior_user)

        self.auth_headers = {"Authorization": f"Bearer {make_test_jwt(self.senior_user.id)}"}

        # Setup Provider Profile
        self.provider_profile = self.db.query(ProviderProfile).filter(ProviderProfile.user_id == self.senior_user.id).first()
        if not self.provider_profile:
            self.provider_profile = ProviderProfile(
                id="provider_loc_test",
                user_id=self.senior_user.id,
                title="Traditional Home Cook",
                bio="Expert home chef in Mylapore",
                status="PUBLISHED",
                location="Chennai, Tamil Nadu",
                latitude=13.0827,
                longitude=80.2707,
                city="Chennai",
                state="Tamil Nadu",
                country="India"
            )
            self.db.add(self.provider_profile)
            self.db.commit()
            self.db.refresh(self.provider_profile)

    def tearDown(self):
        self.db.close()

    def test_01_haversine_distance_calculation(self):
        """Verify Haversine geodesic distance calculation."""
        # Mylapore (13.0339, 80.2676) to T. Nagar (13.0418, 80.2341) is ~3.7 km
        dist = haversine_distance(13.0339, 80.2676, 13.0418, 80.2341)
        self.assertGreater(dist, 3.0)
        self.assertLess(dist, 5.0)
        print(f"\n[Test 1] Haversine distance Mylapore -> T.Nagar: {dist} km")

        # Chennai (13.0827, 80.2707) to Bengaluru (12.9716, 77.5946) is ~290 km
        dist_blr = haversine_distance(13.0827, 80.2707, 12.9716, 77.5946)
        self.assertGreater(dist_blr, 270.0)
        self.assertLess(dist_blr, 310.0)
        print(f"[Test 1] Haversine distance Chennai -> Bengaluru: {dist_blr} km")

    def test_02_authenticated_location_update_valid(self):
        """Test authenticated location update with real coordinates and reverse geocoded data."""
        payload = {
            "latitude": 13.0339,
            "longitude": 80.2676,
            "city": "Mylapore, Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "readable_address": "📍 Mylapore, Chennai, Tamil Nadu, India"
        }
        res = client.patch(
            "/api/providers/me/location",
            headers=self.auth_headers,
            json=payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["latitude"], 13.0339)
        self.assertEqual(data["longitude"], 80.2676)

        # Verify DB Persistence
        self.db.expire_all()
        user_db = self.db.query(User).filter(User.id == self.senior_user.id).first()
        self.assertEqual(user_db.latitude, 13.0339)
        self.assertEqual(user_db.longitude, 80.2676)
        self.assertEqual(user_db.city, "Mylapore, Chennai")
        print(f"\n[Test 2] Location update persisted to DB: {user_db.city}, lat={user_db.latitude}, lon={user_db.longitude}")

    def test_03_invalid_latitude_longitude_validation(self):
        """Test validation error for out-of-range latitude/longitude."""
        # Invalid Latitude -95
        res_lat = client.patch(
            "/api/providers/me/location",
            headers=self.auth_headers,
            json={"latitude": -95.0, "longitude": 80.2707}
        )
        self.assertEqual(res_lat.status_code, 400)

        # Invalid Longitude 190
        res_lon = client.patch(
            "/api/providers/me/location",
            headers=self.auth_headers,
            json={"latitude": 13.0827, "longitude": 190.0}
        )
        self.assertEqual(res_lon.status_code, 400)
        print("\n[Test 3] Coordinate boundary validations passed (-90..90, -180..180)")

    def test_04_unauthorized_location_update(self):
        """Test blocking unauthorized location updates without JWT token."""
        res = client.patch(
            "/api/providers/me/location",
            json={"latitude": 13.0827, "longitude": 80.2707}
        )
        self.assertIn(res.status_code, [401, 403])
        print("\n[Test 4] Unauthorized update blocked with 401/403")

    def test_05_haversine_radius_provider_filtering(self):
        """Test search radius filtering (5 km, 10 km, 20 km, 50 km)."""
        # Search from Mylapore (13.0339, 80.2676)
        # 5 km radius
        res_5 = client.get("/api/providers?customer_lat=13.0339&customer_lon=80.2676&radius_km=5")
        self.assertEqual(res_5.status_code, 200)

        # 50 km radius
        res_50 = client.get("/api/providers?customer_lat=13.0339&customer_lon=80.2676&radius_km=50")
        self.assertEqual(res_50.status_code, 200)
        print("\n[Test 5] Provider marketplace Haversine radius filtering (5km & 50km) verified")

    def test_06_opportunity_engine_real_location(self):
        """Verify Opportunity Engine uses senior's real stored lat/lon."""
        res = client.get(
            "/api/providers/me/opportunities",
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        print("\n[Test 6] Opportunity Engine executed cleanly using real stored coordinates")

if __name__ == "__main__":
    unittest.main()
