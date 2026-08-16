"""
Idempotent SQLite to PostgreSQL Data Migration Tool for SilverHands.
Safely migrates existing data from local SQLite (silverhands.db) to Supabase PostgreSQL.
- Will not duplicate records if executed multiple times.
- Does not drop or recreate tables.
- Synchronizes PostgreSQL primary key sequences after migration.
- Preserves the local SQLite file.
"""

import os
import sys
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import get_engine, init_db
from app.models.domain import (
    Base,
    User,
    Skill,
    ServiceListing,
    Booking,
    Review,
    OpportunityInterest
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def parse_dt(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val)
        except Exception:
            try:
                return datetime.strptime(val, "%Y-%m-%d %H:%M:%S.%f")
            except Exception:
                try:
                    return datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    return None
    return None

def migrate_sqlite_to_postgres(sqlite_path: str = "silverhands.db") -> dict:
    """
    Migrates data from SQLite to target Postgres database idempotently.
    """
    if not os.path.exists(sqlite_path):
        logger.warning(f"SQLite file '{sqlite_path}' not found. Nothing to migrate.")
        return {"status": "skipped", "reason": f"{sqlite_path} not found"}

    target_engine = get_engine()
    if target_engine.name == "sqlite":
        logger.info("Target engine is SQLite. SQLite to Postgres migration not required.")
        return {"status": "noop", "reason": "Target database is SQLite"}

    logger.info(f"Connecting to target PostgreSQL engine: {target_engine.url.host or 'postgres'}")
    
    # 1. Ensure target schema tables exist
    init_db()

    # 2. Open SQLite source session
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=target_engine)

    stats = {
        "users": {"read": 0, "inserted": 0, "existing": 0},
        "skills": {"read": 0, "inserted": 0, "existing": 0},
        "services": {"read": 0, "inserted": 0, "existing": 0},
        "bookings": {"read": 0, "inserted": 0, "existing": 0},
        "reviews": {"read": 0, "inserted": 0, "existing": 0},
        "opportunity_interests": {"read": 0, "inserted": 0, "existing": 0},
    }

    with SqliteSession() as src_db, PostgresSession() as dst_db:
        try:
            # 1. Users
            src_users = src_db.query(User).all()
            stats["users"]["read"] = len(src_users)
            for u in src_users:
                existing = dst_db.query(User).filter(User.id == u.id).first()
                if not existing:
                    dst_user = User(
                        id=u.id,
                        email=u.email,
                        hashed_password=u.hashed_password,
                        full_name=u.full_name,
                        role=u.role,
                        user_type=u.user_type,
                        age=u.age,
                        phone=u.phone,
                        bio=u.bio,
                        avatar_url=u.avatar_url,
                        location_name=u.location_name,
                        latitude=u.latitude,
                        longitude=u.longitude,
                        languages=u.languages,
                        availability=u.availability,
                        is_published=bool(u.is_published),
                        is_active=bool(u.is_active),
                        completed_services_count=u.completed_services_count or 0,
                        trust_badge_level=u.trust_badge_level,
                        created_at=parse_dt(u.created_at) or datetime.utcnow()
                    )
                    dst_db.add(dst_user)
                    stats["users"]["inserted"] += 1
                else:
                    stats["users"]["existing"] += 1
            dst_db.commit()

            # 2. Skills
            src_skills = src_db.query(Skill).all()
            stats["skills"]["read"] = len(src_skills)
            for s in src_skills:
                existing = dst_db.query(Skill).filter(Skill.id == s.id).first()
                if not existing:
                    dst_skill = Skill(
                        id=s.id,
                        user_id=s.user_id,
                        category=s.category,
                        title=s.title,
                        description=s.description,
                        proficiency_level=s.proficiency_level,
                        years_experience=s.years_experience or 0,
                        hourly_rate=s.hourly_rate or 0.0,
                        verified=bool(s.verified)
                    )
                    dst_db.add(dst_skill)
                    stats["skills"]["inserted"] += 1
                else:
                    stats["skills"]["existing"] += 1
            dst_db.commit()

            # 3. Services
            src_services = src_db.query(ServiceListing).all()
            stats["services"]["read"] = len(src_services)
            for s in src_services:
                existing = dst_db.query(ServiceListing).filter(ServiceListing.id == s.id).first()
                if not existing:
                    dst_service = ServiceListing(
                        id=s.id,
                        provider_id=s.provider_id,
                        title=s.title,
                        category=s.category,
                        description=s.description,
                        price_per_hour=s.price_per_hour or 0.0,
                        location_name=s.location_name,
                        service_area=s.service_area,
                        home_service=bool(s.home_service),
                        availability=s.availability,
                        latitude=s.latitude,
                        longitude=s.longitude,
                        status=s.status or "active",
                        is_published=bool(s.is_published),
                        created_at=parse_dt(s.created_at) or datetime.utcnow()
                    )
                    dst_db.add(dst_service)
                    stats["services"]["inserted"] += 1
                else:
                    stats["services"]["existing"] += 1
            dst_db.commit()

            # 4. Bookings
            src_bookings = src_db.query(Booking).all()
            stats["bookings"]["read"] = len(src_bookings)
            for b in src_bookings:
                existing = dst_db.query(Booking).filter(Booking.id == b.id).first()
                if not existing:
                    dst_booking = Booking(
                        id=b.id,
                        customer_id=b.customer_id,
                        provider_id=b.provider_id,
                        service_id=b.service_id,
                        status=b.status or "pending",
                        total_price=b.total_price or 0.0,
                        scheduled_date=b.scheduled_date or "",
                        notes=b.notes,
                        created_at=parse_dt(b.created_at) or datetime.utcnow()
                    )
                    dst_db.add(dst_booking)
                    stats["bookings"]["inserted"] += 1
                else:
                    stats["bookings"]["existing"] += 1
            dst_db.commit()

            # 5. Reviews
            src_reviews = src_db.query(Review).all()
            stats["reviews"]["read"] = len(src_reviews)
            for r in src_reviews:
                existing = dst_db.query(Review).filter(Review.id == r.id).first()
                if not existing:
                    dst_review = Review(
                        id=r.id,
                        booking_id=r.booking_id,
                        customer_id=r.customer_id,
                        provider_id=r.provider_id,
                        rating=r.rating or 5,
                        comment=r.comment,
                        created_at=parse_dt(r.created_at) or datetime.utcnow()
                    )
                    dst_db.add(dst_review)
                    stats["reviews"]["inserted"] += 1
                else:
                    stats["reviews"]["existing"] += 1
            dst_db.commit()

            # 6. Opportunity Interests
            src_opps = src_db.query(OpportunityInterest).all()
            stats["opportunity_interests"]["read"] = len(src_opps)
            for o in src_opps:
                existing = dst_db.query(OpportunityInterest).filter(OpportunityInterest.id == o.id).first()
                if not existing:
                    dst_opp = OpportunityInterest(
                        id=o.id,
                        opportunity_id=o.opportunity_id,
                        provider_id=o.provider_id,
                        status=o.status or "applied",
                        created_at=parse_dt(o.created_at) or datetime.utcnow()
                    )
                    dst_db.add(dst_opp)
                    stats["opportunity_interests"]["inserted"] += 1
                else:
                    stats["opportunity_interests"]["existing"] += 1
            dst_db.commit()

            # Synchronize Postgres Serial Sequences
            if target_engine.name == "postgresql":
                table_names = ["users", "skills", "services", "bookings", "reviews", "opportunity_interests"]
                for tbl in table_names:
                    try:
                        dst_db.execute(text(
                            f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), COALESCE((SELECT MAX(id) FROM {tbl}), 1));"
                        ))
                    except Exception as seq_err:
                        logger.warning(f"Could not reset sequence for {tbl}: {seq_err}")
                dst_db.commit()

            logger.info("Migration completed successfully.")
            return {"status": "success", "stats": stats}

        except Exception as e:
            dst_db.rollback()
            logger.error(f"Migration failed: {e}")
            raise

if __name__ == "__main__":
    result = migrate_sqlite_to_postgres()
    print("Migration result:", result)
