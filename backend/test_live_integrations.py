"""
Verification Test Suite: Live Integrations (GitHub Org, Gmail SMTP, Corporate Identity)
======================================================================================
Tests:
1. Corporate Identity & SSO Directory generation (Enterprise SSO Security Vault).
2. GitHub Organization invitation API connector & simulation fallback.
3. Gmail SMTP dispatch connector & simulation fallback.
"""

import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.integrations import identity_service, github_service, email_service
from app.config import settings

def test_corporate_identity_service():
    print("\n--- Test 1: Corporate Identity & SSO Directory Service ---")
    res = identity_service.provision_identity(
        hire_name="Elena Rostova",
        department="AI Platform",
        role="Lead AI Research Engineer"
    )
    
    assert res["account_created"] is True
    assert res["corporate_email"] == "elena.rostova@testcompany.internal"
    assert res["org_unit"] == "/TestCompany/AI Platform"
    assert res["vault_name"] == "Enterprise SSO Security Vault"
    assert "start.testcompany.internal/vault" in res["security_vault"]
    assert res["mfa_enforced"] is True
    assert len(res["groups_assigned"]) >= 3
    print("  [PASS] Corporate Identity generated with Enterprise SSO Security Vault and RBAC groups.")
    print(f"  Corporate Email: {res['corporate_email']}")
    print(f"  Vault: {res['security_vault']}")

def test_github_service():
    print("\n--- Test 2: GitHub Organization Connector ---")
    print(f"  Target Org: {github_service.org}")
    print(f"  Token Configured: {bool(github_service.token)}")
    
    res = github_service.invite_member(
        hire_name="Elena Rostova",
        hire_email="elena.rostova.test@example.com",
        github_username="elena-rostova-dev",
        department="AI Platform"
    )
    
    assert res["delivered"] is True
    assert res["organization"] == "TestCompany-OnboardIQ-Demo"
    print(f"  [PASS] GitHub invitation handled successfully (Mode: {res.get('mode')}).")
    print(f"  Message: {res.get('message')}")

def test_email_service():
    print("\n--- Test 3: Email Service (Gmail SMTP) ---")
    print(f"  SMTP Host: {email_service.host}:{email_service.port}")
    print(f"  User Configured: {bool(email_service.user)}")
    
    res = email_service.send_welcome_email(
        recipient_email="candidate.test@example.com",
        recipient_name="Elena Rostova",
        subject="Welcome to TestCompany! 🎉",
        body_text="Hi Elena, Welcome to the team! Day 1 starts at 9:30 AM."
    )
    
    assert res["delivered"] is True
    print(f"  [PASS] Email dispatch handled successfully (Mode: {res.get('mode')}).")
    print(f"  Message: {res.get('message')}")

def main():
    print("================================================================")
    print("     ONBOARDIQ — LIVE INTEGRATIONS VERIFICATION SUITE           ")
    print("================================================================")
    test_corporate_identity_service()
    test_github_service()
    test_email_service()
    print("\n================================================================")
    print("  [ALL INTEGRATION TESTS PASSED] — Ready for Live Demonstrations ")
    print("================================================================")

if __name__ == "__main__":
    main()
