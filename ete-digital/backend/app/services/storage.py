"""
Storage service for file uploads using MinIO
"""

import re
from typing import Optional, BinaryIO
from app.core.config import settings

try:
    from minio import Minio

    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False


class StorageService:
    """File storage service using MinIO (S3-compatible)"""

    def __init__(self):
        self._client = None
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def _get_client(self):
        if self._client is None and MINIO_AVAILABLE:
            self._client = Minio(
                endpoint=settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
            self._ensure_bucket()
        return self._client

    def _ensure_bucket(self):
        try:
            client = self._client
            if not client.bucket_exists(self.bucket_name):
                client.make_bucket(self.bucket_name)
        except Exception as e:
            print(f"Warning: Could not ensure bucket exists: {e}")

    def extract_object_key(self, stored: str) -> Optional[str]:
        """Normalize legacy public URLs or raw object keys to bucket-relative path."""
        if not stored:
            return None
        stored = stored.strip()
        if stored.startswith(("http://", "https://")):
            marker = f"/{self.bucket_name}/"
            idx = stored.find(marker)
            if idx >= 0:
                return stored[idx + len(marker) :].split("?")[0]
            parts = stored.split("/")
            if len(parts) >= 2:
                return "/".join(parts[-3:]) if len(parts) >= 4 else parts[-1]
            return None
        return stored

    def upload_file(
        self,
        file_data: BinaryIO,
        file_path: str,
        content_type: str = "application/octet-stream",
        file_size: Optional[int] = -1,
    ) -> Optional[str]:
        """
        Upload a file to MinIO storage.

        Returns:
            Object key (path within bucket), or None on failure
        """
        client = self._get_client()
        if not client:
            print("Storage service not available (MinIO not configured)")
            return None

        try:
            client.put_object(
                bucket_name=self.bucket_name,
                object_name=file_path,
                data=file_data,
                length=file_size,
                content_type=content_type,
            )
            return file_path
        except Exception as e:
            print(f"Failed to upload file: {e}")
            return None

    def delete_file(self, file_path: str) -> bool:
        key = self.extract_object_key(file_path) or file_path
        client = self._get_client()
        if not client:
            return False

        try:
            client.remove_object(self.bucket_name, key)
            return True
        except Exception as e:
            print(f"Failed to delete file: {e}")
            return False

    def get_presigned_url(self, file_path: str, expires_seconds: int = 3600) -> Optional[str]:
        from datetime import timedelta

        key = self.extract_object_key(file_path) or file_path
        client = self._get_client()
        if not client or not key:
            return None

        try:
            return client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=key,
                expires=timedelta(seconds=expires_seconds),
            )
        except Exception as e:
            print(f"Failed to generate presigned URL: {e}")
            return None

    def resolve_presigned_url(self, stored: Optional[str], expires_seconds: int = 3600) -> Optional[str]:
        """Return a short-lived presigned URL for a stored key or legacy URL."""
        if not stored:
            return None
        key = self.extract_object_key(stored)
        if not key:
            return None
        return self.get_presigned_url(key, expires_seconds=expires_seconds)

    def get_file_path(self, category: str, user_id: str, filename: str) -> str:
        safe_filename = re.sub(r"[^\w\-_\.]", "_", filename)
        return f"{category}/{user_id}/{safe_filename}"


storage_service = StorageService()
