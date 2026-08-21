from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# Skill Schemas
class SkillBase(BaseModel):
    name: str
    category: Optional[str] = "General"
    proficiency: Optional[str] = "Expert"

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: str
    provider_id: str
    model_config = ConfigDict(from_attributes=True)

# Service Schemas
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "General"
    price_range: Optional[str] = "Negotiable"
    delivery_mode: Optional[str] = "BOTH"

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str
    provider_id: str
    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "provider"  # 'provider' or 'customer'
    location: Optional[str] = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ProviderProfile Schemas
class ProviderProfileBase(BaseModel):
    title: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = 0
    languages: Optional[str] = "Tamil, English"
    target_age_group: Optional[str] = None
    availability: str = "Available"
    service_delivery_mode: Optional[str] = "BOTH"
    rating: Optional[float] = None
    total_reviews: int = 0
    price: Optional[float] = None
    pricing_unit: Optional[str] = "per_service"
    payment_method: Optional[str] = "upi"
    payment_upi_id: Optional[str] = None
    payment_instructions: Optional[str] = None

class ProviderProfileCreate(ProviderProfileBase):
    user_id: str

class PublicProviderResponse(BaseModel):
    id: str
    user_id: str
    created_at: datetime
    title: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = 0
    languages: Optional[str] = "Tamil, English"
    target_age_group: Optional[str] = None
    availability: str = "Available"
    service_delivery_mode: Optional[str] = "BOTH"
    status: Optional[str] = "PUBLISHED"
    readiness_score: Optional[int] = 85
    rating: Optional[float] = None
    total_reviews: int = 0
    price: Optional[float] = None
    pricing_unit: Optional[str] = "per_service"
    user: Optional[UserResponse] = None
    skills: List[SkillResponse] = []
    services: List[ServiceResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ProviderDetailResponse(ProviderProfileBase):
    id: str
    user_id: str
    created_at: datetime
    status: Optional[str] = "PUBLISHED"
    readiness_score: Optional[int] = 85
    user: Optional[UserResponse] = None
    skills: List[SkillResponse] = []
    services: List[ServiceResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ProviderProfileUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    target_age_group: Optional[str] = None
    availability: Optional[str] = None
    service_delivery_mode: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    services: Optional[List[str]] = None
    price: Optional[float] = None
    pricing_unit: Optional[str] = None
    payment_method: Optional[str] = None
    payment_upi_id: Optional[str] = None
    payment_instructions: Optional[str] = None
    status: Optional[str] = None

class NLPUpdateProposal(BaseModel):
    intent: str  # ADD_SERVICE, REMOVE_SERVICE, ADD_SKILL, REMOVE_SKILL, UPDATE_EXPERIENCE, UPDATE_LOCATION, DELETE_PROFILE
    summary: str
    target_field: Optional[str] = None
    value: Optional[str] = None
    draft_update: ProviderProfileUpdate

class OpportunitySuggestion(BaseModel):
    id: str
    title: str
    category: str
    description: str
    action_type: str  # ADD_SERVICE, UPDATE_PROFILE, HIGHLIGHT_SKILL
    suggested_value: str
    reason: str
    badge_label: str = "Suggested opportunity"

# Provider Full Register Schema
class ProviderRegisterRequest(BaseModel):
    name: str
    email: str
    location: str = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    title: str
    bio: str
    experience_years: Optional[int] = 0
    languages: Optional[str] = "Tamil, English"
    target_age_group: Optional[str] = None
    availability: str = "Available"
    service_delivery_mode: Optional[str] = "BOTH"
    price: Optional[float] = None
    pricing_unit: Optional[str] = "per_service"
    payment_method: Optional[str] = "upi"
    payment_upi_id: Optional[str] = None
    payment_instructions: Optional[str] = None
    skills: List[str] = []
    services: List[str] = []

# ServiceRequest Schemas
class ServiceRequestBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = "General"
    location: Optional[str] = "Chennai, Tamil Nadu"
    delivery_mode: Optional[str] = "BOTH"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    preferred_date: Optional[str] = None
    requirement_quantity: Optional[int] = 1
    requirement_unit: Optional[str] = "units"

class ServiceRequestCreate(ServiceRequestBase):
    customer_id: str

class SendQuotePayload(BaseModel):
    quote_amount: float
    additional_charge: Optional[float] = 0.0
    note: Optional[str] = None

class ServiceRequestResponse(ServiceRequestBase):
    id: str
    customer_id: str
    provider_id: Optional[str] = None
    status: str
    agreed_price: Optional[float] = None
    agreed_pricing_unit: Optional[str] = "per_service"
    quote_amount: Optional[float] = None
    quote_pricing_unit: Optional[str] = None
    quote_additional_charge: Optional[float] = 0.0
    quote_note: Optional[str] = None
    quote_status: Optional[str] = "PENDING"
    quoted_at: Optional[datetime] = None
    quote_responded_at: Optional[datetime] = None
    payment_status: Optional[str] = "NOT_REQUIRED"
    payment_method: Optional[str] = None
    payment_upi_id: Optional[str] = None
    payment_instructions: Optional[str] = None
    payment_confirmation_at: Optional[datetime] = None
    created_at: datetime
    customer: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

# Match Response Schemas
class MatchReasonDetail(BaseModel):
    text: str
    is_positive: bool = True

class MatchResponse(BaseModel):
    id: Optional[str] = None
    request_id: str
    provider_id: str
    score: float  # 0 to 100
    distance_km: Optional[float] = None
    matched_skills: List[str] = []
    reasons: List[str] = []
    explanation: Optional[str] = None
    provider: Optional[ProviderDetailResponse] = None

# AI Endpoints Schemas
class SkillAnalysisRequest(BaseModel):
    description: str

class SkillAnalysisResponse(BaseModel):
    skills: List[str]
    category: str
    experience_years: Optional[int] = None
    target_age_group: Optional[str] = None
    languages: List[str] = []
    services: List[str]
    keywords: List[str]
    suggested_title: str

class ProfileGenerationRequest(BaseModel):
    skills: List[str]
    experience_years: Optional[int] = None
    services: List[str]

class ProfileGenerationResponse(BaseModel):
    suggested_title: str
    bio: str
    service_descriptions: List[str]
    keywords: List[str]

class AIChatRequest(BaseModel):
    message: str

class OpportunitySuggestionItem(BaseModel):
    id: str
    title: str
    type: str  # "REAL_DEMAND" or "SKILL_OPPORTUNITY"
    matched_skills: List[str] = []
    reason: str
    demand_count: Optional[int] = None
    time_window_days: Optional[int] = 30
    location: Optional[str] = None
    category: Optional[str] = None
    confidence: str = "medium"  # "high", "medium"
    suggested_action: str = "ADD_SERVICE"
    suggested_service_name: str
    suggested_description: Optional[str] = None
    badge_label: str  # "REAL MARKET DEMAND" or "POTENTIAL OPPORTUNITY"
    estimated_earning: Optional[float] = 2500.0
    match_score: Optional[int] = 85

class SeniorOpportunitiesResponse(BaseModel):
    has_low_request_activity: bool = True
    recent_request_count: int = 0
    status_message: Optional[str] = None
    suggestions: List[OpportunitySuggestionItem] = []

# AI Interview Room Schemas
class AIInterviewStartRequest(BaseModel):
    selected_domain: str
    selected_skill: str
    session_type: Optional[str] = "REGISTRATION"  # 'REGISTRATION' or 'UPDATE'
    language: Optional[str] = "en"                # 'en', 'ta', 'hi'

class AIInterviewAnswerRequest(BaseModel):
    answer: str
    input_type: Optional[str] = "TEXT"  # 'TEXT' or 'VOICE'

class LocationUpdatePayload(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    readable_address: Optional[str] = None

class ApprovedServiceItem(BaseModel):
    name: str
    category: Optional[str] = "General"
    description: Optional[str] = None
    price_range: Optional[str] = "Negotiable"
    delivery_mode: Optional[str] = "BOTH"

class AIInterviewApproveRequest(BaseModel):
    approved_skills: List[str] = []
    approved_services: List[ApprovedServiceItem] = []
    experience_years: Optional[int] = None
    bio_summary: Optional[str] = None

class AIInterviewMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    message: str
    input_type: str
    question_number: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AIInterviewResultResponse(BaseModel):
    id: str
    session_id: str
    detected_skills: str  # JSON or text
    experience_summary: str
    capabilities: str     # JSON or text
    confidence_score: int
    suggested_services: str # JSON or text
    evidence: Optional[str] = None
    recommendation_reason: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AIInterviewSessionResponse(BaseModel):
    id: str
    senior_id: str
    session_type: Optional[str] = "REGISTRATION"
    language: Optional[str] = "en"
    selected_domain: str
    selected_skill: str
    existing_profile_snapshot: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    overall_score: Optional[int] = None
    summary: Optional[str] = None
    messages: List[AIInterviewMessageResponse] = []
    result: Optional[AIInterviewResultResponse] = None
    next_question: Optional[str] = None
    is_completed_ready: bool = False
    model_config = ConfigDict(from_attributes=True)


