import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db, init_db
from app.models.domain import (
    User, Skill, ServiceListing, Booking, Review, OpportunityInterest,
    Video, Notification, Opportunity, FamilyRelationship, FamilyPermission, FamilyInvitation
)
from app.core.security import get_password_hash
from app.api.v1.endpoints.opportunities import DEFAULT_OPPORTUNITIES

router = APIRouter()

@router.post("/seed", summary="Seed Sample Indian Senior Providers & Service Listings")
def seed_database(db: Session = Depends(get_db)):
    """Pre-populates the database with realistic Indian senior provider profiles, homemakers, skills, services, bookings, and reviews."""
    init_db(force_recreate=True)

    # Clear existing data if present to ensure clean seed
    db.query(FamilyPermission).delete()
    db.query(FamilyRelationship).delete()
    db.query(FamilyInvitation).delete()
    db.query(Notification).delete()
    db.query(Video).delete()
    db.query(OpportunityInterest).delete()
    db.query(Opportunity).delete()
    db.query(Review).delete()
    db.query(Booking).delete()
    db.query(ServiceListing).delete()
    db.query(Skill).delete()
    db.query(User).delete()
    db.commit()

    hashed_pw = get_password_hash("password123")

    # Varied Indian Senior Providers and Homemakers with bundled local static avatars
    providers_data = [
        {
            "email": "lakshmi.ammal@example.com",
            "full_name": "Lakshmi Ammal (Lakshmi Amma)",
            "user_type": "homemaker",
            "age": 64,
            "phone": "+91 98401 12345",
            "bio": "Expert master seamstress in Chennai with 40 years of precision saree blouse tailoring, bridal alterations, and traditional hand embroidery.",
            "avatar_url": "/avatars/seed/lakshmi_amma.jpg",
            "location_name": "Mylapore / T. Nagar, Chennai",
            "latitude": 13.0368,
            "longitude": 80.2676,
            "languages": "Tamil, English, Telugu",
            "availability": "Weekday Mornings & Afternoons",
            "completed_services_count": 32,
            "trust_badge_level": "master_craftsman",
            "skills": [
                {"category": "Crafts & Tailoring", "title": "Saree Blouse Tailoring & Hand Embroidery", "exp": 40, "rate": 350.0, "desc": "Custom saree blouse stitching, neck designs, and hand embroidery."}
            ],
            "services": [
                {"title": "Custom Saree Blouse Tailoring & Alteration", "category": "Crafts & Tailoring", "price": 350.0, "desc": "Tailor-made saree blouses, lining attachments, and hand-stitched piping with 40 years of craftsmanship.", "area": "Within 8 km of Mylapore"}
            ]
        },
        {
            "email": "meenakshi.amma@example.com",
            "full_name": "Meenakshi Sundaram (Grandma Meenakshi)",
            "user_type": "homemaker",
            "age": 68,
            "phone": "+91 98200 12345",
            "bio": "Lifelong homemaker from Coimbatore with 38 years of culinary passion. Specialized in authentic South Indian snacks, podis, traditional mango avakaya, and daily tiffins.",
            "avatar_url": "/avatars/seed/meenakshi_amma.jpg",
            "location_name": "Dadar / Matunga, Mumbai",
            "latitude": 19.0178,
            "longitude": 72.8478,
            "languages": "Tamil, Hindi, English",
            "availability": "Weekday Mornings & Weekends",
            "completed_services_count": 28,
            "trust_badge_level": "master_craftsman",
            "skills": [
                {"category": "Cooking & Tiffin", "title": "Traditional South Indian Tiffin & Pickles", "exp": 38, "rate": 350.0, "desc": "Authentic Dosa, Idli batter, Sambar powder, and mango pickle prep."},
                {"category": "Cooking & Tiffin", "title": "Wholesome Daily Family Meals", "exp": 35, "rate": 300.0, "desc": "Fresh home-cooked daily lunch & dinner tiffins."}
            ],
            "services": [
                {"title": "Traditional South Indian Cooking & Tiffin Prep", "category": "Cooking & Tiffin", "price": 350.0, "desc": "Learn authentic hands-on South Indian cooking, tiffin batter prep, and homemade pickles in small friendly sessions.", "area": "Within 8 km of Dadar & R.S. Puram"},
                {"title": "Daily Wholesome Home Meal Prep (Tiffin)", "category": "Cooking & Tiffin", "price": 300.0, "desc": "Hygienic, home-cooked regional meals prepared with care for busy professionals.", "area": "Matunga & Dadar"}
            ]
        },
        {
            "email": "ravi.hegde@example.com",
            "full_name": "Ravi Hegde (Ravi Uncle)",
            "user_type": "senior",
            "age": 71,
            "phone": "+91 98450 34567",
            "bio": "Retired agricultural officer and urban terrace gardening expert in Bengaluru. Helps apartment families build productive balcony kitchen gardens with organic compost.",
            "avatar_url": "/avatars/seed/ravi_uncle.jpg",
            "location_name": "Malleshwaram, Bengaluru",
            "latitude": 13.0031,
            "longitude": 77.5643,
            "languages": "Kannada, English, Hindi",
            "availability": "Early Mornings (7 AM - 11 AM)",
            "completed_services_count": 24,
            "trust_badge_level": "master_craftsman",
            "skills": [
                {"category": "Gardening & Agriculture", "title": "Balcony Kitchen Gardening & Organic Care", "exp": 35, "rate": 400.0, "desc": "Terrace pot setup, vermicompost preparation, and organic vegetable cultivation."}
            ],
            "services": [
                {"title": "Terrace Kitchen Garden & Composting Setup", "category": "Gardening & Agriculture", "price": 400.0, "desc": "Transform your balcony or terrace into an organic vegetable garden with natural pest management.", "area": "Malleshwaram & Rajajinagar"}
            ]
        },
        {
            "email": "saraswati.ramaswamy@example.com",
            "full_name": "Saraswati Ramaswamy",
            "user_type": "senior",
            "age": 66,
            "phone": "+91 98422 45678",
            "bio": "Traditional arts mentor from Madurai with 30 years of experience teaching authentic Tanjore gold foil painting, traditional kolam motifs, and Sanskrit shlokas.",
            "avatar_url": "/avatars/seed/saraswati_amma.jpg",
            "location_name": "KK Nagar, Madurai",
            "latitude": 9.9252,
            "longitude": 78.1198,
            "languages": "Tamil, Sanskrit, English",
            "availability": "Afternoons (3 PM - 6 PM)",
            "completed_services_count": 20,
            "trust_badge_level": "community_star",
            "skills": [
                {"category": "Tutoring & Mentoring", "title": "Traditional Tanjore Art & Shlokas", "exp": 30, "rate": 400.0, "desc": "Traditional Tanjore gold-foil painting and Sanskrit shloka chanting for all ages."}
            ],
            "services": [
                {"title": "Traditional Tanjore Painting & Shloka Classes", "category": "Tutoring & Mentoring", "price": 400.0, "desc": "Step-by-step authentic Tanjore painting sessions with gold foil and devotional Sanskrit shloka chanting.", "area": "Within Madurai City"}
            ]
        },
        {
            "email": "kalyan.sundaram@example.com",
            "full_name": "Kalyan Sundaram (Kalyan Sir)",
            "user_type": "senior",
            "age": 69,
            "phone": "+91 98201 56789",
            "bio": "Former Kendriya Vidyalaya mathematics educator with 32 years of teaching experience. Passionate about helping children grasp algebra, geometry, and foundational science.",
            "avatar_url": "/avatars/seed/kalyan_sir.jpg",
            "location_name": "Matunga Central, Mumbai",
            "latitude": 19.0269,
            "longitude": 72.8553,
            "languages": "Hindi, Tamil, English, Marathi",
            "availability": "Evenings (4 PM - 7 PM)",
            "completed_services_count": 34,
            "trust_badge_level": "master_craftsman",
            "skills": [
                {"category": "Tutoring & Mentoring", "title": "School Mathematics & Foundational Science", "exp": 32, "rate": 450.0, "desc": "Patient 1-on-1 algebra, geometry, and school exam preparation for Class 6-10."}
            ],
            "services": [
                {"title": "Patient School Math & Science Tuition", "category": "Tutoring & Mentoring", "price": 450.0, "desc": "Clear, concept-based school math tutoring and exam preparation with patient step-by-step guidance.", "area": "Matunga, Dadar & Sion"}
            ]
        },
        {
            "email": "ramanathan.iyer@example.com",
            "full_name": "Ramanathan Iyer (Raman Uncle)",
            "user_type": "senior",
            "age": 73,
            "phone": "+91 98300 67890",
            "bio": "Former civil engineer and passionate home craftsman in Kolkata. Specializes in antique wooden furniture restoration, gentle home repair advice, and Carnatic flute.",
            "avatar_url": "/avatars/seed/raman_uncle.jpg",
            "location_name": "Salt Lake, Kolkata",
            "latitude": 22.5868,
            "longitude": 88.4178,
            "languages": "Bengali, Tamil, Hindi, English",
            "availability": "Weekdays (10 AM - 4 PM)",
            "completed_services_count": 18,
            "trust_badge_level": "community_star",
            "skills": [
                {"category": "Home Maintenance", "title": "Precision Woodwork & Home Repair Advice", "exp": 45, "rate": 350.0, "desc": "Experienced guidance on antique wooden furniture preservation, hinges, and minor repairs."}
            ],
            "services": [
                {"title": "Wooden Furniture Care & Home Help", "category": "Home Maintenance", "price": 350.0, "desc": "Trusted senior handyman consultation for furniture restoration, minor fixtures, and maintenance.", "area": "Salt Lake & New Town"}
            ]
        },
        {
            "email": "ananya.sen@example.com",
            "full_name": "Ananya Sen",
            "user_type": "homemaker",
            "age": 56,
            "phone": "+91 98333 78901",
            "bio": "Skilled homemaker and nutritionist passionate about wholesome regional meal prep, balanced low-oil diet tiffins, and Bengali traditional sweets.",
            "avatar_url": "/avatars/seed/ananya_homemaker.jpg",
            "location_name": "Kothrud, Pune",
            "latitude": 18.5074,
            "longitude": 73.8077,
            "languages": "Marathi, Bengali, Hindi, English",
            "availability": "Flexible Weekdays",
            "completed_services_count": 22,
            "trust_badge_level": "community_star",
            "skills": [
                {"category": "Cooking & Tiffin", "title": "Healthy Diet Tiffin & Traditional Sweets", "exp": 25, "rate": 300.0, "desc": "Balanced, hygienic homestyle meals and preservative-free regional sweets."}
            ],
            "services": [
                {"title": "Healthy Home Tiffin & Fresh Sweet Prep", "category": "Cooking & Tiffin", "price": 300.0, "desc": "Fresh, nutrient-rich daily lunch tiffins and weekend traditional sweets made with pure ingredients.", "area": "Kothrud & Deccan"}
            ]
        }
    ]

    created_providers = []
    created_services = []

    for pdata in providers_data:
        user = User(
            email=pdata["email"],
            hashed_password=hashed_pw,
            full_name=pdata["full_name"],
            role="provider",
            user_type=pdata["user_type"],
            age=pdata["age"],
            phone=pdata["phone"],
            bio=pdata["bio"],
            avatar_url=pdata["avatar_url"],
            location_name=pdata["location_name"],
            latitude=pdata["latitude"],
            longitude=pdata["longitude"],
            languages=pdata["languages"],
            availability=pdata["availability"],
            is_published=True,
            completed_services_count=pdata["completed_services_count"],
            trust_badge_level=pdata["trust_badge_level"]
        )
        db.add(user)
        db.flush()
        created_providers.append(user)

        for sk in pdata["skills"]:
            skill = Skill(
                user_id=user.id,
                category=sk["category"],
                title=sk["title"],
                description=sk["desc"],
                years_experience=sk["exp"],
                hourly_rate=sk["rate"],
                verified=True
            )
            db.add(skill)

        for sv in pdata["services"]:
            service = ServiceListing(
                provider_id=user.id,
                title=sv["title"],
                category=sv["category"],
                description=sv["desc"],
                price_per_hour=sv["price"],
                location_name=pdata["location_name"],
                service_area=sv["area"],
                home_service=True,
                availability=pdata["availability"],
                latitude=pdata["latitude"],
                longitude=pdata["longitude"],
                status="active",
                is_published=True
            )
            db.add(service)
            db.flush()
            created_services.append(service)

    # Sample Customer Users
    customer1 = User(
        email="priya.patel@example.com",
        hashed_password=hashed_pw,
        full_name="Priya Patel",
        role="customer",
        user_type="customer",
        phone="+91 98920 99000",
        bio="Working professional seeking trusted local senior services for family.",
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        location_name="Bandra West, Mumbai",
        latitude=19.0596,
        longitude=72.8295
    )
    customer2 = User(
        email="anand.kumar@example.com",
        hashed_password=hashed_pw,
        full_name="Anand Kumar",
        role="customer",
        user_type="customer",
        phone="+91 98800 44332",
        bio="Parent in Bengaluru looking for patient tutors for my son.",
        avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
        location_name="Koramangala, Bengaluru",
        latitude=12.9352,
        longitude=77.6245
    )
    db.add(customer1)
    db.add(customer2)
    db.flush()

    # Sample Completed Bookings and Reviews
    booking1 = Booking(
        customer_id=customer1.id,
        provider_id=created_providers[1].id,
        service_id=created_services[1].id,
        status="completed",
        total_price=700.0,
        scheduled_date="2026-08-10 (2 Hours)",
        notes="Authentic Sambar powder & Dosa batter learning session."
    )
    booking2 = Booking(
        customer_id=customer2.id,
        provider_id=created_providers[4].id,
        service_id=created_services[4].id,
        status="completed",
        total_price=900.0,
        scheduled_date="2026-08-12 (2 Hours)",
        notes="Class 8 Mathematics geometry & algebra problem solving."
    )
    booking3 = Booking(
        customer_id=customer1.id,
        provider_id=created_providers[0].id,
        service_id=created_services[0].id,
        status="completed",
        total_price=700.0,
        scheduled_date="2026-08-14 (2 Hours)",
        notes="Silk saree blouse fitting and neck alteration."
    )
    db.add(booking1)
    db.add(booking2)
    db.add(booking3)
    db.flush()

    # Authentic Reviews
    review1 = Review(
        booking_id=booking1.id,
        customer_id=customer1.id,
        provider_id=created_providers[1].id,
        rating=5,
        comment="Grandma Meenakshi is wonderful! She taught us how to make traditional sambar powder and crisp dosas. Heartwarming experience!"
    )
    review2 = Review(
        booking_id=booking2.id,
        customer_id=customer2.id,
        provider_id=created_providers[4].id,
        rating=5,
        comment="Kalyan Sir is so patient and explains mathematics concepts using simple daily-life examples. My son's confidence in algebra shot up."
    )
    review3 = Review(
        booking_id=booking3.id,
        customer_id=customer1.id,
        provider_id=created_providers[0].id,
        rating=5,
        comment="Lakshmi Amma's saree blouse fitting was immaculate. Delivered on time and done with exceptional care."
    )
    db.add(review1)
    db.add(review2)
    db.add(review3)

    # Seed Platform Opportunities
    for d_opp in DEFAULT_OPPORTUNITIES:
        opp_model = Opportunity(
            id=d_opp["id"],
            customer_id=customer1.id,
            title=d_opp["title"],
            category=d_opp["category"],
            customer_location=d_opp["customer_location"],
            latitude=19.0760 if "Mumbai" in d_opp["customer_location"] else 13.0827 if "Chennai" in d_opp["customer_location"] else 12.9716,
            longitude=72.8777 if "Mumbai" in d_opp["customer_location"] else 80.2707 if "Chennai" in d_opp["customer_location"] else 77.5946,
            budget_range=d_opp["budget_range"],
            description=d_opp["description"],
            status="open",
            created_at=datetime.datetime.utcnow()
        )
        db.add(opp_model)

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully seeded {len(created_providers)} Indian senior providers, {len(created_services)} services, opportunities, bookings, and verified reviews!"
    }

