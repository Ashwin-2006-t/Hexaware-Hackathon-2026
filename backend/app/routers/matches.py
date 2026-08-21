from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import ServiceRequest, ProviderProfile, Match, User
from app.schemas.domain import MatchResponse
from app.agents.matching_agent import rank_and_explain_matches
from app.services.matching_service import calculate_match_score, haversine_distance

router = APIRouter(tags=["Matching"])

class SearchMatchQuery(BaseModel):
    query: Optional[str] = ""
    category: Optional[str] = None
    location: Optional[str] = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    radius_km: Optional[float] = 10.0

@router.post("/api/matches", response_model=List[MatchResponse])
def find_matches(payload: SearchMatchQuery, db: Session = Depends(get_db)):
    providers = db.query(ProviderProfile).all()
    if not providers:
        return []

    search_text = (payload.query or "").strip()

    # If query is empty, return published providers formatted as browse results without creating any request
    if not search_text:
        results = []
        for p in providers:
            if p.status and p.status != "PUBLISHED":
                continue

            if payload.category:
                cat_target = payload.category.lower().strip()
                prov_cats = set()
                if p.services:
                    for srv in p.services:
                        if srv.category: prov_cats.add(srv.category.lower())
                        if srv.name: prov_cats.add(srv.name.lower())
                if p.skills:
                    for sk in p.skills:
                        if sk.category: prov_cats.add(sk.category.lower())
                        if sk.name: prov_cats.add(sk.name.lower())

                matches_cat = any(cat_target in c or c in cat_target for c in prov_cats)
                if not matches_cat:
                    continue

            user = p.user
            p_lat = p.latitude if p.latitude is not None else (user.latitude if user and user.latitude is not None else None)
            p_lon = p.longitude if p.longitude is not None else (user.longitude if user and user.longitude is not None else None)

            dist_km = None
            if payload.latitude is not None and payload.longitude is not None and p_lat is not None and p_lon is not None:
                dist_km = haversine_distance(payload.latitude, payload.longitude, p_lat, p_lon)

            # Enforce search radius filter if radius_km is specified
            if payload.radius_km is not None and payload.radius_km > 0 and dist_km is not None:
                if dist_km > payload.radius_km:
                    continue

            results.append({
                "request_id": "browse",
                "provider_id": p.id,
                "score": 100.0,
                "distance_km": dist_km,
                "reasons": ["Available Senior Service Provider"],
                "explanation": f"{user.name if user else 'Provider'} offers {p.title or 'services'} in {p.location or (user.location if user else 'Chennai')}.",
                "provider": p
            })
        return results

    dummy_user = db.query(User).filter(User.role == "customer").first()
    cust_id = dummy_user.id if dummy_user else "temp-cust-id"

    temp_req = ServiceRequest(
        id="temp-search-id",
        customer_id=cust_id,
        title=search_text,
        description=search_text,
        category=payload.category,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude
    )

    matched_results = rank_and_explain_matches(db, temp_req, providers, radius_km=payload.radius_km)
    return matched_results

@router.get("/api/requests/{request_id}/matches", response_model=List[MatchResponse])
def get_request_matches(request_id: str, db: Session = Depends(get_db)):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    providers = db.query(ProviderProfile).all()
    matched_results = rank_and_explain_matches(db, request, providers)
    
    # Store top matches in DB
    for res in matched_results[:5]:
        existing = db.query(Match).filter(Match.request_id == request_id, Match.provider_id == res['provider_id']).first()
        if not existing:
            m = Match(
                request_id=request_id,
                provider_id=res['provider_id'],
                score=res['score'],
                explanation=res['explanation']
            )
            db.add(m)
    db.commit()

    return matched_results
