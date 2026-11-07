"""
Database Engine & Session Management Module
============================================
Establishes SQLAlchemy engine, declarative base, session factories,
and database lifecycle management utilities for SQLite persistence.
"""

from typing import Any
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# Normalize postgres:// to postgresql:// (common in Supabase and PaaS URLs)
raw_db_url = settings.DATABASE_URL
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

connect_args: dict[str, Any] = {}
engine_kwargs: dict[str, Any] = {"pool_pre_ping": True}

if raw_db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine_kwargs = {}
else:
    # PostgreSQL / Supabase pooler configuration (Session & Transaction modes)
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 300,
    })

engine = create_engine(
    raw_db_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    """SQLAlchemy 2.0 DeclarativeBase providing native static typing support."""
    pass

def get_db():
    """
    FastAPI dependency that yields a request-scoped database session
    and guarantees proper closure and resource cleanup upon completion.

    Yields:
        Session: Active SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Creates all defined database tables according to SQLAlchemy metadata.
    Invoked during application startup.
    """
    # Import models here so Base knows about all tables
    import app.models.onboarding
    Base.metadata.create_all(bind=engine)
