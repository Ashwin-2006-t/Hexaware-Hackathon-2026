from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.domain import ServiceListing, User, Skill, Review
from app.schemas.domain import (
    SkillExtractionRequest, SkillExtractionResponse, ExtractedSkillItem,
    SmartMatchRequest, SmartMatchResponse, MatchProviderResult,
    AssistantChatRequest, AssistantChatResponse
)
from app.services.ai_service import (
    extract_skills_from_text, generate_match_explanation, generate_senior_mentor_response
)
from app.services.matching_service import calculate_haversine_distance, calculate_match_score

router = APIRouter()

@router.post("/extract-skills", response_model=SkillExtractionResponse, summary="AI Skill & Profile Builder Agent")
def extract_skills_endpoint(payload: SkillExtractionRequest):
    """
    Skill & Profile AI Agent endpoint:
    Parses plain natural language spoken or typed by senior citizens to create structured skill items,
    fair pricing recommendations, and warm biography copy.
    """
    if not payload.raw_prompt or len(payload.raw_prompt.strip()) < 5:
        raise HTTPException(status_code=400, detail="Please provide a descriptive text about your skills and hobbies.")

    result = extract_skills_from_text(payload.raw_prompt, payload.preferred_category)
    
    skills_items = [
        ExtractedSkillItem(
            title=item["title"],
            category=item["category"],
            proficiency_level=item.get("proficiency_level", "Master"),
            years_experience=item.get("years_experience", 20),
            suggested_hourly_rate=item.get("suggested_hourly_rate", 30.0),
            suggested_bio=item.get("suggested_bio", ""),
            key_highlights=item.get("key_highlights", ["Decades of Hands-on Experience"])
        ) for item in result.get("skills", [])
    ]

    return SkillExtractionResponse(
        success=True,
        skills=skills_items,
        generated_profile_bio=result.get("generated_profile_bio", ""),
        ai_mentor_tip=result.get("ai_mentor_tip", "Starting with a friendly rate helps build your initial 5-star review history!")
    )


@router.post("/smart-match", response_model=SmartMatchResponse, summary="Deterministic & AI Smart Match Engine")
def smart_match_endpoint(payload: SmartMatchRequest, db: Session = Depends(get_db)):
    """
    Smart Matching Agent:
    Evaluates senior providers using 5 deterministic weighted factors (Skill 40%, Distance 25%, Rating 15%, Experience 10%, Availability 10%)
    and attaches humanized AI rationale explaining top matches to customers.
    """
    services = db.query(ServiceListing).filter(ServiceListing.status == "active").all()
    matches: List[MatchProviderResult] = []

    cust_lat = payload.customer_latitude or 37.7749
    cust_lng = payload.customer_longitude or -122.4194

    for service in services:
        provider = db.query(User).filter(User.id == service.provider_id).first()
        if not provider:
            continue

        prov_lat = service.latitude or provider.latitude or 37.7749
        prov_lng = service.longitude or provider.longitude or -122.4194

        distance = calculate_haversine_distance(cust_lat, cust_lng, prov_lat, prov_lng)
        if payload.max_distance_km and distance > payload.max_distance_km:
            continue

        skills = db.query(Skill).filter(Skill.user_id == provider.id).all()
        skills_titles = [s.title for s in skills] or [service.title]
        years_exp = max([s.years_experience for s in skills], default=15)

        reviews = db.query(Review).filter(Review.provider_id == provider.id).all()
        avg_rating = 5.0
        if reviews:
            avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

        score_res = calculate_match_score(
            service_query=payload.service_query,
            target_category=payload.category or "",
            service_title=service.title,
            service_category=service.category,
            service_description=service.description,
            distance_km=distance,
            provider_rating=avg_rating,
            years_experience=years_exp,
            max_distance_km=payload.max_distance_km or 25.0
        )

        ai_reason = generate_match_explanation(
            customer_query=payload.service_query,
            provider_name=provider.full_name,
            service_title=service.title,
            category=service.category,
            distance_km=distance,
            match_score=score_res["total_score"],
            years_experience=years_exp,
            rating=avg_rating
        )

        matches.append(MatchProviderResult(
            provider_id=provider.id,
            provider_name=provider.full_name,
            provider_avatar=provider.avatar_url,
            service_id=service.id,
            service_title=service.title,
            category=service.category,
            price_per_hour=service.price_per_hour,
            location_name=service.location_name or provider.location_name or "Nearby",
            distance_km=distance,
            match_score=score_res["total_score"],
            skills=skills_titles,
            rating=avg_rating,
            years_experience=years_exp,
            ai_reasoning=ai_reason
        ))

    # Sort descending by match score
    matches.sort(key=lambda x: x.match_score, reverse=True)

    return SmartMatchResponse(
        query=payload.service_query,
        top_matches=matches[:10],
        total_found=len(matches)
    )


@router.post("/assistant", response_model=AssistantChatResponse, summary="Senior Business Mentor AI Assistant")
def assistant_chat_endpoint(payload: AssistantChatRequest):
    """
    Assistant / Business Agent endpoint:
    A senior-friendly AI assistant giving practical pricing advice, safety guidelines, and platform walkthroughs.
    """
    if not payload.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    res = generate_senior_mentor_response(payload.message, payload.user_context or "senior_provider")
    return AssistantChatResponse(
        reply=res["reply"],
        suggested_actions=res["suggested_actions"]
    )
