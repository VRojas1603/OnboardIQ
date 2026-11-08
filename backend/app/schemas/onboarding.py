"""
Onboarding & Approvals Pydantic Data Contracts
==============================================
Defines request and response validation schemas for API communication:
- `OnboardingCaseCreate`: Input payload for creating a new onboarding case.
- `ApprovalDecisionRequest`: Input payload for approving/rejecting a pending gate.
- `WorkflowStepResponse`: Detailed step execution state and telemetry.
- `ApprovalItemResponse`: Approval item preview data and status.
- `OnboardingCaseSummary`: Compact candidate representation for dashboard listings.
- `OnboardingCaseDetailResponse`: Full candidate representation with all 7 steps.
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field

# --- Request Schemas ---

class OnboardingCaseCreate(BaseModel):
    """
    Candidate intake payload schema containing all core attributes required
    to initialize the 7-step onboarding state machine.
    """
    hire_name: str = Field(description="Full name of the new employee", examples=["Jane Doe"])
    hire_email: EmailStr = Field(description="Personal contact email", examples=["jane.doe@example.com"])
    role: str = Field(description="Target job title", examples=["Senior Software Engineer"])
    department: str = Field(description="Assigned department", examples=["Engineering"])
    manager_name: str = Field(description="Name of the reporting manager", examples=["Alex Smith"])
    manager_email: EmailStr = Field(description="Corporate email of the manager", examples=["alex.smith@example.com"])
    start_date: str = Field(description="Target start date (YYYY-MM-DD)", examples=["2026-11-15"])
    github_username: Optional[str] = Field(default=None, description="Candidate GitHub username for org invitation", examples=["octocat"])

class ApprovalDecisionRequest(BaseModel):
    """
    Managerial review decision payload capturing authorization comments.
    """
    comment: Optional[str] = Field(default=None, description="Optional managerial review notes", examples=["Approved with correct equipment list."])

# --- Response Schemas ---

class WorkflowStepResponse(BaseModel):
    """
    Individual workflow step execution status and payload telemetry.
    """
    id: int
    case_id: int
    step_key: str
    step_label: str
    order_index: int
    status: str
    requires_approval: bool
    output_data: Optional[Any] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApprovalItemResponse(BaseModel):
    """
    Pending or resolved Human-in-the-Loop review item holding preview data.
    """
    id: int
    step_id: int
    case_id: int
    preview_data: Optional[Any] = None
    decision: str
    reviewer_comment: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime
    step: Optional[WorkflowStepResponse] = None

    class Config:
        from_attributes = True

class OnboardingCaseSummary(BaseModel):
    """
    High-level onboarding case summary optimized for tabular dashboard displays.
    """
    id: int
    hire_name: str
    hire_email: str
    role: str
    department: str
    manager_name: str
    manager_email: str
    start_date: str
    github_username: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    total_steps: int = 0
    completed_steps: int = 0
    pending_approvals: int = 0

    class Config:
        from_attributes = True

class OnboardingCaseDetailResponse(BaseModel):
    """
    Comprehensive onboarding case detail including all 7 lifecycle steps and approvals.
    """
    id: int
    hire_name: str
    hire_email: str
    role: str
    department: str
    manager_name: str
    manager_email: str
    start_date: str
    github_username: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    steps: list[WorkflowStepResponse] = []
    approvals: list[ApprovalItemResponse] = []

    class Config:
        from_attributes = True
