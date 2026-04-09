"""
Talent Vault-related Pydantic schemas
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from app.models.vault import VaultItemType

# ========== Vault Item ==========


class VaultItemCreate(BaseModel):
    """Create vault item"""

    type: VaultItemType
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

    file_url: Optional[str] = Field(None, max_length=500)  # Will be encrypted
    file_type: Optional[str] = Field(None, max_length=50)

    item_metadata: Optional[Dict] = None
    # Example: {'tech_stack': ['React', 'Node'], 'github_url': '...', 'live_url': '...'}

    # Verification
    tryout_submission_id: Optional[str] = None  # If from a tryout


class VaultItemUpdate(BaseModel):
    """Update vault item"""

    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

    file_url: Optional[str] = Field(None, max_length=500)
    file_type: Optional[str] = Field(None, max_length=50)

    item_metadata: Optional[Dict] = None


class VaultItemResponse(BaseModel):
    """Vault item response"""

    id: str
    candidate_id: str

    type: VaultItemType
    title: str
    description: Optional[str]

    file_url: Optional[str]  # Decrypted for owner
    file_type: Optional[str]
    file_size_bytes: Optional[int]

    item_metadata: Optional[Dict]

    is_verified: bool
    verified_by: Optional[str]
    tryout_submission_id: Optional[str]

    share_count: int
    view_count: int

    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class VaultItemListResponse(BaseModel):
    """Paginated vault item list"""

    items: List[VaultItemResponse]
    total: int
    page: int
    page_size: int


# ========== Share Token ==========


class ShareTokenCreate(BaseModel):
    """Create share token for vault items"""

    vault_item_ids: List[str] = Field(..., min_length=1)

    # Access control
    expires_hours: Optional[int] = Field(None, ge=1, le=720)  # Max 30 days
    max_views: Optional[int] = Field(None, ge=1)

    # Optional recipient tracking
    shared_with_email: Optional[str] = None
    shared_with_company: Optional[str] = Field(None, max_length=255)


class ShareTokenResponse(BaseModel):
    """Share token response"""

    id: str
    vault_item_id: str

    token: str
    share_url: str  # Full URL with token

    expires_at: Optional[datetime]
    max_views: Optional[int]
    view_count: int
    is_revoked: bool

    shared_with_email: Optional[str]
    shared_with_company: Optional[str]

    created_at: datetime
    last_accessed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ShareTokenListResponse(BaseModel):
    """Paginated share token list"""

    tokens: List[ShareTokenResponse]
    total: int
    page: int
    page_size: int


class VaultAccessResponse(BaseModel):
    """Response when accessing vault via share token"""

    item: VaultItemResponse
    remaining_views: Optional[int]
    expires_at: Optional[datetime]


# ========== Statistics ==========


class VaultStatsResponse(BaseModel):
    """Vault statistics"""

    total_items: int
    verified_items: int
    total_shares: int
    total_views: int
    items_by_type: Dict[str, int]
