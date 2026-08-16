import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User, Skill, ServiceListing, Booking, OpportunityInterest, Opportunity
from app.schemas.domain import (
    OpportunityFeedResponse, OpportunityItem, OpportunityInterestResponse,
    DemandRadarResponse, DemandRadarItem, OpportunityDetailResponse, OpportunityCreate
)
from app.services.ai_service import generate_match_explanation

router = APIRouter()

# Baseline Catalog of Local Demand Radar Data (aggregated across neighborhoods in India)
DEMAND_RADAR_DATA = [
    {
        "category": "Cooking & Tiffin",
        "location": "Mumbai, Maharashtra",
        "demand_level": "High",
        "active_requests_count": 28,
        "average_hourly_rate": 350.0,
        "top_requested_skills": ["Daily Homestyle Tiffin", "Authentic Sambar & Rasam", "Sun-dried Mango Pickle", "Gujarati Thali"],
        "growth_trend": "+22% this week",
        "is_remote_friendly": False,
        "is_live_data": True
    },
    {
        "category": "Tutoring & Mentoring",
        "location": "Mumbai, Maharashtra",
        "demand_level": "High",
        "active_requests_count": 24,
        "average_hourly_rate": 450.0,
        "top_requested_skills": ["Class 6-10 Mathematics", "Foundational English Reading", "CBSE Science Mentoring"],
        "growth_trend": "+18% this week",
        "is_remote_friendly": True,
        "is_live_data": True
    },
    {
        "category": "Crafts & Tailoring",
        "location": "Mumbai, Maharashtra",
        "demand_level": "High",
        "active_requests_count": 19,
        "average_hourly_rate": 400.0,
        "top_requested_skills": ["Silk Saree Blouse Fitting", "Kurti Alterations", "Zardozi Hand Embroidery", "Dress Upcycling"],
        "growth_trend": "+15% this week",
        "is_remote_friendly": False,
        "is_live_data": True
    },
    {
        "category": "Gardening & Agriculture",
        "location": "Mumbai, Maharashtra",
        "demand_level": "Medium",
        "active_requests_count": 14,
        "average_hourly_rate": 400.0,
        "top_requested_skills": ["Balcony Kitchen Garden", "Organic Pest Control", "Potting Soil & Compost Mix"],
        "growth_trend": "+12% this week",
        "is_remote_friendly": False,
        "is_live_data": True
    },
    {
        "category": "Consulting & Life Mentoring",
        "location": "Mumbai, Maharashtra",
        "demand_level": "Medium",
        "active_requests_count": 9,
        "average_hourly_rate": 550.0,
        "top_requested_skills": ["Career Transitions", "Personal Financial Wisdom", "Life Mentoring"],
        "growth_trend": "+8% this week",
        "is_remote_friendly": True,
        "is_live_data": True
    },
    {
        "category": "Cooking & Tiffin",
        "location": "Chennai, Tamil Nadu",
        "demand_level": "High",
        "active_requests_count": 26,
        "average_hourly_rate": 320.0,
        "top_requested_skills": ["Filter Coffee Roasting", "Traditional Brahmin Sambar", "Idli/Dosa Batter", "Chettinad Specialties"],
        "growth_trend": "+20% this week",
        "is_remote_friendly": False,
        "is_live_data": True
    },
    {
        "category": "Tutoring & Mentoring",
        "location": "Bengaluru, Karnataka",
        "demand_level": "High",
        "active_requests_count": 31,
        "average_hourly_rate": 500.0,
        "top_requested_skills": ["Maths & Physics", "Spoken English & Communication", "Sanskrit & Hindi Basics"],
        "growth_trend": "+25% this week",
        "is_remote_friendly": True,
        "is_live_data": True
    }
]

# Baseline Persistent Live Opportunities Pool
DEFAULT_OPPORTUNITIES = [
    {
        "id": "opp-101",
        "title": "Weekend South Indian Tiffin & Filter Coffee Masterclass",
        "category": "Cooking & Tiffin",
        "customer_location": "Dadar West, Mumbai",
        "distance_km": 2.4,
        "budget_range": "₹1,200 - ₹2,000 / session",
        "posted_ago": "2 hours ago",
        "description": "Looking for an experienced senior home cook to guide a young working couple on authentic sambar, rasam, and traditional breakfast recipes.",
        "keywords": ["cook", "tiffin", "south indian", "recipe", "food", "kitchen", "coffee"],
        "demand_level": "High",
        "hours_alignment": "Weekend Mornings"
    },
    {
        "id": "opp-102",
        "title": "Patient Mathematics & Science Tuition (Class 7 & 8)",
        "category": "Tutoring & Mentoring",
        "customer_location": "Matunga Central, Mumbai",
        "distance_km": 1.8,
        "budget_range": "₹400 - ₹600 / hour",
        "posted_ago": "4 hours ago",
        "description": "Seeking a kind, experienced retired teacher for 3 days/week foundational algebra and geometry school tuition.",
        "keywords": ["teach", "tutor", "math", "tuition", "school", "science", "read"],
        "demand_level": "High",
        "hours_alignment": "Weekday Evenings"
    },
    {
        "id": "opp-103",
        "title": "Custom Saree Blouse Fitting & Festival Dress Stitching",
        "category": "Crafts & Tailoring",
        "customer_location": "Bandra East, Mumbai",
        "distance_km": 4.1,
        "budget_range": "₹500 - ₹800 / piece",
        "posted_ago": "1 day ago",
        "description": "Need an artisan tailor for 3 custom silk saree blouses with traditional hand piping and neck alteration for upcoming wedding.",
        "keywords": ["tailor", "sew", "stitching", "blouse", "saree", "craft", "embroidery"],
        "demand_level": "High",
        "hours_alignment": "Flexible"
    },
    {
        "id": "opp-104",
        "title": "Balcony Kitchen Garden Setup & Organic Plant Care",
        "category": "Gardening & Agriculture",
        "customer_location": "Chembur, Mumbai",
        "distance_km": 5.2,
        "budget_range": "₹800 - ₹1,500 / visit",
        "posted_ago": "3 hours ago",
        "description": "Looking for a seasoned gardener to help transplant vegetable saplings, advise on natural vermicompost, and potting soil mix.",
        "keywords": ["garden", "plant", "farming", "terrace", "organic", "vegetable"],
        "demand_level": "Medium",
        "hours_alignment": "Morning Slots"
    },
    {
        "id": "opp-105",
        "title": "Traditional Mango & Lime Pickle Batch Preparation",
        "category": "Cooking & Tiffin",
        "customer_location": "Prabhadevi, Mumbai",
        "distance_km": 3.0,
        "budget_range": "₹1,500 - ₹2,500 / batch",
        "posted_ago": "6 hours ago",
        "description": "Seeking expert grandmother/senior homemaker to prepare a 5 kg family batch of authentic traditional sun-dried mango pickles.",
        "keywords": ["pickle", "cook", "recipe", "food", "tiffin"],
        "demand_level": "High",
        "hours_alignment": "Weekday Daytime"
    },
    {
        "id": "opp-106",
        "title": "Weekly Organic Terrace Garden Maintenance & Pruning",
        "category": "Gardening & Agriculture",
        "customer_location": "Sion, Mumbai",
        "distance_km": 3.8,
        "budget_range": "₹1,000 - ₹1,800 / visit",
        "posted_ago": "1 day ago",
        "description": "Weekly visits to manage flowering plants, drip irrigation checks, and seasonal vegetable pruning.",
        "keywords": ["garden", "plant", "terrace", "organic", "pruning"],
        "demand_level": "Medium",
        "hours_alignment": "Weekend"
    }
]


@router.get("/demand-radar", response_model=DemandRadarResponse, summary="Local Demand Radar Insights")
def get_demand_radar(
    location: Optional[str] = Query(None, description="Filter by city/locality"),
    category: Optional[str] = Query(None, description="Filter by skill category"),
    demand_level: Optional[str] = Query(None, description="Filter by demand level ('High', 'Medium')"),
    is_remote: Optional[bool] = Query(None, description="Filter remote friendly"),
    db: Session = Depends(get_db)
):
    """
    Returns Local Demand Radar metrics across neighborhood categories in India.
    """
    items = DEMAND_RADAR_DATA

    if location and location != "All":
        items = [i for i in items if location.lower() in i["location"].lower()]
    if category and category != "All":
        items = [i for i in items if category.lower() in i["category"].lower()]
    if demand_level and demand_level != "All":
        items = [i for i in items if i["demand_level"].lower() == demand_level.lower()]
    if is_remote is not None:
        items = [i for i in items if i["is_remote_friendly"] == is_remote]

    high_count = sum(1 for i in items if i["demand_level"] == "High")

    return DemandRadarResponse(
        location_query=location,
        category_query=category,
        total_categories=len(items),
        high_demand_count=high_count,
        radar_items=[DemandRadarItem(**i) for i in items]
    )


@router.get("/feed", response_model=OpportunityFeedResponse, summary="Deterministic Opportunity Feed for Provider")
def get_opportunity_feed(
    provider_id: int = Query(1, description="Provider user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_score: Optional[float] = Query(None, description="Minimum match score filter"),
    db: Session = Depends(get_db)
):
    """
    Deterministic Opportunity Scoring Engine:
    Score = Skill (40%) + Location (20%) + Local Demand (15%) + Availability (10%) + Experience (10%) + Trust (5%).
    Gemini explains the match only, never modifies the score.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    skills_text = " ".join([s.title.lower() + " " + s.category.lower() for s in skills]) + " " + (provider.bio or "").lower()

    applied_interests = db.query(OpportunityInterest).filter(OpportunityInterest.provider_id == provider.id).all()
    applied_opp_ids = {interest.opportunity_id for interest in applied_interests}

    matched_opportunities: List[OpportunityItem] = []

    for opp in DEFAULT_OPPORTUNITIES:
        if category and category != "All" and category.lower() not in opp["category"].lower():
            continue

        # 1. Skill Match (40 pts)
        kw_matches = sum(1 for kw in opp["keywords"] if kw in skills_text)
        is_category_match = any(s.category.lower() in opp["category"].lower() for s in skills)
        
        skill_score = 0.0
        if is_category_match:
            skill_score += 25.0
        if kw_matches > 0:
            skill_score += min(15.0, kw_matches * 5.0)
        else:
            skill_score += 5.0

        # 2. Location Match (20 pts)
        dist = opp["distance_km"]
        if dist <= 2.5:
            loc_score = 20.0
        elif dist <= 5.0:
            loc_score = 15.0
        elif dist <= 10.0:
            loc_score = 10.0
        else:
            loc_score = 5.0

        # 3. Local Demand Match (15 pts)
        demand_score = 15.0 if opp.get("demand_level") == "High" else 10.0

        # 4. Availability / Hours Match (10 pts)
        avail_score = 10.0 if provider.availability else 6.0

        # 5. Experience Match (10 pts)
        max_exp = max([s.years_experience for s in skills], default=provider.age - 35 if provider.age else 10)
        if max_exp >= 20:
            exp_score = 10.0
        elif max_exp >= 10:
            exp_score = 8.0
        else:
            exp_score = 6.0

        # 6. Trust & Badge Match (5 pts)
        trust_score = 5.0 if (provider.trust_badge_level or "").startswith("verified") else 3.0

        total_score = round(skill_score + loc_score + demand_score + avail_score + exp_score + trust_score, 1)
        total_score = min(99.0, max(50.0, total_score))

        if min_score and total_score < min_score:
            continue

        # Build Verified Reasons Checklist
        reasons = []
        if is_category_match:
            reasons.append(f"✓ Strong {opp['category']} Skill Match")
        if dist <= 3.5:
            reasons.append(f"✓ Nearby Distance ({dist} km away)")
        else:
            reasons.append(f"✓ In Service Area ({dist} km)")
        if opp.get("demand_level") == "High":
            reasons.append("✓ High Neighborhood Demand")
        if max_exp >= 10:
            reasons.append(f"✓ {max_exp}+ Years Verified Experience")
        if (provider.completed_services_count or 0) >= 1:
            reasons.append("✓ Platform Verified Track Record")

        matched_opportunities.append(OpportunityItem(
            id=opp["id"],
            title=opp["title"],
            category=opp["category"],
            customer_location=opp["customer_location"],
            distance_km=opp["distance_km"],
            budget_range=opp["budget_range"],
            match_score=total_score,
            match_reasons=reasons,
            posted_ago=opp["posted_ago"],
            description=opp["description"],
            is_applied=opp["id"] in applied_opp_ids
        ))

    # Sort by highest match score
    matched_opportunities.sort(key=lambda x: x.match_score, reverse=True)

    return OpportunityFeedResponse(
        provider_id=provider.id,
        opportunities=matched_opportunities,
        total=len(matched_opportunities)
    )


@router.post("/{opportunity_id}/interest", response_model=OpportunityInterestResponse, summary="Express Interest in Opportunity")
def express_interest(
    opportunity_id: str,
    provider_id: int = Query(1, description="Provider ID expressing interest"),
    db: Session = Depends(get_db)
):
    """
    Express interest lifecycle:
    Validates provider, checks for duplicate submissions, persists interest, returns formatted confirmation.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    existing = db.query(OpportunityInterest).filter(
        OpportunityInterest.provider_id == provider_id,
        OpportunityInterest.opportunity_id == opportunity_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already expressed interest in this opportunity."
        )

    new_interest = OpportunityInterest(
        opportunity_id=opportunity_id,
        provider_id=provider_id,
        status="applied",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_interest)
    db.commit()
    db.refresh(new_interest)

    return OpportunityInterestResponse(
        success=True,
        message="Interest sent successfully! The customer will be notified and can view your Skill Passport.",
        opportunity_id=opportunity_id,
        provider_id=provider_id,
        is_applied=True,
        applied_at=new_interest.created_at.isoformat()
    )


@router.get("/{opportunity_id}/interests", summary="List Interested Providers for an Opportunity")
def list_interested_providers(opportunity_id: str, db: Session = Depends(get_db)):
    """
    Allows opportunity owner to view all providers who expressed interest.
    """
    interests = db.query(OpportunityInterest).filter(
        OpportunityInterest.opportunity_id == opportunity_id
    ).order_by(OpportunityInterest.created_at.desc()).all()

    results = []
    for item in interests:
        p = item.provider
        if p:
            skills = db.query(Skill).filter(Skill.user_id == p.id).all()
            results.append({
                "interest_id": item.id,
                "provider_id": p.id,
                "full_name": p.full_name,
                "avatar_url": p.avatar_url,
                "user_type": p.user_type,
                "location_name": p.location_name,
                "rating": 5.0 if not p.reviews_received else round(sum(r.rating for r in p.reviews_received) / len(p.reviews_received), 1),
                "completed_services_count": p.completed_services_count or 0,
                "trust_badge_level": p.trust_badge_level or "verified_senior",
                "skills": [s.title for s in skills],
                "status": item.status,
                "applied_at": item.created_at.isoformat() if item.created_at else ""
            })
    return {"opportunity_id": opportunity_id, "interested_providers": results, "total": len(results)}


@router.post("/{opportunity_id}/interests/{interest_id}/accept", summary="Accept Interested Provider & Create Booking")
def accept_provider_interest(
    opportunity_id: str,
    interest_id: int,
    customer_id: int = Query(2, description="Customer user ID"),
    db: Session = Depends(get_db)
):
    """
    Full lifecycle integration:
    Accepts provider interest -> updates interest to 'accepted' -> creates confirmed Booking record.
    """
    interest = db.query(OpportunityInterest).filter(
        OpportunityInterest.id == interest_id,
        OpportunityInterest.opportunity_id == opportunity_id
    ).first()
    if not interest:
        raise HTTPException(status_code=404, detail="Interest record not found")

    interest.status = "accepted"

    # Find matching service or default service for provider
    provider = interest.provider
    service = db.query(ServiceListing).filter(ServiceListing.provider_id == provider.id).first()
    service_id = service.id if service else 1
    total_price = service.price_per_hour * 2.0 if service else 700.0

    # Create confirmed Booking
    new_booking = Booking(
        customer_id=customer_id,
        provider_id=provider.id,
        service_id=service_id,
        status="confirmed",
        total_price=total_price,
        scheduled_date=(datetime.datetime.utcnow() + datetime.timedelta(days=2)).strftime("%Y-%m-%d 10:00 AM"),
        notes=f"Accepted via Opportunity {opportunity_id}",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return {
        "success": True,
        "message": f"Provider {provider.full_name} accepted! Booking #{new_booking.id} confirmed.",
        "booking_id": new_booking.id,
        "opportunity_id": opportunity_id,
        "provider_id": provider.id,
        "status": "confirmed"
    }


@router.get("/provider/{provider_id}/my-opportunities", summary="Get Provider's Tracked Opportunities")
def get_my_opportunities(provider_id: int, db: Session = Depends(get_db)):
    """
    Returns list of opportunities provider applied to or was accepted for.
    """
    interests = db.query(OpportunityInterest).filter(
        OpportunityInterest.provider_id == provider_id
    ).order_by(OpportunityInterest.created_at.desc()).all()

    applied_map = {item.opportunity_id: item.status for item in interests}

    results = []
    for opp in DEFAULT_OPPORTUNITIES:
        if opp["id"] in applied_map:
            results.append({
                **opp,
                "interest_status": applied_map[opp["id"]],
                "is_applied": True
            })

    return {
        "provider_id": provider_id,
        "my_opportunities": results,
        "total": len(results)
    }
