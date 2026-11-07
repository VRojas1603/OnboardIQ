"""
Human-in-the-Loop (HITL) Approvals API Router.

Provides endpoints for reviewing pending actions and authorizing or rejecting
orchestrated steps (e.g., Slack announcements, Google Workspace account generation, emails).
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.onboarding import ApprovalItem
from app.schemas.onboarding import ApprovalItemResponse, ApprovalDecisionRequest
from app.services.workflow_engine import workflow_engine

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

def resume_workflow_task(case_id: int):
    """
    Background worker task to resume workflow execution after an approval decision.

    Args:
        case_id: Primary key of the OnboardingCase.
    """
    db = SessionLocal()
    try:
        workflow_engine.run_workflow(case_id, db)
    finally:
        db.close()

@router.get("", response_model=list[ApprovalItemResponse])
def list_pending_approvals(db: Session = Depends(get_db)):
    """
    List all pending approvals waiting for human review across all onboarding cases.

    Returns:
        List of ApprovalItem records ordered chronologically (oldest first).
    """
    approvals = (
        db.query(ApprovalItem)
        .filter(ApprovalItem.decision == "pending")
        .order_by(ApprovalItem.created_at.asc())
        .all()
    )
    return approvals

@router.post("/{approval_id}/approve", response_model=ApprovalItemResponse)
@router.post("/{approval_id}/approved", response_model=ApprovalItemResponse)
def approve_step(
    approval_id: int,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Authorize and execute a pending step, resuming the autonomous workflow.

    Executes external actions associated with the step (e.g. broadcasting to Slack)
    and marks the step as completed before initiating the next workflow step.

    Args:
        approval_id: Primary key ID of the ApprovalItem.
        payload: Reviewer comments and decision metadata.
        db: Active SQLAlchemy database session.

    Returns:
        The updated ApprovalItem entity.

    Raises:
        HTTPException: 404 if not found, 400 if already decided.
    """
    approval = db.query(ApprovalItem).filter(ApprovalItem.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.decision != "pending":
        raise HTTPException(status_code=400, detail=f"Item already decided: {approval.decision}")

    comment = payload.comment or "Approved by Manager"
    updated = workflow_engine.handle_approval(approval_id, "approved", comment, db)
    return updated

@router.post("/{approval_id}/reject", response_model=ApprovalItemResponse)
@router.post("/{approval_id}/rejected", response_model=ApprovalItemResponse)
def reject_step(
    approval_id: int,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Reject and skip a pending step, continuing the remaining workflow without executing it.

    Marks the step as skipped and immediately unblocks subsequent workflow steps.

    Args:
        approval_id: Primary key ID of the ApprovalItem.
        payload: Reviewer reason or comment.
        db: Active SQLAlchemy database session.

    Returns:
        The updated ApprovalItem entity.

    Raises:
        HTTPException: 404 if not found, 400 if already decided.
    """
    approval = db.query(ApprovalItem).filter(ApprovalItem.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.decision != "pending":
        raise HTTPException(status_code=400, detail=f"Item already decided: {approval.decision}")

    comment = payload.comment or "Rejected / Skipped by Manager"
    updated = workflow_engine.handle_approval(approval_id, "rejected", comment, db)
    return updated
