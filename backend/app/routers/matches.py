from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import ServiceRequest, ProviderProfile, Match, User
from app.schemas.domain import MatchResponse
from app.agents.matching_agent import rank_and_explain_matches

router = APIRouter(tags=["Matching"])

class SearchMatchQuery(BaseModel):
    query: str
    category: Optional[str] = None
    location: Optional[str] = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707

@router.post("/api/matches", response_model=List[MatchResponse])
def find_matches(payload: SearchMatchQuery, db: Session = Depends(get_db)):
    # Create transient request for matching
    dummy_user = db.query(User).filter(User.role == "customer").first()
    cust_id = dummy_user.id if dummy_user else "temp-cust-id"

    temp_req = ServiceRequest(
        id="temp-search-id",
        customer_id=cust_id,
        title=payload.query,
        description=payload.query,
        category=payload.category,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude
    )

    providers = db.query(ProviderProfile).all()
    if not providers:
        return []

    matched_results = rank_and_explain_matches(db, temp_req, providers)
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
