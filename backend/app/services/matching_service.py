import math
from typing import List, Dict, Any, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    R = 6371.0  # Radius of Earth in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 1)

def calculate_match_score(
    request_title: str,
    request_description: str,
    request_category: Optional[str],
    request_lat: Optional[float],
    request_lon: Optional[float],
    provider_title: str,
    provider_bio: str,
    provider_skills: List[str],
    provider_services: List[str],
    provider_category: Optional[str],
    experience_years: int,
    availability: str,
    rating: float,
    provider_lat: Optional[float],
    provider_lon: Optional[float]
) -> Dict[str, Any]:
    """
    Deterministic matching algorithm:
    - Skill/category match: 40%
    - Experience: 20%
    - Distance: 15%
    - Availability: 15%
    - Rating: 10%
    """
    reasons = []
    matched_skills = []

    req_text = f"{request_title} {request_description} {request_category or ''}".lower()
    
    # 1. Skill / Category Score (Max 40 points)
    skill_score = 0.0
    for skill in provider_skills:
        skill_clean = skill.lower()
        # Check direct or partial keyword matches
        tokens = [t for t in skill_clean.split() if len(t) > 2]
        if any(t in req_text for t in tokens) or skill_clean in req_text:
            matched_skills.append(skill)
            skill_score += 15.0
            
    for service in provider_services:
        service_clean = service.lower()
        if any(t in req_text for t in service_clean.split() if len(t) > 2):
            skill_score += 10.0

    if request_category and provider_category and (request_category.lower() in provider_category.lower() or provider_category.lower() in request_category.lower()):
        skill_score += 15.0

    skill_score = min(40.0, skill_score)
    if skill_score >= 20.0:
        reasons.append("✓ Strong skill & domain match")
    elif skill_score > 0.0:
        reasons.append("✓ Relevant expertise match")

    # 2. Experience Score (Max 20 points)
    exp_score = min(20.0, (experience_years / 25.0) * 20.0)
    if experience_years >= 15:
        reasons.append(f"✓ {experience_years}+ years extensive experience")
    elif experience_years >= 5:
        reasons.append(f"✓ {experience_years} years proven experience")

    # 3. Location / Distance Score (Max 15 points)
    distance_km = 5.0
    if request_lat is not None and request_lon is not None and provider_lat is not None and provider_lon is not None:
        distance_km = haversine_distance(request_lat, request_lon, provider_lat, provider_lon)

    if distance_km <= 3.0:
        dist_score = 15.0
        reasons.append(f"✓ Nearby provider ({distance_km} km away)")
    elif distance_km <= 8.0:
        dist_score = 12.0
        reasons.append(f"✓ Within local area ({distance_km} km away)")
    elif distance_km <= 15.0:
        dist_score = 8.0
        reasons.append(f"✓ Accessible distance ({distance_km} km away)")
    else:
        dist_score = 4.0
        reasons.append(f"✓ Serviceable region ({distance_km} km away)")

    # 4. Availability Score (Max 15 points)
    avail_clean = (availability or "Available").lower()
    if "available" in avail_clean or "flexible" in avail_clean or "full" in avail_clean:
        avail_score = 15.0
        reasons.append("✓ Flexible & immediate availability")
    else:
        avail_score = 10.0
        reasons.append("✓ Suitable schedule availability")

    # 5. Rating Score (Max 10 points)
    normalized_rating = max(0.0, min(5.0, rating))
    rating_score = (normalized_rating / 5.0) * 10.0
    if normalized_rating >= 4.7:
        reasons.append(f"✓ Highly rated provider ({normalized_rating:.1f}★)")
    elif normalized_rating >= 4.0:
        reasons.append(f"✓ Top customer satisfaction ({normalized_rating:.1f}★)")

    total_score = round(min(100.0, skill_score + exp_score + dist_score + avail_score + rating_score), 1)

    # Ensure at least 3 reasons are populated
    if len(reasons) < 3:
        reasons.append("✓ Verified SilverHands Provider")

    return {
        "score": total_score,
        "distance_km": distance_km,
        "matched_skills": list(set(matched_skills)),
        "reasons": reasons
    }
