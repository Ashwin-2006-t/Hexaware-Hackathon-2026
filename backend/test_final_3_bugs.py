import json
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def setup_test_providers():
    h_food = {"Authorization": "Bearer mock_jwt_token_food", "X-User-Id": "user_food", "X-User-Phone": "+919876543211"}
    h_tailor = {"Authorization": "Bearer mock_jwt_token_tailor", "X-User-Id": "user_tailor", "X-User-Phone": "+919876543212"}
    h_tutor = {"Authorization": "Bearer mock_jwt_token_tutor", "X-User-Id": "user_tutor", "X-User-Phone": "+919876543213"}
    h_garden = {"Authorization": "Bearer mock_jwt_token_garden", "X-User-Id": "user_garden", "X-User-Phone": "+919876543214"}

    # 1. Food Provider
    p_food = client.post("/api/providers", json={
        "name": "Hari Food Specialist",
        "email": "hari.food@example.com",
        "location": "Mylapore, Chennai",
        "latitude": 13.0339,
        "longitude": 80.2687,
        "title": "Dosa & Tamil Sweets Specialist",
        "bio": "Specialized in dosa preparation, adhirasam, and murukku for family functions.",
        "skills": ["Dosa Preparation", "Tamil Sweets", "Function Catering"],
        "services": ["Dosa Preparation for Functions", "Traditional Sweets"]
    }, headers=h_food).json()

    # 2. Tailoring Provider
    p_tailor = client.post("/api/providers", json={
        "name": "Kamala Tailor",
        "email": "kamala.tailor@example.com",
        "location": "T Nagar, Chennai",
        "latitude": 13.0418,
        "longitude": 80.2341,
        "title": "Saree Blouse Designer",
        "bio": "Custom saree blouse stitching and garment alterations for functions.",
        "skills": ["Saree Blouse Stitching", "Garment Alteration", "Aari Embroidery"],
        "services": ["Custom Blouse Stitching", "Express Alterations"]
    }, headers=h_tailor).json()

    # 3. Tutoring Provider
    p_tutor = client.post("/api/providers", json={
        "name": "Shanthi Teacher",
        "email": "shanthi.tutor@example.com",
        "location": "Alwarpet, Chennai",
        "latitude": 13.0333,
        "longitude": 80.2500,
        "title": "Hindi & Primary Math Tutor",
        "bio": "Experienced tutor providing Hindi language lessons for school children.",
        "skills": ["Hindi Language Teaching", "Child Tutoring"],
        "services": ["Hindi Language Lessons for Children"]
    }, headers=h_tutor).json()

    # 4. Gardening Provider
    p_garden = client.post("/api/providers", json={
        "name": "Sundaram Gardener",
        "email": "sundaram.garden@example.com",
        "location": "Adyar, Chennai",
        "latitude": 13.0012,
        "longitude": 80.2565,
        "title": "Terrace Gardening Specialist",
        "bio": "Organic soil prep and balcony plant maintenance.",
        "skills": ["Terrace Gardening", "Plant Maintenance"],
        "services": ["Balcony Garden Setup"]
    }, headers=h_garden).json()

    return p_food, p_tailor, p_tutor, p_garden

def test_final_3_bugs():
    p_food, p_tailor, p_tutor, p_garden = setup_test_providers()

    try:
        # TEST 1 — ENGLISH DOSA QUERY
        print("\n--- TEST 1: English Dosa Query ('I need dosa for a family function.') ---")
        res1 = client.post("/api/matches", json={"query": "I need dosa for a family function."}).json()
        print(f"Returned {len(res1)} matches:")
        for m in res1:
            print(f"  - {m['provider']['user']['name']}: {m['score']}% match score")
        
        # Verify Food provider is returned among top matches
        matched_ids1 = [m["provider"]["id"] for m in res1]
        assert p_food["id"] in matched_ids1, "Food provider not found in matches!"
        # Verify Tailoring, Tutoring, Gardening providers are EXCLUDED (score 0.0)
        assert p_tailor["id"] not in matched_ids1, "Tailoring provider improperly matched Dosa query!"
        assert p_garden["id"] not in matched_ids1, "Gardening provider improperly matched Dosa query!"
        assert p_tutor["id"] not in matched_ids1, "Tutoring provider improperly matched Dosa query!"
        print("[OK] Test 1 Passed: Only relevant Food providers matched English Dosa query!")

        # TEST 2 — TAMIL DOSA QUERY
        print("\n--- TEST 2: Tamil Dosa Query ---")
        res2 = client.post("/api/matches", json={"query": "எனக்கு விசேஷத்திற்கு தோசை வேண்டும்"}).json()
        print(f"Returned {len(res2)} matches:")
        for m in res2:
            print(f"  - {m['provider']['user']['name']}: {m['score']}% match score")

        matched_ids2 = [m["provider"]["id"] for m in res2]
        assert p_food["id"] in matched_ids2, "Food provider not found in Tamil Dosa matches!"
        assert p_tailor["id"] not in matched_ids2, "Tailoring provider improperly matched Tamil Dosa query!"
        assert p_garden["id"] not in matched_ids2, "Gardening provider improperly matched Tamil Dosa query!"
        print("[OK] Test 2 Passed: Tamil Dosa query correctly resolved to Food providers!")

        # TEST 3 — TAMIL TAILORING QUERY
        print("\n--- TEST 3: Tamil Tailoring Query ---")
        res3 = client.post("/api/matches", json={"query": "எனக்கு பிளவுஸ் தைக்க வேண்டும்"}).json()
        print(f"Returned {len(res3)} matches:")
        for m in res3:
            print(f"  - {m['provider']['user']['name']}: {m['score']}% match score")

        matched_ids3 = [m["provider"]["id"] for m in res3]
        assert p_tailor["id"] in matched_ids3, "Tailor provider not found in Tamil Tailoring matches!"
        assert p_food["id"] not in matched_ids3, "Food provider improperly matched Tamil Tailoring query!"
        print("[OK] Test 3 Passed: Tamil Blouse Stitching query correctly resolved to Tailor provider!")

        # TEST 4 — TAMIL TUTORING QUERY
        print("\n--- TEST 4: Tamil Tutoring Query ---")
        res4 = client.post("/api/matches", json={"query": "குழந்தைகளுக்கு ஹிந்தி பாடம் சொல்லித்தர வேண்டும்"}).json()
        print(f"Returned {len(res4)} matches:")
        for m in res4:
            print(f"  - {m['provider']['user']['name']}: {m['score']}% match score")

        matched_ids4 = [m["provider"]["id"] for m in res4]
        assert p_tutor["id"] in matched_ids4, "Tutor provider not found in Tamil Tutoring matches!"
        assert p_food["id"] not in matched_ids4, "Food provider improperly matched Tamil Tutoring query!"
        print("[OK] Test 4 Passed: Tamil Hindi Tutoring query correctly resolved to Tutor provider!")

    finally:
        # Cleanup
        h_food = {"Authorization": "Bearer mock_jwt_token_food", "X-User-Id": "user_food", "X-User-Phone": "+919876543211"}
        h_tailor = {"Authorization": "Bearer mock_jwt_token_tailor", "X-User-Id": "user_tailor", "X-User-Phone": "+919876543212"}
        h_tutor = {"Authorization": "Bearer mock_jwt_token_tutor", "X-User-Id": "user_tutor", "X-User-Phone": "+919876543213"}
        h_garden = {"Authorization": "Bearer mock_jwt_token_garden", "X-User-Id": "user_garden", "X-User-Phone": "+919876543214"}

        if isinstance(p_food, dict) and "id" in p_food: client.delete(f"/api/providers/{p_food['id']}", headers=h_food)
        if isinstance(p_tailor, dict) and "id" in p_tailor: client.delete(f"/api/providers/{p_tailor['id']}", headers=h_tailor)
        if isinstance(p_tutor, dict) and "id" in p_tutor: client.delete(f"/api/providers/{p_tutor['id']}", headers=h_tutor)
        if isinstance(p_garden, dict) and "id" in p_garden: client.delete(f"/api/providers/{p_garden['id']}", headers=h_garden)

if __name__ == "__main__":
    test_final_3_bugs()
    print("\nALL FINAL 3 BUG VERIFICATIONS PASSED 100% SUCCESSFULLY!")
