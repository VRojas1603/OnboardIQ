"""
System Health and Integration Status Endpoints.

Provides readiness checks, environment details, and configuration probes
for Vultr Serverless Inference and Slack integration connectivity.
"""

from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check():
    """
    Perform application health check.

    Returns diagnostic metadata about service status, active environment,
    and external credentials status for Vultr Inference and Slack.
    """
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "vultr_inference": {
            "configured": bool(settings.VULTR_INFERENCE_API_KEY),
            "model": settings.VULTR_INFERENCE_MODEL,
            "base_url": settings.VULTR_INFERENCE_BASE_URL
        },
        "slack": {
            "configured": bool(settings.SLACK_BOT_TOKEN),
            "default_channel": settings.SLACK_DEFAULT_CHANNEL
        }
    }
