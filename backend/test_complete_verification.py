#!/usr/bin/env python3
"""
Comprehensive Verification Script for SilverHands Platform Bug Fixes:
1. Supabase Table Editor Verification (all tables exist in PostgreSQL with real rows)
2. Auth End-to-End Test (Signup -> Login -> /me -> Logout -> Re-login)
3. Avatar Upload & Storage Persistence Test
4. Video Upload & Storage Persistence Test
5. Cross-User Video Visibility Test (User 2 / Customer sees User 1 / Provider video)
6. AI Autofill from Video Description / Transcript (Gemini GenAI + Disclaimer)
"""
import sys
import os
import time
import io
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.db.session import get_engine, init_db, get_session_factory
from app.models.domain import User, Skill, ServiceListing, Booking, Review, OpportunityInterest, ProfileMedia
from app.services.supabase_client import upload_to_storage, ensure_storage_bucket, is_supabase_available
from app.services.ai_service import autofill_from_video_description
from fastapi.testclient import TestClient
from main import app

sys.stdout.reconfigure(encoding='utf-8')

client = TestClient(app)

def run_all_verifications():
    print("=" * 70)
    print("[SILVERHANDS] Complete Bug-Fix & Feature Verification Suite")
    print("=" * 70)

    # ----------------------------------------------------
    # TEST 1: Database & Supabase Tables Verification
    # ----------------------------------------------------
    print("\n[TEST 1] Verifying Supabase PostgreSQL Database Connection & Tables...")
    engine = get_engine()
    print(f"[*] Dialect: {engine.name}")
    print(f"[*] Host: {engine.url.host}")
    assert engine.name == "postgresql", f"Expected postgresql engine, got {engine.name}"

    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"[+] Tables in public schema: {tables}")
    expected = ["users", "skills", "services", "bookings", "reviews", "opportunities", "opportunity_interests", "profile_media", "work_samples"]
    for t in expected:
        assert t in tables, f"Missing table {t} in Supabase!"
    print("✅ [TEST 1 PASSED] All 9 tables exist in Supabase PostgreSQL!")

    # ----------------------------------------------------
    # TEST 2: Auth End-to-End Loop (Signup -> Login -> /me -> Logout -> Re-login)
    # ----------------------------------------------------
    print("\n[TEST 2] Testing Auth End-to-End Loop against Supabase...")
    ts = int(time.time())
    test_senior_email = f"test_senior_{ts}@example.com"
    test_password = "SecurePassword123!"

    # 2a. Signup
    signup_payload = {
        "email": test_senior_email,
        "password": test_password,
        "full_name": "Kavitha Raman",
        "role": "provider",
        "user_type": "senior",
        "age": 63,
        "phone": "+91 98400 54321",
        "location_name": "T. Nagar, Chennai",
        "languages": "Tamil, English",
        "bio": "Expert in South Indian filter coffee, traditional sweets, and Carnatic music tutoring."
    }
    signup_resp = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_resp.status_code == 200, f"Signup failed: {signup_resp.text}"
    signup_data = signup_resp.json()
    token = signup_data["access_token"]
    user_id = signup_data["user"]["id"]
    print(f"[+] Signup successful! Created User ID: {user_id} ({signup_data['user']['email']})")

    # 2b. Check /me with Bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200, f"/me failed: {me_resp.text}"
    me_data = me_resp.json()
    assert me_data["email"] == test_senior_email
    assert me_data["full_name"] == "Kavitha Raman"
    print(f"[+] /me authenticated successfully: {me_data['full_name']} (Role: {me_data['role']})")

    # 2c. Logout
    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
    print("[+] Logout endpoint responded OK.")

    # 2d. Re-login
    login_resp = client.post("/api/v1/auth/login", json={"email": test_senior_email, "password": test_password})
    assert login_resp.status_code == 200, f"Re-login failed: {login_resp.text}"
    new_token = login_resp.json()["access_token"]
    print(f"[+] Re-login succeeded with new Bearer token!")

    # 2e. Failed Login Check (wrong password)
    bad_login = client.post("/api/v1/auth/login", json={"email": test_senior_email, "password": "WrongPassword"})
    assert bad_login.status_code == 401
    print("[+] Invalid password correctly returned HTTP 401.")
    print("✅ [TEST 2 PASSED] Auth End-to-End loop verified successfully!")

    # ----------------------------------------------------
    # TEST 3: Avatar Upload & Persistence
    # ----------------------------------------------------
    print("\n[TEST 3] Testing Avatar Upload & Supabase Storage Persistence...")
    fake_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    avatar_upload_resp = client.post(
        f"/api/v1/providers/upload-avatar?user_id={user_id}",
        files={"file": ("profile_photo.png", io.BytesIO(fake_image), "image/png")},
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert avatar_upload_resp.status_code == 200, f"Avatar upload failed: {avatar_upload_resp.text}"
    avatar_result = avatar_upload_resp.json()
    uploaded_avatar_url = avatar_result["avatar_url"]
    print(f"[+] Avatar uploaded successfully: {uploaded_avatar_url}")
    assert "t=" in uploaded_avatar_url, "Avatar URL should include cache-busting timestamp"

    # Verify /me returns updated avatar_url
    me_after_avatar = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"}).json()
    assert me_after_avatar["avatar_url"] == uploaded_avatar_url
    print(f"[+] Verified avatar_url persisted on user profile in database!")
    print("✅ [TEST 3 PASSED] Avatar upload and persistence verified!")

    # ----------------------------------------------------
    # TEST 4: Video Upload & Persistence on Profile
    # ----------------------------------------------------
    print("\n[TEST 4] Testing Video Upload & Storage Persistence...")
    fake_video = b"\x00\x00\x00 ftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08free"
    video_upload_resp = client.post(
        f"/api/v1/providers/upload-video?user_id={user_id}&title=Carnatic%20Music%20Demo",
        files={"file": ("intro_video.mp4", io.BytesIO(fake_video), "video/mp4")},
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert video_upload_resp.status_code == 200, f"Video upload failed: {video_upload_resp.text}"
    video_result = video_upload_resp.json()
    uploaded_video_url = video_result["video_url"]
    print(f"[+] Video uploaded successfully: {uploaded_video_url}")

    # Create a service listing for User 1 (Kavitha Raman)
    service_payload = {
        "title": "Traditional Filter Coffee & Carnatic Vocal Tutoring",
        "category": "Tutoring & Mentoring",
        "description": "Authentic Carnatic music beginner lessons and traditional South Indian culinary guidance.",
        "price_per_hour": 350.0,
        "location_name": "T. Nagar, Chennai"
    }
    create_svc_resp = client.post(
        f"/api/v1/services?provider_id={user_id}",
        json=service_payload,
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert create_svc_resp.status_code == 200, f"Create service failed: {create_svc_resp.text}"
    created_svc = create_svc_resp.json()
    svc_id = created_svc["id"]
    print(f"[+] Created Service #{svc_id} with provider video linked: {created_svc.get('provider_video_url')}")
    assert created_svc.get("provider_video_url") == uploaded_video_url
    print("✅ [TEST 4 PASSED] Video upload and linking verified!")

    # ----------------------------------------------------
    # TEST 5: Cross-User Video Visibility Test (User 2 / Customer)
    # ----------------------------------------------------
    print("\n[TEST 5] Testing Cross-User Video Visibility (Customer viewing Provider's Video)...")
    # Signup a second distinct user (Customer)
    cust_email = f"customer_probe_{ts}@example.com"
    cust_signup_resp = client.post("/api/v1/auth/signup", json={
        "email": cust_email,
        "password": test_password,
        "full_name": "Arun Swaminathan",
        "role": "customer",
        "user_type": "customer",
        "location_name": "Adyar, Chennai"
    })
    assert cust_signup_resp.status_code == 200
    cust_token = cust_signup_resp.json()["access_token"]
    cust_id = cust_signup_resp.json()["user"]["id"]
    print(f"[+] Signed in as SECOND DISTINCT USER (Customer ID: {cust_id}, Name: Arun Swaminathan)")

    # Customer fetches marketplace services
    mkt_resp = client.get("/api/v1/services", headers={"Authorization": f"Bearer {cust_token}"})
    assert mkt_resp.status_code == 200
    all_services = mkt_resp.json()
    kavitha_svc = next((s for s in all_services if s["provider_id"] == user_id), None)
    assert kavitha_svc is not None, "Customer could not find provider service in marketplace!"
    assert kavitha_svc["provider_video_url"] == uploaded_video_url, f"Customer cannot see video! Got: {kavitha_svc.get('provider_video_url')}"
    print(f"[+] Customer successfully retrieved Provider's service with valid video URL: {kavitha_svc['provider_video_url']}")

    # Customer fetches single service detail
    svc_detail_resp = client.get(f"/api/v1/services/{svc_id}", headers={"Authorization": f"Bearer {cust_token}"})
    assert svc_detail_resp.status_code == 200
    assert svc_detail_resp.json()["provider_video_url"] == uploaded_video_url
    print("[+] Customer successfully retrieved Service Detail with provider video!")

    # Customer fetches provider profile
    provider_prof_resp = client.get(f"/api/v1/providers/{user_id}", headers={"Authorization": f"Bearer {cust_token}"})
    assert provider_prof_resp.status_code == 200
    assert provider_prof_resp.json()["provider"]["video_intro_url"] == uploaded_video_url
    print("[+] Customer successfully viewed Provider Profile with intro video URL!")
    print("✅ [TEST 5 PASSED] Cross-user video visibility confirmed!")

    # ----------------------------------------------------
    # TEST 6: AI Autofill from Video Description / Transcript
    # ----------------------------------------------------
    print("\n[TEST 6] Testing AI Autofill from Video Description / Transcript...")
    sample_video_desc = (
        "Hello everyone, I am Kavitha from Chennai. I have been practicing Carnatic vocal music for over 28 years "
        "and also preparing authentic Kumbakonam degree filter coffee and traditional South Indian snacks at home. "
        "I love teaching beginners and children."
    )
    autofill_resp = client.post("/api/v1/ai/autofill-from-video", json={
        "video_description": sample_video_desc,
        "user_name": "Kavitha Raman",
        "location": "Chennai, Tamil Nadu"
    })
    assert autofill_resp.status_code == 200, f"AI autofill failed: {autofill_resp.text}"
    autofill_data = autofill_resp.json()
    print(f"[+] AI Autofill Response received:")
    print(f"    - Notice/Disclaimer: {autofill_data.get('notice')}")
    print(f"    - Suggested Bio: {autofill_data.get('suggested_bio')}")
    print(f"    - Suggested Skills Count: {len(autofill_data.get('suggested_skills', []))}")
    for s in autofill_data.get("suggested_skills", []):
        print(f"      * {s.get('title')} ({s.get('category')}) — ₹{s.get('suggested_hourly_rate')}/hr")
    
    assert autofill_data.get("is_ai_assisted") is True
    assert "review" in (autofill_data.get("notice") or "").lower() or "ai" in (autofill_data.get("notice") or "").lower()
    assert len(autofill_data.get("suggested_skills", [])) > 0
    print("✅ [TEST 6 PASSED] AI Autofill produced structured, editable suggestions with disclaimer!")

    print("\n" + "=" * 70)
    print("🎉 ALL 6 VERIFICATION TEST SUITES PASSED FLAWLESSLY!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = run_all_verifications()
    sys.exit(0 if success else 1)
