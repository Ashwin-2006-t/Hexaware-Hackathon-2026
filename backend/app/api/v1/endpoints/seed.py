from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db, init_db
from app.models.domain import User, Skill, ServiceListing, Booking, Review
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/seed", summary="Seed Sample Senior Providers & Service Listings")
def seed_database(db: Session = Depends(get_db)):
    """Pre-populates the database with realistic senior provider profiles, skills, services, and reviews."""
    init_db()

    # Clear existing data if present to ensure clean seed
    db.query(Review).delete()
    db.query(Booking).delete()
    db.query(ServiceListing).delete()
    db.query(Skill).delete()
    db.query(User).delete()
    db.commit()

    hashed_pw = get_password_hash("password123")

    # Sample Senior Providers
    providers_data = [
        {
            "email": "mary.johnson@example.com",
            "full_name": "Mary Johnson (Grandma Mary)",
            "phone": "+1 (555) 234-5678",
            "bio": "Retired home economics teacher with 38 years of culinary passion. Specialized in artisanal bread baking, South Asian slow cooking, and custom dietary meals for busy families.",
            "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
            "location_name": "Downtown / Mission District",
            "latitude": 37.7650,
            "longitude": -122.4194,
            "skills": [
                {"category": "Cooking & Baking", "title": "Traditional Artisanal Baking", "exp": 38, "rate": 32.0, "desc": "Sourdough, pastries, and family heritage baking."},
                {"category": "Cooking & Baking", "title": "Heritage Slow Cooking", "exp": 35, "rate": 35.0, "desc": "Custom batch meal prep for busy young professionals."}
            ],
            "services": [
                {"title": "Artisanal Sourdough & Pastry Workshop", "category": "Cooking & Baking", "price": 35.0, "desc": "Learn authentic hands-on sourdough technique and heritage pastry baking in small friendly sessions."},
                {"title": "Weekly Family Meal Prep & Heritage Dishes", "category": "Cooking & Baking", "price": 32.0, "desc": "Wholesome home-cooked weekly batch meals tailored to your diet."}
            ]
        },
        {
            "email": "robert.chen@example.com",
            "full_name": "Robert Chen (Professor Chen)",
            "phone": "+1 (555) 345-6789",
            "bio": "Former high school mathematics department head (32 years). Enthusiastic about mentoring elementary and high school students in algebra, geometry, and problem solving.",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
            "location_name": "Sunset District",
            "latitude": 37.7540,
            "longitude": -122.4770,
            "skills": [
                {"category": "Tutoring & Mentoring", "title": "Math & STEM Mentorship", "exp": 32, "rate": 40.0, "desc": "Patient algebra, geometry, and logic tutoring."}
            ],
            "services": [
                {"title": "Patient One-on-One Math & STEM Mentoring", "category": "Tutoring & Mentoring", "price": 40.0, "desc": "Clear, encouraging math tutoring for grade school and high school students."}
            ]
        },
        {
            "email": "elena.rodriguez@example.com",
            "full_name": "Elena Rodriguez",
            "phone": "+1 (555) 456-7890",
            "bio": "Master seamstress and craft artisan with 42 years of fashion tailoring, embroidery, and home décor restoration.",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
            "location_name": "Pacific Heights",
            "latitude": 37.7925,
            "longitude": -122.4382,
            "skills": [
                {"category": "Crafts & Tailoring", "title": "Custom Alterations & Embroidery", "exp": 42, "rate": 30.0, "desc": "Suit tailoring, dress modifications, and heirloom embroidery."}
            ],
            "services": [
                {"title": "Heirloom Garment Tailoring & Custom Sewing", "category": "Crafts & Tailoring", "price": 30.0, "desc": "Expert garment alterations, dress fittings, and custom embroidery."}
            ]
        },
        {
            "email": "arthur.penton@example.com",
            "full_name": "Arthur Penton",
            "phone": "+1 (555) 567-8901",
            "bio": "Master gardener and urban agriculture consultant with 40 years of organic vegetable gardening experience.",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
            "location_name": "Richmond District",
            "latitude": 37.7780,
            "longitude": -122.4700,
            "skills": [
                {"category": "Gardening & Agriculture", "title": "Organic Vegetable Garden Setup", "exp": 40, "rate": 35.0, "desc": "Raised garden beds, composting, and seasonal crop planning."}
            ],
            "services": [
                {"title": "Urban Garden Consultation & Raised Bed Setup", "category": "Gardening & Agriculture", "price": 35.0, "desc": "Transform your backyard or patio into a thriving organic vegetable haven."}
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
            phone=pdata["phone"],
            bio=pdata["bio"],
            avatar_url=pdata["avatar_url"],
            location_name=pdata["location_name"],
            latitude=pdata["latitude"],
            longitude=pdata["longitude"]
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
                latitude=pdata["latitude"],
                longitude=pdata["longitude"],
                status="active"
            )
            db.add(service)
            db.flush()
            created_services.append(service)

    # Sample Customer User
    customer = User(
        email="customer@example.com",
        hashed_password=hashed_pw,
        full_name="Sarah Jenkins",
        role="customer",
        phone="+1 (555) 999-0000",
        bio="Local resident looking for trusted local senior services.",
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        location_name="San Francisco Bay Area",
        latitude=37.7749,
        longitude=-122.4194
    )
    db.add(customer)
    db.flush()

    # Sample Booking & Review for Grandma Mary
    booking1 = Booking(
        customer_id=customer.id,
        provider_id=created_providers[0].id,
        service_id=created_services[0].id,
        status="completed",
        total_price=70.0,
        scheduled_date="2026-08-10 14:00",
        notes="Sourdough bread session for two."
    )
    db.add(booking1)
    db.flush()

    review1 = Review(
        booking_id=booking1.id,
        customer_id=customer.id,
        provider_id=created_providers[0].id,
        rating=5,
        comment="Grandma Mary is absolute magic! She taught us how to cultivate sourdough starter and bake beautiful loaves. Truly heartwarming experience!"
    )
    db.add(review1)

    db.commit()

    return {
        "status": "success",
        "message": f"Seeded {len(created_providers)} senior providers, {len(created_services)} services, 1 customer, and reviews successfully!"
    }
