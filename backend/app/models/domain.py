import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    auth_user_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    role = Column(String, nullable=False, default="SENIOR")  # 'SENIOR' or 'CUSTOMER'
    profile_setup_completed = Column(Boolean, default=False)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("ProviderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    requests = relationship("ServiceRequest", back_populates="customer", cascade="all, delete-orphan", foreign_keys="[ServiceRequest.customer_id]")

class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    title = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0)
    languages = Column(String, nullable=True, default="Tamil, English")
    target_age_group = Column(String, nullable=True)
    availability = Column(String, default="Available")
    status = Column(String, default="PUBLISHED")  # 'DRAFT', 'PUBLISHED', 'UNPUBLISHED'
    readiness_score = Column(Integer, default=80)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    price = Column(Float, nullable=True, default=None)
    pricing_unit = Column(String, default="per_service")  # 'per_service', 'per_hour', 'per_person', 'per_session', 'negotiable'
    payment_method = Column(String, default="upi")  # 'upi', 'cash', 'bank_transfer', 'other'
    payment_upi_id = Column(String, nullable=True)  # e.g. "seniorname@upi"
    payment_instructions = Column(Text, nullable=True)  # e.g. "Pay via UPI or cash upon service completion"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")
    skills = relationship("Skill", back_populates="provider", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="provider", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="provider", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String, primary_key=True, default=generate_uuid)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    proficiency = Column(String, default="Expert")

    provider = relationship("ProviderProfile", back_populates="skills")

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=generate_uuid)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    price_range = Column(String, nullable=True)

    provider = relationship("ProviderProfile", back_populates="services")

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    message = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    preferred_date = Column(String, nullable=True)
    requirement_quantity = Column(Integer, default=1)
    requirement_unit = Column(String, default="units")
    status = Column(String, default="PENDING")  # 'PENDING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'
    agreed_price = Column(Float, nullable=True, default=None)
    agreed_pricing_unit = Column(String, nullable=True, default="per_service")
    
    # Quote Lifecycle Fields
    quote_amount = Column(Float, nullable=True)
    quote_pricing_unit = Column(String, nullable=True)
    quote_additional_charge = Column(Float, default=0.0)
    quote_note = Column(Text, nullable=True)
    quote_status = Column(String, default="PENDING")  # 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'
    quoted_at = Column(DateTime, nullable=True)
    quote_responded_at = Column(DateTime, nullable=True)

    # Payment Lifecycle Fields (No real gateway)
    payment_status = Column(String, default="NOT_REQUIRED")  # 'NOT_REQUIRED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMATION', 'PAID', 'REFUNDED'
    payment_method = Column(String, nullable=True)
    payment_upi_id = Column(String, nullable=True)
    payment_instructions = Column(Text, nullable=True)
    payment_confirmation_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("User", back_populates="requests", foreign_keys=[customer_id])
    provider = relationship("ProviderProfile")
    matches = relationship("Match", back_populates="request", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="request", cascade="all, delete-orphan")

class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("service_requests.id"), nullable=False)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("ServiceRequest", back_populates="matches")
    provider = relationship("ProviderProfile")

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, UniqueConstraint

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("request_id", name="uq_review_request"),)

    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("service_requests.id"), nullable=False)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("ServiceRequest", back_populates="reviews")
    customer = relationship("User")
    provider = relationship("ProviderProfile", back_populates="reviews")

class SavedProvider(Base):
    __tablename__ = "saved_providers"
    __table_args__ = (UniqueConstraint("customer_id", "provider_id", name="uq_saved_provider_customer_provider"),)

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("User")
    provider = relationship("ProviderProfile")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # 'NEW_SERVICE_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'QUOTE_RECEIVED', 'PAYMENT_CONFIRMED', 'SERVICE_COMPLETED', 'NEW_REVIEW', 'OPPORTUNITY_SUGGESTION'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_request_id = Column(String, ForeignKey("service_requests.id"), nullable=True)
    whatsapp_status = Column(String, default="SENT (DEMO)")
    whatsapp_phone = Column(String, nullable=True)
    whatsapp_message = Column(Text, nullable=True)
    whatsapp_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    related_request = relationship("ServiceRequest")



