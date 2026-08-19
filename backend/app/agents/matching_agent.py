import os
from typing import List, Dict, Any
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
    providers: List[ProviderProfile]
) -> List[Dict[str, Any]]:
    """
    Ranks providers using the deterministic matching engine and synthesizes explanations.
    """
    results = []

    for provider in providers:
        user = provider.user
        skills = [s.name for s in provider.skills]
        services = [srv.name for srv in provider.services]
        category = provider.skills[0].category if provider.skills else "General"

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
            rating=provider.rating,
            provider_lat=user.latitude if user else None,
            provider_lon=user.longitude if user else None
        )

        provider_name = user.name if user else "SilverHands Provider"
        title = provider.title or "Skilled Provider"

        # Generate natural language explanation (Gemini or Rule-Based Fallback)
        explanation = None
        if GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = f"""
Synthesize a short, 1-2 sentence explanation of why this provider matches the customer request.
Customer Request: "{request.title} - {request.description}"
Provider: {provider_name} ({title})
Matched Reasons: {match_data['reasons']}
Distance: {match_data['distance_km']} km
Match Percentage: {match_data['score']}%

Keep it friendly, clear, and reassuring.
"""
                response = client.models.generate_content(
                    model="models/gemini-3.6-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.2)
                )
                if response and response.text:
                    explanation = response.text.strip()
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(f"[MatchingAgent] Gemini unavailable (429 RESOURCE_EXHAUSTED), using rule-based explanation fallback.")
                else:
                    print(f"[MatchingAgent] Gemini unavailable ({e}), using rule-based explanation fallback.")

        if match_data['score'] == 0.0:
            continue

        if not explanation:
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
