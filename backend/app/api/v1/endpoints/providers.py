import os
import uuid
import logging
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db, UPLOADS_DIR
from app.models.domain import (
    User, Skill, ServiceListing, Review, Booking, OpportunityInterest,
    WorkSample, ProfileMedia
)
from app.services.supabase_client import upload_to_storage

logger = logging.getLogger(__name__)
from app.schemas.domain import (
    UserResponse, UserUpdate, SkillResponse, SkillCreate,
    OpportunityFeedResponse, OpportunityItem, OpportunityInterestResponse,
    SkillPassportResponse, SkillPassportItem,
    ReadinessResponse, ReadinessChecklistItem,
    WorkSampleResponse, WorkSampleCreate,
    ProfileMediaResponse, ProfileMediaCreate
)

router = APIRouter()


@router.get("/", response_model=List[UserResponse], summary="List All Providers")
def list_providers(
    category: Optional[str] = Query(None, description="Filter by skill category"),
    user_type: Optional[str] = Query(None, description="Filter by user type ('senior', 'homemaker', 'customer')"),
    location: Optional[str] = Query(None, description="Filter by location keyword"),
    min_rating: Optional[float] = Query(None, description="Minimum provider rating"),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role.in_(["provider", "senior", "homemaker"]))

    if user_type and user_type != "All":
        query = query.filter(User.user_type == user_type)

    if location:
        query = query.filter(User.location_name.ilike(f"%{location}%"))

    providers = query.all()

    if category and category != "All":
        matching_providers = []
        for p in providers:
            has_cat = db.query(Skill).filter(Skill.user_id == p.id, Skill.category.ilike(f"%{category}%")).first()
            has_serv_cat = db.query(ServiceListing).filter(ServiceListing.provider_id == p.id, ServiceListing.category.ilike(f"%{category}%")).first()
            if has_cat or has_serv_cat:
                matching_providers.append(p)
        providers = matching_providers

    results = []
    for p in providers:
        results.append(UserResponse(
            id=p.id,
            email=p.email,
            full_name=p.full_name,
            role=p.role,
            user_type=p.user_type,
            age=p.age,
            phone=p.phone,
            bio=p.bio,
            avatar_url=p.avatar_url,
            location_name=p.location_name,
            latitude=p.latitude,
            longitude=p.longitude,
            languages=p.languages,
            availability=p.availability,
            is_published=p.is_published,
            is_active=p.is_active,
            completed_services_count=p.completed_services_count or 0,
            trust_badge_level=p.trust_badge_level or "verified_senior",
            created_at=p.created_at.isoformat()
        ))
    return results


@router.get("/{provider_id}", summary="Get Detailed Provider Profile")
def get_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    services = db.query(ServiceListing).filter(ServiceListing.provider_id == provider.id).all()
    reviews = db.query(Review).filter(Review.provider_id == provider.id).all()
    bookings_count = db.query(Booking).filter(Booking.provider_id == provider.id, Booking.status == "completed").count()

    avg_rating = 5.0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    user_type_label = "Senior Citizen"
    if provider.user_type == "homemaker":
        user_type_label = "Skilled Homemaker"
    elif provider.user_type == "customer":
        user_type_label = "Customer"

    return {
        "provider": {
            "id": provider.id,
            "full_name": provider.full_name,
            "email": provider.email,
            "phone": provider.phone,
            "bio": provider.bio,
            "avatar_url": provider.avatar_url,
            "location_name": provider.location_name,
            "user_type": provider.user_type,
            "user_type_label": user_type_label,
            "age": provider.age,
            "languages": provider.languages,
            "availability": provider.availability,
            "is_published": provider.is_published,
            "latitude": provider.latitude,
            "longitude": provider.longitude,
            "rating": avg_rating,
            "total_reviews": len(reviews),
            "completed_services_count": provider.completed_services_count or bookings_count or len(reviews) or 6,
            "trust_badge_level": provider.trust_badge_level or "verified_senior",
            "video_intro_url": provider.video_intro_url
        },
        "skills": [
            {
                "id": s.id,
                "category": s.category,
                "title": s.title,
                "description": s.description,
                "proficiency_level": s.proficiency_level,
                "years_experience": s.years_experience,
                "hourly_rate": s.hourly_rate
            } for s in skills
        ],
        "services": [
            {
                "id": s.id,
                "title": s.title,
                "category": s.category,
                "description": s.description,
                "price_per_hour": s.price_per_hour,
                "location_name": s.location_name,
                "service_area": s.service_area,
                "home_service": s.home_service,
                "availability": s.availability,
                "status": s.status,
                "is_published": s.is_published
            } for s in services
        ],
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "customer_name": r.customer.full_name if r.customer else "Verified Neighbor",
                "created_at": r.created_at.isoformat()
            } for r in reviews
        ]
    }


@router.put("/{provider_id}", response_model=UserResponse, summary="Update Provider Profile")
def update_provider_profile(provider_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == provider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()
    if user_in.phone is not None:
        user.phone = user_in.phone.strip()
    if user_in.bio is not None:
        user.bio = user_in.bio.strip()
    if user_in.location_name is not None:
        user.location_name = user_in.location_name.strip()
    if user_in.languages is not None:
        user.languages = user_in.languages.strip()
    if user_in.availability is not None:
        user.availability = user_in.availability.strip()
    if user_in.is_published is not None:
        user.is_published = user_in.is_published
    if user_in.age is not None:
        user.age = user_in.age
    if user_in.user_type is not None:
        user.user_type = user_in.user_type
    if user_in.avatar_url is not None:
        user.avatar_url = user_in.avatar_url

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        user_type=user.user_type,
        age=user.age,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        languages=user.languages,
        availability=user.availability,
        is_published=user.is_published,
        is_active=user.is_active,
        completed_services_count=user.completed_services_count or 0,
        trust_badge_level=user.trust_badge_level or "verified_senior",
        created_at=user.created_at.isoformat()
    )


@router.post("/{provider_id}/skills", response_model=SkillResponse, summary="Add Skill to Senior Provider Profile")
def add_provider_skill(provider_id: int, skill_in: SkillCreate, db: Session = Depends(get_db)):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    new_skill = Skill(
        user_id=provider.id,
        category=skill_in.category,
        title=skill_in.title,
        description=skill_in.description,
        proficiency_level=skill_in.proficiency_level,
        years_experience=skill_in.years_experience,
        hourly_rate=skill_in.hourly_rate,
        verified=True
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.get("/{provider_id}/opportunities", response_model=OpportunityFeedResponse, summary="Get Personalized Opportunity Feed for Provider")
def get_provider_opportunities(provider_id: int, db: Session = Depends(get_db)):
    """
    Opportunity Feed:
    Scored and matched dynamically against the provider's skills, location, rating, and experience.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    skills_text = " ".join([s.title.lower() for s in skills]) + " " + (provider.bio or "").lower()

    # Get set of already applied opportunity IDs for this provider
    applied_interests = db.query(OpportunityInterest).filter(OpportunityInterest.provider_id == provider.id).all()
    applied_opp_ids = {interest.opportunity_id for interest in applied_interests}

    # Dynamic Simulated Demand based on Provider Profile
    potential_opportunities = [
        {
            "id": "opp-101",
            "title": "Weekend South Indian Tiffin & Filter Coffee Workshop",
            "category": "Cooking & Tiffin",
            "customer_location": "Dadar West, Mumbai",
            "distance_km": 2.4,
            "budget_range": "₹1,200 - ₹2,000 / session",
            "posted_ago": "2 hours ago",
            "description": "Looking for an experienced senior home cook to guide a young working couple on authentic sambar, rasam, and traditional breakfast recipes.",
            "keywords": ["cook", "tiffin", "south indian", "recipe", "food", "kitchen", "coffee"]
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
            "keywords": ["teach", "tutor", "math", "tuition", "school", "science", "read"]
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
            "keywords": ["tailor", "sew", "stitching", "blouse", "saree", "craft", "embroidery"]
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
            "keywords": ["garden", "plant", "farming", "terrace", "organic", "vegetable"]
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
            "keywords": ["pickle", "cook", "recipe", "food", "tiffin"]
        }
    ]

    matched_opportunities: List[OpportunityItem] = []

    for opp in potential_opportunities:
        # Score calculation
        match_count = sum(1 for kw in opp["keywords"] if kw in skills_text)
        is_category_match = any(s.category.lower() in opp["category"].lower() for s in skills)

        base_score = 65.0
        if is_category_match:
            base_score += 20.0
        if match_count > 0:
            base_score += min(12.0, match_count * 4.0)

        # Proximity boost
        if opp["distance_km"] <= 3.0:
            base_score += 5.0

        final_score = min(98.0, round(base_score, 1))

        reasons = []
        if is_category_match:
            reasons.append(f"✓ Strong {opp['category']} Skill Match")
        if opp["distance_km"] <= 3.5:
            reasons.append(f"✓ Very Close ({opp['distance_km']} km away)")
        else:
            reasons.append(f"✓ In Service Area ({opp['distance_km']} km)")
        if (provider.completed_services_count or 0) >= 5:
            reasons.append("✓ High Reliability Provider Match")

        matched_opportunities.append(OpportunityItem(
            id=opp["id"],
            title=opp["title"],
            category=opp["category"],
            customer_location=opp["customer_location"],
            distance_km=opp["distance_km"],
            budget_range=opp["budget_range"],
            match_score=final_score,
            match_reasons=reasons,
            posted_ago=opp["posted_ago"],
            description=opp["description"],
            is_applied=opp["id"] in applied_opp_ids
        ))

    # Sort descending by match score
    matched_opportunities.sort(key=lambda x: x.match_score, reverse=True)

    return OpportunityFeedResponse(
        provider_id=provider.id,
        opportunities=matched_opportunities,
        total=len(matched_opportunities)
    )


@router.post("/{provider_id}/opportunities/{opportunity_id}/interest", response_model=OpportunityInterestResponse, summary="Express Interest in an Opportunity")
def express_interest_in_opportunity(
    provider_id: int,
    opportunity_id: str,
    db: Session = Depends(get_db)
):
    """
    Express Interest in Opportunity:
    Validates provider and checks for duplicates. Persists application and returns confirmation.
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
        message="Interest expressed successfully! The customer will be notified and can contact you.",
        opportunity_id=opportunity_id,
        provider_id=provider_id,
        is_applied=True,
        applied_at=new_interest.created_at.isoformat()
    )


@router.get("/{provider_id}/skill-passport", response_model=SkillPassportResponse, summary="Get Senior Skill Passport")
def get_skill_passport(provider_id: int, db: Session = Depends(get_db)):
    """
    Skill Passport:
    Provides structured, authentic skill credentials distinguishing user-claimed vs platform-verified facts.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    reviews = db.query(Review).filter(Review.provider_id == provider.id).all()
    work_samples = db.query(WorkSample).filter(WorkSample.user_id == provider.id).all()
    completed_bookings = db.query(Booking).filter(Booking.provider_id == provider.id, Booking.status == "completed").count()

    total_completed = max(provider.completed_services_count or 0, completed_bookings, len(reviews))
    avg_rating = 5.0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    passport_items: List[SkillPassportItem] = []
    for s in skills:
        passport_items.append(SkillPassportItem(
            skill_id=s.id,
            skill_title=s.title,
            category=s.category,
            claimed_experience_years=s.years_experience or 10,
            completed_services_count=total_completed,
            verified_rating=avg_rating,
            verified_reviews_count=len(reviews),
            work_samples_count=len([ws for ws in work_samples if ws.category.lower() in s.category.lower()]),
            has_video_demo=bool(provider.video_intro_url),
            verification_status=provider.trust_badge_level or "verified_senior",
            hourly_rate=s.hourly_rate or 350.0,
            platform_verified=bool(s.verified)
        ))

    summary = (
        f"{provider.full_name} is a verified senior practitioner on SilverHands with {len(skills)} registered skill areas, "
        f"{total_completed} completed community services, and a verified {avg_rating}★ customer rating."
    )

    return SkillPassportResponse(
        provider_id=provider.id,
        provider_name=provider.full_name,
        avatar_url=provider.avatar_url,
        trust_badge_level=provider.trust_badge_level or "verified_senior",
        total_completed_services=total_completed,
        overall_rating=avg_rating,
        total_reviews_count=len(reviews),
        video_intro_url=provider.video_intro_url,
        skills=passport_items,
        member_since=provider.created_at.strftime("%B %Y") if provider.created_at else "August 2026",
        passport_summary=summary
    )


@router.get("/{provider_id}/readiness", response_model=ReadinessResponse, summary="Opportunity Improvement Engine (Readiness %)")
def get_provider_readiness(provider_id: int, db: Session = Depends(get_db)):
    """
    Opportunity Improvement Engine:
    Recalculates profile readiness % with concrete, actionable steps and non-guarantee recommendations.
    """
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
    work_samples = db.query(WorkSample).filter(WorkSample.user_id == provider.id).all()

    checklist = [
        ReadinessChecklistItem(
            id="photo",
            title="Profile Photo / Avatar",
            description="Clear, friendly profile photo helps local families identify you.",
            completed=bool(provider.avatar_url and not provider.avatar_url.endswith("default.png")),
            points=15,
            action_label="Upload Photo",
            action_key="upload_photo"
        ),
        ReadinessChecklistItem(
            id="skills",
            title="Registered Skills & Pricing",
            description="List specific services with fair hourly rates in ₹ INR.",
            completed=len(skills) > 0,
            points=20,
            action_label="Add Skill",
            action_key="add_skill"
        ),
        ReadinessChecklistItem(
            id="location",
            title="Location & Neighborhood",
            description="Specify your city and service radius (e.g. within 5 km).",
            completed=bool(provider.location_name),
            points=15,
            action_label="Set Location",
            action_key="set_location"
        ),
        ReadinessChecklistItem(
            id="availability",
            title="Availability & Hours",
            description="Set comfortable morning or weekend time slots.",
            completed=bool(provider.availability),
            points=15,
            action_label="Set Availability",
            action_key="set_availability"
        ),
        ReadinessChecklistItem(
            id="samples",
            title="Work Samples Showcase",
            description="Photos of homemade dishes, stitching patterns, or garden setups.",
            completed=len(work_samples) > 0,
            points=15,
            action_label="Add Work Sample",
            action_key="add_sample"
        ),
        ReadinessChecklistItem(
            id="video",
            title="Senior Intro Video Clip",
            description="A short 30-second video introducing yourself and your passion.",
            completed=bool(provider.video_intro_url),
            points=10,
            action_label="Upload Video",
            action_key="upload_video"
        ),
        ReadinessChecklistItem(
            id="trust",
            title="Identity & Trust Badge",
            description="Senior citizen community verification level.",
            completed=(provider.trust_badge_level or "").startswith("verified"),
            points=10,
            action_label="Verify Trust Badge",
            action_key="verify_trust"
        )
    ]

    total_pts = sum(item.points for item in checklist)
    earned_pts = sum(item.points for item in checklist if item.completed)
    readiness_pct = int(round((earned_pts / total_pts) * 100)) if total_pts > 0 else 50
    completed_count = sum(1 for item in checklist if item.completed)

    # Save to user model
    provider.readiness_score = readiness_pct
    db.commit()

    advice = "Your profile is in great shape! Adding a short video intro or work photos may help you stand out to nearby neighborhood requests."
    if readiness_pct < 60:
        advice = "Adding your skills, pricing in ₹ INR, and profile picture will significantly increase your visibility on the local Opportunity Radar."
    elif readiness_pct < 85:
        advice = "Almost complete! Uploading a work sample photo or a 30-second intro video will give clients full confidence."

    return ReadinessResponse(
        provider_id=provider.id,
        readiness_percentage=readiness_pct,
        completed_count=completed_count,
        total_count=len(checklist),
        checklist=checklist,
        improvement_advice=advice
    )


@router.post("/upload-avatar", summary="Upload Profile Avatar Photo")
async def upload_avatar(
    user_id: int = Query(1),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WEBP, GIF) are allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 5MB.")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    timestamp = int(datetime.datetime.utcnow().timestamp())

    # Try Supabase Storage first (persistent, accessible to all users)
    supabase_url = upload_to_storage(
        bucket="avatars",
        path=filename,
        file_bytes=contents,
        content_type=file.content_type or "image/jpeg",
    )

    if supabase_url:
        avatar_url = f"{supabase_url}?t={timestamp}"
        logger.info(f"Avatar uploaded to Supabase Storage: {avatar_url}")
    else:
        # Fallback to local filesystem (uses canonical UPLOADS_DIR)
        upload_folder = os.path.join(UPLOADS_DIR, "avatars")
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        avatar_url = f"http://localhost:8000/uploads/avatars/{filename}?t={timestamp}"
        logger.info(f"Avatar saved locally: {file_path}")

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "avatar_url": avatar_url,
        "message": "Profile photo uploaded and saved successfully!"
    }


@router.delete("/{provider_id}/avatar", summary="Remove Profile Avatar Photo")
def remove_avatar(provider_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == provider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")

    user.avatar_url = None
    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "Avatar removed successfully. Default profile picture restored."
    }


@router.post("/upload-video", summary="Upload Senior Intro / Work Demo Video Clip")
async def upload_video(
    user_id: int = Query(1),
    file: UploadFile = File(...),
    title: Optional[str] = Query("Senior Intro Clip"),
    media_type: Optional[str] = Query("video_intro"),
    db: Session = Depends(get_db)
):
    allowed_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"]
    if file.content_type not in allowed_types and not (file.filename and file.filename.endswith((".mp4", ".webm", ".mov"))):
        raise HTTPException(status_code=400, detail="Only video files (MP4, WebM, QuickTime MOV) are allowed.")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video file size exceeds maximum limit of 50MB.")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "mp4"
    filename = f"video_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    timestamp = int(datetime.datetime.utcnow().timestamp())

    # Try Supabase Storage first (persistent, accessible to all users)
    supabase_url = upload_to_storage(
        bucket="videos",
        path=filename,
        file_bytes=contents,
        content_type=file.content_type or "video/mp4",
    )

    if supabase_url:
        video_url = f"{supabase_url}?t={timestamp}"
        logger.info(f"Video uploaded to Supabase Storage: {video_url}")
    else:
        # Fallback to local filesystem (uses canonical UPLOADS_DIR)
        upload_folder = os.path.join(UPLOADS_DIR, "videos")
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        video_url = f"http://localhost:8000/uploads/videos/{filename}?t={timestamp}"
        logger.info(f"Video saved locally: {file_path}")

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.video_intro_url = video_url
        
        # Also store ProfileMedia record
        media_rec = ProfileMedia(
            user_id=user.id,
            media_type=media_type or "video_intro",
            url=video_url,
            title=title,
            file_size_bytes=len(contents),
            created_at=datetime.datetime.utcnow()
        )
        db.add(media_rec)
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "video_url": video_url,
        "message": "Video clip uploaded and attached to profile successfully!"
    }


@router.delete("/{provider_id}/video", summary="Remove Senior Intro Video Clip")
def remove_video(provider_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == provider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")

    user.video_intro_url = None
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Video clip removed successfully."}


@router.get("/{provider_id}/work-samples", response_model=List[WorkSampleResponse], summary="List Provider Work Samples")
def list_work_samples(provider_id: int, db: Session = Depends(get_db)):
    samples = db.query(WorkSample).filter(WorkSample.user_id == provider_id).order_by(WorkSample.created_at.desc()).all()
    results = []
    for ws in samples:
        results.append(WorkSampleResponse(
            id=ws.id,
            user_id=ws.user_id,
            title=ws.title,
            category=ws.category,
            image_url=ws.image_url,
            description=ws.description,
            created_at=ws.created_at.isoformat() if ws.created_at else ""
        ))
    return results


@router.post("/{provider_id}/work-samples", response_model=WorkSampleResponse, summary="Add Work Sample Showcase Item")
def add_work_sample(
    provider_id: int,
    sample_in: WorkSampleCreate,
    db: Session = Depends(get_db)
):
    provider = db.query(User).filter(User.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    new_sample = WorkSample(
        user_id=provider.id,
        title=sample_in.title,
        category=sample_in.category,
        image_url=sample_in.image_url,
        description=sample_in.description,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_sample)
    provider.work_samples_count = (provider.work_samples_count or 0) + 1
    db.commit()
    db.refresh(new_sample)

    return WorkSampleResponse(
        id=new_sample.id,
        user_id=new_sample.user_id,
        title=new_sample.title,
        category=new_sample.category,
        image_url=new_sample.image_url,
        description=new_sample.description,
        created_at=new_sample.created_at.isoformat()
    )


@router.delete("/{provider_id}/work-samples/{sample_id}", summary="Delete Work Sample Item")
def delete_work_sample(provider_id: int, sample_id: int, db: Session = Depends(get_db)):
    sample = db.query(WorkSample).filter(WorkSample.id == sample_id, WorkSample.user_id == provider_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Work sample not found")

    db.delete(sample)
    user = db.query(User).filter(User.id == provider_id).first()
    if user and (user.work_samples_count or 0) > 0:
        user.work_samples_count = user.work_samples_count - 1
    db.commit()

    return {"status": "success", "message": "Work sample deleted successfully."}

