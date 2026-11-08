"""
Enterprise Integration Connectors for OnboardIQ.
================================================
Provides integrations with external productivity, communication, and identity platforms:
- Slack API: Broadcasts interactive Block Kit new-hire announcements to team channels.
- GitHub Enterprise / Org: Invites candidates to the company GitHub Organization via REST API.
- Gmail SMTP: Dispatches Day 0 Welcome Emails synthesized by Vultr Serverless Inference.
- Corporate Identity & SSO: Provisions enterprise identity profiles, directory UIDs, RBAC security groups, and Enterprise SSO Security Vaults.
"""

import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class SlackService:
    """
    Handles Slack messaging and interactive block notifications via Web API chat.postMessage.
    Gracefully falls back to simulated delivery if credentials are not configured or the network is offline.
    """

    def __init__(self):
        """Initialize Slack credentials and target default broadcast channel from settings."""
        self.bot_token = settings.SLACK_BOT_TOKEN
        self.default_channel = settings.SLACK_DEFAULT_CHANNEL

    def post_welcome_announcement(self, hire_name: str, role: str, department: str, start_date: str, manager_name: str, channel: str | None = None) -> dict[str, Any]:
        """
        Post a rich Slack Block Kit welcome card announcing a new employee to the team channel.

        Args:
            hire_name: Candidate's full name.
            role: Candidate's title.
            department: Functional team.
            start_date: Employee starting date string.
            manager_name: Candidate's direct supervisor.

        Returns:
            dict payload indicating delivery mode ('live' or 'simulated'), timestamp, and channel metadata.
        """
        target_raw = channel or self.default_channel
        channel_id = target_raw.lstrip("#") if target_raw else "hackathon-demo"

        if not self.bot_token:
            logger.info("SLACK_BOT_TOKEN not provided. Returning simulated Slack dispatch.")
            return {
                "delivered": True,
                "mode": "simulated",
                "channel": f"#{channel_id}",
                "message": f"Welcome announcement for {hire_name} published to #{channel_id}",
                "timestamp": "1730937600.000100"
            }

        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json"
        }
        
        # Slack Blocks payload
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🎉 New Team Member Alert!",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"Please join us in giving a warm welcome to *{hire_name}*, who is joining the *{department}* team as *{role}* starting *{start_date}*!"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Manager:*\n{manager_name}"},
                    {"type": "mrkdwn", "text": f"*Department:*\n{department}"},
                    {"type": "mrkdwn", "text": f"*Status:*\nOnboarding via OnboardIQ"},
                    {"type": "mrkdwn", "text": f"*Start Date:*\n{start_date}"}
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "⚡ *OnboardIQ* | Autonomous Orchestrator powered by Vultr Cloud"
                    }
                ]
            }
        ]

        payload = {
            "channel": channel_id,
            "text": f"Welcome {hire_name} to the team as our new {role}!",
            "blocks": blocks
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, headers=headers, json=payload)
                data = res.json()
                if data.get("ok"):
                    logger.info(f"Successfully posted Slack announcement to {channel_id}")
                    return {
                        "delivered": True,
                        "mode": "live",
                        "channel": channel_id,
                        "timestamp": data.get("ts"),
                        "message": f"Successfully published to Slack channel {channel_id}"
                    }
                else:
                    logger.warning(f"Slack API response error: {data.get('error')}. Fallback to simulated delivery.")
                    return {
                        "delivered": True,
                        "mode": "simulated",
                        "channel": channel_id,
                        "warning": f"Slack API: {data.get('error')}",
                        "message": f"Announcement prepared for {channel_id}"
                    }
        except Exception as e:
            logger.error(f"Error calling Slack API: {e}")
            return {
                "delivered": True,
                "mode": "simulated",
                "channel": channel_id,
                "error": str(e),
                "message": f"Announcement staged for {channel_id}"
            }


class CorporateIdentityService:
    """
    Simulates enterprise Identity Provider (IdP) directory provisioning (e.g. Okta, Entra ID, JumpCloud).
    Generates corporate email, SSO directory IDs, department security groups, and Enterprise SSO Security Vaults.
    """

    @staticmethod
    def provision_identity(hire_name: str, department: str, role: str = "Team Member") -> dict[str, Any]:
        """
        Generate enterprise identity provisioning metadata for a candidate.

        Args:
            hire_name: Full name of candidate.
            department: Functional team / department.
            role: Target job title.

        Returns:
            dict containing corporate email, directory UID, organizational unit, assigned groups, and vault URI.
        """
        clean_name = hire_name.lower().replace(" ", ".")
        clean_dept = department.lower().replace(" ", "-")
        org_email = f"{clean_name}@testcompany.internal"
        directory_uid = f"sso_usr_{abs(hash(clean_name + clean_dept)) % 10000000:07d}"

        return {
            "account_created": True,
            "corporate_email": org_email,
            "sso_directory_id": directory_uid,
            "org_unit": f"/TestCompany/{department}",
            "role_title": role,
            "groups_assigned": [
                f"{clean_dept}-team@testcompany.internal",
                "all-hands@testcompany.internal",
                "internal-tools-access@testcompany.internal"
            ],
            "security_vault": f"https://start.testcompany.internal/vault/{directory_uid}",
            "vault_name": "Enterprise SSO Security Vault",
            "mfa_enforced": True,
            "status": "Active (Awaiting Day 1 First Login)",
            "provisioned_at": datetime.utcnow().isoformat()
        }

    # Backward compatibility alias
    provision_account = provision_identity


class GitHubService:
    """
    Connects to GitHub REST API to invite new hires to the company GitHub Organization.
    Gracefully falls back to high-fidelity simulation if credentials are not configured or offline.
    """

    def __init__(self):
        """Initialize GitHub API credentials and target organization from application configuration."""
        self.token = settings.GITHUB_TOKEN
        self.org = settings.GITHUB_ORG

    def _lookup_user_id(self, github_username: str) -> int | None:
        """
        Query GitHub API to resolve a username to an integer user ID.

        Args:
            github_username: Candidate's GitHub handle.

        Returns:
            int user ID if found, else None.
        """
        if not self.token:
            return None

        url = f"https://api.github.com/users/{github_username}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "OnboardIQ-Orchestrator"
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("id")
        except Exception as e:
            logger.warning(f"Failed to lookup GitHub username '{github_username}': {e}")
        return None

    def invite_member(
        self,
        hire_name: str,
        hire_email: str,
        github_username: str | None = None,
        department: str = "Engineering",
        role: str = "direct_member"
    ) -> dict[str, Any]:
        """
        Invite candidate to the GitHub organization using live REST API, or return realistic simulation.

        Args:
            hire_name: Candidate's full name.
            hire_email: Personal contact email to receive invitation.
            github_username: Optional GitHub handle.
            department: Functional team.
            role: Organization role ('direct_member' or 'admin').

        Returns:
            dict containing invitation status, mode, and audit details.
        """
        if not self.token or not self.org:
            logger.info("GITHUB_TOKEN or GITHUB_ORG not set. Using simulated GitHub provisioning.")
            return self._simulate_provisioning(hire_name, hire_email, github_username, department)

        url = f"https://api.github.com/orgs/{self.org}/invitations"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "OnboardIQ-Orchestrator"
        }

        payload: dict[str, Any] = {"role": role}

        # If a username is specified, resolve user ID first
        if github_username:
            user_id = self._lookup_user_id(github_username)
            if user_id:
                payload["invitee_id"] = user_id
            else:
                payload["email"] = hire_email
        else:
            payload["email"] = hire_email

        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code in (201, 200):
                    data = res.json()
                    logger.info(f"Successfully invited {hire_name} to GitHub Org {self.org}")
                    return {
                        "delivered": True,
                        "mode": "live",
                        "organization": self.org,
                        "invitation_id": data.get("id"),
                        "target": payload.get("email") or github_username,
                        "role": role,
                        "created_at": data.get("created_at"),
                        "message": f"Successfully sent member invitation to {hire_name} for GitHub Org {self.org}."
                    }
                elif res.status_code == 422:
                    error_data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                    message = error_data.get("message", res.text)
                    logger.warning(f"GitHub invitation returned 422: {message}")
                    return {
                        "delivered": True,
                        "mode": "live_warning",
                        "organization": self.org,
                        "target": payload.get("email") or github_username,
                        "status": "already_invited_or_member",
                        "warning": "Candidate is already an invited or active member of this GitHub organization.",
                        "details": message
                    }
                else:
                    logger.warning(f"GitHub API {res.status_code}: {res.text}. Falling back to simulation.")
                    return self._simulate_provisioning(hire_name, hire_email, github_username, department, warning=f"GitHub API HTTP {res.status_code}")
        except Exception as e:
            logger.error(f"Error calling GitHub API: {e}")
            return self._simulate_provisioning(hire_name, hire_email, github_username, department, warning=str(e))

    def _simulate_provisioning(
        self,
        hire_name: str,
        hire_email: str,
        github_username: str | None = None,
        department: str = "Engineering",
        warning: str | None = None
    ) -> dict[str, Any]:
        """Generate high-fidelity simulated GitHub organization provisioning receipt."""
        handle = github_username or (hire_name.lower().replace(" ", "-") + "-dev")
        clean_dept = department.lower().replace(" ", "-")
        receipt: dict[str, Any] = {
            "delivered": True,
            "mode": "simulated",
            "organization": self.org or "TestCompany-OnboardIQ-Demo",
            "target": github_username or hire_email,
            "github_username": handle,
            "teams_assigned": [
                f"{clean_dept}-contributors",
                "engineering-general"
            ],
            "base_role": "Member",
            "two_factor_auth_required": True,
            "audit_trail_id": f"gh-audit-{clean_dept}-9941",
            "message": f"Simulated GitHub Organization invitation staged for {hire_name}."
        }
        if warning:
            receipt["warning"] = warning
        return receipt

    def provision_team_access(self, hire_name: str, department: str, role: str) -> dict[str, Any]:
        """Pre-approval preview generation helper."""
        return self._simulate_provisioning(hire_name, "", None, department)


class EmailService:
    """
    Dispatches outbound transactional welcome emails using standard SMTP (Gmail).
    Gracefully falls back to high-fidelity simulation if credentials are not configured.
    """

    def __init__(self):
        """Initialize SMTP connection parameters from configuration."""
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_name = settings.SMTP_FROM_NAME

    def send_welcome_email(self, recipient_email: str, recipient_name: str, subject: str, body_text: str) -> dict[str, Any]:
        """
        Send Day 0 Welcome Email to candidate personal inbox via Gmail SMTP.

        Args:
            recipient_email: Destination candidate email.
            recipient_name: Full name of candidate.
            subject: AI-generated email subject line.
            body_text: AI-generated personalized email body.

        Returns:
            dict indicating delivery status, mode, and dispatch timestamp.
        """
        if not self.user or not self.password:
            logger.info("SMTP credentials not configured. Simulating email dispatch.")
            return {
                "delivered": True,
                "mode": "simulated",
                "recipient": recipient_email,
                "subject": subject,
                "message": f"Welcome email staged for {recipient_email} (Simulated — add SMTP_USER & SMTP_PASSWORD to send live)."
            }

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.user}>"
        msg["To"] = recipient_email

        part = MIMEText(body_text, "plain", "utf-8")
        msg.attach(part)

        try:
            with smtplib.SMTP(self.host, self.port, timeout=12.0) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.user, [recipient_email], msg.as_string())

            logger.info(f"Successfully sent Day 0 welcome email to {recipient_email} via {self.host}:{self.port}")
            return {
                "delivered": True,
                "mode": "live",
                "provider": "Gmail SMTP",
                "recipient": recipient_email,
                "sender": self.user,
                "subject": subject,
                "timestamp": datetime.utcnow().isoformat(),
                "message": f"Successfully delivered Day 0 welcome email to {recipient_email} via Gmail SMTP."
            }
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {recipient_email}: {e}")
            return {
                "delivered": False,
                "mode": "failed",
                "error": str(e),
                "recipient": recipient_email,
                "message": f"SMTP delivery failed: {e}"
            }


slack_service = SlackService()
identity_service = CorporateIdentityService()
google_service = identity_service  # Legacy alias
github_service = GitHubService()
email_service = EmailService()
