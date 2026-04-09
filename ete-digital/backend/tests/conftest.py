"""
Pytest shared fixtures for ETE Digital backend tests.

Strategy:
  - If TEST_DATABASE_URL or DATABASE_URL is set in the environment AND
    points to a real PostgreSQL instance (CI provides one as a service),
    we use that directly — giving us full JSONB support.
  - If no env var is set (or they point nowhere reachable), we fall back
    to an in-memory SQLite database so that developers can run the test
    suite locally without any external services.

IMPORTANT: We do NOT call load_dotenv() here. In CI the env vars are
injected by GitHub Actions and must NOT be overridden by a local .env
file (which would point at the production Supabase instance).
"""

import os
import uuid as _uuid

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

# ---------------------------------------------------------------------------

# Provide safe fallback env vars so that Settings() doesn't raise when
# no .env is present (e.g. local runs without a Postgres instance).
# ---------------------------------------------------------------------------
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/placeholder")
os.environ.setdefault("JWT_SECRET_KEY", "ci-test-secret-key-not-for-production")
os.environ.setdefault("ENCRYPTION_KEY", "ci-test-encryption-key-32-chars!!")

# ---------------------------------------------------------------------------
# Decide which engine to use
# ---------------------------------------------------------------------------

def _make_asyncpg_url(url: str) -> str:
    return (
        url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
           .replace("postgresql://", "postgresql+asyncpg://", 1)
    )


_raw = os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
_use_sqlite = not _raw or "localhost/placeholder" in _raw

if _use_sqlite:
    _TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
    _engine_kwargs: dict = dict(
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
else:
    _TEST_DB_URL = _make_asyncpg_url(_raw)
    _engine_kwargs = dict(
        echo=False,
        connect_args={"statement_cache_size": 0},
    )

# ---------------------------------------------------------------------------
# Imports that trigger the app (after env vars are set)
# ---------------------------------------------------------------------------

from app.core.security import create_access_token, hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models.users import User, UserRole  # noqa: E402
from app.core.database import Base, get_db  # noqa: E402

# ---------------------------------------------------------------------------
# Engine + session factory
# ---------------------------------------------------------------------------

_engine = create_async_engine(_TEST_DB_URL, **_engine_kwargs)

_TestingSessionLocal = async_sessionmaker(
    _engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _create_tables():
    """Create all ORM tables before the session and drop them after."""
    if _use_sqlite:
        # SQLite: create tables ourselves (no Alembic migration needed)
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    # For Postgres CI: Alembic migrations run as a separate CI step, tables exist.
    yield
    if _use_sqlite:
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Override get_db so the app uses the same test engine
# ---------------------------------------------------------------------------

async def _override_get_db():
    async with _TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = _override_get_db


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def client():
    """ASGI test client wired to the test database."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Internal DB session for fixture user creation
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def _db():
    async with _TestingSessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def candidate_user(_db: AsyncSession):
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
async def employer_user(_db: AsyncSession):
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
async def admin_user(_db: AsyncSession):
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
async def candidate_token(candidate_user: User) -> str:
    return create_access_token(
        {"sub": str(candidate_user.id), "role": "candidate", "email": str(candidate_user.email)}
    )


@pytest_asyncio.fixture
async def employer_token(employer_user: User) -> str:
    return create_access_token(
        {"sub": str(employer_user.id), "role": "employer", "email": str(employer_user.email)}
    )


@pytest_asyncio.fixture
async def admin_token(admin_user: User) -> str:
    return create_access_token(
        {"sub": str(admin_user.id), "role": "admin", "email": str(admin_user.email)}
    )
