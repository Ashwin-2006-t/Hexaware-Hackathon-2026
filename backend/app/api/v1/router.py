from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, providers, services, ai, bookings, reviews, seed, opportunities, map, notifications, family

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(providers.router, prefix="/providers", tags=["Providers"])
api_router.include_router(services.router, prefix="/services", tags=["Services"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["Opportunities & Demand"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Agents"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(family.router, prefix="/family", tags=["Family Circle"])
api_router.include_router(map.router, prefix="/map", tags=["Geospatial & Discovery"])
api_router.include_router(map.router, prefix="", tags=["Geospatial Updates"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Quiet Insight Notifications"])
api_router.include_router(seed.router, tags=["Database Seed"])

