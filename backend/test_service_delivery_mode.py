import unittest
import base64
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.domain import User, ProviderProfile, Service, ServiceRequest, VirtualRoom

client = TestClient(app)

def make_jwt(user_id: str, role: str) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "role": role}).encode()).decode().rstrip("=")
    return f"{header}.{payload}.sig"

class TestServiceDeliveryMode(unittest.TestCase):

    def setUp(self):
        self.db = next(get_db())

        # Create Senior 1 (In Person Only)
        self.senior_in_person = self.db.query(User).filter(User.phone == "+918888811111").first()
        if not self.senior_in_person:
            self.senior_in_person = User(
                id="user_senior_in_person",
                name="Lakshmi Senior (In Person)",
                email="lakshmi.inperson@example.com",
                phone="+918888811111",
                role="SENIOR"
            )
            self.db.add(self.senior_in_person)

        self.prof_in_person = self.db.query(ProviderProfile).filter(ProviderProfile.user_id == "user_senior_in_person").first()
        if not self.prof_in_person:
            self.prof_in_person = ProviderProfile(
                id="prof_in_person",
                user_id="user_senior_in_person",
                title="Traditional Home Cook",
                status="PUBLISHED",
                service_delivery_mode="IN_PERSON"
            )
            self.db.add(self.prof_in_person)
        else:
            self.prof_in_person.service_delivery_mode = "IN_PERSON"

        # Create Senior 2 (Online Only)
        self.senior_online = self.db.query(User).filter(User.phone == "+918888822222").first()
        if not self.senior_online:
            self.senior_online = User(
                id="user_senior_online",
                name="Raman Senior (Online Tutor)",
                email="raman.online@example.com",
                phone="+918888822222",
                role="SENIOR"
            )
            self.db.add(self.senior_online)

        self.prof_online = self.db.query(ProviderProfile).filter(ProviderProfile.user_id == "user_senior_online").first()
        if not self.prof_online:
            self.prof_online = ProviderProfile(
                id="prof_online",
                user_id="user_senior_online",
                title="Virtual Math Tutor",
                status="PUBLISHED",
                service_delivery_mode="ONLINE"
            )
            self.db.add(self.prof_online)
        else:
            self.prof_online.service_delivery_mode = "ONLINE"

        # Create Senior 3 (Both & Per-Service Overrides)
        self.senior_both = self.db.query(User).filter(User.phone == "+918888833333").first()
        if not self.senior_both:
            self.senior_both = User(
                id="user_senior_both",
                name="Sundaram Senior (Both Modes)",
                email="sundaram.both@example.com",
                phone="+918888833333",
                role="SENIOR"
            )
            self.db.add(self.senior_both)

        self.prof_both = self.db.query(ProviderProfile).filter(ProviderProfile.user_id == "user_senior_both").first()
        if not self.prof_both:
            self.prof_both = ProviderProfile(
                id="prof_both",
                user_id="user_senior_both",
                title="Multi-Skilled Mentor",
                status="PUBLISHED",
                service_delivery_mode="BOTH"
            )
            self.db.add(self.prof_both)

            # Per-service overrides
            srv1 = Service(id="srv_cook", provider_id="prof_both", name="Catering Service", delivery_mode="IN_PERSON")
            srv2 = Service(id="srv_tutor", provider_id="prof_both", name="Vocal Music Tuition", delivery_mode="ONLINE")
            self.db.add_all([srv1, srv2])

        # Create Customer
        self.customer = self.db.query(User).filter(User.phone == "+918888844444").first()
        if not self.customer:
            self.customer = User(
                id="user_customer_test",
                name="Anand Customer",
                email="anand.cust@example.com",
                phone="+918888844444",
                role="CUSTOMER"
            )
            self.db.add(self.customer)

        # Create Unauthorized Third Party
        self.unauthorized_user = self.db.query(User).filter(User.phone == "+918888855555").first()
        if not self.unauthorized_user:
            self.unauthorized_user = User(
                id="user_unauthorized",
                name="Intruder User",
                email="intruder@example.com",
                phone="+918888855555",
                role="CUSTOMER"
            )
            self.db.add(self.unauthorized_user)

        self.db.commit()

        self.cust_headers = {"Authorization": f"Bearer {make_jwt('user_customer_test', 'CUSTOMER')}"}
        self.unauth_headers = {"Authorization": f"Bearer {make_jwt('user_unauthorized', 'CUSTOMER')}"}

    def tearDown(self):
        self.db.close()

    def test_01_in_person_booking_cannot_create_virtual_room(self):
        """Test that IN_PERSON bookings are strictly blocked from Virtual Room creation (HTTP 400)."""
        req = ServiceRequest(
            id="req_in_person_test",
            customer_id="user_customer_test",
            provider_id="prof_in_person",
            title="In-Person Home Cooking",
            description="Prepare traditional dinner at home",
            delivery_mode="IN_PERSON",
            status="ACCEPTED"
        )
        self.db.merge(req)
        self.db.commit()

        res = client.post("/api/virtual-rooms/create", json={"booking_id": "req_in_person_test"}, headers=self.cust_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("in-person delivery only", res.json()["detail"])
        print("\n[Test 1] IN_PERSON booking blocked from Virtual Room with HTTP 400")

    def test_02_online_booking_can_create_virtual_room(self):
        """Test that ONLINE bookings successfully launch Virtual Room (HTTP 200)."""
        req = ServiceRequest(
            id="req_online_test",
            customer_id="user_customer_test",
            provider_id="prof_online",
            title="Online Math Coaching",
            description="Algebra coaching over video call",
            delivery_mode="ONLINE",
            status="ACCEPTED"
        )
        self.db.merge(req)
        self.db.commit()

        res = client.post("/api/virtual-rooms/create", json={"booking_id": "req_online_test"}, headers=self.cust_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["booking_id"], "req_online_test")
        self.assertIsNotNone(data["room_code"])
        print("[Test 2] ONLINE booking successfully created Virtual Room")

    def test_03_both_mode_can_create_virtual_room(self):
        """Test that BOTH mode bookings successfully launch Virtual Room (HTTP 200)."""
        req = ServiceRequest(
            id="req_both_test",
            customer_id="user_customer_test",
            provider_id="prof_both",
            title="General Consultation",
            description="Career mentorship session",
            delivery_mode="BOTH",
            status="ACCEPTED"
        )
        self.db.merge(req)
        self.db.commit()

        res = client.post("/api/virtual-rooms/create", json={"booking_id": "req_both_test"}, headers=self.cust_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["booking_id"], "req_both_test")
        print("[Test 3] BOTH mode booking successfully created Virtual Room")

    def test_04_unauthorized_user_cannot_join(self):
        """Test that unauthorized users are rejected from entering virtual room (HTTP 403)."""
        req = ServiceRequest(
            id="req_unauth_test",
            customer_id="user_customer_test",
            provider_id="prof_online",
            title="Online Science Class",
            description="Physics tutoring",
            delivery_mode="ONLINE",
            status="ACCEPTED"
        )
        self.db.merge(req)
        self.db.commit()

        res = client.post("/api/virtual-rooms/create", json={"booking_id": "req_unauth_test"}, headers=self.unauth_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access denied", res.json()["detail"])
        print("[Test 4] Unauthorized user blocked from Virtual Room with HTTP 403")

    def test_05_existing_profiles_continue_working(self):
        """Test existing legacy profiles default to 'BOTH' and continue working."""
        req = ServiceRequest(
            id="req_legacy_test",
            customer_id="user_customer_test",
            provider_id="prof_both",
            title="Legacy Service Booking",
            description="Legacy booking request",
            status="ACCEPTED"
        )
        self.db.merge(req)
        self.db.commit()

        res = client.post("/api/virtual-rooms/create", json={"booking_id": "req_legacy_test"}, headers=self.cust_headers)
        self.assertEqual(res.status_code, 200)
        print("[Test 5] Legacy booking without explicit delivery_mode defaults to BOTH and creates room")

    def test_06_per_service_delivery_mode_override(self):
        """Test per-service override (Senior = BOTH, Catering = IN_PERSON, Music Tuition = ONLINE)."""
        # Booking 1: Catering Service -> IN_PERSON override
        req1 = client.post(
            "/api/requests",
            json={
                "provider_id": "prof_both",
                "title": "Catering Service for Birthday",
                "description": "Prepare meals for 15 guests",
                "location": "Mylapore, Chennai"
            },
            headers=self.cust_headers
        )
        self.assertEqual(req1.status_code, 201)
        b1_id = req1.json()["id"]

        # Accept booking 1
        req1_db = self.db.query(ServiceRequest).filter(ServiceRequest.id == b1_id).first()
        req1_db.status = "ACCEPTED"
        self.db.commit()

        # Attempt room creation for Catering (IN_PERSON override) -> Expected 400 Bad Request
        res1 = client.post("/api/virtual-rooms/create", json={"booking_id": b1_id}, headers=self.cust_headers)
        self.assertEqual(res1.status_code, 400)

        # Booking 2: Music Tuition -> ONLINE override
        req2 = client.post(
            "/api/requests",
            json={
                "provider_id": "prof_both",
                "title": "Vocal Music Tuition Class",
                "description": "Carnatic vocal music lesson",
                "location": "Online"
            },
            headers=self.cust_headers
        )
        self.assertEqual(req2.status_code, 201)
        b2_id = req2.json()["id"]

        # Accept booking 2
        req2_db = self.db.query(ServiceRequest).filter(ServiceRequest.id == b2_id).first()
        req2_db.status = "ACCEPTED"
        self.db.commit()

        # Attempt room creation for Music Tuition (ONLINE override) -> Expected 200 OK
        res2 = client.post("/api/virtual-rooms/create", json={"booking_id": b2_id}, headers=self.cust_headers)
        self.assertEqual(res2.status_code, 200)

        print("[Test 6] Per-service delivery mode overrides verified successfully!")

if __name__ == "__main__":
    unittest.main()
