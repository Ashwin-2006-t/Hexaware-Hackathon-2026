import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from app.db.session import SessionLocal, init_db
from app.models.domain import User, ServiceListing, Booking, Review, FamilyRelationship, FamilyPermission, FamilyInvitation
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)

def setup_module(module):
    """Ensure database schema is initialized"""
    init_db()

def create_test_user(db, email: str, full_name: str, user_type: str = "Senior Citizen") -> tuple[User, str]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash("Secret123!"),
            full_name=full_name,
            user_type=user_type,
            phone="+919876543210",
            location_name="Mumbai",
            latitude=19.0760,
            longitude=72.8777
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return user, token

def test_reviews_ratings_and_smart_match():
    db = SessionLocal()
    try:
        # Create Provider and Customer
        provider, p_token = create_test_user(db, "test_provider@silverhands.in", "Lakshmi Amma (Test)")
        customer, c_token = create_test_user(db, "test_customer@silverhands.in", "Rahul Sharma (Test)", "Regular User")
        intruder, i_token = create_test_user(db, "test_intruder@silverhands.in", "Intruder User", "Regular User")

        # Create Service Listing
        service = ServiceListing(
            provider_id=provider.id,
            title="South Indian Cooking Masterclass",
            category="Cooking & Tiffin",
            description="Traditional recipes",
            price_per_hour=450,
            service_area="Mumbai",
            status="active"
        )
        db.add(service)
        db.commit()
        db.refresh(service)

        # Create Booking (Status: pending)
        booking1 = Booking(
            customer_id=customer.id,
            provider_id=provider.id,
            service_id=service.id,
            status="pending",
            total_price=450,
            scheduled_date="2026-09-01 10:00:00"
        )
        db.add(booking1)
        db.commit()
        db.refresh(booking1)

        # 1. Reviewing a pending booking must fail (400)
        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking1.id, "rating": 5, "comment": "Too early"}
        )
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        assert "completed" in res.json()["detail"].lower()

        # Update booking to completed
        booking1.status = "completed"
        db.commit()

        # 2. Rating out of bounds (e.g. 0 or 6) must fail (400)
        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking1.id, "rating": 6, "comment": "Invalid high rating"}
        )
        assert res.status_code == 400

        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking1.id, "rating": 0, "comment": "Invalid low rating"}
        )
        assert res.status_code == 400

        # 3. Unauthorized user (intruder) trying to review must fail (403)
        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {i_token}"},
            json={"booking_id": booking1.id, "rating": 5, "comment": "Fake review"}
        )
        assert res.status_code == 403

        # 4. Provider trying to review their own service must fail (403)
        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {p_token}"},
            json={"booking_id": booking1.id, "rating": 5, "comment": "Self review"}
        )
        assert res.status_code == 403

        # 5. Legitimate customer submits review (rating = 5)
        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking1.id, "rating": 5, "comment": "Outstanding traditional sambar!"}
        )
        assert res.status_code == 200, f"Failed review submission: {res.text}"
        review_data = res.json()
        assert review_data["rating"] == 5
        assert review_data["booking_id"] == booking1.id

        # 6. Duplicate review for the same booking must fail (400)
        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking1.id, "rating": 4, "comment": "Duplicate attempt"}
        )
        assert res.status_code == 400
        assert "already submitted" in res.json()["detail"].lower()

        # 7. Create second completed booking and review with 4 stars
        booking2 = Booking(
            customer_id=customer.id,
            provider_id=provider.id,
            service_id=service.id,
            status="completed",
            total_price=450,
            scheduled_date="2026-09-02 10:00:00"
        )
        db.add(booking2)
        db.commit()
        db.refresh(booking2)

        res = client.post(
            "/api/v1/reviews",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking2.id, "rating": 4, "comment": "Very good experience"}
        )
        assert res.status_code == 200

        # 8. Check dynamic rating breakdown endpoint (average should be 4.5, total_reviews = 2)
        res = client.get(f"/api/v1/providers/{provider.id}/rating")
        assert res.status_code == 200
        rating_breakdown = res.json()
        assert rating_breakdown["total_reviews"] == 2
        assert rating_breakdown["average_rating"] == 4.5
        assert rating_breakdown["star_distribution"]["5"] == 1
        assert rating_breakdown["star_distribution"]["4"] == 1

        # 9. Test Smart Match integration with real provider rating
        match_res = client.post(
            "/api/v1/ai/smart-match",
            json={
                "customer_need": "I want traditional South Indian cooking and tiffin classes",
                "customer_location": "Mumbai",
                "category": "Cooking & Tiffin",
                "budget_max": 600
            }
        )
        assert match_res.status_code == 200
        matches = match_res.json().get("matches", [])
        assert len(matches) > 0
        # Verify rating score calculation inside breakdown
        matched_item = next((m for m in matches if m["provider_name"] == provider.full_name), None)
        if matched_item:
            # 4.5 rating -> (4.5 / 5.0) * 15 = 13.5 pts
            rating_pts = matched_item["score_breakdown"]["community_rating_pts"]
            assert rating_pts == 13.5, f"Expected 13.5 rating points for 4.5 avg rating, got {rating_pts}"

        print("✓ Real reviews, ratings, and Smart Match integration passed!")

    finally:
        db.close()

def test_virtual_call_mvp():
    db = SessionLocal()
    try:
        provider, p_token = create_test_user(db, "call_provider@silverhands.in", "Sita Devi")
        customer, c_token = create_test_user(db, "call_customer@silverhands.in", "Vikram Patel", "Regular User")
        intruder, i_token = create_test_user(db, "call_intruder@silverhands.in", "Sneha Rao", "Regular User")

        service = ServiceListing(
            provider_id=provider.id,
            title="School Math Mentoring",
            category="School Tuition & Mentoring",
            description="Grade 10 Math",
            price_per_hour=350,
            status="active"
        )
        db.add(service)
        db.commit()
        db.refresh(service)

        booking = Booking(
            customer_id=customer.id,
            provider_id=provider.id,
            service_id=service.id,
            status="confirmed",
            total_price=350,
            scheduled_date="2026-09-05 15:00:00"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        # 1. Intruder cannot start or join call (403)
        res = client.post(
            f"/api/v1/bookings/{booking.id}/virtual-call/start",
            headers={"Authorization": f"Bearer {i_token}"}
        )
        assert res.status_code == 403

        # 2. Customer can start call
        res = client.post(
            f"/api/v1/bookings/{booking.id}/virtual-call/start",
            headers={"Authorization": f"Bearer {c_token}"}
        )
        assert res.status_code == 200
        call_info = res.json()
        assert call_info["booking_id"] == booking.id
        assert "room_id" in call_info
        assert "meeting_url" in call_info
        assert "meet.jit.si" in call_info["meeting_url"] or "silverhands" in call_info["meeting_url"]

        # 3. Provider can retrieve call details
        res = client.get(
            f"/api/v1/bookings/{booking.id}/virtual-call",
            headers={"Authorization": f"Bearer {p_token}"}
        )
        assert res.status_code == 200
        assert res.json()["room_id"] == call_info["room_id"]

        # 4. Notify counterpart
        res = client.post(
            f"/api/v1/bookings/{booking.id}/virtual-call/notify",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"booking_id": booking.id, "message": "Ready to connect!"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "notified"

        print("✓ Virtual video call MVP & authorization passed!")

    finally:
        db.close()

def test_family_circle_senior_permissions():
    db = SessionLocal()
    try:
        senior, s_token = create_test_user(db, "senior_ramesh@silverhands.in", "Ramesh Uncle", "Senior Citizen")
        family_user, f_token = create_test_user(db, "son_amit@silverhands.in", "Amit Kumar", "Regular User")

        # 1. Senior invites family member
        invite_res = client.post(
            "/api/v1/family/invite",
            headers={"Authorization": f"Bearer {s_token}"},
            json={
                "email_or_phone": family_user.email,
                "relationship_type": "Son",
                "permissions": {
                    "VIEW_BOOKINGS": True,
                    "VIEW_SERVICE_DETAILS": True,
                    "VIEW_PROVIDER_DETAILS": True,
                    "RECEIVE_NOTIFICATIONS": True,
                    "HELP_WITH_REQUESTS": False
                }
            }
        )
        assert invite_res.status_code == 200, f"Invite failed: {invite_res.text}"
        invitation = invite_res.json()
        token = invitation["token"]
        assert token is not None

        # 2. Inspect invitation publicly with token
        inspect_res = client.get(f"/api/v1/family/invitations/{token}")
        assert inspect_res.status_code == 200
        assert inspect_res.json()["senior_name"] == senior.full_name

        # 3. Family member accepts invitation
        accept_res = client.post(
            f"/api/v1/family/invitations/{token}/accept",
            headers={"Authorization": f"Bearer {f_token}"}
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "accepted"

        # 4. Senior views Family Circle (active member exists)
        circle_res = client.get(
            "/api/v1/family/circle",
            headers={"Authorization": f"Bearer {s_token}"}
        )
        assert circle_res.status_code == 200
        members = circle_res.json()["members"]
        assert len(members) == 1
        member = members[0]
        assert member["family_name"] == family_user.full_name
        rel_id = member["relationship_id"]

        # 5. Family member retrieves senior care dashboard
        dash_res = client.get(
            f"/api/v1/family/senior/{senior.id}/dashboard",
            headers={"Authorization": f"Bearer {f_token}"}
        )
        assert dash_res.status_code == 200
        dash = dash_res.json()
        assert "upcoming_bookings" in dash  # VIEW_BOOKINGS was True
        assert dash["can_help_with_requests"] is False  # HELP_WITH_REQUESTS was False

        # 6. Senior disables VIEW_BOOKINGS permission
        update_perm_res = client.put(
            f"/api/v1/family/members/{rel_id}/permissions",
            headers={"Authorization": f"Bearer {s_token}"},
            json={
                "permissions": {
                    "VIEW_BOOKINGS": False,
                    "VIEW_SERVICE_DETAILS": True,
                    "VIEW_PROVIDER_DETAILS": True,
                    "RECEIVE_NOTIFICATIONS": True,
                    "HELP_WITH_REQUESTS": True
                }
            }
        )
        assert update_perm_res.status_code == 200

        # 7. Family member re-fetches dashboard: upcoming_bookings must now be None / omitted!
        dash_res2 = client.get(
            f"/api/v1/family/senior/{senior.id}/dashboard",
            headers={"Authorization": f"Bearer {f_token}"}
        )
        assert dash_res2.status_code == 200
        dash2 = dash_res2.json()
        assert dash2["upcoming_bookings"] is None
        assert dash2["can_help_with_requests"] is True

        # 8. Senior removes family member
        delete_res = client.delete(
            f"/api/v1/family/members/{rel_id}",
            headers={"Authorization": f"Bearer {s_token}"}
        )
        assert delete_res.status_code == 200

        # 9. After deletion, family member dashboard access is forbidden (403)
        dash_res3 = client.get(
            f"/api/v1/family/senior/{senior.id}/dashboard",
            headers={"Authorization": f"Bearer {f_token}"}
        )
        assert dash_res3.status_code == 403

        print("✓ Family circle senior-controlled permission enforcement passed!")

    finally:
        db.close()

if __name__ == "__main__":
    test_reviews_ratings_and_smart_match()
    test_virtual_call_mvp()
    test_family_circle_senior_permissions()
    print("\n🎉 ALL REAL REVIEWS, VIRTUAL CONTACT, AND FAMILY CIRCLE AUTOMATED TESTS PASSED!")
