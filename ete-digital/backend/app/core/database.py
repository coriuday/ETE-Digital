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

# Log DB host only — never log credentials
_db_host = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "unknown"
print(f"[DB] Connecting to: {_db_host}")

# asyncpg does NOT accept ?ssl=require or ?sslmode=require as URL query params.
# SSL must be passed exclusively via connect_args (not both URL + connect_args).
# We detect the ssl requirement from the URL, strip it, then pass ssl via connect_args.
_connect_args: dict = {}
_needs_ssl = (
    "ssl=require" in DATABASE_URL
    or "sslmode=require" in DATABASE_URL
    or "supabase.com" in DATABASE_URL  # Supabase always requires SSL
)
if _needs_ssl:
    # Remove SSL params from URL — asyncpg handles them via connect_args only
    DATABASE_URL = (
        DATABASE_URL.replace("?ssl=require", "")
        .replace("&ssl=require", "")
        .replace("?sslmode=require", "")
        .replace("&sslmode=require", "")
    )
    _connect_args["ssl"] = "require"


_is_sqlite = DATABASE_URL.startswith("sqlite")

# Pool settings tuned for Supabase session pooler (not applicable to SQLite):
# - pool_size: concurrent connections kept open
# - max_overflow: extra connections allowed under burst load
# - pool_pre_ping: validates connections before use (detects stale connections)
# - pool_recycle: recycle connections after 10 min (Supabase closes idle after ~5 min)
_engine_kwargs: dict = {
    "echo": False,
    "future": True,
    "connect_args": _connect_args,
}
if not _is_sqlite:
    _engine_kwargs.update(
        {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 600,
        }
    )

engine = create_async_engine(DATABASE_URL, **_engine_kwargs)

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
    """
    Dependency to get database session.
    Commits are EXPLICIT in service methods — this dependency only rolls back
    on unhandled exceptions and ensures the session is always closed.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
