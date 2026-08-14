import math
from typing import List, Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in kilometers between two GPS coordinates using Haversine formula."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 5.0  # Default estimate in km

    R = 6371.0  # Radius of Earth in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_match_score(
    service_query: str,
    target_category: str,
    service_title: str,
    service_category: str,
    service_description: str,
    distance_km: float,
    provider_rating: float,
    years_experience: int,
    max_distance_km: float = 25.0
) -> Dict[str, Any]:
    """
    SilverHands 5-Factor Deterministic Match Scoring Engine:
    - Skill & Keyword Match (40%)
    - Geographic Proximity (25%)
    - Rating & Trust (15%)
    - Senior Experience (10%)
    - Availability & Reliability (10%)
    """
    query_lower = service_query.lower()
    text_to_search = f"{service_title} {service_category} {service_description}".lower()
    
    # 1. Skill Match (40 Points)
    words = [w for w in query_lower.split() if len(w) > 2]
    matched_words = [w for w in words if w in text_to_search]
    keyword_factor = len(matched_words) / max(len(words), 1)
    
    cat_match = 1.0 if target_category and target_category.lower() == service_category.lower() else 0.7
    skill_score = min(40.0, (keyword_factor * 25.0 + cat_match * 15.0))
    
    # 2. Location Proximity (25 Points)
    if distance_km <= 2.0:
        proximity_score = 25.0
    elif distance_km >= max_distance_km:
        proximity_score = 5.0
    else:
        proximity_score = max(5.0, 25.0 * (1.0 - (distance_km / max_distance_km)))
        
    # 3. Rating & Trust (15 Points)
    rating_factor = min(provider_rating / 5.0, 1.0)
    rating_score = rating_factor * 15.0
    
    # 4. Experience (10 Points)
    exp_factor = min(years_experience / 30.0, 1.0)
    exp_score = exp_factor * 10.0
    
    # 5. Base Reliability (10 Points)
    reliability_score = 10.0

    total_score = round(skill_score + proximity_score + rating_score + exp_score + reliability_score, 1)

    return {
        "total_score": min(100.0, total_score),
        "breakdown": {
            "skill_score": round(skill_score, 1),
            "proximity_score": round(proximity_score, 1),
            "rating_score": round(rating_score, 1),
            "exp_score": round(exp_score, 1),
            "reliability_score": round(reliability_score, 1)
        }
    }
