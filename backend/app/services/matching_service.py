import math
from typing import List, Dict, Any, Optional

STOPWORDS = {
    "for", "and", "the", "with", "from", "you", "your", "our", "are", "have", "has",
    "had", "need", "want", "looking", "require", "request", "local", "provider", "providers",
    "function", "functions", "area", "chennai", "nagar", "best", "good", "new", "day", "days",
    "time", "near", "nearby", "place", "type", "order", "orders", "ready", "please",
    "give", "take", "call", "send", "find", "get", "put", "must", "can", "also"
}

DOMAIN_KEYWORDS = {
    "food": [
        "dosa", "dosai", "தோசை", "தோசைப்பாடு",
        "sweet", "sweets", "இனிப்பு", "பலகாரம்", "மிட்டாய்", "मिठाई", "स्वीट्स",
        "murukku", "முறுக்கு", "மூர்ஃக்கு", "मुरुकु",
        "adhirasam", "அதீரசம்", "அதிரசம்",
        "seedai", "சீடை",
        "cook", "cooking", "chef", "food", "tiffin", "snack", "snacks", "biryani", "chapati", "curry", "gravy", "meals", "lunch", "dinner", "breakfast", "catering",
        "சமையல்", "சமைக்க", "உணவு", "சாப்பாடு", "டிபன்", "சிற்றுண்டி", "बिरयानी", "दौसा", "खाना", "रसोई", "भोजन"
    ],
    "tailoring": [
        "tailor", "tailoring", "stitch", "stitching", "blouse", "saree", "churidar", "garment", "sewing", "alteration", "fitting", "aari", "embroidery",
        "தையல்", "தைக்க", "பிளவுஸ்", "ஜாக்கெட்", "சேலை", "ஆல்டரேஷன்", "ஆரி", "எம்பிராய்டரி", "सिलाई", "ब्लाउज", "दर्जी", "कपड़े"
    ],
    "tutoring": [
        "tutor", "tutoring", "teach", "teaching", "school", "exam", "homework", "class", "tuition", "teacher", "academic",
        "பாடம்", "கற்பித்தல்", "டியூஷன்", "தமிழ்ப் பாடம்", "ஹிந்தி பாடம்", "கணிதம்", "ஆசிரியர்", "படிப்பு", "ट्यूशन", "हिंदी ट्यूशन", "गणित", "पढ़ाई", "शिक्षक"
    ],
    "gardening": [
        "garden", "gardening", "terrace", "balcony", "plant", "plants", "soil", "vegetable", "organic",
        "தோட்டம்", "மாடித் தோட்டம்", "செடி", "காய்கறி", "பயிர்கள்", "बगीचा", "पौधे", "बागवानी"
    ],
    "childcare": [
        "childcare", "babysit", "storytelling", "eldercare", "after school",
        "குழந்தை", "குழந்தை பராமரிப்பு", "கதை", "बाल देखभाल", "कहानी"
    ],
    "arts": [
        "kolam", "handicraft", "craft", "music", "dance", "carnatic", "bharatanatyam", "art",
        "கோலம்", "கைவினை", "இசை", "நடனம்", "कला", "संगीत", "नृत्य"
    ]
}

def get_text_domains(text: str) -> List[str]:
    """
    Extract canonical domain tags (food, tailoring, tutoring, etc.) from natural language text
    in English, Tamil, or Hindi.
    """
    text_clean = text.lower()
    matched_domains = set()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in text_clean:
                matched_domains.add(domain)
                break
    return list(matched_domains)

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
    experience_years: Optional[int],
    availability: Optional[str],
    rating: float,
    provider_lat: Optional[float],
    provider_lon: Optional[float],
    radius_km: Optional[float] = None
) -> Dict[str, Any]:
    """
    Deterministic matching engine with strict Domain Relevance Gatekeeper.
    Support English, Tamil, and Hindi natural language requests.
    """
    reasons = []
    matched_skills = []
    matched_services = []

    req_full = f"{request_title} {request_description} {request_category or ''}".lower()
    prov_full = f"{provider_title} {provider_bio} {' '.join(provider_skills)} {' '.join(provider_services)} {provider_category or ''}".lower()

    # 1. Identify canonical domain intents for request and provider
    req_domains = get_text_domains(req_full)
    prov_domains = get_text_domains(prov_full)

    # Token/Word Extraction for Request
    req_non_stop = [w for w in req_full.split() if len(w) >= 3 and w not in STOPWORDS]

    # RELEVANCE GATEKEEPER:
    # If the request matches specific domain categories, the provider MUST have domain overlap or token overlap!
    if req_domains:
        has_domain_overlap = any(d in prov_domains for d in req_domains)
        if not has_domain_overlap:
            # Check for non-stopword token overlap as a secondary safety check
            req_words = set(w for w in req_full.split() if len(w) >= 3 and w not in STOPWORDS)
            prov_words = set(w for w in prov_full.split() if len(w) >= 3 and w not in STOPWORDS)
            has_word_overlap = bool(req_words.intersection(prov_words))
            
            if not has_word_overlap:
                # ZERO relevance -> Return score 0.0 so candidate is excluded!
                return {
                    "score": 0.0,
                    "distance_km": None,
                    "matched_skills": [],
                    "reasons": []
                }

    # 2. Skill & Domain Relevance Score (Max 40 points)
    skill_score = 0.0

    # Domain overlap points
    if req_domains and any(d in prov_domains for d in req_domains):
        skill_score += 15.0

    # Direct Service Name Match (Exact, Substring, or Token Overlap)
    for service in provider_services:
        service_clean = service.lower().strip()
        if not service_clean:
            continue
        service_tokens = [t for t in service_clean.split() if len(t) >= 3 and t not in STOPWORDS]
        # Check substring match or token overlap
        if service_clean in req_full or req_full in service_clean or any(t in req_full for t in service_tokens) or any(t in service_clean for t in req_non_stop):
            matched_services.append(service)
            skill_score += 20.0

    # Direct Skill Name Match
    for skill in provider_skills:
        skill_clean = skill.lower().strip()
        if not skill_clean:
            continue
        skill_tokens = [t for t in skill_clean.split() if len(t) >= 3 and t not in STOPWORDS]
        if skill_clean in req_full or req_full in skill_clean or any(t in req_full for t in skill_tokens) or any(t in skill_clean for t in req_non_stop):
            matched_skills.append(skill)
            skill_score += 15.0

    # Title / Bio Keyword Overlap
    prov_title_clean = (provider_title or "").lower()
    if any(t in prov_title_clean for t in req_non_stop):
        skill_score += 10.0

    if request_category and provider_category:
        req_cat_clean = request_category.lower()
        prov_cat_clean = provider_category.lower()
        if req_cat_clean in prov_cat_clean or prov_cat_clean in req_cat_clean:
            skill_score += 10.0

    skill_score = min(40.0, skill_score)

    # SECONDARY GATE: If skill_score is 0 after token evaluation, return 0.0%
    if skill_score == 0.0:
        return {
            "score": 0.0,
            "distance_km": None,
            "matched_skills": [],
            "reasons": []
        }

    if matched_services:
        reasons.append(f"✓ Offers service: {', '.join(matched_services[:2])}")
    elif skill_score >= 20.0:
        reasons.append("✓ Strong skill & domain match")
    else:
        reasons.append("✓ Relevant expertise match")

    # 3. Location / Distance Score (Max 25 points)
    distance_km = None
    dist_score = 0.0
    if request_lat is not None and request_lon is not None and provider_lat is not None and provider_lon is not None:
        distance_km = haversine_distance(request_lat, request_lon, provider_lat, provider_lon)
        if radius_km is not None and radius_km > 0 and distance_km > radius_km:
            # Provider is outside requested search radius -> exclude!
            return {
                "score": 0.0,
                "distance_km": distance_km,
                "matched_skills": [],
                "reasons": []
            }
        if distance_km <= 3.0:
            dist_score = 25.0
            reasons.append(f"✓ Nearby provider ({distance_km} km away)")
        elif distance_km <= 8.0:
            dist_score = 20.0
            reasons.append(f"✓ Within local area ({distance_km} km away)")
        elif distance_km <= 15.0:
            dist_score = 12.0
            reasons.append(f"✓ Accessible distance ({distance_km} km away)")
        else:
            dist_score = 5.0
            reasons.append(f"✓ Serviceable region ({distance_km} km away)")
    else:
        reasons.append("✓ Distance unavailable")

    # 4. Rating Score (Max 15 points)
    rating_score = 0.0
    if rating and rating > 0:
        normalized_rating = max(0.0, min(5.0, rating))
        rating_score = (normalized_rating / 5.0) * 15.0
        if normalized_rating >= 4.7:
            reasons.append(f"✓ Highly rated provider ({normalized_rating:.1f}★)")
        elif normalized_rating >= 4.0:
            reasons.append(f"✓ Top customer satisfaction ({normalized_rating:.1f}★)")

    # 5. Experience Score (Max 10 points)
    exp_score = 0.0
    if experience_years is not None and experience_years > 0:
        exp_score = min(10.0, (experience_years / 20.0) * 10.0)
        if experience_years >= 15:
            reasons.append(f"✓ {experience_years}+ years extensive experience")
        elif experience_years >= 5:
            reasons.append(f"✓ {experience_years} years proven experience")

    # 6. Availability Score (Max 10 points)
    avail_score = 0.0
    if availability and availability.strip() and availability.lower() != "not specified":
        avail_clean = availability.lower()
        if "available" in avail_clean or "flexible" in avail_clean or "full" in avail_clean or "daily" in avail_clean:
            avail_score = 10.0
            reasons.append("✓ Flexible & immediate availability")
        else:
            avail_score = 6.0
            reasons.append("✓ Suitable schedule availability")

    total_score = round(min(100.0, skill_score + dist_score + rating_score + exp_score + avail_score), 1)

    if len(reasons) < 2:
        reasons.append("✓ SilverHands Provider")

    return {
        "score": total_score,
        "distance_km": distance_km,
        "matched_skills": list(set(matched_skills)),
        "reasons": reasons
    }
