import logging
import os
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

_engine = None
_SessionLocal = None

# Resolve the canonical uploads directory (used by main.py static mount AND upload endpoints)
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))


def get_engine():
    global _engine
    if _engine is not None:
        return _engine

    db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
    if not db_url or "YOUR-PASSWORD" in db_url or "[YOUR" in db_url or "<" in db_url:
        logger.warning("DATABASE_URL is not configured or contains placeholders. Using local sqlite:///./silverhands.db")
        db_url = "sqlite:///./silverhands.db"

    # Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # Log which DB host is being targeted (mask password)
    try:
        parsed = urlparse(db_url)
        safe_host = parsed.hostname or "localhost"
        safe_port = parsed.port or ""
        safe_scheme = parsed.scheme or "sqlite"
        logger.info(f"DATABASE TARGET: {safe_scheme}://{safe_host}:{safe_port} (password hidden)")
    except Exception:
        logger.info(f"DATABASE TARGET: {db_url[:20]}...")

    if db_url.startswith("sqlite"):
        _engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
        logger.info("Using LOCAL SQLite database: silverhands.db")
    else:
        # PostgreSQL engine for Supabase
        try:
            test_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                pool_recycle=300
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            _engine = test_engine
            logger.info("SUCCESS: Connected to Supabase PostgreSQL database!")
        except Exception as e:
            err_str = str(e)
            logger.warning(f"PostgreSQL connection FAILED: {err_str[:200]}")

            # Diagnose common issues
            if "could not translate host name" in err_str:
                logger.warning("DIAGNOSIS: DNS resolution failed. The direct Supabase DB host is not reachable from this network.")
            elif "ENOTFOUND" in err_str or "tenant" in err_str:
                logger.warning("DIAGNOSIS: Supabase pooler cannot find the project tenant. The project may be paused (free tier) or the pooler is not provisioned.")
            elif "password authentication failed" in err_str:
                logger.warning("DIAGNOSIS: Database password is incorrect. Check DATABASE_URL in .env.")

            logger.warning("FALLBACK: Using local SQLite database (silverhands.db) for development.")
            logger.warning("To use Supabase: 1) Ensure the project is active at https://supabase.com/dashboard")
            logger.warning("                 2) Check DATABASE_URL in backend/.env uses the correct pooler connection string")
            _engine = create_engine("sqlite:///./silverhands.db", connect_args={"check_same_thread": False})
    return _engine

def init_db(force_recreate: bool = False):
    """Initializes database tables and safely applies missing columns."""
    engine = get_engine()
    from app.models import domain  # Ensure models are imported
    if force_recreate:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Safe additive schema migration for existing tables (e.g. users table extensions)
    try:
        with engine.connect() as conn:
            from sqlalchemy import inspect
            inspector = inspect(engine)
            if 'users' in inspector.get_table_names():
                user_columns = {col['name'] for col in inspector.get_columns('users')}
                if 'video_intro_url' not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN video_intro_url VARCHAR;"))
                if 'work_samples_count' not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN work_samples_count INTEGER DEFAULT 0;"))
                if 'readiness_score' not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN readiness_score INTEGER DEFAULT 70;"))
                if 'service_radius' not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN service_radius FLOAT DEFAULT 10.0;"))
                conn.commit()
    except Exception as e:
        logger.debug(f"Schema column check: {e}")

def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

def get_db():
    """Dependency for providing a database session to FastAPI endpoints."""
    init_db()
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> dict:
    """Verifies connection to database."""
    try:
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        # Also check Supabase REST API availability
        supabase_rest = False
        try:
            from app.services.supabase_client import is_supabase_available
            supabase_rest = is_supabase_available()
        except Exception:
            pass

        return {
            "status": "connected",
            "database_type": engine.name,
            "supabase_rest_api": "available" if supabase_rest else "unavailable"
        }
    except Exception as e:
        logger.warning(f"Database connection check failed: {str(e)}")
        return {"status": "disconnected", "error": str(e)}
