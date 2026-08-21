import os
os.environ["DATABASE_URL"] = "sqlite:///./test_prevent_auto_req.db"

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.domain import ServiceRequest, ProviderProfile, User

client = TestClient(app)

def test_prevent_automatic_request_creation():
    db = SessionLocal()
    try:
        # 1. Clean existing test requests for clean verification
        db.query(ServiceRequest).delete()
        db.commit()

        initial_count = db.query(ServiceRequest).count()
        assert initial_count == 0, f"Expected 0 ServiceRequests initially, found {initial_count}"

        # Ensure a published provider exists for matching & booking
        provider = db.query(ProviderProfile).filter(ProviderProfile.status == "PUBLISHED").first()
        if not provider:
            prov_user = User(name="Lakshmi Sweets Specialist", email="lakshmi.test@example.com", role="provider", phone="+919876543210")
            db.add(prov_user)
            db.flush()
            provider = ProviderProfile(
                user_id=prov_user.id,
                title="Traditional Tamil Culinary & Sweet Specialist",
                bio="Homemade sweets for weddings and functions",
                status="PUBLISHED",
                price=500.0
            )
            db.add(provider)
            db.commit()
            db.refresh(provider)

        # 2. Simulate opening "Find a Service" page (calls POST /api/matches with empty search query)
        match_res_empty = client.post("/api/matches", json={"query": "", "location": "Chennai, Tamil Nadu"})
        assert match_res_empty.status_code == 200
        matches_data = match_res_empty.json()
        assert isinstance(matches_data, list)
        assert len(matches_data) > 0, "Browsing without query should return available providers"

        count_after_browse = db.query(ServiceRequest).count()
        assert count_after_browse == 0, f"Mounting Find Service created a ServiceRequest in DB! Count: {count_after_browse}"

        # 3. Simulate executing a search query on "Find a Service" page (calls POST /api/matches with search query)
        match_res_query = client.post("/api/matches", json={"query": "I need homemade Tamil sweets for a wedding function", "location": "Chennai, Tamil Nadu"})
        assert match_res_query.status_code == 200
        
        count_after_search = db.query(ServiceRequest).count()
        assert count_after_search == 0, f"Searching matches created a ServiceRequest in DB! Count: {count_after_search}"

        # 4. Verify existing matching functionality still works and returns results
        assert len(match_res_query.json()) > 0, "Matching search should return matched providers"

        # 6. Verify explicit request creation via POST /api/requests works ONLY when customer submits
        auth_headers = {
            "Authorization": "Bearer mock_jwt_token_test_cust_123",
            "X-User-Id": "test_cust_123",
            "X-User-Phone": "+919999888877"
        }

        create_res = client.post("/api/requests", json={
            "provider_id": provider.id,
            "title": "Need authentic sweets for wedding",
            "description": "Please deliver 5kg murukku by 10 AM",
            "category": "Food & Catering",
            "location": "Mylapore, Chennai",
            "preferred_date": "2026-09-01",
            "requirement_quantity": 5,
            "requirement_unit": "kg"
        }, headers=auth_headers)

        assert create_res.status_code == 201, f"Failed to create request: {create_res.text}"
        created_req_data = create_res.json()
        assert created_req_data["title"] == "Need authentic sweets for wedding"
        assert created_req_data["status"] == "PENDING"

        # 7. Confirm exactly 1 request now exists in the database
        final_count = db.query(ServiceRequest).count()
        assert final_count == 1, f"Expected exactly 1 ServiceRequest in DB after explicit submission, got {final_count}"

        # 8. Verify fetching customer's requests returns the explicitly created request
        my_reqs_res = client.get("/api/requests/my", headers=auth_headers)
        assert my_reqs_res.status_code == 200
        my_reqs = my_reqs_res.json()
        assert len(my_reqs) == 1
        assert my_reqs[0]["id"] == created_req_data["id"]

        print("\n[SUCCESS] Regression Test Passed: No ServiceRequest is created automatically upon opening Find Service or searching matches. ServiceRequest is created ONLY upon explicit form submission!")

    finally:
        db.query(ServiceRequest).filter(ServiceRequest.title == "Need authentic sweets for wedding").delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    test_prevent_automatic_request_creation()
