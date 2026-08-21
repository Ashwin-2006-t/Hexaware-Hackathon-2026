import math
from typing import List, Dict, Any, Optional

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in kilometers between two GPS coordinates using Haversine formula."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 3.5  # Default distance in km for local neighborhood

    R = 6371.0  # Radius of Earth in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def calculate_match_score(
    service_query: str,
    target_category: Optional[str],
    service_title: str,
    service_category: str,
    service_description: str,
    distance_km: float,
    provider_rating: float,
    years_experience: int,
    completed_services_count: int = 5,
    is_verified: bool = True,
    max_distance_km: float = 25.0,
    price_per_hour: float = 350.0
) -> Dict[str, Any]:
    """
    SilverHands 5-Factor Deterministic Match Scoring Engine (NO Gemini in math):
    1. Skill & Keyword Relevance: 40 Points
    2. Geographic Proximity: 25 Points
    3. Community Rating: 15 Points
    4. Senior Experience: 10 Points
    5. Reliability & Completed Services: 10 Points
    """
    query_lower = service_query.lower()
    text_to_search = f"{service_title} {service_category} {service_description}".lower()
    
    # 1. Skill & Keyword Match (40 Points)
    words = [w for w in query_lower.split() if len(w) > 2]
    matched_words = [w for w in words if w in text_to_search]
    keyword_factor = len(matched_words) / max(len(words), 1)
    
    cat_match = 1.0 if target_category and target_category.lower() in service_category.lower() else 0.75
    skill_score = min(40.0, (keyword_factor * 25.0 + cat_match * 15.0))
    
    # 2. Geographic Proximity (25 Points)
    if distance_km <= 2.0:
        proximity_score = 25.0
    elif distance_km >= max_distance_km:
        proximity_score = 4.0
    else:
        proximity_score = max(4.0, 25.0 * (1.0 - (distance_km / max_distance_km)))
        
    # 3. Rating & Reviews (15 Points)
    if provider_rating > 0:
        rating_factor = min(max(provider_rating, 1.0) / 5.0, 1.0)
        rating_score = round(rating_factor * 15.0, 1)
    else:
        # Neutral baseline for newly registered verified providers without reviews yet
        rating_score = 11.0

    # 4. Senior Experience (10 Points)
    exp_factor = min(max(years_experience, 1) / 30.0, 1.0)
    exp_score = round(exp_factor * 10.0, 1)

    # 5. Reliability & Completed Services (10 Points)
    # Trust from actual transaction completion
    completion_factor = min(completed_services_count / 15.0, 1.0)
    verified_bonus = 2.0 if is_verified else 0.0
    reliability_score = min(10.0, round(completion_factor * 8.0 + verified_bonus, 1))

    total_score = round(skill_score + proximity_score + rating_score + exp_score + reliability_score, 1)
    total_score = min(100.0, max(20.0, total_score))

    # Generate transparent checklist reason chips
    match_reasons = []
    if distance_km <= 3.5:
        match_reasons.append(f"✓ Nearby ({distance_km} km away)")
    elif distance_km <= 10.0:
        match_reasons.append(f"✓ In Service Area ({distance_km} km)")
    else:
        match_reasons.append(f"✓ Location ({distance_km} km)")

    if years_experience >= 15:
        match_reasons.append(f"✓ {years_experience}+ Years Experience")
    elif years_experience >= 5:
        match_reasons.append(f"✓ {years_experience} Yrs Proven Experience")
    
    if provider_rating >= 4.8:
        match_reasons.append(f"✓ Top Rated ({provider_rating}★)")
    elif provider_rating >= 4.0:
        match_reasons.append(f"✓ Verified Rating ({provider_rating}★)")
    elif provider_rating > 0:
        match_reasons.append(f"✓ Community Rated ({provider_rating}★)")
        
    if completed_services_count >= 5:
        match_reasons.append(f"✓ {completed_services_count} Services Completed")

    if is_verified:
        match_reasons.append("✓ Identity Verified")

    return {
        "total_score": total_score,
        "reasons": match_reasons,
        "breakdown": {
            "skill_score": round(skill_score, 1),
            "proximity_score": round(proximity_score, 1),
            "rating_score": round(rating_score, 1),
            "exp_score": round(exp_score, 1),
            "reliability_score": round(reliability_score, 1)
        }
    }
