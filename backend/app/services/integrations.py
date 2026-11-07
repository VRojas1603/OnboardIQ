"""
Enterprise Integration Connectors for OnboardIQ.

Provides integrations with external productivity and identity platforms:
- Slack API: Broadcasts new-hire announcements and alert cards to team channels.
- Google Workspace: Simulates enterprise identity provisioning, Google Drive vaults, and group membership.
- GitHub Enterprise: Simulates organization seat assignment and repository access controls.
"""

import logging
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

    def post_welcome_announcement(self, hire_name: str, role: str, department: str, start_date: str, manager_name: str) -> dict:
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
        if not self.bot_token:
            logger.info("SLACK_BOT_TOKEN not provided. Returning simulated Slack dispatch.")
            return {
                "delivered": True,
                "mode": "simulated",
                "channel": f"#{self.default_channel}",
                "message": f"Welcome announcement for {hire_name} published to #{self.default_channel}",
                "timestamp": "1730937600.000100"
            }

        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json"
        }
        
        # Clean channel identifier (Slack API prefers channel name without '#' or channel ID)
        channel_id = self.default_channel.lstrip("#") if self.default_channel else "general"
        
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


class GoogleWorkspaceService:
    """
    Connects to or simulates identity directory provisioning on Google Workspace / Cloud Identity.
    """

    @staticmethod
    def provision_account(hire_name: str, department: str) -> dict:
        """
        Simulate enterprise Google Workspace provisioning for email, organizational unit, and security groups.

        Args:
            hire_name: Full name of candidate.
            department: Functional team.

        Returns:
            dict containing corporate email, org unit, assigned Google Groups, and vault directory.
        """
        clean_name = hire_name.lower().replace(" ", ".")
        org_email = f"{clean_name}@company.internal"
        return {
            "account_created": True,
            "corporate_email": org_email,
            "org_unit": f"/Staff/{department}",
            "groups_assigned": [
                f"{department.lower()}-team@company.internal",
                "all-hands@company.internal",
                "announcements@company.internal"
            ],
            "google_drive_folder": f"https://drive.google.com/drive/folders/{clean_name}-onboarding-vault",
            "mfa_enforced": True,
            "status": "Active (Awaiting First Login)"
        }


class GitHubService:
    """
    Connects to or simulates developer organization invitation and team-based repository permissions on GitHub.
    """

    @staticmethod
    def provision_team_access(hire_name: str, department: str, role: str) -> dict:
        """
        Simulate corporate GitHub organization invitation and engineering permissions.

        Args:
            hire_name: Full name of candidate.
            department: Functional team.
            role: Position title.

        Returns:
            dict containing GitHub username, organization, teams assigned, and audit trail record.
        """
        handle = hire_name.lower().replace(" ", "-") + "-dev"
        dept_clean = department.lower().replace(" ", "-")
        return {
            "invitation_sent": True,
            "github_username": handle,
            "organization": "Acme-Corp-Global",
            "teams_assigned": [
                f"{dept_clean}-contributors",
                "engineering-general"
            ],
            "base_role": "Member",
            "two_factor_auth_required": True,
            "audit_trail_id": f"gh-audit-{dept_clean}-9941"
        }

slack_service = SlackService()
google_service = GoogleWorkspaceService()
github_service = GitHubService()
