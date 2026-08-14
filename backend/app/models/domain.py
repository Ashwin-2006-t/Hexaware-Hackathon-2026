import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="provider")  # 'provider', 'customer', 'admin'
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")
    services = relationship("ServiceListing", back_populates="provider", cascade="all, delete-orphan")
    bookings_as_customer = relationship("Booking", foreign_keys="[Booking.customer_id]", back_populates="customer")
    bookings_as_provider = relationship("Booking", foreign_keys="[Booking.provider_id]", back_populates="provider")
    reviews_given = relationship("Review", foreign_keys="[Review.customer_id]", back_populates="customer")
    reviews_received = relationship("Review", foreign_keys="[Review.provider_id]", back_populates="provider")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, index=True, nullable=False)  # Cooking, Tutoring, Crafts, Gardening, Consulting
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    proficiency_level = Column(String, default="Expert")  # Beginner, Intermediate, Expert, Master
    years_experience = Column(Integer, default=10)
    hourly_rate = Column(Float, default=25.0)
    verified = Column(Boolean, default=True)

    user = relationship("User", back_populates="skills")


class ServiceListing(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    price_per_hour = Column(Float, nullable=False)
    location_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="active")  # 'active', 'inactive'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    provider = relationship("User", back_populates="services")
    bookings = relationship("Booking", back_populates="service")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    status = Column(String, default="pending")  # 'pending', 'confirmed', 'completed', 'cancelled'
    total_price = Column(Float, nullable=False)
    scheduled_date = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("User", foreign_keys=[customer_id], back_populates="bookings_as_customer")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="bookings_as_provider")
    service = relationship("ServiceListing", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="review")
    customer = relationship("User", foreign_keys=[customer_id], back_populates="reviews_given")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="reviews_received")
