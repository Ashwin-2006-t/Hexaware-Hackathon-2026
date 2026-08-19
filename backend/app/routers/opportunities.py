from datetime import datetime, timedelta
import re
from typing import List, Optional, Set
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import User, ProviderProfile, ServiceRequest, Skill, Service
from app.schemas.domain import SeniorOpportunitiesResponse, OpportunitySuggestionItem, OpportunitySuggestion
from app.auth import get_current_user

router = APIRouter(prefix="/api/providers", tags=["Opportunity Engine"])

RECENT_WINDOW_DAYS = 30

def normalize_service_name(name: str) -> str:
    """Normalize service/skill name by lowercasing, stripping punctuation, and removing common filler adjectives."""
    if not name:
        return ""
    clean = re.sub(r'[^\w\s]', '', name.lower()).strip()
    # Remove common filler prefixes/suffixes
    clean = re.sub(r'\b(express|custom|homemade|traditional|beginner|master|designer|quality|authentic|specialist)\b', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    # Map common alias equivalences
    if any(k in clean for k in ["garment alteration", "garment fitting", "alteration", "fitting"]):
        return "garment alteration"
    if any(k in clean for k in ["blouse stitch", "saree blouse", "blouse"]):
        return "blouse stitching"
    if any(k in clean for k in ["embroidery", "aari"]):
        return "hand embroidery"
    if any(k in clean for k in ["sweet", "snack", "murukku", "adhirasam", "seedai"]):
        return "sweets & snacks"
    if any(k in clean for k in ["cook", "food", "catering", "tiffin"]):
        return "cooking"
    if any(k in clean for k in ["math", "mathematics"]):
        return "math tutoring"
    if any(k in clean for k in ["tutor", "teach", "hindi", "tamil", "english"]):
        return "tutoring"
    if any(k in clean for k in ["garden", "terrace", "plant"]):
        return "terrace garden care"
    return clean

def get_senior_domain(profile: ProviderProfile) -> Optional[str]:
    """Identify primary domain/category of a senior profile strictly based on stated skills/services/title."""
    skills_text = " ".join([s.name for s in profile.skills if s.name])
    services_text = " ".join([srv.name for srv in profile.services if srv.name])
    combined = f"{profile.title or ''} {profile.bio or ''} {skills_text} {services_text}".lower()

    if any(k in combined for k in ["cook", "dosa", "idli", "food", "catering", "sweet", "snack", "murukku", "adhirasam", "seedai", "tiffin", "meal", "biryani", "gravy", "kitchen", "bake"]):
        return "Food & Catering"
    if any(k in combined for k in ["tailor", "stitch", "blouse", "saree", "embroidery", "garment", "alteration", "fitting", "sew", "aari", "fabric", "craft"]):
        return "Tailoring & Handicrafts"
    if any(k in combined for k in ["tutor", "teach", "lesson", "hindi", "tamil", "english", "math", "mathematics", "reading", "homework", "academic"]):
        return "Education & Tutoring"
    if any(k in combined for k in ["garden", "plant", "lawn", "terrace", "organic"]):
        return "Gardening & Home Care"
    if any(k in combined for k in ["dance", "music", "vocal", "bharatanatyam", "carnatic"]):
        return "Arts & Culture"
    if any(k in combined for k in ["childcare", "babysit", "storytelling", "eldercare"]):
        return "Childcare & Eldercare"
    return None

def is_service_already_offered(candidate_service_name: str, profile: ProviderProfile) -> bool:
    """Return True if candidate service is already offered in senior's services or skills list."""
    cand_norm = normalize_service_name(candidate_service_name)
    if not cand_norm:
        return False
        
    for srv in profile.services:
        if srv.name:
            srv_norm = normalize_service_name(srv.name)
            if srv_norm == cand_norm or cand_norm in srv_norm or srv_norm in cand_norm:
                return True
    for sk in profile.skills:
        if sk.name:
            sk_norm = normalize_service_name(sk.name)
            if sk_norm == cand_norm or cand_norm in sk_norm or sk_norm in cand_norm:
                return True
    return False

def location_matches(senior_location: Optional[str], request_location: Optional[str]) -> bool:
    """Check if request location is compatible with senior location."""
    if not senior_location or not request_location:
        return True
    sen_clean = senior_location.lower()
    req_clean = request_location.lower()
    
    sen_parts = [p.strip() for p in sen_clean.split(',')]
    req_parts = [p.strip() for p in req_clean.split(',')]
    
    # Check for match in city or locality
    for sp in sen_parts:
        if len(sp) > 2 and any(sp in rp or rp in sp for rp in req_parts):
            return True
    return False

def generate_recommendations_for_profile(profile: ProviderProfile, db: Session) -> SeniorOpportunitiesResponse:
    domain = get_senior_domain(profile)
    if not domain:
        return SeniorOpportunitiesResponse(
            has_low_request_activity=True,
            recent_request_count=0,
            status_message="Complete your profile to receive personalized opportunities.",
            suggestions=[]
        )

    cutoff = datetime.utcnow() - timedelta(days=RECENT_WINDOW_DAYS)
    senior_location = profile.user.location if profile.user else None

    # Calculate recent request activity assigned to this provider
    recent_request_count = db.query(ServiceRequest).filter(
        ServiceRequest.provider_id == profile.id,
        ServiceRequest.created_at >= cutoff
    ).count()

    # Query all customer requests created in the last 30 days
    recent_requests = db.query(ServiceRequest).filter(
        ServiceRequest.created_at >= cutoff
    ).all()

    # Domain candidates configuration
    # Mapping of domain -> list of candidate recommendations with keywords & standard names
    domain_candidates = {
        "Food & Catering": [
            {
                "id": "opp-food-bulk",
                "title": "Offer Festival & Family Event Bulk Orders",
                "service_name": "Festival Bulk Food & Snack Orders",
                "keywords": ["sweet", "snack", "bulk", "festival", "catering", "tiffin", "food", "murukku", "adhirasam", "seedai", "sweets"],
                "matched_skills": ["Home Cooking", "Traditional Sweets"],
                "description": "Customers in your area submitted bulk food & catering requests in the last 30 days."
            },
            {
                "id": "opp-food-class",
                "title": "Offer Traditional Cooking Classes",
                "service_name": "Traditional Cooking Classes",
                "keywords": ["cook", "cooking class", "recipe", "teach cooking", "dosa class"],
                "matched_skills": ["Culinary Expertise", "Home Cooking"],
                "description": "Teach authentic recipes and traditional cooking techniques to local neighbors."
            },
            {
                "id": "opp-meal-prep",
                "title": "Offer Weekend Home Meal Preparation",
                "service_name": "Weekend Home Meal Preparation",
                "keywords": ["meal", "tiffin", "lunch", "dinner", "meal prep"],
                "matched_skills": ["Home Cooking", "Meal Prep"],
                "description": "Prepare healthy, traditional home-cooked meals for busy local families."
            }
        ],
        "Tailoring & Handicrafts": [
            {
                "id": "opp-tailor-alteration",
                "title": "Offer Express Garment Alterations",
                "service_name": "Express Garment Alterations",
                "keywords": ["alteration", "alter", "fitting", "garment alteration", "pant alteration", "stitch alteration", "garment fitting"],
                "matched_skills": ["Garment Fitting", "Stitching"],
                "description": "Customers in your service area submitted garment alteration requests in the last 30 days."
            },
            {
                "id": "opp-tailor-embroidery",
                "title": "Offer Designer Aari Hand Embroidery",
                "service_name": "Designer Aari Hand Embroidery",
                "keywords": ["embroidery", "aari", "hand embroidery", "designer embroidery"],
                "matched_skills": ["Hand Embroidery", "Aari Work"],
                "description": "High demand recorded for custom hand embroidery and decorative neckwork."
            },
            {
                "id": "opp-tailor-blouse",
                "title": "Offer Custom Saree Blouse Stitching",
                "service_name": "Custom Saree Blouse Stitching",
                "keywords": ["blouse", "saree blouse", "stitch blouse", "custom blouse"],
                "matched_skills": ["Saree Blouse Stitching", "Tailoring"],
                "description": "Local customers frequently request custom blouse stitching and lining finish."
            }
        ],
        "Education & Tutoring": [
            {
                "id": "opp-tutor-guide",
                "title": "Offer Conversational Language & Homework Guidance",
                "service_name": "Conversational Language & Homework Guidance",
                "keywords": ["tutor", "teach", "hindi", "tamil", "english", "homework", "exam", "reading"],
                "matched_skills": ["Language Teaching", "Student Support"],
                "description": "Provide patient language practice and academic homework guidance for local students."
            },
            {
                "id": "opp-tutor-math",
                "title": "Offer 1-on-1 Math Board Exam Coaching",
                "service_name": "1-on-1 Math Board Exam Coaching",
                "keywords": ["math", "mathematics", "algebra", "calculus", "exam prep"],
                "matched_skills": ["Mathematics Tutoring", "Exam Prep"],
                "description": "High local demand for high school mathematics problem-solving coaching."
            }
        ],
        "Gardening & Home Care": [
            {
                "id": "opp-garden-care",
                "title": "Offer Neighbourhood Terrace Garden Care",
                "service_name": "Neighbourhood Terrace Garden Care",
                "keywords": ["garden", "plant", "terrace", "lawn", "organic"],
                "matched_skills": ["Terrace Gardening", "Plant Maintenance"],
                "description": "Help local residents set up organic terrace vegetable gardens and maintain healthy plants."
            }
        ]
    }

    candidates = domain_candidates.get(domain, [])
    suggestions: List[OpportunitySuggestionItem] = []
    
    total_domain_demand_count = 0
    all_demanded_already_offered = True

    for cand in candidates:
        cand_service_name = cand["service_name"]

        # Check if senior ALREADY offers this service
        already_offered = is_service_already_offered(cand_service_name, profile)
        
        # Count demand signals strictly from recent requests in the last 30 days
        demand_count = 0
        for req in recent_requests:
            req_text = f"{req.title or ''} {req.description or ''} {req.category or ''}".lower()
            
            # STRICT DOMAIN FILTER: Ensure request matches domain keywords
            matches_domain = False
            if domain == "Food & Catering" and any(k in req_text for k in ["food", "cook", "sweet", "snack", "catering", "tiffin", "dosa", "chapati", "biryani"]):
                matches_domain = True
            elif domain == "Tailoring & Handicrafts" and any(k in req_text for k in ["tailor", "stitch", "blouse", "saree", "embroidery", "alteration", "fitting", "garment"]):
                matches_domain = True
            elif domain == "Education & Tutoring" and any(k in req_text for k in ["tutor", "teach", "hindi", "tamil", "english", "math", "homework"]):
                matches_domain = True
            elif domain == "Gardening & Home Care" and any(k in req_text for k in ["garden", "plant", "terrace"]):
                matches_domain = True
            
            if not matches_domain:
                continue

            # Check location compatibility
            if not location_matches(senior_location, req.location):
                continue

            # Check candidate keyword match
            if any(k in req_text for k in cand["keywords"]):
                demand_count += 1

        if demand_count > 0:
            total_domain_demand_count += demand_count
            if not already_offered:
                all_demanded_already_offered = False
                loc_label = senior_location or "your service area"
                reason_msg = f"Customers in {loc_label} submitted {demand_count} {cand['keywords'][0]} request{'s' if demand_count > 1 else ''} in the last 30 days, and this service matches your {domain.lower()} profile."
                
                suggestions.append(OpportunitySuggestionItem(
                    id=cand["id"],
                    title=cand["title"],
                    type="REAL_DEMAND",
                    matched_skills=cand["matched_skills"],
                    reason=reason_msg,
                    demand_count=demand_count,
                    time_window_days=RECENT_WINDOW_DAYS,
                    location=senior_location or "Local Area",
                    category=domain,
                    confidence="high",
                    suggested_action="ADD_SERVICE",
                    suggested_service_name=cand_service_name,
                    suggested_description=cand["description"],
                    badge_label="REAL MARKET DEMAND"
                ))

    # Formulate edge case status message if suggestions list is empty
    status_msg = None
    if not suggestions:
        if total_domain_demand_count > 0 and all_demanded_already_offered:
            status_msg = "Your current services already cover the recent local demand."
        else:
            status_msg = "No new local service opportunities found in the last 30 days."

    return SeniorOpportunitiesResponse(
        has_low_request_activity=(recent_request_count <= 2),
        recent_request_count=recent_request_count,
        status_message=status_msg,
        suggestions=suggestions
    )

@router.get("/me/opportunities", response_model=SeniorOpportunitiesResponse)
def get_my_opportunity_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Proactively identifies realistic service expansion opportunities for Seniors
    based on REAL customer demand in the last 30 days within their domain & location.
    """
    if current_user.role != "SENIOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Senior Service Providers can access personalized profile recommendations."
        )

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        return SeniorOpportunitiesResponse(
            has_low_request_activity=True,
            recent_request_count=0,
            status_message="Complete your profile to receive personalized opportunities.",
            suggestions=[]
        )

    resp = generate_recommendations_for_profile(profile, db)

    # PROACTIVE NOTIFICATION: Trigger AI Opportunity notification for low activity seniors
    try:
        from app.services.notification_service import NotificationService
        from app.models.domain import Notification
        if resp.suggestions:
            top_sug = resp.suggestions[0]
            # Check if notification was sent recently
            existing_notif = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.type == "OPPORTUNITY_SUGGESTION",
                Notification.title == "Opportunity Found"
            ).first()
            if not existing_notif:
                NotificationService.notify_opportunity(
                    db=db,
                    senior_user_id=current_user.id,
                    service_name=top_sug.suggested_service_name or "traditional cooking",
                    match_score=95,
                    estimated_earning=2000.0
                )
    except Exception as e:
        print(f"[Notification Opportunity Error] {e}")

    return resp

@router.get("/{provider_id}/opportunities", response_model=List[OpportunitySuggestion])
def get_opportunity_suggestions(
    provider_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint preserved for backward compatibility.
    Strictly verifies JWT authentication & ownership so seniors cannot query another senior's profile data.
    """
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot request another senior's recommendations."
        )

    resp = generate_recommendations_for_profile(profile, db)
    legacy_suggestions: List[OpportunitySuggestion] = []
    
    for item in resp.suggestions:
        legacy_suggestions.append(OpportunitySuggestion(
            id=item.id,
            title=item.title,
            category=item.category or "General",
            description=item.suggested_description or item.reason,
            action_type="ADD_SERVICE",
            suggested_value=item.suggested_service_name,
            reason=item.reason,
            badge_label=item.badge_label
        ))

    return legacy_suggestions

