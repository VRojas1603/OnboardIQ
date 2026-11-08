"""
Onboarding Cases API Router.

Exposes endpoints to create onboarding cases, inspect lifecycle progress,
and retrieve detailed execution artifacts for new hires.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.onboarding import OnboardingCase
from app.schemas.onboarding import (
    OnboardingCaseCreate,
    OnboardingCaseDetailResponse,
    OnboardingCaseSummary
)
from app.services.workflow_engine import workflow_engine

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

def run_workflow_task(case_id: int):
    """
    Background worker thread function with isolated database session
    to trigger autonomous workflow progression without blocking HTTP requests.

    Args:
        case_id: Primary key of the OnboardingCase.
    """
    db = SessionLocal()
    try:
        workflow_engine.run_workflow(case_id, db)
    finally:
        db.close()

@router.post("", response_model=OnboardingCaseDetailResponse)
def create_onboarding_case(
    payload: OnboardingCaseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new employee onboarding case and initiate autonomous orchestration.

    Seeds the 7 standardized workflow steps and dispatches a background task
    to begin document synthesis and step execution.

    Args:
        payload: Candidate and manager profile data.
        background_tasks: FastAPI background worker dispatcher.
        db: Active SQLAlchemy database session.

    Returns:
        The created OnboardingCase model with initialized workflow steps.
    """
    case = OnboardingCase(
        hire_name=payload.hire_name,
        hire_email=payload.hire_email,
        role=payload.role,
        department=payload.department,
        manager_name=payload.manager_name,
        manager_email=payload.manager_email,
        start_date=payload.start_date,
        github_username=payload.github_username,
        status="created"
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Initialize 7 standard workflow steps
    workflow_engine.initialize_case_steps(db, case)
    db.refresh(case)

    # Launch background autonomous workflow
    background_tasks.add_task(run_workflow_task, case.id)

    return case

@router.get("", response_model=list[OnboardingCaseSummary])
def list_onboarding_cases(db: Session = Depends(get_db)):
    """
    Retrieve all onboarding cases annotated with aggregate progress indicators.

    Calculates total steps, completed/skipped steps, and active pending approval counts.

    Args:
        db: Active SQLAlchemy database session.

    Returns:
        List of OnboardingCaseSummary records ordered by newest first.
    """
    cases = db.query(OnboardingCase).order_by(OnboardingCase.created_at.desc()).all()
    results = []
    for c in cases:
        total = len(c.steps)
        completed = sum(1 for s in c.steps if s.status in ["completed", "skipped"])
        pending_apps = sum(1 for a in c.approvals if a.decision == "pending")
        results.append(
            OnboardingCaseSummary(
                id=c.id,
                hire_name=c.hire_name,
                hire_email=c.hire_email,
                role=c.role,
                department=c.department,
                manager_name=c.manager_name,
                manager_email=c.manager_email,
                start_date=c.start_date,
                status=c.status,
                created_at=c.created_at,
                updated_at=c.updated_at,
                total_steps=total,
                completed_steps=completed,
                pending_approvals=pending_apps
            )
        )
    return results

@router.get("/{case_id}", response_model=OnboardingCaseDetailResponse)
def get_onboarding_case(case_id: int, db: Session = Depends(get_db)):
    """
    Retrieve full details of an onboarding case by ID.

    Includes all 7 workflow steps, execution outputs, and approval records.

    Args:
        case_id: Primary key ID of the onboarding case.
        db: Active SQLAlchemy database session.

    Returns:
        Complete OnboardingCase with nested steps and approvals.

    Raises:
        HTTPException: 404 if case is not found.
    """
    case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Onboarding case not found")
    return case
