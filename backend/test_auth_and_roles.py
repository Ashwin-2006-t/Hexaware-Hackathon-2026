import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_auth_and_two_role_marketplace_flow():
    print("\n============================================================")
    print("RUNNING INTEGRATED AUTH & TWO-ROLE MARKETPLACE REGRESSION SUITE")
    print("============================================================")

    # ------------------------------------------------------------
    # STEP 1: Senior Registration via Phone Auth
    # ------------------------------------------------------------
    senior_id = "user_9876543210"
    senior_headers = {
        "Authorization": f"Bearer mock_jwt_token_{senior_id}",
        "X-User-Id": senior_id,
        "X-User-Phone": "+919876543210"
    }

    # 1a. Save Senior User Profile
    res = client.post("/api/users/profile", json={
        "userId": senior_id,
        "phone": "+919876543210",
        "role": "SENIOR",
        "fullName": "Mani Senior Specialist"
    }, headers=senior_headers)
    assert res.status_code == 200, f"Senior profile save failed: {res.text}"
    user_data = res.json()
    assert user_data["role"] == "SENIOR"
    print("[OK] Step 1a Passed: Senior User Profile saved successfully.")

    # 1b. Create Senior Provider Profile
    res = client.post("/api/providers", json={
        "name": "Mani",
        "email": "mani@example.com",
        "location": "Adyar, Chennai",
        "title": "Traditional Dosa & South Indian Chef",
        "bio": "Over 25 years of experience preparing authentic dosa and idli for events.",
        "experience_years": 25,
        "languages": "Tamil, English",
        "availability": "Weekdays & Weekends",
        "skills": ["Dosa Preparation", "South Indian Catering"],
        "services": ["Crispy Dosa Live Station", "South Indian Catering"]
    }, headers=senior_headers)
    assert res.status_code == 201, f"Provider creation failed: {res.text}"
    provider_data = res.json()
    provider_id = provider_data["id"]
    print(f"[OK] Step 1b Passed: Provider Profile created (ID: {provider_id}) linked to User ID {senior_id}.")

    # ------------------------------------------------------------
    # STEP 2: Customer Registration & Service Search
    # ------------------------------------------------------------
    customer_id = "user_9123456789"
    customer_headers = {
        "Authorization": f"Bearer mock_jwt_token_{customer_id}",
        "X-User-Id": customer_id,
        "X-User-Phone": "+919123456789"
    }

    # 2a. Save Customer User Profile
    res = client.post("/api/users/profile", json={
        "userId": customer_id,
        "phone": "+919123456789",
        "role": "CUSTOMER",
        "fullName": "Anand Resident"
    }, headers=customer_headers)
    assert res.status_code == 200, f"Customer profile save failed: {res.text}"
    assert res.json()["role"] == "CUSTOMER"
    print("[OK] Step 2a Passed: Customer User Profile saved successfully.")

    # 2b. Customer Searches for Dosa Service
    res = client.post("/api/matches", json={
        "query": "I need dosa for a function in Chennai."
    })
    assert res.status_code == 200
    matches = res.json()
    assert len(matches) > 0, "No matches found for dosa query!"
    print(f"[OK] Step 2b Passed: Customer matching returned {len(matches)} relevant providers.")

    # ------------------------------------------------------------
    # STEP 3: Customer Submits Request to Senior Mani
    # ------------------------------------------------------------
    res = client.post("/api/requests", json={
        "customer_name": "Anand Resident",
        "provider_id": provider_id,
        "title": "Dosa Live Station for Family Function",
        "description": "Need live dosa station for 60 guests on Sunday evening.",
        "location": "Adyar, Chennai",
        "preferred_date": "This Sunday, 6:00 PM"
    }, headers=customer_headers)
    assert res.status_code == 201, f"Request creation failed: {res.text}"
    req_data = res.json()
    request_id = req_data["id"]
    assert req_data["status"] == "PENDING"
    print(f"[OK] Step 3 Passed: Service Request created (ID: {request_id}) with status PENDING.")

    # ------------------------------------------------------------
    # STEP 4: Senior Receives & Accepts Request
    # ------------------------------------------------------------
    res = client.get("/api/requests/incoming", headers=senior_headers)
    assert res.status_code == 200
    incoming = res.json()
    assert any(r["id"] == request_id for r in incoming), "Request not found in Senior's incoming requests list!"
    print(f"[OK] Step 4a Passed: Senior Mani sees {len(incoming)} incoming requests.")

    # Senior Accepts Request
    res = client.put(f"/api/requests/{request_id}/status", json={"status": "ACCEPTED"}, headers=senior_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "ACCEPTED"
    print("[OK] Step 4b Passed: Senior successfully updated request status to ACCEPTED.")

    # ------------------------------------------------------------
    # STEP 5: Customer Verifies Request Status
    # ------------------------------------------------------------
    res = client.get("/api/requests/my", headers=customer_headers)
    assert res.status_code == 200
    my_requests = res.json()
    target_req = next((r for r in my_requests if r["id"] == request_id), None)
    assert target_req is not None
    assert target_req["status"] == "ACCEPTED"
    print("[OK] Step 5 Passed: Customer tracks request and verifies ACCEPTED status!")

    print("\n============================================================")
    print("ALL AUTH, ROLE WORKFLOW, AND SERVICE REQUEST TESTS PASSED 100%!")
    print("============================================================\n")

if __name__ == "__main__":
    test_full_auth_and_two_role_marketplace_flow()
