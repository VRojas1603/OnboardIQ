"""
OnboardIQ - Autonomous Employee Onboarding Orchestrator Backend
===============================================================
Main application entry point configuring FastAPI, application lifespan,
database initialization, CORS middleware, and API router inclusions.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import health, onboarding, approvals

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    
    Executes database schema creation and table initialization on startup,
    and performs graceful cleanup on application shutdown.
    """
    # Initialize SQLite database schema
    init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="OnboardIQ - Autonomous Employee Onboarding Orchestrator powered by Vultr",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during hackathon/demo to avoid CORS friction
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Core Routers
app.include_router(health.router)
app.include_router(onboarding.router)
app.include_router(approvals.router)

@app.get("/")
def root():
    """
    Root endpoint returning basic application metadata and navigation links.
    """
    return {
        "message": "Welcome to OnboardIQ API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.BACKEND_PORT, reload=True)
