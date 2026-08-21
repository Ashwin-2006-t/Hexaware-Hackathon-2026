import os
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.domain import ProviderProfile, ServiceRequest, Match
from app.services.matching_service import calculate_match_score
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def generate_match_explanation_fallback(reasons: List[str], provider_name: str, title: str) -> str:
    """
    Deterministic rule-based explanation synthesis when Gemini API is unavailable or quota is exceeded.
    """
    if reasons:
        bulleted = "\n".join([f"✓ {r.replace('✓ ', '').strip()}" for r in reasons if r])
        return f"Matched because:\n{bulleted}"
    return f"Matched because:\n✓ Same service category\n✓ Provider location is nearby\n✓ Skills match customer requirement"

def rank_and_explain_matches(
    db: Session,
    request: ServiceRequest,
    providers: List[ProviderProfile],
    radius_km: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Ranks providers using the deterministic matching engine and synthesizes explanations.
    """
    results = []

    for provider in providers:
        if provider.status and provider.status != "PUBLISHED":
            continue

        user = provider.user
        skills = [s.name for s in provider.skills]
        services = [srv.name for srv in provider.services]
        
        category = "General"
        if provider.services and provider.services[0].category:
            category = provider.services[0].category
        elif provider.skills and provider.skills[0].category:
            category = provider.skills[0].category

        p_lat = provider.latitude if provider.latitude is not None else (user.latitude if user and user.latitude is not None else None)
        p_lon = provider.longitude if provider.longitude is not None else (user.longitude if user and user.longitude is not None else None)

        match_data = calculate_match_score(
            request_title=request.title,
            request_description=request.description,
            request_category=request.category,
            request_lat=request.latitude,
            request_lon=request.longitude,
            provider_title=provider.title or "Provider",
            provider_bio=provider.bio or "",
            provider_skills=skills,
            provider_services=services,
            provider_category=category,
            experience_years=provider.experience_years,
            availability=provider.availability,
            rating=provider.rating or 0.0,
            provider_lat=p_lat,
            provider_lon=p_lon,
            radius_km=radius_km
        )

        provider_name = user.name if user else "SilverHands Provider"
        title = provider.title or "Skilled Provider"

        if match_data['score'] == 0.0:
            continue

        # Generate natural language explanation (Rule-Based Fallback for Instant Search Speed)
        explanation = generate_match_explanation_fallback(match_data['reasons'], provider_name, title)

        results.append({
            "request_id": request.id,
            "provider_id": provider.id,
            "score": match_data['score'],
            "distance_km": match_data['distance_km'],
            "matched_skills": match_data['matched_skills'],
            "reasons": match_data['reasons'],
            "explanation": explanation,
            "provider": provider
        })

    # Sort descending by score
    results.sort(key=lambda x: x['score'], reverse=True)

    return results
