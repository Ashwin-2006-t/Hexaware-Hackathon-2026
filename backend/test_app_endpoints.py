import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_v6_suite():
    print("=" * 60)
    print("STARTING SILVERHANDS v6.0 BACKEND CAPABILITY TESTS")
    print("=" * 60)

    # 1. Health
    print("\n[1] Testing /api/v1/health...")
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200, f"Health failed: {resp.text}"
    data = resp.json()
    print(f"  [OK] Status: {data.get('status')}, Database: {data.get('database')}")

    # 2. Providers List & Profile
    print("\n[2] Testing /api/v1/providers...")
    resp = client.get("/api/v1/providers/")
    assert resp.status_code == 200, f"List providers failed: {resp.text}"
    providers = resp.json()
    print(f"  [OK] Total Providers: {len(providers)}")

    # 3. Skill Passport
    print("\n[3] Testing Skill Passport (/api/v1/providers/1/skill-passport)...")
    resp = client.get("/api/v1/providers/1/skill-passport")
    assert resp.status_code == 200, f"Skill Passport failed: {resp.text}"
    passport = resp.json()
    print(f"  [OK] Provider: {passport['provider_name']}")
    print(f"  [OK] Badge: {passport['trust_badge_level']}")
    print(f"  [OK] Verified Skills Count: {len(passport['skills'])}")
    print(f"  [OK] Summary: {passport['passport_summary']}")

    # 4. Opportunity Improvement Engine (Readiness)
    print("\n[4] Testing Improvement Engine (/api/v1/providers/1/readiness)...")
    resp = client.get("/api/v1/providers/1/readiness")
    assert resp.status_code == 200, f"Readiness failed: {resp.text}"
    readiness = resp.json()
    print(f"  [OK] Readiness Percentage: {readiness['readiness_percentage']}%")
    print(f"  [OK] Checklist Items: {readiness['completed_count']}/{readiness['total_count']} complete")
    print(f"  [OK] Advice: {readiness['improvement_advice']}")

    # 5. Local Demand Radar
    print("\n[5] Testing Local Demand Radar (/api/v1/opportunities/demand-radar)...")
    resp = client.get("/api/v1/opportunities/demand-radar?location=Mumbai")
    assert resp.status_code == 200, f"Demand radar failed: {resp.text}"
    radar = resp.json()
    print(f"  [OK] Total Radar Categories in Mumbai: {radar['total_categories']}")
    print(f"  [OK] High Demand Categories: {radar['high_demand_count']}")

    # 6. Opportunity Feed
    print("\n[6] Testing Deterministic Opportunity Feed (/api/v1/opportunities/feed)...")
    resp = client.get("/api/v1/opportunities/feed?provider_id=1")
    assert resp.status_code == 200, f"Opportunity feed failed: {resp.text}"
    feed = resp.json()
    print(f"  [OK] Matched Opportunities: {feed['total']}")
    if feed['opportunities']:
        top = feed['opportunities'][0]
        print(f"  [OK] Top Match: {top['title']} ({top['match_score']}%)")
        print(f"  [OK] Match Reasons: {top['match_reasons']}")

    # 7. Express Interest Lifecycle (and duplicate prevention)
    print("\n[7] Testing Express Interest Lifecycle...")
    # First attempt (or query existing)
    resp = client.post("/api/v1/opportunities/opp-101/interest?provider_id=1")
    if resp.status_code == 200:
        print(f"  [OK] Interest expressed successfully: {resp.json().get('message')}")
    elif resp.status_code == 400:
        print(f"  [OK] Duplicate prevention confirmed: {resp.json().get('detail')}")
    else:
        assert False, f"Unexpected response: {resp.text}"

    # Attempt duplicate
    dup_resp = client.post("/api/v1/opportunities/opp-101/interest?provider_id=1")
    assert dup_resp.status_code == 400, "Duplicate interest should be rejected with 400"
    print(f"  [OK] Duplicate blocked cleanly: {dup_resp.json().get('detail')}")

    # List interested providers
    interests_resp = client.get("/api/v1/opportunities/opp-101/interests")
    assert interests_resp.status_code == 200
    print(f"  [OK] Opportunity Owner View: {interests_resp.json().get('total')} interested provider(s)")

    # 8. Work Samples API
    print("\n[8] Testing Work Samples...")
    new_sample = {
        "title": "Traditional Mysore Pak & Filter Coffee",
        "category": "Cooking & Tiffin",
        "image_url": "http://localhost:8000/uploads/avatars/sample1.jpg",
        "description": "Authentic melt-in-mouth ghee Mysore Pak prepared for festival order."
    }
    sample_post = client.post("/api/v1/providers/1/work-samples", json=new_sample)
    assert sample_post.status_code == 200, f"Add work sample failed: {sample_post.text}"
    created_sample = sample_post.json()
    print(f"  [OK] Created work sample ID: {created_sample['id']}")

    samples_get = client.get("/api/v1/providers/1/work-samples")
    assert samples_get.status_code == 200
    print(f"  [OK] Total work samples for provider 1: {len(samples_get.json())}")

    # Clean up test sample
    del_resp = client.delete(f"/api/v1/providers/1/work-samples/{created_sample['id']}")
    assert del_resp.status_code == 200
    print("  [OK] Cleaned up test work sample.")

    # 9. AI Smart Match & Assistant
    print("\n[9] Testing AI Smart Match & Explainer...")
    match_payload = {
        "service_query": "Need patient home tutor for class 8 math",
        "category": "Tutoring & Mentoring",
        "customer_latitude": 19.0760,
        "customer_longitude": 72.8777
    }
    match_resp = client.post("/api/v1/ai/smart-match", json=match_payload)
    assert match_resp.status_code == 200, f"Smart match failed: {match_resp.text}"
    matches = match_resp.json()
    print(f"  [OK] Found {matches['total_found']} smart matches.")
    if matches['top_matches']:
        m1 = matches['top_matches'][0]
        print(f"  [OK] Top Match: {m1['provider_name']} ({m1['match_score']}%)")
        print(f"  [OK] Explainer: {m1['ai_reasoning']}")

    print("\n" + "=" * 60)
    print("ALL SILVERHANDS v6.0 BACKEND TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_v6_suite()
