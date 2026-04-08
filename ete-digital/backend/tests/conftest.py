"""
Pytest shared fixtures for ETE Digital backend tests.

Uses the real FastAPI app via ASGI (ASGITransport + httpx).
The app connects to the Supabase DB defined in .env (DATABASE_URL).

Tests use unique random identifiers to avoid data collisions.
No mocking of the DB layer — tests verify real end-to-end behaviour.
"""

import os
import uuid as _uuid

import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport

load_dotenv()

from app.core.security import create_access_token, hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models.users import User, UserRole  # noqa: E402
from app.core.database import get_db  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker  # noqa: E402

# ---------------------------------------------------------------------------
# Database URL helpers
# ---------------------------------------------------------------------------

def _make_asyncpg_url(url: str) -> str:
    return (
        url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
           .replace("postgresql://", "postgresql+asyncpg://", 1)
    )


_raw = os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
if not _raw:
    raise RuntimeError("No database URL found. Set DATABASE_URL in .env")

TEST_DB_URL = _make_asyncpg_url(_raw)

# ---------------------------------------------------------------------------
# HTTP client — each test gets a fresh client against the real app+DB
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def client():
    """
    Thin ASGI client that talks to the real FastAPI app.
    The app uses its own DB pool (Supabase) — no DB mocking needed.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# db_session — used ONLY by user creation fixtures (not injected into tests)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def _db():
    """Internal DB session for creating fixture users directly."""
    eng = create_async_engine(
        TEST_DB_URL,
        echo=False,
        future=True,
        connect_args={"statement_cache_size": 0},
    )
    factory = async_sessionmaker(eng, expire_on_commit=False, class_=AsyncSession)
    async with factory() as session:
        yield session
    await eng.dispose()


# ---------------------------------------------------------------------------
# User fixtures  (write directly to DB, tagged with unique suffix)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def candidate_user(_db):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"candidate_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.CANDIDATE,
        is_active=True,
        is_verified=True,
    )
    _db.add(user)
    await _db.commit()
    await _db.refresh(user)
    return user


@pytest_asyncio.fixture
async def employer_user(_db):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"employer_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.EMPLOYER,
        is_active=True,
        is_verified=True,
    )
    _db.add(user)
    await _db.commit()
    await _db.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(_db):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"admin_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    _db.add(user)
    await _db.commit()
    await _db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Token fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def candidate_token(candidate_user):
    return create_access_token(
        {"sub": str(candidate_user.id), "role": "candidate", "email": candidate_user.email}
    )


@pytest_asyncio.fixture
async def employer_token(employer_user):
    return create_access_token(
        {"sub": str(employer_user.id), "role": "employer", "email": employer_user.email}
    )


@pytest_asyncio.fixture
async def admin_token(admin_user):
    return create_access_token(
        {"sub": str(admin_user.id), "role": "admin", "email": admin_user.email}
    )
