"""
FastAPI Application Configuration
Centralized settings management using Pydantic BaseSettings
"""

import os
from typing import List, Optional
from pydantic import PostgresDsn, model_validator
from pydantic_settings import BaseSettings

# ✅ ALWAYS override first
if os.getenv("TEST_DATABASE_URL"):
    os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL")
    print("[DB] USING TEST DATABASE")


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    APP_NAME: str = "ETE Digital"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    # Server
    HOST: str = "0.0.0.0"  # nosec B104 — intentional: container bind-all for Docker
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./local_dev.db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Redis (optional — used only if REDIS_URL provided; falls back to in-memory)
    REDIS_URL: Optional[str] = None
    REDIS_CACHE_TTL: int = 3600  # 1 hour

    # Security - JWT  ← REQUIRED: must be set via JWT_SECRET_KEY env var
    JWT_SECRET_KEY: str  # no default — must be provided explicitly
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Security - Encryption (field-level)  ← REQUIRED: must be set via ENCRYPTION_KEY env var
    ENCRYPTION_KEY: str  # no default — must be provided explicitly
    # Security - Password
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True

    # Frontend URL (used for email links — e.g. email verification, password reset)
    FRONTEND_URL: str = "http://localhost:5173"

    # CORS — allow frontend origins
    # NOTE: FastAPI/Starlette CORSMiddleware does EXACT string matching only.
    # Wildcards like *.vercel.app are NOT supported — list every origin explicitly.
    # Can be overridden with CORS_ORIGINS env var (comma-separated list)
    CORS_ORIGINS: List[str] = [
        # Local development
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        # Production — Vercel deployments
        "https://ete-digital.vercel.app",
        "https://ete-digital-git-main.vercel.app",
        "https://jobsrow.vercel.app",
        # Production — custom domain
        "https://jobsrow.com",
        "https://www.jobsrow.com",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # OAuth2 - Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/oauth/google/callback"

    # Email / SMTP
    EMAIL_ENABLED: bool = True  # Set False to skip sending (console log only)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USE_TLS: bool = False  # True = STARTTLS (Gmail / Mailgun port 587)
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@etedigital.com"
    SMTP_FROM_NAME: str = "ETE Digital"

    # Object Storage - MinIO/S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_SECURE: bool = False  # True for HTTPS in production
    MINIO_BUCKET_NAME: str = "ete-digital"

    # File Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_IMAGE_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "gif", "webp"]
    ALLOWED_DOCUMENT_EXTENSIONS: List[str] = ["pdf", "doc", "docx", "txt"]
    ALLOWED_CODE_EXTENSIONS: List[str] = ["py", "js", "ts", "java", "cpp", "go", "zip"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_ATTEMPTS: int = 5
    RATE_LIMIT_AUTH_WINDOW_MINUTES: int = 15

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Search
    SEARCH_MIN_QUERY_LENGTH: int = 3
    SEARCH_MAX_RESULTS: int = 100

    # Tryouts
    TRYOUT_MIN_DURATION_DAYS: int = 1
    TRYOUT_MAX_DURATION_DAYS: int = 7
    TRYOUT_AUTO_SCORE_TIMEOUT_SECONDS: int = 300  # 5 minutes

    # Stripe (Test Mode)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_CONNECT_ENABLED: bool = False

    # AI Matching — Google Gemini (optional, free tier)
    # Get a free key at https://aistudio.google.com/
    # If not set, the matching engine will use template-based explanations.
    GEMINI_API_KEY: Optional[str] = None

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def _validate_production_settings(self) -> "Settings":
        """Enforce settings that are critical in non-development environments."""
        if self.ENVIRONMENT == "production":
            if self.DEBUG:
                raise ValueError("DEBUG must be False in production. " "Set ENVIRONMENT=development to use debug mode.")
            if not self.REDIS_URL:
                import logging as _logging

                _logging.getLogger(__name__).warning(
                    "REDIS_URL is not set in production. Rate limiting will use in-memory storage "
                    "which does NOT persist across workers or restarts. Set REDIS_URL for production reliability."
                )
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


import logging

# Set up simple logging for the config
logger = logging.getLogger(__name__)

# Singleton instance
settings = Settings()
