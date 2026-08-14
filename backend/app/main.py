import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import providers, skills, services, requests, matches, ai, seed
from app.models.domain import ProviderProfile

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SilverHands API",
    description="India's AI-Powered Digital Livelihood Platform for Senior Citizens & Homemakers",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(providers.router)
app.include_router(skills.router)
app.include_router(services.router)
app.include_router(requests.router)
app.include_router(matches.router)
app.include_router(ai.router)
app.include_router(seed.router)

@app.on_event("startup")
def auto_seed_on_startup():
    db = SessionLocal()
    try:
        count = db.query(ProviderProfile).count()
        if count == 0:
            print("[Startup] Empty database detected. Auto-seeding realistic Chennai providers...")
            seed.run_seed_data(db)
            print("[Startup] Auto-seed complete.")
    except Exception as e:
        print(f"[Startup] Auto-seed failed: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SilverHands API",
        "version": "1.0.0",
        "environment": "production"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
