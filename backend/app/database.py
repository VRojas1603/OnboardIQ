"""
Database Engine & Session Management Module
============================================
Establishes SQLAlchemy engine, declarative base, session factories,
and database lifecycle management utilities for SQLite persistence.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# SQLite specific connect_args to allow multithreaded requests
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
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

    # Auto-migrate github_username column for existing SQLite databases
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE onboarding_cases ADD COLUMN github_username VARCHAR(100)"))
    except Exception:
        pass
