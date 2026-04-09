"""
Talent Vault service
Business logic for candidate portfolio management
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple, Dict
import uuid

from app.models.vault import TalentVaultItem, VaultShareToken, VaultItemType
from app.models.tryouts import TryoutSubmission, SubmissionStatus
from app.core.security import encrypt_field, decrypt_field
from fastapi import HTTPException, status


class VaultService:
    """Talent vault service"""

    async def create_vault_item(self, db: AsyncSession, candidate_id: uuid.UUID, item_data: dict) -> TalentVaultItem:
        """Create a new vault item"""
        # Encrypt file URL if provided
        if item_data.get("file_url"):
            item_data["file_url"] = encrypt_field(item_data["file_url"])

        # Check if from tryout submission
        tryout_submission_id = item_data.get("tryout_submission_id")
        if tryout_submission_id:
            # Verify submission exists and belongs to candidate
            sub_result = await db.execute(
                select(TryoutSubmission).where(
                    TryoutSubmission.id == tryout_submission_id,
                    TryoutSubmission.candidate_id == candidate_id,
                )
            )
            submission = sub_result.scalar_one_or_none()

            if not submission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tryout submission not found",
                )

            # Auto-verify if submission passed
            if submission.status == SubmissionStatus.PASSED:
                item_data["is_verified"] = True
                item_data["verified_by"] = "tryout"

        item = TalentVaultItem(candidate_id=candidate_id, **item_data)
        db.add(item)
        await db.commit()
        await db.refresh(item)

        # Decrypt file URL for response
        if item.file_url:
            item.file_url = decrypt_field(item.file_url)

        return item

    async def get_vault_item(self, db: AsyncSession, item_id: uuid.UUID, decrypt: bool = True) -> Optional[TalentVaultItem]:
        """Get vault item by ID"""
        result = await db.execute(select(TalentVaultItem).where(TalentVaultItem.id == item_id))
        item = result.scalar_one_or_none()

        if item and decrypt and item.file_url:
            item.file_url = decrypt_field(item.file_url)

        return item

    async def update_vault_item(
        self,
        db: AsyncSession,
        item_id: uuid.UUID,
        candidate_id: uuid.UUID,
        update_data: dict,
    ) -> TalentVaultItem:
        """Update vault item"""
        item = await self.get_vault_item(db, item_id, decrypt=False)

        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")

        if item.candidate_id != candidate_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this item",
            )

        # Encrypt file URL if being updated
        if "file_url" in update_data and update_data["file_url"]:
            update_data["file_url"] = encrypt_field(update_data["file_url"])

        for field, value in update_data.items():
            if value is not None:
                setattr(item, field, value)

        await db.commit()
        await db.refresh(item)

        # Decrypt for response
        if item.file_url:
            item.file_url = decrypt_field(item.file_url)

        return item

    async def delete_vault_item(self, db: AsyncSession, item_id: uuid.UUID, candidate_id: uuid.UUID) -> bool:
        """Delete vault item"""
        item = await self.get_vault_item(db, item_id, decrypt=False)

        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")

        if item.candidate_id != candidate_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this item",
            )

        await db.delete(item)
        await db.commit()
        return True

    async def get_candidate_vault(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        item_type: Optional[VaultItemType] = None,
    ) -> Tuple[List[TalentVaultItem], int]:
        """Get all vault items for a candidate"""
        query = select(TalentVaultItem).where(TalentVaultItem.candidate_id == candidate_id)

        if item_type:
            query = query.where(TalentVaultItem.type == item_type)

        # Get total count
        count_query = select(func.count()).where(TalentVaultItem.candidate_id == candidate_id)
        if item_type:
            count_query = count_query.where(TalentVaultItem.type == item_type)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(TalentVaultItem.created_at.desc()).offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        items = result.scalars().all()

        # Decrypt file URLs
        for item in items:
            if item.file_url:
                item.file_url = decrypt_field(item.file_url)

        return items, total

    async def get_vault_stats(self, db: AsyncSession, candidate_id: uuid.UUID) -> Dict:
        """Get vault statistics"""
        # Total items
        total_result = await db.execute(select(func.count()).where(TalentVaultItem.candidate_id == candidate_id))
        total_items = total_result.scalar()

        # Verified items
        verified_result = await db.execute(
            select(func.count()).where(
                and_(
                    TalentVaultItem.candidate_id == candidate_id,
                    TalentVaultItem.is_verified == True,  # noqa: E712
                )
            )
        )
        verified_items = verified_result.scalar()

        # Total shares and views
        shares_result = await db.execute(
            select(
                func.sum(TalentVaultItem.share_count),
                func.sum(TalentVaultItem.view_count),
            ).where(TalentVaultItem.candidate_id == candidate_id)
        )
        shares_row = shares_result.one()
        total_shares = shares_row[0] or 0
        total_views = shares_row[1] or 0

        # Items by type
        type_result = await db.execute(
            select(TalentVaultItem.type, func.count())
            .where(TalentVaultItem.candidate_id == candidate_id)
            .group_by(TalentVaultItem.type)
        )
        items_by_type = {row[0]: row[1] for row in type_result.all()}

        return {
            "total_items": total_items,
            "verified_items": verified_items,
            "total_shares": total_shares,
            "total_views": total_views,
            "items_by_type": items_by_type,
        }


class ShareTokenService:
    """Vault share token service"""

    async def create_share_tokens(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        vault_item_ids: List[uuid.UUID],
        expires_hours: Optional[int],
        max_views: Optional[int],
        shared_with_email: Optional[str],
        shared_with_company: Optional[str],
    ) -> List[VaultShareToken]:
        """Create share tokens for vault items"""
        tokens = []

        for item_id in vault_item_ids:
            # Verify item exists and belongs to candidate
            item_result = await db.execute(
                select(TalentVaultItem).where(
                    TalentVaultItem.id == item_id,
                    TalentVaultItem.candidate_id == candidate_id,
                )
            )
            item = item_result.scalar_one_or_none()

            if not item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Vault item {item_id} not found",
                )

            # Create token
            expires_at = None
            if expires_hours:
                expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_hours)

            token = VaultShareToken(
                vault_item_id=item_id,
                expires_at=expires_at,
                max_views=max_views,
                shared_with_email=shared_with_email,
                shared_with_company=shared_with_company,
            )
            db.add(token)

            # Increment share count
            item.share_count += 1

            tokens.append(token)

        await db.commit()

        for token in tokens:
            await db.refresh(token)

        return tokens

    async def get_share_token(self, db: AsyncSession, token_str: str) -> Optional[VaultShareToken]:
        """Get share token by token string"""
        try:
            token_uuid = uuid.UUID(token_str)
        except (ValueError, AttributeError):
            return None
        result = await db.execute(select(VaultShareToken).where(VaultShareToken.token == token_uuid))
        return result.scalar_one_or_none()

    async def access_vault_via_token(self, db: AsyncSession, token_str: str) -> Tuple[TalentVaultItem, VaultShareToken]:
        """Access vault item via share token"""
        token = await self.get_share_token(db, token_str)

        if not token:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share token not found")

        # Check if revoked
        if token.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Share token has been revoked",
            )

        # Check if expired
        if token.expires_at:
            expires_at = token.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Share token has expired")

        # Check view limit
        if token.max_views and token.view_count >= token.max_views:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Share token view limit reached",
            )

        # Get vault item
        item_result = await db.execute(select(TalentVaultItem).where(TalentVaultItem.id == token.vault_item_id))
        item = item_result.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault item not found")

        # Increment view counts
        token.view_count += 1
        token.last_accessed_at = datetime.now(timezone.utc)
        item.view_count += 1

        await db.commit()
        await db.refresh(token)
        await db.refresh(item)

        # Decrypt file URL
        if item.file_url:
            item.file_url = decrypt_field(item.file_url)

        return item, token

    async def revoke_share_token(self, db: AsyncSession, token_id: uuid.UUID, candidate_id: uuid.UUID) -> bool:
        """Revoke a share token"""
        result = await db.execute(select(VaultShareToken).where(VaultShareToken.id == token_id))
        token = result.scalar_one_or_none()

        if not token:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share token not found")

        # Verify ownership via vault item
        item_result = await db.execute(select(TalentVaultItem).where(TalentVaultItem.id == token.vault_item_id))
        item = item_result.scalar_one_or_none()

        if not item or item.candidate_id != candidate_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to revoke this token",
            )

        token.is_revoked = True
        await db.commit()
        return True

    async def get_candidate_share_tokens(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[VaultShareToken], int]:
        """Get all share tokens for candidate's vault items"""
        # Get all vault item IDs for candidate
        items_result = await db.execute(select(TalentVaultItem.id).where(TalentVaultItem.candidate_id == candidate_id))
        item_ids = [row[0] for row in items_result.all()]

        if not item_ids:
            return [], 0

        query = select(VaultShareToken).where(VaultShareToken.vault_item_id.in_(item_ids))

        # Get total count
        count_query = select(func.count()).where(VaultShareToken.vault_item_id.in_(item_ids))
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(VaultShareToken.created_at.desc()).offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        tokens = result.scalars().all()

        return tokens, total


# Singleton instances
vault_service = VaultService()
share_token_service = ShareTokenService()
