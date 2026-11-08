"""
Database Engine & Session Management Module
============================================
Establishes SQLAlchemy engine, declarative base, session factories,
and database lifecycle management utilities for dual-mode SQLite and PostgreSQL/Supabase persistence.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

raw_db_url = settings.resolved_database_url

connect_args = {}
engine_kwargs = {}

if raw_db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase pool configuration
    engine_kwargs.update({
        "pool_pre_ping": True,
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

    # Auto-migrate github_username column if missing
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE onboarding_cases ADD COLUMN IF NOT EXISTS github_username VARCHAR(100)"))
    except Exception:
        pass
