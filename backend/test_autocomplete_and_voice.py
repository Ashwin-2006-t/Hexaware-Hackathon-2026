import os
import sys
import unittest

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from app.db.session import get_db
from app.models.domain import User

client = TestClient(app)

class TestLocationAutocompleteAndMapIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Seed test database
        resp = client.post("/api/v1/seed")
        print(f"Database seed status: {resp.status_code}")

    def test_01_location_autocomplete_preset_and_live(self):
        print("\n--- 1. Testing Location Autocomplete Suggestions ---")
        resp = client.get("/api/v1/map/autocomplete?q=Coimbatore")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreater(data["total"], 0)
        first = data["suggestions"][0]
        print(f"Autocomplete 'Coimbatore' -> {first['formatted_address']} (Lat: {first['latitude']}, Lng: {first['longitude']})")
        self.assertIn("Coimbatore", first["formatted_address"])
        self.assertAlmostEqual(first["latitude"], 11.0168, places=1)
        self.assertAlmostEqual(first["longitude"], 76.9558, places=1)

        resp2 = client.get("/api/v1/map/autocomplete?q=Mylapore")
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        self.assertGreater(data2["total"], 0)
        print(f"Autocomplete 'Mylapore' -> {data2['suggestions'][0]['formatted_address']}")

    def test_02_profile_update_with_resolved_coordinates(self):
        print("\n--- 2. Testing Profile Update with Autocomplete Coordinates ---")
        # Update User 1 with Coimbatore coordinates
        update_payload = {
            "location_name": "Coimbatore, Tamil Nadu",
            "latitude": 11.0168,
            "longitude": 76.9558,
            "bio": "Expert traditional silk weaver and tailoring artisan from Coimbatore.",
            "service_radius": 15.0
        }
        resp = client.put("/api/v1/providers/1/profile", json=update_payload)
        self.assertEqual(resp.status_code, 200)
        user_data = resp.json()
        print(f"Updated User 1 Profile: {user_data['full_name']}, Location: {user_data['location_name']}, Lat: {user_data['latitude']}, Lng: {user_data['longitude']}")
        self.assertEqual(user_data["location_name"], "Coimbatore, Tamil Nadu")
        self.assertAlmostEqual(user_data["latitude"], 11.0168, places=3)
        self.assertAlmostEqual(user_data["longitude"], 76.9558, places=3)

    def test_03_map_placement_and_distance_calculation_reflection(self):
        print("\n--- 3. Testing Map Placement & Haversine Distance Reflection ---")
        # Query map centered at Coimbatore (11.0168, 76.9558)
        resp_cbe = client.get("/api/v1/map/nearby?lat=11.0168&lng=76.9558&radius=25.0")
        self.assertEqual(resp_cbe.status_code, 200)
        map_cbe = resp_cbe.json()
        
        # User 1 should be right at the center (< 1.0 km)
        user1_marker = next((item for item in map_cbe["items"] if item["marker_type"] == "silverhands_provider" and item["id"] == 1), None)
        self.assertIsNotNone(user1_marker)
        print(f"User 1 marker found in Coimbatore radar: Distance = {user1_marker['distance_km']} km (Exact match: {user1_marker['distance_km'] <= 1.0})")
        self.assertLessEqual(user1_marker["distance_km"], 1.0)

        # Query map from Mumbai (19.0760, 72.8777) with 50km radius: User 1 in Coimbatore should NOT be within 50km
        resp_mum = client.get("/api/v1/map/nearby?lat=19.0760&lng=72.8777&radius=50.0")
        self.assertEqual(resp_mum.status_code, 200)
        map_mum = resp_mum.json()
        user1_in_mum = next((item for item in map_mum["items"] if item["marker_type"] == "silverhands_provider" and item["id"] == 1), None)
        self.assertIsNone(user1_in_mum, "User 1 located in Coimbatore correctly excluded from 50km Mumbai radius")
        print("[SUCCESS] Distance filtering correctly placed User 1 in Coimbatore!")

    def test_04_manual_unlisted_fallback_handling(self):
        print("\n--- 4. Testing Manual Unlisted Location Fallback ---")
        resp = client.get("/api/v1/map/autocomplete?q=ZzzUnlistedTinyHamlet99")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        print(f"Autocomplete for unlisted place -> total suggestions: {data['total']} (Graceful fallback)")
        self.assertEqual(data["total"], 0)

if __name__ == "__main__":
    unittest.main()
