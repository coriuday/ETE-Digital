"""
Import all models for Alembic autogenerate
"""

from app.models.users import User, UserProfile, RefreshToken
from app.models.jobs import Job, Application
from app.models.tryouts import Tryout, TryoutSubmission
from app.models.vault import TalentVaultItem, VaultShareToken
from app.models.notifications import Notification, AuditLog
from app.models.company import CompanyProfile, Interview

__all__ = [
    "User",
    "UserProfile",
    "RefreshToken",
    "Job",
    "Application",
    "Tryout",
    "TryoutSubmission",
    "TalentVaultItem",
    "VaultShareToken",
    "Notification",
    "AuditLog",
    "CompanyProfile",
    "Interview",
]
