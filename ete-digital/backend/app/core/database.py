"""
Database connection and session management
SQLAlchemy setup with async support
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


def _make_asyncpg_url(url: str) -> str:
    if not url:
        return url
    if url.startswith("postgresql://") or url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
    if url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://")
    return url


DATABASE_URL = _make_asyncpg_url(os.getenv("TEST_DATABASE_URL") or settings.DATABASE_URL)

print(f"[DB] FINAL DATABASE URL: {DATABASE_URL}")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Base class for models (SQLAlchemy 2.x style)
class Base(DeclarativeBase):
    pass


# Dependency for FastAPI routes
async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
