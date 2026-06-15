"""add_organization_tables

Revision ID: a2b3c4d5e6f7
Revises: f1a73524a674
Create Date: 2026-06-14 19:15:00.000000

Phase 1 — Domain-Based HR Authentication
=========================================
Creates:
  - organizations          (new table)
  - organization_members   (new table)

Modifies:
  - users  → adds work_email, email_domain, organization_id, onboarding_complete
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a2b3c4d5e6f7"
down_revision = "f1a73524a674"
branch_labels = None
depends_on = None


# ── Guard helpers (same pattern as existing migrations) ──────────────────────


def _table_exists(conn, table: str) -> bool:
    """Check if a table exists in the public schema."""
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.tables " "WHERE table_schema = 'public' AND table_name = :t"),
            {"t": table},
        ).scalar()
    )


def _column_exists(conn, table: str, column: str) -> bool:
    """Check if a column exists in information_schema."""
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.columns " "WHERE table_name = :t AND column_name = :c"),
            {"t": table, "c": column},
        ).scalar()
    )


def _index_exists(conn, index_name: str, table_name: str) -> bool:
    """Check if a PostgreSQL index exists."""
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM pg_indexes WHERE tablename = :t AND indexname = :n"),
            {"t": table_name, "n": index_name},
        ).scalar()
    )


def _constraint_exists(conn, table: str, constraint_name: str, constraint_type: str) -> bool:
    """Check if a constraint exists in information_schema."""
    type_map = {
        "unique": "UNIQUE",
        "foreignkey": "FOREIGN KEY",
        "primary": "PRIMARY KEY",
        "check": "CHECK",
    }
    pg_type = type_map.get(constraint_type, constraint_type.upper())
    return bool(
        conn.execute(
            sa.text(
                "SELECT 1 FROM information_schema.table_constraints "
                "WHERE table_name = :t AND constraint_name = :n AND constraint_type = :ct"
            ),
            {"t": table, "n": constraint_name, "ct": pg_type},
        ).scalar()
    )


# ── Upgrade ──────────────────────────────────────────────────────────────────


def upgrade():
    conn = op.get_bind()

    # ── 1. CREATE organizations table ────────────────────────────────────────
    if not _table_exists(conn, "organizations"):
        op.create_table(
            "organizations",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("company_name", sa.String(length=255), nullable=False),
            sa.Column("website", sa.String(length=255), nullable=False),
            sa.Column("domain", sa.String(length=100), nullable=False),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("verification_method", sa.String(length=50), nullable=True),
            sa.Column("verification_token", sa.String(length=255), nullable=True),
            sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "owner_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )

    # Unique index on domain (one org per domain)
    if not _index_exists(conn, "ix_organizations_domain", "organizations"):
        op.create_index(
            op.f("ix_organizations_domain"),
            "organizations",
            ["domain"],
            unique=True,
        )

    # Index on owner_id for fast lookups
    if not _index_exists(conn, "ix_organizations_owner_id", "organizations"):
        op.create_index(
            op.f("ix_organizations_owner_id"),
            "organizations",
            ["owner_id"],
            unique=False,
        )

    # ── 2. CREATE organization_members table ─────────────────────────────────
    if not _table_exists(conn, "organization_members"):
        op.create_table(
            "organization_members",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column(
                "organization_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("organizations.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "user_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("role", sa.String(length=50), nullable=False, server_default="recruiter"),
            sa.Column(
                "invited_by",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "joined_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.UniqueConstraint("organization_id", "user_id", name="uq_org_members_org_user"),
        )

    # Indexes on FK columns for fast joins
    if not _index_exists(conn, "ix_organization_members_organization_id", "organization_members"):
        op.create_index(
            op.f("ix_organization_members_organization_id"),
            "organization_members",
            ["organization_id"],
            unique=False,
        )

    if not _index_exists(conn, "ix_organization_members_user_id", "organization_members"):
        op.create_index(
            op.f("ix_organization_members_user_id"),
            "organization_members",
            ["user_id"],
            unique=False,
        )

    # ── 3. ALTER users — add 4 new nullable columns ──────────────────────────
    # IMPORTANT: organization_id FK references organizations (created above).
    # All new columns are nullable so zero existing data is touched.

    if not _column_exists(conn, "users", "work_email"):
        op.add_column("users", sa.Column("work_email", sa.String(length=255), nullable=True))

    if not _column_exists(conn, "users", "email_domain"):
        op.add_column("users", sa.Column("email_domain", sa.String(length=100), nullable=True))

    if not _index_exists(conn, "ix_users_email_domain", "users"):
        op.create_index(op.f("ix_users_email_domain"), "users", ["email_domain"], unique=False)

    if not _column_exists(conn, "users", "organization_id"):
        op.add_column(
            "users",
            sa.Column(
                "organization_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("organizations.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )

    if not _index_exists(conn, "ix_users_organization_id", "users"):
        op.create_index(op.f("ix_users_organization_id"), "users", ["organization_id"], unique=False)

    if not _column_exists(conn, "users", "onboarding_complete"):
        op.add_column(
            "users",
            sa.Column(
                "onboarding_complete",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )


# ── Downgrade ─────────────────────────────────────────────────────────────────


def downgrade():
    conn = op.get_bind()

    # ── Remove columns from users ────────────────────────────────────────────
    if _column_exists(conn, "users", "onboarding_complete"):
        op.drop_column("users", "onboarding_complete")

    if _index_exists(conn, "ix_users_organization_id", "users"):
        op.drop_index(op.f("ix_users_organization_id"), table_name="users")

    if _column_exists(conn, "users", "organization_id"):
        op.drop_column("users", "organization_id")

    if _index_exists(conn, "ix_users_email_domain", "users"):
        op.drop_index(op.f("ix_users_email_domain"), table_name="users")

    if _column_exists(conn, "users", "email_domain"):
        op.drop_column("users", "email_domain")

    if _column_exists(conn, "users", "work_email"):
        op.drop_column("users", "work_email")

    # ── Drop organization_members ────────────────────────────────────────────
    if _index_exists(conn, "ix_organization_members_user_id", "organization_members"):
        op.drop_index(op.f("ix_organization_members_user_id"), table_name="organization_members")

    if _index_exists(conn, "ix_organization_members_organization_id", "organization_members"):
        op.drop_index(op.f("ix_organization_members_organization_id"), table_name="organization_members")

    if _table_exists(conn, "organization_members"):
        op.drop_table("organization_members")

    # ── Drop organizations ───────────────────────────────────────────────────
    if _index_exists(conn, "ix_organizations_owner_id", "organizations"):
        op.drop_index(op.f("ix_organizations_owner_id"), table_name="organizations")

    if _index_exists(conn, "ix_organizations_domain", "organizations"):
        op.drop_index(op.f("ix_organizations_domain"), table_name="organizations")

    if _table_exists(conn, "organizations"):
        op.drop_table("organizations")
