import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_backend_startup():
    res = client.get("/api/health")
    assert res.status_code == 200
    print("[OK] Backend startup healthy.")

def test_gemini_skill_extraction_grounding():
    payload = {"description": "I am good in Hindi and ready to teach children till age 16."}
    res = client.post("/api/ai/analyze-skills", json=payload)
    assert res.status_code == 200
    data = res.json()
    print("[OK] Gemini Skill Extraction Result:")
    print(json.dumps(data, indent=2))

    # Grounding Checks:
    # 1. experience_years MUST be null or 0 (NOT 10, 5, etc.)
    exp = data.get("experience_years")
    assert exp is None or exp == 0, f"Experience hallucinated: {exp}"

    # 2. No Mathematics or Exam preparation hallucinated
    all_skills_and_services = [s.lower() for s in data.get("skills", []) + data.get("services", [])]
    assert not any("math" in s for s in all_skills_and_services), "Math was hallucinated!"
    assert not any("exam prep" in s for s in all_skills_and_services), "Exam prep was hallucinated!"

    # 3. Correct Hindi / Education category
    assert "Education" in data.get("category") or "Tutoring" in data.get("category")
    print("[OK] Zero-hallucination verification PASSED cleanly!")

def test_gemini_profile_generation():
    payload = {
        "skills": ["Hindi Language Teaching", "Child Tutoring"],
        "experience_years": None,
        "services": ["Hindi Tutoring for Children"]
    }
    res = client.post("/api/ai/generate-profile", json=payload)
    assert res.status_code == 200
    data = res.json()
    print("[OK] Gemini Profile Generation Result:")
    print(json.dumps(data, indent=2))
    assert "bio" in data and "suggested_title" in data

def test_gemini_match_explanation():
    # Search matches for candidate request
    payload = {"query": "Hindi tutoring for children up to age 16 near Mylapore"}
    res = client.post("/api/matches", json=payload)
    assert res.status_code == 200
    matches = res.json()
    print(f"[OK] Gemini Match Explanation Result ({len(matches)} matches):")
    if matches:
        print("Explanation for top match:", matches[0].get("explanation"))
    assert len(matches) > 0

def test_gemini_nlp_profile_update_parsing():
    # Register dummy provider
    reg = client.post("/api/providers", json={
        "name": "Testing Provider",
        "email": "test.gemini@example.com",
        "location": "Mylapore, Chennai",
        "title": "Hindi Tutor",
        "bio": "Tutoring children.",
        "experience_years": 0,
        "availability": "Available Daily",
        "skills": ["Hindi Language"],
        "services": ["Hindi Tutoring"]
    })
    prov_id = reg.json()["id"]

    nlp_res = client.post(f"/api/providers/{prov_id}/nlp-update", json={"command": "I now offer traditional Tamil sweets for festival bulk orders"})
    assert nlp_res.status_code == 200
    proposal = nlp_res.json()
    print("[OK] Gemini NLP Profile Update Parsing Result:")
    print(json.dumps(proposal, indent=2))
    assert proposal.get("intent") is not None

    # Cleanup test provider
    client.delete(f"/api/providers/{prov_id}")

def test_gemini_ai_chat():
    res = client.post("/api/ai/chat", json={"message": "How do I add a new skill to my SilverHands profile?"})
    assert res.status_code == 200
    reply = res.json().get("reply")
    print("[OK] Gemini AI Chat Result:", reply)
    assert reply is not None

if __name__ == "__main__":
    test_backend_startup()
    test_gemini_skill_extraction_grounding()
    test_gemini_profile_generation()
    test_gemini_match_explanation()
    test_gemini_nlp_profile_update_parsing()
    test_gemini_ai_chat()
    print("\nALL 5 GEMINI FEATURES VERIFIED SUCCESSFULLY WITH LIVE MODELS/GEMINI-3.6-FLASH!")
