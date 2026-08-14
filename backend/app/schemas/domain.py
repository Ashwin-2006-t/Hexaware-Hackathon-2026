from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "provider"  # 'provider', 'customer', 'admin'
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Skill Schemas
class SkillBase(BaseModel):
    category: str
    title: str
    description: Optional[str] = None
    proficiency_level: str = "Expert"
    years_experience: int = 10
    hourly_rate: float = 25.0

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: int
    user_id: int
    verified: bool

    class Config:
        from_attributes = True

# Service Listing Schemas
class ServiceBase(BaseModel):
    title: str
    category: str
    description: str
    price_per_hour: float
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    provider_id: int
    status: str
    created_at: str
    provider_name: Optional[str] = None
    provider_avatar: Optional[str] = None
    rating: Optional[float] = 4.9

    class Config:
        from_attributes = True

# Booking Schemas
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
    service_title: Optional[str] = None
    provider_name: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True

# Review Schemas
class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
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

# AI Agent Schemas
class SkillExtractionRequest(BaseModel):
    raw_prompt: str  # e.g., "I have been cooking traditional South Indian recipes for 35 years and love teaching young families."
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
    skills: List[ExtractedSkillItem]
    generated_profile_bio: str
    ai_mentor_tip: str

class SmartMatchRequest(BaseModel):
    service_query: str
    category: Optional[str] = None
    max_distance_km: Optional[float] = 25.0
    customer_latitude: Optional[float] = 37.7749
    customer_longitude: Optional[float] = -122.4194

class MatchProviderResult(BaseModel):
    provider_id: int
    provider_name: str
    provider_avatar: Optional[str] = None
    service_id: int
    service_title: str
    category: str
    price_per_hour: float
    location_name: str
    distance_km: float
    match_score: float  # 0 to 100
    skills: List[str]
    rating: float
    years_experience: int
    ai_reasoning: str

class SmartMatchResponse(BaseModel):
    query: str
    top_matches: List[MatchProviderResult]
    total_found: int

class AssistantChatRequest(BaseModel):
    message: str
    user_context: Optional[str] = "senior_provider"

class AssistantChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str]
