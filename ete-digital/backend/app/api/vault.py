"""
Talent Vault API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.core.config import settings
from app.models.users import UserRole
from app.models.vault import VaultItemType
from app.schemas.vault import (
    VaultItemCreate,
    VaultItemUpdate,
    VaultItemResponse,
    VaultItemListResponse,
    ShareTokenCreate,
    ShareTokenResponse,
    ShareTokenListResponse,
    VaultAccessResponse,
    VaultStatsResponse
)
from app.services.vault import vault_service, share_token_service


router = APIRouter()


# ========== Vault Item Endpoints ==========

@router.post("/items", response_model=VaultItemResponse, status_code=status.HTTP_201_CREATED)
async def create_vault_item(
    item_data: VaultItemCreate,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new vault item (Candidates only)
    
    Add projects, verified samples, badges, or certificates to your talent vault.
    """
    item = await vault_service.create_vault_item(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        item_data=item_data.model_dump()
    )
    
    return VaultItemResponse(
        id=str(item.id),
        candidate_id=str(item.candidate_id),
        type=item.type,
        title=item.title,
        description=item.description,
        file_url=item.file_url,
        file_type=item.file_type,
        file_size_bytes=item.file_size_bytes,
        item_metadata=item.item_metadata,
        is_verified=item.is_verified,
        verified_by=item.verified_by,
        tryout_submission_id=str(item.tryout_submission_id) if item.tryout_submission_id else None,
        share_count=item.share_count,
        view_count=item.view_count,
        created_at=item.created_at,
        updated_at=item.updated_at
    )


@router.get("/items", response_model=VaultItemListResponse)
async def get_my_vault_items(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    item_type: Optional[VaultItemType] = None,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Get all vault items for current candidate"""
    items, total = await vault_service.get_candidate_vault(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        page=page,
        page_size=page_size,
        item_type=item_type
    )
    
    return VaultItemListResponse(
        items=[
            VaultItemResponse(
                id=str(item.id),
                candidate_id=str(item.candidate_id),
                type=item.type,
                title=item.title,
                description=item.description,
                file_url=item.file_url,
                file_type=item.file_type,
                file_size_bytes=item.file_size_bytes,
                item_metadata=item.item_metadata,
                is_verified=item.is_verified,
                verified_by=item.verified_by,
                tryout_submission_id=str(item.tryout_submission_id) if item.tryout_submission_id else None,
                share_count=item.share_count,
                view_count=item.view_count,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
            for item in items
        ],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/items/{item_id}", response_model=VaultItemResponse)
async def get_vault_item(
    item_id: str,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Get vault item details"""
    item = await vault_service.get_vault_item(db, uuid.UUID(item_id))
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault item not found"
        )
    
    # Verify ownership
    if item.candidate_id != uuid.UUID(current_user["user_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this item"
        )
    
    return VaultItemResponse(
        id=str(item.id),
        candidate_id=str(item.candidate_id),
        type=item.type,
        title=item.title,
        description=item.description,
        file_url=item.file_url,
        file_type=item.file_type,
        file_size_bytes=item.file_size_bytes,
        item_metadata=item.item_metadata,
        is_verified=item.is_verified,
        verified_by=item.verified_by,
        tryout_submission_id=str(item.tryout_submission_id) if item.tryout_submission_id else None,
        share_count=item.share_count,
        view_count=item.view_count,
        created_at=item.created_at,
        updated_at=item.updated_at
    )


@router.put("/items/{item_id}", response_model=VaultItemResponse)
async def update_vault_item(
    item_id: str,
    item_data: VaultItemUpdate,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Update vault item"""
    item = await vault_service.update_vault_item(
        db=db,
        item_id=uuid.UUID(item_id),
        candidate_id=uuid.UUID(current_user["user_id"]),
        update_data=item_data.model_dump(exclude_unset=True)
    )
    
    return VaultItemResponse(
        id=str(item.id),
        candidate_id=str(item.candidate_id),
        type=item.type,
        title=item.title,
        description=item.description,
        file_url=item.file_url,
        file_type=item.file_type,
        file_size_bytes=item.file_size_bytes,
        item_metadata=item.item_metadata,
        is_verified=item.is_verified,
        verified_by=item.verified_by,
        tryout_submission_id=str(item.tryout_submission_id) if item.tryout_submission_id else None,
        share_count=item.share_count,
        view_count=item.view_count,
        created_at=item.created_at,
        updated_at=item.updated_at
    )


@router.delete("/items/{item_id}", response_model=dict)
async def delete_vault_item(
    item_id: str,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Delete vault item"""
    await vault_service.delete_vault_item(
        db=db,
        item_id=uuid.UUID(item_id),
        candidate_id=uuid.UUID(current_user["user_id"])
    )
    
    return {"message": "Vault item deleted successfully"}


@router.get("/stats", response_model=VaultStatsResponse)
async def get_vault_stats(
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Get vault statistics"""
    stats = await vault_service.get_vault_stats(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"])
    )
    
    return VaultStatsResponse(**stats)


# ========== Share Token Endpoints ==========

@router.post("/share", response_model=list[ShareTokenResponse], status_code=status.HTTP_201_CREATED)
async def create_share_tokens(
    share_data: ShareTokenCreate,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """
    Create share tokens for vault items
    
    Generate secure shareable links for your portfolio items.
    You can set expiration time and view limits.
    """
    vault_item_ids = [uuid.UUID(item_id) for item_id in share_data.vault_item_ids]
    
    tokens = await share_token_service.create_share_tokens(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        vault_item_ids=vault_item_ids,
        expires_hours=share_data.expires_hours,
        max_views=share_data.max_views,
        shared_with_email=share_data.shared_with_email,
        shared_with_company=share_data.shared_with_company
    )
    
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    
    return [
        ShareTokenResponse(
            id=str(token.id),
            vault_item_id=str(token.vault_item_id),
            token=str(token.token),
            share_url=f"{frontend_url}/vault/shared/{token.token}",
            expires_at=token.expires_at,
            max_views=token.max_views,
            view_count=token.view_count,
            is_revoked=token.is_revoked,
            shared_with_email=token.shared_with_email,
            shared_with_company=token.shared_with_company,
            created_at=token.created_at,
            last_accessed_at=token.last_accessed_at
        )
        for token in tokens
    ]


@router.get("/share/tokens", response_model=ShareTokenListResponse)
async def get_my_share_tokens(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Get all share tokens for current candidate's vault items"""
    tokens, total = await share_token_service.get_candidate_share_tokens(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        page=page,
        page_size=page_size
    )
    
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    
    return ShareTokenListResponse(
        tokens=[
            ShareTokenResponse(
                id=str(token.id),
                vault_item_id=str(token.vault_item_id),
                token=str(token.token),
                share_url=f"{frontend_url}/vault/shared/{token.token}",
                expires_at=token.expires_at,
                max_views=token.max_views,
                view_count=token.view_count,
                is_revoked=token.is_revoked,
                shared_with_email=token.shared_with_email,
                shared_with_company=token.shared_with_company,
                created_at=token.created_at,
                last_accessed_at=token.last_accessed_at
            )
            for token in tokens
        ],
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete("/share/{token_id}", response_model=dict)
async def revoke_share_token(
    token_id: str,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a share token"""
    await share_token_service.revoke_share_token(
        db=db,
        token_id=uuid.UUID(token_id),
        candidate_id=uuid.UUID(current_user["user_id"])
    )
    
    return {"message": "Share token revoked successfully"}


@router.get("/shared/{token}", response_model=VaultAccessResponse)
async def access_shared_vault(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Access vault item via share token (Public endpoint)
    
    No authentication required. Anyone with the token can view.
    """
    item, share_token = await share_token_service.access_vault_via_token(
        db=db,
        token_str=token
    )
    
    # Calculate remaining views
    remaining_views = None
    if share_token.max_views:
        remaining_views = share_token.max_views - share_token.view_count
    
    return VaultAccessResponse(
        item=VaultItemResponse(
            id=str(item.id),
            candidate_id=str(item.candidate_id),
            type=item.type,
            title=item.title,
            description=item.description,
            file_url=item.file_url,
            file_type=item.file_type,
            file_size_bytes=item.file_size_bytes,
            item_metadata=item.item_metadata,
            is_verified=item.is_verified,
            verified_by=item.verified_by,
            tryout_submission_id=str(item.tryout_submission_id) if item.tryout_submission_id else None,
            share_count=item.share_count,
            view_count=item.view_count,
            created_at=item.created_at,
            updated_at=item.updated_at
        ),
        remaining_views=remaining_views,
        expires_at=share_token.expires_at
    )
