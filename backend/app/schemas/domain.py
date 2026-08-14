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
    experience_years: int = 0
    availability: str = "Available"
    rating: float = 4.5
    total_reviews: int = 0

class ProviderProfileCreate(ProviderProfileBase):
    user_id: str

class ProviderDetailResponse(ProviderProfileBase):
    id: str
    user_id: str
    created_at: datetime
    user: Optional[UserResponse] = None
    skills: List[SkillResponse] = []
    services: List[ServiceResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Provider Full Register Schema
class ProviderRegisterRequest(BaseModel):
    name: str
    email: str
    location: str = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    title: str
    bio: str
    experience_years: int
    availability: str = "Available"
    skills: List[str] = []
    services: List[str] = []

# ServiceRequest Schemas
class ServiceRequestBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = "General"
    location: Optional[str] = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    preferred_date: Optional[str] = None

class ServiceRequestCreate(ServiceRequestBase):
    customer_id: str

class ServiceRequestResponse(ServiceRequestBase):
    id: str
    customer_id: str
    status: str
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
    experience_years: int
    services: List[str]
    keywords: List[str]
    suggested_title: str

class ProfileGenerationRequest(BaseModel):
    skills: List[str]
    experience_years: int
    services: List[str]

class ProfileGenerationResponse(BaseModel):
    suggested_title: str
    bio: str
    service_descriptions: List[str]
    keywords: List[str]

class AIChatRequest(BaseModel):
    message: str
