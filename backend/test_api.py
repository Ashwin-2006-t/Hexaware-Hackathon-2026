import requests
import json
import time
import sys

# Ensure UTF-8 output and unbuffered flush
sys.stdout.reconfigure(encoding='utf-8')

def p(msg):
    print(msg, flush=True)

BASE_URL = "http://localhost:8000/api/v1"

def test_full_lifecycle():
    p("========================================")
    p("STARTING SILVERHANDS v3.1 BACKEND TESTS...")
    p("========================================")

    # 1. Health check
    p("\n1. Testing /health...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    p(f"[PASS] Health check passed: {r.json()}")

    # 2. Database Seeding
    p("\n2. Testing /seed...")
    r = requests.post(f"{BASE_URL}/seed")
    assert r.status_code == 200, f"Seed failed: {r.text}"
    p(f"[PASS] Seeding passed: {r.json()['message']}")

    # 3. Auth - Signup new senior provider
    p("\n3. Testing /auth/signup...")
    test_email = f"test.senior.{int(time.time())}@example.com"
    signup_payload = {
        "email": test_email,
        "password": "securePassword123",
        "full_name": "Kalyan Sundaram",
        "role": "provider",
        "user_type": "senior",
        "age": 67,
        "phone": "+91 98410 55667",
        "bio": "Retired botany lecturer and organic terrace gardener with 35 years of practical cultivation experience.",
        "location_name": "Adyar, Chennai",
        "latitude": 13.0012,
        "longitude": 80.2565,
        "languages": "Tamil, English",
        "availability": "Weekday Mornings"
    }
    r = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    assert r.status_code == 200, f"Signup failed: {r.text}"
    auth_data = r.json()
    token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    p(f"[PASS] Signup passed! User ID: {user_id}, Name: {auth_data['user']['full_name']}")

    # 4. Auth - Test Duplicate Email Block
    p("\n4. Testing duplicate email rejection...")
    r_dup = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    assert r_dup.status_code == 400, "Duplicate email should return 400"
    p(f"[PASS] Duplicate email correctly blocked: {r_dup.json()['detail']}")

    # 5. Auth - Test /me
    p("\n5. Testing /auth/me...")
    r_me = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert r_me.status_code == 200, f"/me failed: {r_me.text}"
    p(f"[PASS] /me authenticated successfully for {r_me.json()['email']}")

    # 6. AI - Skill Identification (Real Gemini)
    p("\n6. Testing /ai/extract-skills (Real Gemini)...")
    extract_payload = {
        "raw_prompt": "I have 35 years of experience in balcony organic terrace farming, composting kitchen waste, and nurturing flowering plants in Chennai.",
        "preferred_category": "Gardening & Agriculture"
    }
    r_skill = requests.post(f"{BASE_URL}/ai/extract-skills", json=extract_payload, headers=headers)
    assert r_skill.status_code == 200, f"extract-skills failed: {r_skill.text}"
    skill_res = r_skill.json()
    assert skill_res.get("ai_available") is True, "AI should be real dynamic Gemini"
    p(f"[PASS] Skill ID passed! ai_available={skill_res['ai_available']}, Extracted {len(skill_res['skills'])} skills. Bio: {skill_res['generated_profile_bio'][:60]}...")

    # 7. AI - Profile Builder (Real Gemini)
    p("\n7. Testing /ai/profile-builder (Real Gemini)...")
    builder_payload = {
        "name": "Kalyan Sundaram",
        "skills": ["Organic Terrace Gardening", "Natural Composting"],
        "experience_years": 35,
        "location": "Adyar, Chennai",
        "interests": "Terrace vegetables and medicinal herbs"
    }
    r_build = requests.post(f"{BASE_URL}/ai/profile-builder", json=builder_payload, headers=headers)
    assert r_build.status_code == 200, f"profile-builder failed: {r_build.text}"
    assert r_build.json().get("ai_available") is True, "AI should be real dynamic Gemini"
    p(f"[PASS] Profile Builder passed! Headline: {r_build.json()['headline']}")

    # 8. AI - Business Guidance (Real Gemini)
    p("\n8. Testing /ai/business-guidance (Real Gemini)...")
    guidance_payload = {
        "query": "sell homemade terrace compost and balcony garden setups",
        "location": "Adyar, Chennai"
    }
    r_guide = requests.post(f"{BASE_URL}/ai/business-guidance", json=guidance_payload, headers=headers)
    assert r_guide.status_code == 200, f"business-guidance failed: {r_guide.text}"
    assert r_guide.json().get("ai_available") is True, "AI should be real dynamic Gemini"
    p(f"[PASS] Business Guidance passed! Pricing strategy: {r_guide.json()['pricing_strategy']}")

    # 9. Services - Create service
    p("\n9. Testing /services (Create service)...")
    service_payload = {
        "title": "Balcony Kitchen Garden Setup & Organic Plant Care",
        "category": "Gardening & Agriculture",
        "description": "Personalized terrace vegetable garden setup, potting soil preparation, and natural composting guidance.",
        "price_per_hour": 350.0,
        "location_name": "Adyar, Chennai",
        "service_area": "Within 10 km",
        "home_service": True,
        "availability": "Weekday Mornings"
    }
    r_srv = requests.post(f"{BASE_URL}/services?provider_id={user_id}", json=service_payload, headers=headers)
    assert r_srv.status_code == 200, f"Create service failed: {r_srv.text}"
    service_id = r_srv.json()["id"]
    p(f"[PASS] Service created! ID: {service_id}, Title: {r_srv.json()['title']}")

    # 10. AI - Smart Match Engine
    p("\n10. Testing /ai/smart-match (5-Factor Deterministic Engine)...")
    match_payload = {
        "service_query": "Need senior gardening expert for balcony vegetable plants in Chennai",
        "category": "Gardening & Agriculture",
        "max_distance_km": 30.0,
        "customer_latitude": 13.0050,
        "customer_longitude": 80.2500
    }
    r_match = requests.post(f"{BASE_URL}/ai/smart-match", json=match_payload, headers=headers)
    assert r_match.status_code == 200, f"smart-match failed: {r_match.text}"
    match_data = r_match.json()
    p(f"[PASS] Smart Match passed! Found {match_data['total_found']} providers. Top match: {match_data['top_matches'][0]['provider_name']} (Score: {match_data['top_matches'][0]['match_score']}/100)")
    p(f"  Checklist reasons: {match_data['top_matches'][0]['match_reasons']}")

    # 11. Provider Opportunities Feed
    p("\n11. Testing /providers/{id}/opportunities...")
    r_opp = requests.get(f"{BASE_URL}/providers/{user_id}/opportunities", headers=headers)
    assert r_opp.status_code == 200, f"opportunities failed: {r_opp.text}"
    opps = r_opp.json()["opportunities"]
    p(f"[PASS] Opportunity Feed passed! Found {len(opps)} local demand requests for provider. Top Opp: {opps[0]['title']} (Score: {opps[0]['match_score']}/100)")

    # 12. Express Interest in Opportunity
    p("\n12. Testing Express Interest in Opportunity...")
    target_opp_id = opps[0]["id"]
    r_interest = requests.post(f"{BASE_URL}/providers/{user_id}/opportunities/{target_opp_id}/interest", headers=headers)
    assert r_interest.status_code == 200, f"Express interest failed: {r_interest.text}"
    interest_data = r_interest.json()
    assert interest_data["is_applied"] is True
    p(f"[PASS] Express Interest successful! Status: applied for {target_opp_id}")

    # Duplicate Interest Block
    r_dup_interest = requests.post(f"{BASE_URL}/providers/{user_id}/opportunities/{target_opp_id}/interest", headers=headers)
    assert r_dup_interest.status_code == 400, "Duplicate interest should be rejected"
    p(f"[PASS] Duplicate interest correctly rejected with 400: {r_dup_interest.json()['detail']}")

    # Check updated feed shows is_applied == True
    r_opp_updated = requests.get(f"{BASE_URL}/providers/{user_id}/opportunities", headers=headers)
    updated_opp = next(o for o in r_opp_updated.json()["opportunities"] if o["id"] == target_opp_id)
    assert updated_opp["is_applied"] is True
    p(f"[PASS] Opportunity feed correctly marks is_applied=True for {target_opp_id}")

    # 13. Bookings Lifecycle (Create -> Accept -> Complete -> Review)
    p("\n13. Testing Booking Lifecycle...")
    booking_payload = {
        "service_id": service_id,
        "provider_id": user_id,
        "total_price": 700.0,
        "scheduled_date": "2026-08-25 (2 Hours)",
        "notes": "Need help setting up tomato and chili saplings on 3rd floor balcony."
    }
    r_book = requests.post(f"{BASE_URL}/bookings?customer_id=1", json=booking_payload, headers=headers)
    assert r_book.status_code == 200, f"Booking creation failed: {r_book.text}"
    booking_id = r_book.json()["id"]
    p(f"[PASS] Booking created! ID: {booking_id}, Status: {r_book.json()['status']}")

    # Provider accepts booking
    r_accept = requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "confirmed"}, headers=headers)
    assert r_accept.status_code == 200 and r_accept.json()["status"] == "confirmed"
    p("[PASS] Provider accepted booking -> Status: confirmed")

    # Complete service
    r_complete = requests.patch(f"{BASE_URL}/bookings/{booking_id}/status", json={"status": "completed"}, headers=headers)
    assert r_complete.status_code == 200 and r_complete.json()["status"] == "completed"
    p("[PASS] Service marked completed -> Status: completed")

    # Customer leaves 5-star review
    review_payload = {
        "booking_id": booking_id,
        "rating": 5,
        "comment": "Kalyan sir is exceptionally knowledgeable about terrace plants! Highly recommend his guidance."
    }
    r_rev = requests.post(f"{BASE_URL}/reviews?customer_id=1", json=review_payload, headers=headers)
    assert r_rev.status_code == 200, f"Review failed: {r_rev.text}"
    p(f"[PASS] Review submitted! 5* Rating posted by customer.")

    # 14. AI Assistant Multilingual (Real Gemini in EN & TA)
    p("\n14. Testing /ai/assistant (SeniorBot in English & Tamil)...")
    r_bot_en = requests.post(f"{BASE_URL}/ai/assistant", json={"message": "How much should I charge for 2 hours of terrace gardening in Chennai?", "language": "en"}, headers=headers)
    assert r_bot_en.status_code == 200, f"assistant EN failed: {r_bot_en.text}"
    assert r_bot_en.json().get("ai_available") is True, "AI should be real dynamic Gemini"
    p(f"[PASS] SeniorBot Assistant reply (EN): {r_bot_en.json()['reply'][:80]}...")

    r_bot_ta = requests.post(f"{BASE_URL}/ai/assistant", json={"message": "மாடித்தோட்டம் அமைக்க எவ்வளவு கட்டணம் வாங்கலாம்?", "language": "ta"}, headers=headers)
    assert r_bot_ta.status_code == 200, f"assistant TA failed: {r_bot_ta.text}"
    assert r_bot_ta.json().get("ai_available") is True, "AI should be real dynamic Gemini"
    p(f"[PASS] SeniorBot Assistant reply (Tamil): {r_bot_ta.json()['reply'][:80]}...")

    p("\n========================================")
    p("ALL 14 API SUITE TESTS PASSED!")
    p("========================================")

if __name__ == "__main__":
    test_full_lifecycle()
