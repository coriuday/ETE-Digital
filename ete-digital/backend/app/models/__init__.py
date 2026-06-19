"""
Import all models for Alembic autogenerate
"""

from app.models.users import User, UserProfile, RefreshToken
from app.models.jobs import Job, Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.tryouts import Tryout, TryoutSubmission
from app.models.vault import TalentVaultItem, VaultShareToken
from app.models.notifications import Notification, AuditLog
from app.models.company import CompanyProfile, Interview
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.subscription import Subscription

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
    "Organization",
    "OrganizationMember",
    "Subscription",
]
