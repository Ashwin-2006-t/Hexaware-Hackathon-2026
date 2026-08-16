#!/usr/bin/env python3
"""
CLI entry point for SQLite to Supabase PostgreSQL migration.
Run from backend directory:
    python migrate_sqlite_to_postgres.py
"""
import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.migrate_data import migrate_sqlite_to_postgres

if __name__ == "__main__":
    print("=== SilverHands Data Migration: SQLite -> PostgreSQL ===")
    res = migrate_sqlite_to_postgres()
    print("\nResult:", res)
