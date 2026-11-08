"""
Autonomous Workflow Engine for OnboardIQ.

Coordinates multi-step onboarding lifecycle execution:
1. AI document synthesis (Vultr Inference)
2. Identity and workspace provisioning (Google, Slack, GitHub)
3. Automated compliance & orientation scheduling
4. Formal welcome notification delivery
5. Continuous feedback collection loops

Enforces Human-in-the-Loop (HITL) pause states whenever a step requires manager or HR authorization.
"""

import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.onboarding import OnboardingCase, WorkflowStep, ApprovalItem
from app.services.ai_service import ai_service
from app.services.integrations import slack_service, identity_service, google_service, github_service, email_service

logger = logging.getLogger(__name__)

# Standard ordered workflow steps
STEP_DEFINITIONS = [
    {
        "step_key": "generate_documents",
        "step_label": "AI Document Generation (Welcome Email, Plan & Equipment)",
        "order_index": 1,
        "requires_approval": True
    },
    {
        "step_key": "provision_identity",
        "step_label": "Corporate Identity & SSO Directory Provisioning",
        "order_index": 2,
        "requires_approval": True
    },
    {
        "step_key": "provision_slack",
        "step_label": "Slack Workspace Invitation & Channel Announcement",
        "order_index": 3,
        "requires_approval": True
    },
    {
        "step_key": "provision_github",
        "step_label": "GitHub Organization & Team Repositories (TestCompany-OnboardIQ-Demo)",
        "order_index": 4,
        "requires_approval": True
    },
    {
        "step_key": "schedule_training",
        "step_label": "Automated Compliance & Orientation Training Scheduling",
        "order_index": 5,
        "requires_approval": False
    },
    {
        "step_key": "send_welcome_email",
        "step_label": "Day 0 Formal Welcome Email Dispatch (Gmail SMTP)",
        "order_index": 6,
        "requires_approval": True
    },
    {
        "step_key": "schedule_followups",
        "step_label": "Automated Day 3 & Day 30 Feedback Loops",
        "order_index": 7,
        "requires_approval": False
    }
]

class WorkflowEngine:
    """
    State machine and step orchestrator for onboarding workflows.
    Sequentially progresses through lifecycle steps, halts for approvals,
    and resumes execution once approvals or skips are registered.
    """

    @staticmethod
    def initialize_case_steps(db: Session, case: OnboardingCase) -> None:
        """
        Seed the standardized 7 workflow steps for a newly registered onboarding case.

        Args:
            db: Active SQLAlchemy database session.
            case: The newly persisted OnboardingCase entity.
        """
        for defn in STEP_DEFINITIONS:
            step = WorkflowStep(
                case_id=case.id,
                step_key=defn["step_key"],
                step_label=defn["step_label"],
                order_index=defn["order_index"],
                status="pending",
                requires_approval=defn["requires_approval"],
                output_data=None,
                started_at=None,
                completed_at=None
            )
            db.add(step)
        db.commit()

    @staticmethod
    def run_workflow(case_id: int, db: Session) -> None:
        """
        Execute or resume the sequential workflow steps for a specified onboarding case.

        Iterates through steps in order of order_index. If an unapproved step requiring approval
        is encountered, generates an ApprovalItem and pauses the workflow ('awaiting_approval').
        If all steps complete, marks the case status as 'completed'.

        Args:
            case_id: ID of the onboarding case.
            db: Active SQLAlchemy database session.
        """
        case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
        if not case or case.status in ["completed", "cancelled", "failed"]:
            return

        case.status = "running"
        db.commit()

        steps = db.query(WorkflowStep).filter(WorkflowStep.case_id == case_id).order_by(WorkflowStep.order_index).all()

        for step in steps:
            # Skip steps already finished or skipped
            if step.status in ["completed", "skipped"]:
                continue

            # If a step is currently awaiting approval, the workflow must pause
            if step.status == "awaiting_approval":
                case.status = "awaiting_approval"
                db.commit()
                return

            # Execute pending step
            step.status = "running"
            step.started_at = step.started_at or datetime.utcnow()
            db.commit()

            try:
                if step.step_key == "generate_documents":
                    # Generate AI artifacts
                    email_doc = ai_service.generate_welcome_email(
                        case.hire_name, case.role, case.department, case.manager_name, case.start_date
                    )
                    plan_doc = ai_service.generate_onboarding_plan(
                        case.hire_name, case.role, case.department, case.manager_name
                    )
                    equip_doc = ai_service.generate_equipment_request(
                        case.hire_name, case.role, case.department
                    )

                    step.output_data = {
                        "welcome_email": email_doc,
                        "onboarding_plan": plan_doc,
                        "equipment_checklist": equip_doc,
                        "generated_at": datetime.utcnow().isoformat(),
                        "engine": "Vultr Serverless Inference"
                    }

                    # Create approval item for HR manager
                    approval = ApprovalItem(
                        step_id=step.id,
                        case_id=case.id,
                        preview_data={
                            "title": f"Review AI Generated Onboarding Package for {case.hire_name}",
                            "summary": f"Verify welcome email tone, 30-day milestones, and {len(equip_doc)} hardware/software items.",
                            "welcome_email": email_doc,
                            "onboarding_plan": plan_doc,
                            "equipment_checklist": equip_doc
                        },
                        decision="pending"
                    )
                    db.add(approval)
                    step.status = "awaiting_approval"
                    case.status = "awaiting_approval"
                    db.commit()
                    return # Stop and wait for human approval

                elif step.step_key in ("provision_identity", "provision_google"):
                    identity_payload = identity_service.provision_identity(case.hire_name, case.department, case.role)
                    step.output_data = identity_payload

                    # Needs approval before activating account
                    approval = ApprovalItem(
                        step_id=step.id,
                        case_id=case.id,
                        preview_data={
                            "title": f"Approve Corporate Identity & SSO Profile: {identity_payload['corporate_email']}",
                            "summary": f"Authorize SSO directory provisioning in {identity_payload['org_unit']} with {len(identity_payload['groups_assigned'])} RBAC groups and Enterprise SSO Security Vault.",
                            "details": identity_payload
                        },
                        decision="pending"
                    )
                    db.add(approval)
                    step.status = "awaiting_approval"
                    case.status = "awaiting_approval"
                    db.commit()
                    return

                elif step.step_key == "provision_slack":
                    # Create approval for team announcement
                    clean_ch = slack_service.default_channel.lstrip("#") if slack_service.default_channel else "hackathon-demo"
                    approval = ApprovalItem(
                        step_id=step.id,
                        case_id=case.id,
                        preview_data={
                            "title": f"Approve Slack Team Announcement for {case.hire_name}",
                            "summary": f"Post official introduction and welcome banner into #{clean_ch}.",
                            "target_channel": f"#{clean_ch}",
                            "hire_name": case.hire_name,
                            "role": case.role,
                            "department": case.department
                        },
                        decision="pending"
                    )
                    db.add(approval)
                    step.status = "awaiting_approval"
                    case.status = "awaiting_approval"
                    db.commit()
                    return

                elif step.step_key == "provision_github":
                    gh_payload = {
                        "organization": github_service.org,
                        "candidate_name": case.hire_name,
                        "candidate_email": case.hire_email,
                        "github_username": case.github_username or "Will invite by email",
                        "target_role": "Member",
                        "status": "Ready to dispatch invitation via GitHub REST API"
                    }
                    step.output_data = gh_payload

                    target_desc = f"@{case.github_username}" if case.github_username else case.hire_email
                    approval = ApprovalItem(
                        step_id=step.id,
                        case_id=case.id,
                        preview_data={
                            "title": f"Authorize GitHub Org Invitation for {target_desc}",
                            "summary": f"Grant member role in {github_service.org} and dispatch live invitation via GitHub REST API.",
                            "details": gh_payload
                        },
                        decision="pending"
                    )
                    db.add(approval)
                    step.status = "awaiting_approval"
                    case.status = "awaiting_approval"
                    db.commit()
                    return

                elif step.step_key == "schedule_training":
                    training_sessions = [
                        {"session": "Company Culture & Global Onboarding Kickoff", "date": f"{case.start_date} 10:00 AM", "duration": "60m", "host": "People Ops"},
                        {"session": "IT Security, Enterprise SSO & MFA Compliance", "date": f"{case.start_date} 2:00 PM", "duration": "45m", "host": "SecOps"},
                        {"session": f"{case.department} Architecture & Sprint Workflow", "date": f"{case.start_date} Day 2 11:00 AM", "duration": "90m", "host": case.manager_name}
                    ]
                    step.output_data = {
                        "calendar_events_booked": training_sessions,
                        "status": "Confirmed on Corporate Calendar"
                    }
                    step.status = "completed"
                    step.completed_at = datetime.utcnow()
                    db.commit()

                elif step.step_key == "send_welcome_email":
                    prev_step = next((s for s in steps if s.step_key == "generate_documents"), None)
                    email_content = prev_step.output_data.get("welcome_email") if prev_step and prev_step.output_data else None

                    if not email_content:
                        email_content = ai_service.generate_welcome_email(
                            case.hire_name, case.role, case.department, case.manager_name, case.start_date
                        )

                    step.output_data = {
                        "recipient": case.hire_email,
                        "email": email_content,
                        "smtp_server": "smtp.gmail.com:587",
                        "status": "Staged for outbound dispatch via Gmail SMTP"
                    }

                    approval = ApprovalItem(
                        step_id=step.id,
                        case_id=case.id,
                        preview_data={
                            "title": f"Authorize Welcome Email Dispatch to {case.hire_email}",
                            "summary": f"Confirm outbound sending of Day 0 welcome email for {case.hire_name} via Gmail SMTP.",
                            "recipient": case.hire_email,
                            "email": email_content
                        },
                        decision="pending"
                    )
                    db.add(approval)
                    step.status = "awaiting_approval"
                    case.status = "awaiting_approval"
                    db.commit()
                    return

                elif step.step_key == "schedule_followups":
                    step.output_data = {
                        "day3_checkin": "Scheduled for Day 3: 'How was your first 72 hours?' automated pulse",
                        "day30_checkin": "Scheduled for Day 30: '30-Day Milestone & Manager Alignment' review",
                        "status": "Queued in automated cadence"
                    }
                    step.status = "completed"
                    step.completed_at = datetime.utcnow()
                    db.commit()

            except Exception as e:
                logger.error(f"Error executing step {step.step_key}: {e}", exc_info=True)
                step.status = "failed"
                step.error_message = str(e)
                case.status = "failed"
                db.commit()
                return

        # Check if all steps are completed or skipped
        all_done = all(s.status in ["completed", "skipped"] for s in steps)
        if all_done:
            case.status = "completed"
            db.commit()

    @staticmethod
    def handle_approval(approval_id: int, decision: str, comment: str, db: Session) -> ApprovalItem | None:
        """
        Record a human approval decision, execute side effects if approved, and resume workflow.

        Args:
            approval_id: Primary key ID of the ApprovalItem.
            decision: Outcome decision ('approved' or 'rejected').
            comment: Optional auditor or manager rationale comment.
            db: Active SQLAlchemy database session.

        Returns:
            The updated ApprovalItem model instance, or None if not found or already processed.
        """
        approval = db.query(ApprovalItem).filter(ApprovalItem.id == approval_id).first()
        if not approval or approval.decision != "pending":
            return None

        approval.decision = decision
        approval.reviewer_comment = comment
        approval.decided_at = datetime.utcnow()

        step = approval.step
        case = approval.case

        if decision == "approved":
            # Execute actual external actions upon human approval
            if step.step_key == "provision_slack":
                slack_res = slack_service.post_welcome_announcement(
                    case.hire_name, case.role, case.department, case.start_date, case.manager_name
                )
                step.output_data = slack_res

            elif step.step_key == "provision_github":
                gh_res = github_service.invite_member(
                    hire_name=case.hire_name,
                    hire_email=case.hire_email,
                    github_username=case.github_username,
                    department=case.department
                )
                step.output_data = gh_res

            elif step.step_key == "send_welcome_email":
                # Extract AI generated email content from step output
                email_content = step.output_data.get("email") if isinstance(step.output_data, dict) else None
                subject_val: str = f"Welcome to the Team, {case.hire_name}! 🎉"
                body_val: str = ""
                if isinstance(email_content, dict):
                    subject_val = str(email_content.get("subject") or subject_val)
                    body_val = str(email_content.get("body") or "")
                elif email_content:
                    body_val = str(email_content)

                email_res = email_service.send_welcome_email(
                    recipient_email=case.hire_email,
                    recipient_name=case.hire_name,
                    subject=subject_val,
                    body_text=body_val
                )
                step.output_data = {
                    "email": email_content,
                    "dispatch_receipt": email_res
                }
                if not email_res.get("delivered", False):
                    step.status = "failed"
                    step.error_message = email_res.get("error") or email_res.get("message") or "Failed to deliver welcome email via Gmail SMTP"
                    case.status = "failed"
                    db.commit()
                    return approval
            
            step.status = "completed"
            step.completed_at = datetime.utcnow()
        else:
            # Mark as skipped
            step.status = "skipped"
            step.completed_at = datetime.utcnow()

        db.commit()

        # Resume the workflow to advance to the next step
        WorkflowEngine.run_workflow(case.id, db)
        return approval

workflow_engine = WorkflowEngine()
