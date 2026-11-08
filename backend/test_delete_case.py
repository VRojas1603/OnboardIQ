"""
Automated Test Suite for Onboarding Case Deletion Endpoint.
===========================================================
Verifies that DELETE /api/onboarding/{case_id} cleanly and atomically deletes
an onboarding case, cascading across workflow_steps and approval_items,
preventing foreign key violations and eliminating orphan records.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models.onboarding import OnboardingCase, WorkflowStep, ApprovalItem
from app.services.workflow_engine import workflow_engine

client = TestClient(app)

def test_cascade_deletion():
    print("================================================================")
    print("      ONBOARDIQ — CASCADE DELETION VERIFICATION SUITE           ")
    print("================================================================")

    init_db()
    db = SessionLocal()

    # Step 1: Create a candidate via API
    payload = {
        "hire_name": "Deletion Test Candidate",
        "hire_email": "delete.test@example.com",
        "role": "Site Reliability Engineer",
        "department": "Engineering",
        "manager_name": "DevOps Lead",
        "manager_email": "devops.lead@example.com",
        "start_date": "2026-11-20",
        "github_username": "del-test-user"
    }

    create_res = client.post("/api/onboarding", json=payload)
    assert create_res.status_code == 200, f"Expected 200 on creation, got {create_res.status_code}"
    case_data = create_res.json()
    case_id = case_data["id"]
    print(f"  [CREATED] Onboarding Case #{case_id} for '{payload['hire_name']}'")

    # Step 2: Verify case, steps, and approvals exist in DB
    db_case = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    assert db_case is not None, "Case not found in database"
    # Verify workflow steps and approvals exist
    steps_count = db.query(WorkflowStep).filter(WorkflowStep.case_id == case_id).count()
    assert steps_count == 7, f"Expected 7 workflow steps, got {steps_count}"
    print(f"  [VERIFIED] Case #{case_id} contains {steps_count} workflow steps.")

    approvals_count = db.query(ApprovalItem).filter(ApprovalItem.case_id == case_id).count()
    print(f"  [VERIFIED] Case #{case_id} contains {approvals_count} approval items.")

    # Step 3: Call DELETE /api/onboarding/{case_id}
    del_res = client.delete(f"/api/onboarding/{case_id}")
    assert del_res.status_code == 204, f"Expected 204 No Content, got {del_res.status_code}"
    print(f"  [DELETED] DELETE /api/onboarding/{case_id} returned HTTP 204 No Content.")

    # Step 4: Verify 404 from API
    get_res = client.get(f"/api/onboarding/{case_id}")
    assert get_res.status_code == 404, f"Expected 404 Not Found, got {get_res.status_code}"
    print(f"  [VERIFIED] GET /api/onboarding/{case_id} correctly returned 404.")

    # Step 5: Verify zero dangling rows in database
    db_case_after = db.query(OnboardingCase).filter(OnboardingCase.id == case_id).first()
    assert db_case_after is None, "OnboardingCase still exists!"
    steps_after = db.query(WorkflowStep).filter(WorkflowStep.case_id == case_id).count()
    assert steps_after == 0, f"Expected 0 orphaned steps, found {steps_after}!"
    approvals_after = db.query(ApprovalItem).filter(ApprovalItem.case_id == case_id).count()
    assert approvals_after == 0, f"Expected 0 orphaned approvals, found {approvals_after}!"
    print("  [VERIFIED] Zero orphaned steps and zero orphaned approvals in database.")

    # Step 6: Test 404 on deleting non-existent case
    del_404 = client.delete(f"/api/onboarding/{case_id}")
    assert del_404.status_code == 404, f"Expected 404 on subsequent delete, got {del_404.status_code}"
    print("  [VERIFIED] Deleting non-existent case returns HTTP 404.")

    db.close()
    print("================================================================")
    print("  [ALL DELETION TESTS PASSED] — Cascade Integrity Verified      ")
    print("================================================================")

if __name__ == "__main__":
    test_cascade_deletion()
