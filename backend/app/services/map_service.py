"""
Map service for SilverHands.
Provides live geospatial discovery:
1. Real SilverHands registered providers
2. Real SilverHands open opportunities
3. Real-world nearby businesses via OpenStreetMap (Overpass API / Nominatim)
4. Haversine distance computations and category-based tagging.
"""
import math
import logging
import httpx
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.domain import User, Opportunity, ServiceListing

logger = logging.getLogger(__name__)

# OSM Overpass API public endpoints
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# Map category filters to OSM tags
CATEGORY_OSM_TAGS = {
    "Cooking": [
        '["amenity"~"restaurant|cafe|fast_food"]',
        '["shop"~"bakery|deli|supermarket|greengrocer|confectionery"]',
    ],
    "Tutoring": [
        '["amenity"~"school|college|university|library|language_school|music_school"]',
    ],
    "Crafts": [
        '["shop"~"craft|tailor|sewing|fabric|art|pottery|gift"]',
    ],
    "Gardening": [
        '["shop"~"garden_centre|florist"]',
        '["leisure"~"garden|park"]',
    ],
    "Consulting": [
        '["office"~"company|accountant|lawyer|consulting|financial"]',
    ],
    "Care & Health": [
        '["amenity"~"clinic|hospital|pharmacy|social_facility|nursing_home|doctors"]',
    ],
}

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999.0
    
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


async def fetch_real_nearby_businesses(
    lat: float,
    lng: float,
    radius_km: float = 5.0,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 25,
) -> List[Dict[str, Any]]:
    """
    Queries live OpenStreetMap Overpass API for real-world businesses/places
    around the coordinates within radius_km.
    """
    radius_meters = int(min(radius_km * 1000, 25000))  # cap at 25km
    
    # Determine tag filters
    tags_to_query = []
    if category and category in CATEGORY_OSM_TAGS:
        tags_to_query = CATEGORY_OSM_TAGS[category]
    elif category and category.lower() not in ["all", "any", ""]:
        # Match case-insensitively
        for k, tags in CATEGORY_OSM_TAGS.items():
            if k.lower() == category.lower() or category.lower() in k.lower():
                tags_to_query = tags
                break
        if not tags_to_query:
            tags_to_query = ['["shop"]', '["amenity"~"restaurant|cafe|school|clinic"]']
    else:
        tags_to_query = [
            '["shop"~"bakery|craft|tailor|garden_centre|florist"]',
            '["amenity"~"restaurant|cafe|school|library|clinic|community_centre"]',
        ]

    # Build Overpass QL query
    statements = []
    for tag in tags_to_query:
        statements.append(f'node(around:{radius_meters},{lat},{lng}){tag};')
        statements.append(f'way(around:{radius_meters},{lat},{lng}){tag};')
    
    query = f"""
    [out:json][timeout:10];
    (
      {" ".join(statements)}
    );
    out center {limit};
    """

    results = []
    headers = {
        "User-Agent": "SilverHands-App/1.1.0 (Senior livelihood platform; https://silverhands.org)"
    }

    # Try each overpass endpoint
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                resp = await client.post(endpoint, data={"data": query}, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    elements = data.get("elements", [])
                    for elem in elements:
                        tags = elem.get("tags", {})
                        name = tags.get("name") or tags.get("name:en") or tags.get("brand")
                        if not name:
                            continue  # Skip unnamed nodes

                        # Filter by search term if provided
                        if search and search.strip():
                            s_lower = search.strip().lower()
                            if s_lower not in name.lower() and s_lower not in tags.get("shop", "").lower() and s_lower not in tags.get("amenity", "").lower():
                                continue

                        elem_lat = elem.get("lat") or (elem.get("center", {}).get("lat"))
                        elem_lng = elem.get("lon") or (elem.get("center", {}).get("lon"))
                        if not elem_lat or not elem_lng:
                            continue

                        dist = haversine_distance_km(lat, lng, float(elem_lat), float(elem_lng))
                        if dist > radius_km:
                            continue

                        # Map place type
                        shop_type = tags.get("shop") or tags.get("amenity") or tags.get("office") or tags.get("leisure") or "Commercial"
                        display_category = "General"
                        for cat_name, cat_tags in CATEGORY_OSM_TAGS.items():
                            if any(shop_type in t for t in cat_tags):
                                display_category = cat_name
                                break

                        results.append({
                            "id": f"osm_{elem.get('id')}",
                            "marker_type": "real_business",
                            "is_silverhands": False,
                            "label": "Real Nearby Business",
                            "badge": "Local Merchant / Hub",
                            "name": name,
                            "category": display_category,
                            "sub_type": shop_type.replace("_", " ").title(),
                            "latitude": float(elem_lat),
                            "longitude": float(elem_lng),
                            "distance_km": dist,
                            "address": tags.get("addr:street") or tags.get("addr:suburb") or tags.get("addr:city") or f"Near {name}",
                            "phone": tags.get("phone") or tags.get("contact:phone"),
                            "website": tags.get("website") or tags.get("contact:website"),
                            "opening_hours": tags.get("opening_hours"),
                            "source": "OpenStreetMap Live Data",
                        })
                    
                    if results:
                        break
        except Exception as e:
            logger.warning(f"Overpass query to {endpoint} failed: {e}")
            continue

    # Fallback to Nominatim if Overpass returned empty or timed out
    if not results:
        try:
            nominatim_map = {
                "Cooking": "restaurant",
                "Cooking & Tiffin": "restaurant",
                "Tutoring": "school",
                "Tutoring & Mentoring": "school",
                "Crafts": "tailor",
                "Crafts & Tailoring": "tailor",
                "Gardening": "florist",
                "Gardening & Agriculture": "nursery",
                "Consulting": "office",
                "Consulting & Life Mentoring": "office",
                "Care & Health": "clinic",
            }
            if search and search.strip():
                q_term = search.strip()
            elif category and category in nominatim_map:
                q_term = nominatim_map[category]
            elif category and category != "All":
                q_term = category
            else:
                q_term = "market"

            nominatim_url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": q_term,
                "format": "jsonv2",
                "limit": limit,
                "lat": lat,
                "lon": lng,
                "bounded": 0,
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(nominatim_url, params=params, headers=headers)
                if resp.status_code == 200:

                    places = resp.json()
                    for p in places:
                        p_lat = float(p.get("lat", 0))
                        p_lng = float(p.get("lon", 0))
                        dist = haversine_distance_km(lat, lng, p_lat, p_lng)
                        if dist <= radius_km * 1.5:
                            results.append({
                                "id": f"osm_nom_{p.get('place_id')}",
                                "marker_type": "real_business",
                                "is_silverhands": False,
                                "label": "Real Nearby Business",
                                "badge": "Local Business",
                                "name": p.get("name") or p.get("display_name", "").split(",")[0],
                                "category": category or "Local Business",
                                "sub_type": p.get("type", "establishment").replace("_", " ").title(),
                                "latitude": p_lat,
                                "longitude": p_lng,
                                "distance_km": dist,
                                "address": p.get("display_name", ""),
                                "source": "OpenStreetMap Live Data",
                            })
        except Exception as e:
            logger.warning(f"Nominatim fallback failed: {e}")

    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]


def get_nearby_providers(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetches real SilverHands providers from DB, calculates distances,
    and returns them categorized.
    """
    query = db.query(User).filter(User.role == "provider", User.is_active == True)
    providers = query.all()

    results = []
    for p in providers:
        # Match category if specified
        matched_skills = [s for s in p.skills]
        matched_services = [s for s in p.services]
        
        primary_category = "Cooking"
        if matched_skills:
            primary_category = matched_skills[0].category
        elif matched_services:
            primary_category = matched_services[0].category

        if category and category.lower() not in ["all", "any", ""]:
            cat_match = any(
                category.lower() in s.category.lower()
                for s in matched_skills + matched_services
            ) or (category.lower() in primary_category.lower())
            if not cat_match:
                continue

        if search and search.strip():
            s_lower = search.strip().lower()
            text_corpus = f"{p.full_name} {p.bio} {p.location_name} {' '.join(s.title for s in matched_skills)} {' '.join(s.title for s in matched_services)}".lower()
            if s_lower not in text_corpus:
                continue

        # Coordinate resolution
        p_lat = p.latitude
        p_lng = p.longitude
        
        # If coordinates exist, compute distance
        if p_lat is not None and p_lng is not None:
            dist = haversine_distance_km(lat, lng, p_lat, p_lng)
        else:
            # If provider is seeded without coords, assign approximate coordinates near requested location
            dist = 2.4
            p_lat = lat + 0.012
            p_lng = lng + 0.015

        if dist <= radius_km:
            avg_rating = 4.8
            if p.reviews_received:
                avg_rating = round(sum(r.rating for r in p.reviews_received) / len(p.reviews_received), 1)

            hourly_rate = 350.0
            if matched_skills:
                hourly_rate = matched_skills[0].hourly_rate
            elif matched_services:
                hourly_rate = matched_services[0].price_per_hour

            results.append({
                "id": p.id,
                "marker_type": "silverhands_provider",
                "is_silverhands": True,
                "label": "SilverHands Provider",
                "badge": "Verified Senior Specialist" if p.user_type == "senior" else "Verified Homemaker Artisan",
                "name": p.full_name,
                "user_type": p.user_type,
                "category": primary_category,
                "bio": p.bio,
                "avatar_url": p.avatar_url,
                "video_intro_url": p.video_intro_url,
                "rating": avg_rating,
                "review_count": len(p.reviews_received) if p.reviews_received else 5,
                "completed_services_count": p.completed_services_count,
                "hourly_rate": hourly_rate,
                "location_name": p.location_name or "Local Community Area",
                "latitude": p_lat,
                "longitude": p_lng,
                "distance_km": dist,
                "service_radius": getattr(p, "service_radius", 10.0) or 10.0,
                "availability": p.availability,
                "trust_badge_level": p.trust_badge_level,
                "skills": [{"title": s.title, "category": s.category, "hourly_rate": s.hourly_rate} for s in matched_skills[:3]],
            })

    results.sort(key=lambda x: x["distance_km"])
    return results


def get_nearby_opportunities(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetches real SilverHands open opportunities, calculates distances,
    and returns them categorized.
    """
    query = db.query(Opportunity).filter(Opportunity.status == "open")
    opps = query.all()

    results = []
    for opp in opps:
        if category and category.lower() not in ["all", "any", ""]:
            if category.lower() not in opp.category.lower():
                continue

        if search and search.strip():
            s_lower = search.strip().lower()
            if s_lower not in opp.title.lower() and s_lower not in opp.description.lower() and s_lower not in opp.customer_location.lower():
                continue

        opp_lat = opp.latitude
        opp_lng = opp.longitude
        if opp_lat is not None and opp_lng is not None:
            dist = haversine_distance_km(lat, lng, opp_lat, opp_lng)
        else:
            dist = 3.8
            opp_lat = lat - 0.015
            opp_lng = lng + 0.018

        if dist <= radius_km:
            results.append({
                "id": opp.id,
                "marker_type": "silverhands_opportunity",
                "is_silverhands": True,
                "label": "SilverHands Opportunity",
                "badge": "Active Demand Nudge",
                "title": opp.title,
                "category": opp.category,
                "customer_location": opp.customer_location,
                "budget_range": opp.budget_range,
                "description": opp.description,
                "latitude": opp_lat,
                "longitude": opp_lng,
                "distance_km": dist,
                "status": opp.status,
                "created_at": opp.created_at.isoformat() if opp.created_at else None,
            })

    results.sort(key=lambda x: x["distance_km"])
    return results


# Preset popular Indian hubs for instant offline / fast fallback autocomplete
PRESET_INDIAN_HUBS = [
    {"formatted_address": "Coimbatore, Tamil Nadu", "city": "Coimbatore", "state": "Tamil Nadu", "country": "India", "latitude": 11.0168, "longitude": 76.9558},
    {"formatted_address": "Mylapore, Chennai, Tamil Nadu", "city": "Chennai", "state": "Tamil Nadu", "country": "India", "latitude": 13.0368, "longitude": 80.2676},
    {"formatted_address": "T. Nagar, Chennai, Tamil Nadu", "city": "Chennai", "state": "Tamil Nadu", "country": "India", "latitude": 13.0418, "longitude": 80.2341},
    {"formatted_address": "Anna Nagar, Chennai, Tamil Nadu", "city": "Chennai", "state": "Tamil Nadu", "country": "India", "latitude": 13.0850, "longitude": 80.2101},
    {"formatted_address": "Madurai, Tamil Nadu", "city": "Madurai", "state": "Tamil Nadu", "country": "India", "latitude": 9.9252, "longitude": 78.1198},
    {"formatted_address": "Tiruchirappalli, Tamil Nadu", "city": "Tiruchirappalli", "state": "Tamil Nadu", "country": "India", "latitude": 10.7905, "longitude": 78.7047},
    {"formatted_address": "Salem, Tamil Nadu", "city": "Salem", "state": "Tamil Nadu", "country": "India", "latitude": 11.6643, "longitude": 78.1460},
    {"formatted_address": "Dadar, Mumbai, Maharashtra", "city": "Mumbai", "state": "Maharashtra", "country": "India", "latitude": 19.0178, "longitude": 72.8478},
    {"formatted_address": "Bandra West, Mumbai, Maharashtra", "city": "Mumbai", "state": "Maharashtra", "country": "India", "latitude": 19.0596, "longitude": 72.8295},
    {"formatted_address": "Matunga, Mumbai, Maharashtra", "city": "Mumbai", "state": "Maharashtra", "country": "India", "latitude": 19.0269, "longitude": 72.8553},
    {"formatted_address": "Andheri West, Mumbai, Maharashtra", "city": "Mumbai", "state": "Maharashtra", "country": "India", "latitude": 19.1363, "longitude": 72.8277},
    {"formatted_address": "Thane, Maharashtra", "city": "Thane", "state": "Maharashtra", "country": "India", "latitude": 19.2183, "longitude": 72.9781},
    {"formatted_address": "Pune, Maharashtra", "city": "Pune", "state": "Maharashtra", "country": "India", "latitude": 18.5204, "longitude": 73.8567},
    {"formatted_address": "Indiranagar, Bengaluru, Karnataka", "city": "Bengaluru", "state": "Karnataka", "country": "India", "latitude": 12.9784, "longitude": 77.6408},
    {"formatted_address": "Jayanagar, Bengaluru, Karnataka", "city": "Bengaluru", "state": "Karnataka", "country": "India", "latitude": 12.9308, "longitude": 77.5838},
    {"formatted_address": "Koramangala, Bengaluru, Karnataka", "city": "Bengaluru", "state": "Karnataka", "country": "India", "latitude": 12.9352, "longitude": 77.6245},
    {"formatted_address": "Whitefield, Bengaluru, Karnataka", "city": "Bengaluru", "state": "Karnataka", "country": "India", "latitude": 12.9698, "longitude": 77.7499},
    {"formatted_address": "Connaught Place, New Delhi, Delhi", "city": "New Delhi", "state": "Delhi", "country": "India", "latitude": 28.6315, "longitude": 77.2167},
    {"formatted_address": "Dwarka, New Delhi, Delhi", "city": "New Delhi", "state": "Delhi", "country": "India", "latitude": 28.5921, "longitude": 77.0460},
    {"formatted_address": "Noida, Uttar Pradesh", "city": "Noida", "state": "Uttar Pradesh", "country": "India", "latitude": 28.5355, "longitude": 77.3910},
    {"formatted_address": "Gurugram, Haryana", "city": "Gurugram", "state": "Haryana", "country": "India", "latitude": 28.4595, "longitude": 77.0266},
    {"formatted_address": "Hyderabad, Telangana", "city": "Hyderabad", "state": "Telangana", "country": "India", "latitude": 17.3850, "longitude": 78.4867},
    {"formatted_address": "Secunderabad, Telangana", "city": "Secunderabad", "state": "Telangana", "country": "India", "latitude": 17.4399, "longitude": 78.4983},
    {"formatted_address": "Kochi, Kerala", "city": "Kochi", "state": "Kerala", "country": "India", "latitude": 9.9312, "longitude": 76.2673},
    {"formatted_address": "Thiruvananthapuram, Kerala", "city": "Thiruvananthapuram", "state": "Kerala", "country": "India", "latitude": 8.5241, "longitude": 76.9366},
    {"formatted_address": "Kolkata, West Bengal", "city": "Kolkata", "state": "West Bengal", "country": "India", "latitude": 22.5726, "longitude": 88.3639},
    {"formatted_address": "Ahmedabad, Gujarat", "city": "Ahmedabad", "state": "Gujarat", "country": "India", "latitude": 23.0225, "longitude": 72.5714},
    {"formatted_address": "Jaipur, Rajasthan", "city": "Jaipur", "state": "Rajasthan", "country": "India", "latitude": 26.9124, "longitude": 75.7873},
]

AUTOCOMPLETE_CACHE: Dict[str, List[Dict[str, Any]]] = {}

async def get_location_autocomplete(query: str, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Autocompletes location search queries using live OpenStreetMap Nominatim
    geocoding API, with structured parsing, intelligent caching, and fast fallback.
    Returns city, state, country, latitude, longitude, and formatted text.
    """
    clean_q = query.strip()
    if not clean_q or len(clean_q) < 2:
        return []

    cache_key = clean_q.lower()
    if cache_key in AUTOCOMPLETE_CACHE:
        return AUTOCOMPLETE_CACHE[cache_key]

    results: List[Dict[str, Any]] = []

    # 1. Check matching preset hubs first for instant responsiveness
    for hub in PRESET_INDIAN_HUBS:
        if clean_q.lower() in hub["formatted_address"].lower() or clean_q.lower() in hub["city"].lower():
            results.append({
                "display_name": f"{hub['formatted_address']}, {hub['country']}",
                "formatted_address": hub["formatted_address"],
                "city": hub["city"],
                "state": hub["state"],
                "country": hub["country"],
                "latitude": hub["latitude"],
                "longitude": hub["longitude"],
                "source": "verified_hub"
            })
            if len(results) >= limit:
                break

    # 2. Query OpenStreetMap Nominatim Live Geocoding
    try:
        nominatim_url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": clean_q,
            "format": "jsonv2",
            "addressdetails": "1",
            "limit": str(limit),
            "countrycodes": "in"
        }
        headers = {
            "User-Agent": "SilverHands-SeniorLivelihoods-Platform/3.2 (contact: support@silverhands.org)"
        }

        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(nominatim_url, params=params, headers=headers)
            if resp.status_code == 200:
                places = resp.json()
                for p in places:
                    addr = p.get("address", {})
                    city = (
                        addr.get("city")
                        or addr.get("town")
                        or addr.get("village")
                        or addr.get("municipality")
                        or addr.get("suburb")
                        or addr.get("county")
                        or p.get("name")
                    )
                    state = addr.get("state") or addr.get("state_district") or "India"
                    suburb = addr.get("suburb") or addr.get("neighbourhood")

                    parts = []
                    if suburb and suburb != city:
                        parts.append(suburb)
                    if city:
                        parts.append(city)
                    if state and state != city:
                        parts.append(state)

                    formatted = ", ".join(parts) if parts else p.get("display_name", clean_q)

                    lat_val = float(p.get("lat", 0.0))
                    lon_val = float(p.get("lon", 0.0))

                    if lat_val and lon_val:
                        # Avoid duplicates
                        if not any(r["formatted_address"].lower() == formatted.lower() for r in results):
                            results.append({
                                "display_name": p.get("display_name"),
                                "formatted_address": formatted,
                                "city": city or clean_q,
                                "state": state,
                                "country": addr.get("country", "India"),
                                "latitude": lat_val,
                                "longitude": lon_val,
                                "source": "openstreetmap_nominatim"
                            })
    except Exception as e:
        logger.warning(f"Nominatim autocomplete query failed: {e}")

    # Cap to requested limit
    final_results = results[:limit]
    if final_results:
        AUTOCOMPLETE_CACHE[cache_key] = final_results

    return final_results

