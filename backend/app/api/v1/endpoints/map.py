"""
Map endpoints for SilverHands real-time location discovery.
"""
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError

from app.db.session import get_db
from app.models.domain import User
from app.core.config import settings
from app.services.map_service import (
    fetch_real_nearby_businesses,
    get_nearby_providers,
    get_nearby_opportunities,
    haversine_distance_km,
    get_location_autocomplete
)

logger = logging.getLogger(__name__)

router = APIRouter()

class LocationUpdateSchema(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    service_radius: Optional[float] = None


def get_optional_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        return db.query(User).filter(User.id == int(user_id_str)).first()
    except Exception:
        return None


def get_required_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.id == int(user_id_str)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/nearby", summary="Get nearby real providers, opportunities, and live real-world businesses")
async def get_nearby_map_data(
    lat: float = Query(..., description="User live latitude (e.g. 19.0760)"),
    lng: float = Query(..., description="User live longitude (e.g. 72.8777)"),
    radius: float = Query(10.0, ge=1.0, le=50.0, description="Discovery radius in kilometers"),
    category: Optional[str] = Query(None, description="Category filter (Cooking, Tutoring, Crafts, Gardening, etc.)"),
    search: Optional[str] = Query(None, description="Keyword search string"),
    include_businesses: bool = Query(True, description="Include live real-world businesses from OSM"),
    db: Session = Depends(get_db)
):
    """
    Returns verified SilverHands providers, open opportunities, and live nearby businesses from OSM.
    Distinguishes marker types:
    - SilverHands Provider (verified platform providers)
    - SilverHands Opportunity (customer requests / gigs)
    - Real Nearby Business (OSM real-world venues)
    """
    # 1. Fetch platform providers
    providers = get_nearby_providers(db, lat=lat, lng=lng, radius_km=radius, category=category, search=search)
    
    # 2. Fetch platform opportunities
    opportunities = get_nearby_opportunities(db, lat=lat, lng=lng, radius_km=radius, category=category, search=search)
    
    # 3. Fetch real businesses from live OSM Overpass/Nominatim API
    real_businesses = []
    if include_businesses:
        try:
            real_businesses = await fetch_real_nearby_businesses(
                lat=lat, lng=lng, radius_km=min(radius, 15.0), category=category, search=search, limit=20
            )
        except Exception as e:
            logger.warning(f"Error querying live OSM places: {e}")

    # Unified items list
    all_items = []
    all_items.extend(providers)
    all_items.extend(opportunities)
    all_items.extend(real_businesses)
    all_items.sort(key=lambda x: x.get("distance_km", 999.0))

    return {
        "center": {
            "latitude": lat,
            "longitude": lng
        },
        "radius_km": radius,
        "category": category or "All",
        "search": search or "",
        "counts": {
            "total": len(all_items),
            "providers": len(providers),
            "opportunities": len(opportunities),
            "real_businesses": len(real_businesses)
        },
        "items": all_items
    }


@router.post("/location/update", summary="Update Current User Geolocation & Service Radius")
def update_user_location(
    loc_in: LocationUpdateSchema,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the authenticated user's coordinates and service radius.
    """
    current_user.latitude = loc_in.latitude
    current_user.longitude = loc_in.longitude
    if loc_in.location_name:
        current_user.location_name = loc_in.location_name
    if loc_in.service_radius is not None and loc_in.service_radius > 0:
        current_user.service_radius = loc_in.service_radius

    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "message": "Location and service radius updated successfully.",
        "user_id": current_user.id,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude,
        "location_name": current_user.location_name,
        "service_radius": getattr(current_user, "service_radius", 10.0)
    }


@router.get("/autocomplete", summary="Location Geocoding & Address Autocomplete")
async def autocomplete_location(
    q: str = Query(..., min_length=2, description="Search query string (e.g. 'Coimbatore' or 'Mylapore')"),
    limit: int = Query(6, ge=1, le=10, description="Max suggestions to return")
):
    """
    Provides real-time debounced location suggestions with resolved
    latitude and longitude coordinates directly from OpenStreetMap Nominatim.
    """
    suggestions = await get_location_autocomplete(query=q, limit=limit)
    return {
        "query": q,
        "total": len(suggestions),
        "suggestions": suggestions
    }

