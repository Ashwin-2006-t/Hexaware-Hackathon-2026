from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "provider"
    user_type: Optional[str] = "senior"
    age: Optional[int] = 65
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    languages: Optional[str] = "English, Hindi"
    availability: Optional[str] = "Flexible / Weekday Mornings"
    is_published: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    languages: Optional[str] = None
    availability: Optional[str] = None
    is_published: Optional[bool] = None
    age: Optional[int] = None
    user_type: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    completed_services_count: Optional[int] = 0
    trust_badge_level: Optional[str] = "verified_senior"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Skill Schemas ---
class SkillBase(BaseModel):
    category: str
    title: str
    description: Optional[str] = None
    proficiency_level: Optional[str] = "Expert"
    years_experience: Optional[int] = 10
    hourly_rate: Optional[float] = 350.0  # ₹ INR

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: int
    user_id: int
    verified: bool

    class Config:
        from_attributes = True


# --- Service Listing Schemas ---
class ServiceBase(BaseModel):
    title: str
    category: str
    description: str
    price_per_hour: float  # ₹ INR
    location_name: Optional[str] = None
    service_area: Optional[str] = "Within 10 km"
    home_service: Optional[bool] = True
    availability: Optional[str] = "Flexible"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[float] = None
    location_name: Optional[str] = None
    service_area: Optional[str] = None
    home_service: Optional[bool] = None
    availability: Optional[str] = None
    is_published: Optional[bool] = None

class ServiceResponse(ServiceBase):
    id: int
    provider_id: int
    status: str
    is_published: bool = True
    created_at: str
    provider_name: Optional[str] = None
    provider_avatar: Optional[str] = None
    provider_user_type: Optional[str] = "Senior Citizen"
    rating: Optional[float] = 4.9
    total_reviews: Optional[int] = 12
    completed_services: Optional[int] = 15
    verified_badge: Optional[bool] = True
    years_experience: Optional[int] = 20

    class Config:
        from_attributes = True


# --- Booking Schemas ---
class BookingCreate(BaseModel):
    provider_id: int
    service_id: int
    total_price: float
    scheduled_date: str
    notes: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str  # 'confirmed', 'completed', 'cancelled'

class BookingResponse(BaseModel):
    id: int
    customer_id: int
    provider_id: int
    service_id: int
    status: str
    total_price: float
    scheduled_date: str
    notes: Optional[str] = None
    created_at: str
    customer_name: Optional[str] = None
    provider_name: Optional[str] = None
    service_title: Optional[str] = None

    class Config:
        from_attributes = True


# --- Review Schemas ---
class ReviewCreate(BaseModel):
    booking_id: int
    rating: int  # 1 to 5
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    provider_id: int
    rating: int
    comment: Optional[str] = None
    created_at: str
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- AI Engine Schemas ---
class SkillExtractRequest(BaseModel):
    raw_prompt: str
    preferred_category: Optional[str] = None

class ExtractedSkillItem(BaseModel):
    title: str
    category: str
    proficiency_level: str
    years_experience: int
    suggested_hourly_rate: float
    suggested_bio: str
    key_highlights: List[str]

class SkillExtractionResponse(BaseModel):
    success: bool
    ai_available: Optional[bool] = True
    ai_message: Optional[str] = None
    skills: List[ExtractedSkillItem]
    generated_profile_bio: str
    ai_mentor_tip: str

class ProfileBuilderRequest(BaseModel):
    name: str
    skills: List[str]
    experience_years: int
    location: str
    interests: Optional[str] = None

class ProfileBuilderResponse(BaseModel):
    success: bool
    ai_available: bool = True
    headline: str
    about_text: str
    suggested_services: List[Dict[str, Any]]
    is_ai_assisted: bool = True
    notice: str = "AI-assisted — please verify before publishing"

class BusinessGuidanceRequest(BaseModel):
    query: str  # e.g., "sell homemade pickles" or "math tuition"
    location: Optional[str] = "Mumbai, Maharashtra"

class BusinessGuidanceResponse(BaseModel):
    success: bool
    ai_available: bool = True
    topic: str
    idea_summary: str
    target_customers: str
    pricing_strategy: str  # in ₹ INR
    marketing_and_outreach: str
    first_three_steps: List[str]
    packaging_and_hygiene: str
    disclaimer: str = "Practical guidance for informal home businesses in India. Not legal or tax advice."

# --- Smart Match & Opportunity Engine Schemas ---
class SmartMatchRequest(BaseModel):
    service_query: str
    category: Optional[str] = None
    max_distance_km: Optional[float] = 25.0
    customer_latitude: Optional[float] = 19.0760
    customer_longitude: Optional[float] = 72.8777

class MatchProviderResult(BaseModel):
    provider_id: int
    provider_name: str
    provider_avatar: Optional[str] = None
    provider_user_type: Optional[str] = "Senior Citizen"
    service_id: int
    service_title: str
    category: str
    price_per_hour: float
    location_name: str
    distance_km: float
    match_score: float  # 0 to 100
    match_reasons: List[str]
    breakdown: Optional[Dict[str, float]] = None
    skills: List[str]
    rating: float
    years_experience: int
    completed_services: int = 0
    verified_badge: bool = True
    ai_reasoning: str

class SmartMatchResponse(BaseModel):
    query: str
    top_matches: List[MatchProviderResult]
    total_found: int

class OpportunityItem(BaseModel):
    id: str
    title: str
    category: str
    customer_location: str
    distance_km: float
    budget_range: str
    match_score: float
    match_reasons: List[str]
    posted_ago: str
    description: str
    is_applied: bool = False

class OpportunityFeedResponse(BaseModel):
    provider_id: int
    opportunities: List[OpportunityItem]
    total: int

class OpportunityInterestResponse(BaseModel):
    success: bool
    message: str
    opportunity_id: str
    provider_id: int
    is_applied: bool = True
    applied_at: str

class AssistantChatRequest(BaseModel):
    message: str
    user_context: Optional[str] = "senior_provider"
    language: Optional[str] = "en"

class AssistantChatResponse(BaseModel):
    ai_available: Optional[bool] = True
    ai_message: Optional[str] = None
    reply: str
    suggested_actions: List[str]
