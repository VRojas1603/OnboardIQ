"""
Onboarding Domain Database Models
=================================
SQLAlchemy relational models defining the core domain entities:
- `OnboardingCase`: The aggregate root representing a candidate's onboarding journey.
- `WorkflowStep`: An individual execution step in the 7-step lifecycle.
- `ApprovalItem`: Human-in-the-Loop governance gate for critical actions.
"""

"""
Onboarding Domain Database Models
=================================
SQLAlchemy relational models defining the core domain entities:
- `OnboardingCase`: The aggregate root representing a candidate's onboarding journey.
- `WorkflowStep`: An individual execution step in the 7-step lifecycle.
- `ApprovalItem`: Human-in-the-Loop governance gate for critical actions.
"""

from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class OnboardingCase(Base):
    """
    OnboardingCase Model
    --------------------
    Represents an employee onboarding case, storing candidate identity,
    organizational hierarchy, start date, and overarching lifecycle status.
    """
    __tablename__ = "onboarding_cases"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    hire_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hire_email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=False)
    manager_name: Mapped[str] = mapped_column(String(255), nullable=False)
    manager_email: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "2026-11-15"
    github_username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Status: created, running, awaiting_approval, completed, failed, cancelled
    status: Mapped[str] = mapped_column(String(50), default="created", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    steps: Mapped[list["WorkflowStep"]] = relationship("WorkflowStep", back_populates="case", cascade="all, delete-orphan", order_by="WorkflowStep.order_index")
    approvals: Mapped[list["ApprovalItem"]] = relationship("ApprovalItem", back_populates="case", cascade="all, delete-orphan")


class WorkflowStep(Base):
    """
    WorkflowStep Model
    ------------------
    Represents an atomic execution task in the onboarding pipeline (e.g., AI document
    generation, Google Workspace provisioning, Slack announcement, GitHub invitation).
    Tracks step state, outputs, execution timestamps, and approval requirements.
    """
    __tablename__ = "workflow_steps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("onboarding_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    step_key: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "generate_documents", "provision_slack"
    step_label: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(nullable=False)
    
    # Status: pending, running, awaiting_approval, approved, completed, failed, skipped
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    output_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # Stores AI output, account credentials, payloads
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    case: Mapped["OnboardingCase"] = relationship("OnboardingCase", back_populates="steps")
    approval_item: Mapped[Optional["ApprovalItem"]] = relationship("ApprovalItem", back_populates="step", uselist=False, cascade="all, delete-orphan")


class ApprovalItem(Base):
    """
    ApprovalItem Model
    ------------------
    Represents a Human-in-the-Loop review item holding an execution preview
    (e.g., generated email text, provision credentials) and recording managerial
    authorization decisions and audit comments.
    """
    __tablename__ = "approval_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    step_id: Mapped[int] = mapped_column(ForeignKey("workflow_steps.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("onboarding_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Preview data presented to HR/IT reviewer (AI generated email, provision credentials, etc.)
    preview_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    
    # Decision: pending, approved, rejected
    decision: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    reviewer_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    step: Mapped["WorkflowStep"] = relationship("WorkflowStep", back_populates="approval_item")
    case: Mapped["OnboardingCase"] = relationship("OnboardingCase", back_populates="approvals")
