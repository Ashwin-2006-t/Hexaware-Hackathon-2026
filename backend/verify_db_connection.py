#!/usr/bin/env python3
"""
Verification Script for SilverHands Database Connectivity & CRUD Operations.
Performs:
1. Engine connection test
2. Schema / table inspection
3. Safe transactional CRUD cycle (Insert -> Read -> Update -> Delete)
4. Confirms zero stray test records remain
"""
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.db.session import get_engine, init_db, get_session_factory
from app.models.domain import User, Skill, ServiceListing, Booking, Review, OpportunityInterest

def run_verification():
    print("=" * 60)
    print("SilverHands DB Verification")
    print("=" * 60)
    
    engine = get_engine()
    print(f"[*] Connected DB Dialect: {engine.name}")
    print(f"[*] DB Host: {engine.url.host if engine.url.host else 'local'}")
    
    # 1. Initialize Tables
    print("\n[1] Initializing schema / tables...")
    init_db()
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"[+] Found tables in database: {tables}")
    expected_tables = ["users", "skills", "services", "bookings", "reviews", "opportunity_interests"]
    missing = [t for t in expected_tables if t not in tables]
    if missing:
        print(f"[!] Warning: Missing tables: {missing}")
    else:
        print("[+] All expected domain tables are present.")
        
    # 2. CRUD Test
    print("\n[2] Executing Full Transactional CRUD Cycle...")
    SessionFactory = get_session_factory()
    db = SessionFactory()
    
    test_email = f"probe_test_{int(datetime.utcnow().timestamp())}@silverhands.test"
    test_user_id = None
    
    try:
        # INSERT
        print("  - Testing INSERT...")
        test_user = User(
            email=test_email,
            hashed_password="probe_test_hashed_pwd",
            full_name="Probe Test Senior",
            role="provider",
            user_type="senior",
            bio="Temporary test record for database verification",
            is_active=True,
            is_published=False
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        test_user_id = test_user.id
        print(f"    [OK] Inserted test user ID: {test_user_id}")
        
        # READ
        print("  - Testing READ...")
        read_user = db.query(User).filter(User.id == test_user_id).first()
        assert read_user is not None, "Failed to read inserted user!"
        assert read_user.email == test_email, "Email mismatch on read!"
        print(f"    [OK] Successfully retrieved user: {read_user.full_name} ({read_user.email})")
        
        # UPDATE
        print("  - Testing UPDATE...")
        read_user.bio = "Updated test bio verification"
        read_user.completed_services_count = 10
        db.commit()
        db.refresh(read_user)
        
        updated_user = db.query(User).filter(User.id == test_user_id).first()
        assert updated_user is not None and updated_user.bio == "Updated test bio verification", "Update failed!"
        assert updated_user.completed_services_count == 10, "Count update failed!"
        print(f"    [OK] Successfully updated user attributes.")
        
        # DELETE
        print("  - Testing DELETE & CLEANUP...")
        db.delete(updated_user)
        db.commit()
        
        deleted_check = db.query(User).filter(User.id == test_user_id).first()
        assert deleted_check is None, "Failed to delete test record!"
        print(f"    [OK] Successfully deleted test record. Zero stray rows left.")
        
        print("\n" + "=" * 60)
        print("SUCCESS: Full DB Connectivity & CRUD Verification Passed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        db.rollback()
        # Clean up in case of failure
        if test_user_id:
            try:
                cleanup_db = SessionFactory()
                stray = cleanup_db.query(User).filter(User.email == test_email).first()
                if stray:
                    cleanup_db.delete(stray)
                    cleanup_db.commit()
                cleanup_db.close()
            except Exception:
                pass
        print(f"\n[ERROR] DB Verification failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
