"""
Storage service for file uploads using MinIO
"""

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
        """Lazy-load MinIO client"""
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
        """Create bucket if it doesn't exist"""
        try:
            client = self._client
            if not client.bucket_exists(self.bucket_name):
                client.make_bucket(self.bucket_name)
        except Exception as e:
            print(f"Warning: Could not ensure bucket exists: {e}")

    def upload_file(
        self,
        file_data: BinaryIO,
        file_path: str,
        content_type: str = "application/octet-stream",
        file_size: Optional[int] = -1,
    ) -> Optional[str]:
        """
        Upload a file to MinIO storage.

        Args:
            file_data: File-like object
            file_path: Path in bucket (e.g., 'avatars/user-id.jpg')
            content_type: MIME type
            file_size: File size in bytes (-1 for unknown)

        Returns:
            Public URL of uploaded file, or None on failure
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
            protocol = "https" if settings.MINIO_SECURE else "http"
            return f"{protocol}://{settings.MINIO_ENDPOINT}/{self.bucket_name}/{file_path}"
        except Exception as e:
            print(f"Failed to upload file: {e}")
            return None

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from MinIO storage.

        Args:
            file_path: Path in bucket

        Returns:
            True if deleted successfully
        """
        client = self._get_client()
        if not client:
            return False

        try:
            client.remove_object(self.bucket_name, file_path)
            return True
        except Exception as e:
            print(f"Failed to delete file: {e}")
            return False

    def get_presigned_url(self, file_path: str, expires_seconds: int = 3600) -> Optional[str]:
        """
        Get a temporary presigned URL for a file.

        Args:
            file_path: Path in bucket
            expires_seconds: URL validity in seconds

        Returns:
            Presigned URL or None
        """
        from datetime import timedelta

        client = self._get_client()
        if not client:
            return None

        try:
            return client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=file_path,
                expires=timedelta(seconds=expires_seconds),
            )
        except Exception as e:
            print(f"Failed to generate presigned URL: {e}")
            return None

    def get_file_path(self, category: str, user_id: str, filename: str) -> str:
        """
        Generate a structured file path.

        Args:
            category: 'avatars', 'resumes', 'vault', 'submissions'
            user_id: User UUID string
            filename: Original filename

        Returns:
            Structured path: '{category}/{user_id}/{filename}'
        """
        import re

        # Sanitize filename
        safe_filename = re.sub(r"[^\w\-_\.]", "_", filename)
        return f"{category}/{user_id}/{safe_filename}"


# Singleton instance
storage_service = StorageService()
