import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

_engine = None
_SessionLocal = None

def get_engine():
    global _engine
    if _engine is None:
        db_url = settings.DATABASE_URL
        try:
            # Use SQLite in-memory or file fallback if PostgreSQL is not running locally
            if "sqlite" in db_url or "localhost" in db_url:
                try:
                    _engine = create_engine(db_url, pool_pre_ping=True)
                    # Test connection
                    with _engine.connect() as conn:
                        conn.execute(text("SELECT 1"))
                except Exception as e:
                    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite file.")
                    _engine = create_engine("sqlite:///./silverhands.db", connect_args={"check_same_thread": False})
            else:
                _engine = create_engine(db_url, pool_pre_ping=True)
        except Exception as e:
            logger.warning(f"Database creation fallback: {e}")
            _engine = create_engine("sqlite:///./silverhands.db", connect_args={"check_same_thread": False})
    return _engine

def init_db():
    """Initializes database tables."""
    engine = get_engine()
    from app.models import domain  # Ensure models are imported
    Base.metadata.create_all(bind=engine)

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
        return {"status": "connected", "database_type": engine.name}
    except Exception as e:
        logger.warning(f"Database connection check failed: {str(e)}")
        return {"status": "disconnected", "error": str(e)}
