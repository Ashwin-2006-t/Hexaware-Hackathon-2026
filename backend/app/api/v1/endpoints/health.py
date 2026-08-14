from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.db.session import check_db_connection

router = APIRouter()


@router.get("/health", summary="System Health Check")
def health_check():
    """
    Returns system status, API version, environment configuration, 
    and database connectivity state.
    """
    db_health = check_db_connection()
    
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_health,
        "services": {
            "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY),
            "gemini_ai_configured": bool(settings.GEMINI_API_KEY)
        }
    }
