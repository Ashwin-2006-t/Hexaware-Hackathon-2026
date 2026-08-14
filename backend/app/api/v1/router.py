from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, providers, services, ai, bookings, reviews, seed

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(providers.router, prefix="/providers", tags=["Providers"])
api_router.include_router(services.router, prefix="/services", tags=["Services"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Agents"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(seed.router, tags=["Database Seed"])
