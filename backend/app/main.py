import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import providers, skills, services, requests, matches, ai, seed, opportunities, users, reviews, saved_providers, notifications, virtual_rooms, calls, ai_interview
from app.models.domain import ProviderProfile, User, Review, ServiceRequest, VirtualRoom, CallLog, AIInterviewSession

from sqlalchemy import text

# Create database tables & apply safe column migrations
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    for migration_sql in [
        "ALTER TABLE provider_profiles ADD COLUMN languages VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN target_age_group VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN status VARCHAR DEFAULT 'PUBLISHED';",
        "ALTER TABLE provider_profiles ADD COLUMN readiness_score INTEGER DEFAULT 80;",
        "ALTER TABLE provider_profiles ADD COLUMN price FLOAT;",
        "ALTER TABLE provider_profiles ADD COLUMN pricing_unit VARCHAR DEFAULT 'per_service';",
        "ALTER TABLE provider_profiles ADD COLUMN payment_method VARCHAR DEFAULT 'upi';",
        "ALTER TABLE provider_profiles ADD COLUMN payment_upi_id VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN payment_instructions TEXT;",
        "ALTER TABLE users ADD COLUMN phone VARCHAR;",
        "ALTER TABLE users ADD COLUMN auth_user_id VARCHAR;",
        "ALTER TABLE users ADD COLUMN password_hash VARCHAR;",
        "ALTER TABLE users ADD COLUMN profile_setup_completed BOOLEAN DEFAULT 0;",
        "ALTER TABLE service_requests ADD COLUMN provider_id VARCHAR;",
        "ALTER TABLE service_requests ADD COLUMN message TEXT;",
        "ALTER TABLE service_requests ADD COLUMN agreed_price FLOAT;",
        "ALTER TABLE service_requests ADD COLUMN agreed_pricing_unit VARCHAR DEFAULT 'per_service';",
        "ALTER TABLE service_requests ADD COLUMN payment_status VARCHAR DEFAULT 'NOT_REQUIRED';",
        "ALTER TABLE service_requests ADD COLUMN requirement_quantity INTEGER DEFAULT 1;",
        "ALTER TABLE service_requests ADD COLUMN requirement_unit VARCHAR DEFAULT 'units';",
        "ALTER TABLE service_requests ADD COLUMN quote_amount FLOAT;",
        "ALTER TABLE service_requests ADD COLUMN quote_pricing_unit VARCHAR;",
        "ALTER TABLE service_requests ADD COLUMN quote_additional_charge FLOAT DEFAULT 0.0;",
        "ALTER TABLE service_requests ADD COLUMN quote_note TEXT;",
        "ALTER TABLE service_requests ADD COLUMN quote_status VARCHAR DEFAULT 'PENDING';",
        "ALTER TABLE service_requests ADD COLUMN quoted_at DATETIME;",
        "ALTER TABLE service_requests ADD COLUMN quote_responded_at DATETIME;",
        "ALTER TABLE service_requests ADD COLUMN payment_method VARCHAR;",
        "ALTER TABLE service_requests ADD COLUMN payment_upi_id VARCHAR;",
        "ALTER TABLE service_requests ADD COLUMN payment_instructions TEXT;",
        "ALTER TABLE service_requests ADD COLUMN payment_confirmation_at DATETIME;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_message_id VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_recipient VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_type VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_status VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_phone VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_message TEXT;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_sent_at VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_delivered_at VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_read_at VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_failed_at VARCHAR;",
        "ALTER TABLE notifications ADD COLUMN whatsapp_error_details TEXT;",
        "ALTER TABLE notifications ADD COLUMN is_cleared BOOLEAN DEFAULT 0;",
        "ALTER TABLE ai_interview_sessions ADD COLUMN session_type VARCHAR DEFAULT 'REGISTRATION';",
        "ALTER TABLE ai_interview_sessions ADD COLUMN language VARCHAR DEFAULT 'en';",
        "ALTER TABLE ai_interview_sessions ADD COLUMN existing_profile_snapshot TEXT;",
        "ALTER TABLE users ADD COLUMN city VARCHAR;",
        "ALTER TABLE users ADD COLUMN state VARCHAR;",
        "ALTER TABLE users ADD COLUMN country VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN location VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN latitude FLOAT;",
        "ALTER TABLE provider_profiles ADD COLUMN longitude FLOAT;",
        "ALTER TABLE provider_profiles ADD COLUMN city VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN state VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN country VARCHAR;",
        "ALTER TABLE provider_profiles ADD COLUMN service_delivery_mode VARCHAR DEFAULT 'BOTH';",
        "ALTER TABLE services ADD COLUMN delivery_mode VARCHAR DEFAULT 'BOTH';",
        "ALTER TABLE service_requests ADD COLUMN delivery_mode VARCHAR DEFAULT 'BOTH';"
    ]:
        try:
            conn.execute(text(migration_sql))
        except Exception:
            pass
    conn.commit()

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
app.include_router(users.router)
app.include_router(providers.router)
app.include_router(opportunities.router)
app.include_router(skills.router)
app.include_router(services.router)
app.include_router(requests.router)
app.include_router(matches.router)
app.include_router(ai.router)
app.include_router(ai_interview.router)
app.include_router(seed.router)
app.include_router(reviews.router)
app.include_router(saved_providers.router)
app.include_router(notifications.router)
app.include_router(virtual_rooms.router)
app.include_router(calls.router)

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

@app.get("/api/health/db-check")
def db_health_check():
    db = SessionLocal()
    try:
        provider_count = db.query(ProviderProfile).count()
        review_count = db.query(Review).count()
        request_count = db.query(ServiceRequest).count()
        user_count = db.query(User).count()
        virtual_room_count = db.query(VirtualRoom).count()
        call_log_count = db.query(CallLog).count()
        from app.database import DATABASE_URL
        runtime_db = "SQLite (" + DATABASE_URL + ")" if "sqlite" in DATABASE_URL else "Supabase PostgreSQL"
        return {
            "status": "healthy",
            "runtime_database": runtime_db,
            "persisted_records": {
                "users": user_count,
                "provider_profiles": provider_count,
                "reviews": review_count,
                "service_requests": request_count,
                "virtual_rooms": virtual_room_count,
                "call_logs": call_log_count
            }
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
