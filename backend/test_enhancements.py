"""
Comprehensive Integration & Security Test Suite for SilverHands Enhancements:
1. Map & Real-time Nearby Discovery (/map/nearby)
2. Location update (/location/update)
3. Opportunity Improvement Engine (/opportunities/recommendations)
4. Express Interest re-verification (/opportunities/{id}/interest)
5. Quiet Insight Notifications Feed (/notifications & mark as read)
6. Gemini AI Video Description Generator (/ai/video-description)
7. Video Gallery Security & Persistence (Upload, Visibility, Edit, Security Check, Delete)
"""
import sys
import os

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient


# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from app.db.session import init_db, get_db
from app.models.domain import User, Skill, Video, Notification, OpportunityInterest
from app.core.security import create_access_token

client = TestClient(app)

def test_all():
    print("\n" + "="*70)
    print("🚀 STARTING SILVERHANDS INTEGRATION & SECURITY SUITE")
    print("="*70)

    # Ensure DB initialized & seeded
    init_db()
    seed_resp = client.post("/api/v1/seed")
    print(f"Database seed status: {seed_resp.status_code}")
    assert seed_resp.status_code == 200

    # 1. Test Map Discovery
    print("\n--- 1. Testing Map & Geospatial Nearby Discovery ---")
    resp = client.get("/api/v1/map/nearby?lat=19.0760&lng=72.8777&radius=10.0&category=Cooking")
    print(f"Map Nearby Response Status: {resp.status_code}")
    assert resp.status_code == 200, f"Map failed: {resp.text}"
    map_data = resp.json()
    print(f"Center: {map_data.get('center')}")
    print(f"Counts: Total={map_data['counts']['total']}, Providers={map_data['counts']['providers']}, Opportunities={map_data['counts']['opportunities']}, OSM Businesses={map_data['counts']['real_businesses']}")
    assert "items" in map_data and len(map_data["items"]) > 0
    # Verify marker labels
    marker_types = {item["marker_type"] for item in map_data["items"]}
    print(f"Marker types present: {marker_types}")
    print("✅ Map Discovery Verified!")

    # 2. Test Location Update
    print("\n--- 2. Testing Geolocation Update ---")
    token_user1 = create_access_token(1)
    headers_user1 = {"Authorization": f"Bearer {token_user1}"}
    loc_payload = {
        "latitude": 19.0800,
        "longitude": 72.8800,
        "location_name": "Bandra West, Mumbai",
        "service_radius": 15.0
    }
    resp = client.post("/api/v1/location/update", json=loc_payload, headers=headers_user1)
    print(f"Location update status: {resp.status_code}")
    assert resp.status_code == 200, f"Location update failed: {resp.text}"
    print(f"Updated User Location: {resp.json()}")
    print("✅ Location Update Verified!")

    # 3. Test Opportunity Improvement Engine Recommendations
    print("\n--- 3. Testing Opportunity Improvement Engine ---")
    resp = client.get("/api/v1/opportunities/recommendations?provider_id=1", headers=headers_user1)
    print(f"Recommendations status: {resp.status_code}")
    assert resp.status_code == 200, f"Recommendations failed: {resp.text}"
    recs_data = resp.json()
    print(f"Provider: {recs_data.get('provider_name')}, Primary Category: {recs_data.get('primary_category')}")
    print(f"Total Recommendations: {recs_data.get('total')}")
    for r in recs_data.get("recommendations", []):
        print(f" - [{r['category']}] {r['title']} | Why: {r['why_shown'][:60]}... | Action: {r['action_label']}")
    assert len(recs_data.get("recommendations", [])) > 0
    print("✅ Opportunity Engine Verified!")

    # 4. Test Notifications Feed & Mark As Read
    print("\n--- 4. Testing Quiet Insight Notifications Feed ---")
    resp = client.get("/api/v1/notifications?user_id=1", headers=headers_user1)
    print(f"Notifications status: {resp.status_code}")
    assert resp.status_code == 200, f"Notifications failed: {resp.text}"
    notifs = resp.json()
    print(f"Total Insight Notifications: {len(notifs)}")
    assert len(notifs) > 0
    sample_notif = notifs[0]
    print(f"Sample Nudge: '{sample_notif['title']}' -> Action: {sample_notif['action']}")

    # Mark specific as read
    patch_resp = client.patch(f"/api/v1/notifications/{sample_notif['id']}/read", headers=headers_user1)
    assert patch_resp.status_code == 200
    print(f"Mark as read: {patch_resp.json()}")
    print("✅ Notifications Feed & Actions Verified!")

    # 5. Test Express Interest Re-Verification
    print("\n--- 5. Testing Express Interest Re-Verification ---")
    interest_resp = client.post("/api/v1/opportunities/opp_cooking_01/interest?provider_id=1")
    print(f"Express Interest status: {interest_resp.status_code}")
    # Can be 200 or 400 (if already applied in previous runs)
    if interest_resp.status_code == 400:
        print(f"Duplicate protection working: {interest_resp.json()['detail']}")
    else:
        assert interest_resp.status_code == 200
        print(f"Express interest response: {interest_resp.json()}")
    print("✅ Express Interest Verified!")

    # 6. Test AI Video Description Generator
    print("\n--- 6. Testing Gemini Video Description Generator ---")
    ai_payload = {
        "title": "Traditional Sambar & Filter Coffee Preparation",
        "transcript_or_notes": "I have been making authentic South Indian Brahmin style meals for over 35 years using stone-ground spices and fresh coconut.",
        "category": "Cooking",
        "language": "English"
    }
    ai_resp = client.post("/api/v1/ai/video-description", json=ai_payload)
    print(f"AI Video Description status: {ai_resp.status_code}")
    assert ai_resp.status_code == 200, f"AI failed: {ai_resp.text}"
    ai_data = ai_resp.json()
    print(f"AI Suggested Description: {ai_data.get('suggested_description')}")
    print(f"AI Notice: {ai_data.get('ai_notice')}")
    print(f"Detected Skills: {ai_data.get('detected_skills')}")
    print("✅ AI Video Description Verified!")

    # 7. Test Video Gallery & Security
    print("\n--- 7. Testing Video Management, Visibility & Security ---")
    token_user2 = create_access_token(2) # Different user / customer
    headers_user2 = {"Authorization": f"Bearer {token_user2}"}

    # User 1 creates a Public Video
    pub_video_payload = {
        "title": "Master Tailoring Hand Stitch Demo",
        "description": "Demonstrating fine hand-embroidery and saree blouse alteration.",
        "category": "Crafts",
        "visibility": "public",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "ai_generated": True,
        "duration_seconds": 45
    }
    pub_resp = client.post("/api/v1/providers/1/videos", json=pub_video_payload, headers=headers_user1)
    assert pub_resp.status_code == 200
    pub_video = pub_resp.json()
    pub_video_id = pub_video["id"]
    print(f"Created Public Video ID: {pub_video_id}")

    # User 1 creates a Private Video
    priv_video_payload = {
        "title": "Private Draft Showcase",
        "description": "Internal work-in-progress draft not ready for public marketplace.",
        "category": "Crafts",
        "visibility": "private",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "ai_generated": False,
        "duration_seconds": 30
    }
    priv_resp = client.post("/api/v1/providers/1/videos", json=priv_video_payload, headers=headers_user1)
    assert priv_resp.status_code == 200
    priv_video = priv_resp.json()
    priv_video_id = priv_video["id"]
    print(f"Created Private Video ID: {priv_video_id}")

    # Owner (User 1) listing own videos -> MUST see both public and private
    owner_list = client.get("/api/v1/providers/1/videos", headers=headers_user1).json()
    owner_video_ids = [v["id"] for v in owner_list]
    print(f"Owner sees video IDs: {owner_video_ids}")
    assert pub_video_id in owner_video_ids
    assert priv_video_id in owner_video_ids
    print("✅ Owner sees both public and private videos.")

    # Third Party (User 2) listing User 1's videos -> MUST see ONLY public video!
    visitor_list = client.get("/api/v1/providers/1/videos", headers=headers_user2).json()
    visitor_video_ids = [v["id"] for v in visitor_list]
    print(f"Visitor (User 2) sees video IDs: {visitor_video_ids}")
    assert pub_video_id in visitor_video_ids
    assert priv_video_id not in visitor_video_ids, "SECURITY BREACH: Private video exposed to visitor!"
    print("✅ Security Check Passed: Private video strictly hidden from other users.")

    # User 2 tries to EDIT User 1's video -> MUST BE 403 FORBIDDEN
    hack_resp = client.patch(f"/api/v1/providers/videos/{pub_video_id}", json={"title": "Hacked Title"}, headers=headers_user2)
    print(f"Unauthorized edit attempt status: {hack_resp.status_code}")
    assert hack_resp.status_code == 403, "SECURITY BREACH: Non-owner edited a video!"
    print("✅ Security Check Passed: Non-owner edit blocked with 403.")

    # User 2 tries to DELETE User 1's video -> MUST BE 403 FORBIDDEN
    hack_del_resp = client.delete(f"/api/v1/providers/videos/{pub_video_id}", headers=headers_user2)
    print(f"Unauthorized delete attempt status: {hack_del_resp.status_code}")
    assert hack_del_resp.status_code == 403, "SECURITY BREACH: Non-owner deleted a video!"
    print("✅ Security Check Passed: Non-owner delete blocked with 403.")

    # User 1 edits public video -> description persists
    edit_resp = client.patch(
        f"/api/v1/providers/videos/{pub_video_id}",
        json={"description": "Updated description with master certifications."},
        headers=headers_user1
    )
    assert edit_resp.status_code == 200
    assert edit_resp.json()["description"] == "Updated description with master certifications."
    print("✅ Owner edit successfully persisted.")

    # User 1 deletes private video -> successfully removed
    del_resp = client.delete(f"/api/v1/providers/videos/{priv_video_id}", headers=headers_user1)
    assert del_resp.status_code == 200
    print(f"Owner deleted private video: {del_resp.json()}")

    # Verify deleted video is gone from DB
    after_del_list = client.get("/api/v1/providers/1/videos", headers=headers_user1).json()
    assert priv_video_id not in [v["id"] for v in after_del_list]
    print("✅ Video removal verified from DB.")

    print("\n" + "="*70)
    print("🎉 ALL BACKEND INTEGRATION & SECURITY TESTS PASSED PERFECTLY!")
    print("="*70)

if __name__ == "__main__":
    test_all()
