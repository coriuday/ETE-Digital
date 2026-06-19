"""add_org_trust_tiers

Revision ID: m7n8o9p0q1r2
Revises: l6m7n8o9p0q1
Create Date: 2026-06-19 12:00:00.000000

Changes:
  - Add trust_tier, registration_path to organizations
  - Add company profile fields for standard registration path
"""

from alembic import op
import sqlalchemy as sa

revision = "m7n8o9p0q1r2"
down_revision = "l6m7n8o9p0q1"
branch_labels = None
depends_on = None


def _has_column(conn, table: str, column: str) -> bool:
    return bool(
        conn.execute(
            sa.text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = :t AND column_name = :c"
            ),
            {"t": table, "c": column},
        ).scalar()
    )


def upgrade():
    conn = op.get_bind()

    if not _has_column(conn, "organizations", "trust_tier"):
        op.add_column(
            "organizations",
            sa.Column("trust_tier", sa.String(length=20), nullable=False, server_default="unverified"),
        )

    if not _has_column(conn, "organizations", "registration_path"):
        op.add_column(
            "organizations",
            sa.Column("registration_path", sa.String(length=20), nullable=False, server_default="domain"),
        )

    for col, coltype in (
        ("linkedin_url", sa.String(length=500)),
        ("company_size", sa.String(length=50)),
        ("industry", sa.String(length=100)),
        ("gst_number", sa.String(length=50)),
    ):
        if not _has_column(conn, "organizations", col):
            op.add_column("organizations", sa.Column(col, coltype, nullable=True))

    if not _has_column(conn, "organizations", "admin_reviewed_at"):
        op.add_column("organizations", sa.Column("admin_reviewed_at", sa.DateTime(timezone=True), nullable=True))

    if not _has_column(conn, "organizations", "admin_reviewed_by"):
        op.add_column(
            "organizations",
            sa.Column("admin_reviewed_by", sa.UUID(as_uuid=True), nullable=True),
        )


def downgrade():
    conn = op.get_bind()
    for col in (
        "admin_reviewed_by",
        "admin_reviewed_at",
        "gst_number",
        "industry",
        "company_size",
        "linkedin_url",
        "registration_path",
        "trust_tier",
    ):
        if _has_column(conn, "organizations", col):
            op.drop_column("organizations", col)
