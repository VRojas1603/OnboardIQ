"""
AI Service Module for OnboardIQ.

Orchestrates LLM-powered generation tasks using Vultr Serverless Inference (e.g. Llama-3.3-70B-Instruct).
Provides robust fallbacks to guaranteed high-quality templates if API keys are missing or network calls fail.
"""

import json
import logging
import time
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    """
    Manages prompt generation, remote inference against Vultr Serverless endpoints,
    and fallback generation for onboarding documentation, equipment requests, and schedules.
    """

    def __init__(self):
        """Initialize inference client settings from application configuration."""
        self.api_key = settings.VULTR_INFERENCE_API_KEY
        self.base_url = settings.VULTR_INFERENCE_BASE_URL.rstrip('/')
        self.model = settings.VULTR_INFERENCE_MODEL

    def _call_vultr_inference(self, prompt: str, system_prompt: str = "You are an expert HR operations and enterprise onboarding AI assistant.") -> str:
        """
        Execute an HTTP POST call to the Vultr Serverless Inference OpenAI-compatible endpoint.

        Args:
            prompt: User-level instruction or prompt template.
            system_prompt: System instruction directing tone and formatting.

        Returns:
            Extracted text content from the LLM completion, or an empty string on error/absence of credentials.
        """
        # Read dynamically in case .env was updated
        api_key = self.api_key or settings.VULTR_INFERENCE_API_KEY
        if not api_key:
            logger.info("VULTR_INFERENCE_API_KEY is not set. Using smart template generator.")
            return ""

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1200
        }

        max_retries = 3
        backoff_delays = [1.0, 2.0, 4.0]

        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=25.0) as client:
                    response = client.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        return content.strip()
                    elif response.status_code in (429, 500, 502, 503, 504):
                        logger.warning(
                            f"Vultr Inference API transient error {response.status_code} on attempt {attempt + 1}/{max_retries}: {response.text}"
                        )
                        if attempt < max_retries - 1:
                            time.sleep(backoff_delays[attempt])
                            continue
                    else:
                        logger.error(f"Vultr Inference API error {response.status_code}: {response.text}")
                        return ""
            except (httpx.TimeoutException, httpx.NetworkError) as e:
                logger.warning(
                    f"Network error communicating with Vultr Serverless Inference (attempt {attempt + 1}/{max_retries}): {e}"
                )
                if attempt < max_retries - 1:
                    time.sleep(backoff_delays[attempt])
                    continue
            except Exception as e:
                logger.error(f"Unexpected error communicating with Vultr Serverless Inference: {e}")
                return ""

        logger.error(f"Exhausted {max_retries} attempts communicating with Vultr Serverless Inference. Falling back to template.")
        return ""

    def generate_welcome_email(self, hire_name: str, role: str, department: str, manager_name: str, start_date: str) -> dict:
        """
        Generate a personalized Day 0 welcome email for a new hire.

        Attempts remote Vultr inference first; falls back to an enterprise-grade structured template
        if inference is unavailable or fails.

        Args:
            hire_name: Full name of the candidate.
            role: Job position title.
            department: Functional team / department.
            manager_name: Reporting manager's full name.
            start_date: Official start date string (e.g. '2026-03-01').

        Returns:
            dict containing 'subject' and 'body' strings.
        """
        prompt = f"""
Write an enthusiastic, professional Day 0 welcome email for our new team member:
- New Hire: {hire_name}
- Role: {role}
- Department: {department}
- Direct Manager: {manager_name}
- Official Start Date: {start_date}

Please format your response as a valid JSON object with exactly two keys:
"subject": string (a welcoming, exciting subject line)
"body": string (the email body, including Day 1 arrival instructions, dress code, first day lunch invitation with the team, and 3 quick checklist items to complete before Day 1)

Output ONLY valid JSON without markdown fences.
"""
        raw_output = self._call_vultr_inference(prompt)
        
        if raw_output:
            cleaned = raw_output.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                if "subject" in parsed and "body" in parsed:
                    return parsed
            except Exception:
                pass

        # High-fidelity fallback if offline or API key missing
        return {
            "subject": f"Welcome to the Team, {hire_name}! 🎉 — Day 1 Instructions ({start_date})",
            "body": (
                f"Hi {hire_name},\n\n"
                f"We are absolutely thrilled to welcome you to the {department} team as our new {role}! "
                f"Your official start date is {start_date}, and your manager, {manager_name}, is preparing an exciting first week for you.\n\n"
                f"Here is what to expect on Day 1:\n"
                f"• 9:30 AM: Welcome coffee & IT workstation setup\n"
                f"• 11:00 AM: Department overview with {manager_name}\n"
                f"• 12:30 PM: Team lunch (on us!)\n"
                f"• 2:00 PM: Introduction to company values & systems tour\n\n"
                f"Pre-arrival Checklist:\n"
                f"1. Complete your direct deposit and emergency contact form.\n"
                f"2. Check your personal email for the single sign-on (SSO) activation link.\n"
                f"3. Bring a valid government ID for Day-1 verification.\n\n"
                f"If you have any questions before Monday, feel free to reply directly to this email.\n\n"
                f"Warm regards,\n"
                f"The People Operations Team"
            )
        }

    def generate_onboarding_plan(self, hire_name: str, role: str, department: str, manager_name: str) -> dict:
        """
        Generate a comprehensive 30-day onboarding plan segmented across weeks 1 through 4.

        Args:
            hire_name: Full name of the candidate.
            role: Job position title.
            department: Functional team / department.
            manager_name: Reporting manager's full name.

        Returns:
            dict containing lists of tasks for 'week1', 'week2', 'week3_4', and a 'day30_goal' string.
        """
        prompt = f"""
Create a structured 30-day onboarding plan for {hire_name}, who is joining as {role} in {department}, reporting to {manager_name}.
Output a JSON object with:
"week1": ["4 concrete tasks for Week 1"],
"week2": ["4 concrete tasks for Week 2"],
"week3_4": ["4 concrete tasks for Weeks 3 and 4"],
"day30_goal": "One clear, measurable 30-day success milestone"

Output ONLY valid JSON without markdown fences.
"""
        raw_output = self._call_vultr_inference(prompt)
        if raw_output:
            cleaned = raw_output.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                if "week1" in parsed and "day30_goal" in parsed:
                    return parsed
            except Exception:
                pass

        return {
            "week1": [
                f"Complete security compliance and IT workstation setup with {manager_name}",
                f"Review {department} team architecture and standard operating procedures",
                "1-on-1 coffee chats with 4 key cross-functional team members",
                "Shadow team lead during weekly sprint planning and standup"
            ],
            "week2": [
                f"Setup local dev/tooling environment and verify access to all {department} repositories",
                "Complete first starter task or documentation enhancement",
                "Review quarterly OKRs and team mission with manager",
                "First formal bi-weekly 1-on-1 check-in"
            ],
            "week3_4": [
                f"Take ownership of your first core project milestone as {role}",
                "Participate independently in team code/design reviews",
                "Deliver first sprint demonstration to department stakeholders",
                "Present 30-day retrospective and identify onboarding feedback"
            ],
            "day30_goal": f"Independently deliver a production-ready initiative as {role} and lead team standup without supervision."
        }

    def generate_equipment_request(self, hire_name: str, role: str, department: str) -> list[dict]:
        """
        Generate tailored hardware, software, and access provisioning requirements for the role.

        Args:
            hire_name: Full name of the candidate.
            role: Job position title.
            department: Functional team / department.

        Returns:
            list of dict items with keys 'item', 'category', and 'status'.
        """
        prompt = f"""
Generate an IT equipment and software provisioning checklist for a new {role} in {department}.
Output a JSON array of objects, each having:
{{"item": string, "category": "Hardware" | "Software" | "Access", "status": "Ready to Provision"}}

Output ONLY valid JSON without markdown fences.
"""
        raw_output = self._call_vultr_inference(prompt)
        if raw_output:
            cleaned = raw_output.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed
            except Exception:
                pass

        return [
            {"item": "MacBook Pro 16\" (M3 Pro, 36GB RAM, 1TB SSD)", "category": "Hardware", "status": "Ready to Dispatch"},
            {"item": "Dell UltraSharp 27\" 4K USB-C Hub Monitor", "category": "Hardware", "status": "Ready to Dispatch"},
            {"item": "Logitech MX Master 3S + Mechanical Keyboard", "category": "Hardware", "status": "Ready to Dispatch"},
            {"item": "Google Workspace Enterprise & 1Password Business License", "category": "Software", "status": "Pre-configured"},
            {"item": f"{department} AWS/Cloud Staging & Production Console Access", "category": "Access", "status": "Pending Manager Sign-off"},
            {"item": "Slack Enterprise Grid & GitHub Enterprise Seat", "category": "Access", "status": "Pending Manager Sign-off"}
        ]

ai_service = AIService()
