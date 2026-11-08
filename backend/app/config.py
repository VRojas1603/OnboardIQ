"""
Configuration & Environment Settings Module
============================================
Loads environment variables from root `.env` or system environment,
and provides strongly-typed configuration settings using Pydantic.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Search for .env in current dir, parent dir, or project root
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings(BaseSettings):
    """
    Application settings model defining runtime configuration parameters,
    external API tokens (Vultr Serverless Inference, Slack), and database paths.
    """
    # App Settings
    APP_NAME: str = "OnboardIQ"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", 8000))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./onboardiq.db")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200,http://localhost:5173")

    # Vultr Serverless Inference
    VULTR_INFERENCE_API_KEY: str = os.getenv("VULTR_INFERENCE_API_KEY", "")
    VULTR_INFERENCE_BASE_URL: str = os.getenv("VULTR_INFERENCE_BASE_URL", "https://api.vultrinference.com/v1")
    VULTR_INFERENCE_MODEL: str = os.getenv("VULTR_INFERENCE_MODEL", "llama-3.3-70b-instruct")

    # Slack Integration
    SLACK_BOT_TOKEN: str = os.getenv("SLACK_BOT_TOKEN", "")
    SLACK_DEFAULT_CHANNEL: str = os.getenv("SLACK_DEFAULT_CHANNEL", "hackathon-demo")

    # GitHub Organization Integration
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_ORG: str = os.getenv("GITHUB_ORG", "TestCompany-OnboardIQ-Demo")

    # Gmail SMTP Dispatch Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "OnboardIQ People Operations")

    @property
    def cors_origins_list(self) -> list[str]:
        """
        Parses the comma-delimited CORS_ORIGINS string into a clean list of URLs.
        
        Returns:
            list[str]: Array of allowed CORS origin origins.
        """
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
