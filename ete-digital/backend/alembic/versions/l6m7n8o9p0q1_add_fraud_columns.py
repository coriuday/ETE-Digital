"""add_fraud_columns

Revision ID: l6m7n8o9p0q1
Revises: k5l6m7n8o9p0
Create Date: 2026-06-18 11:28:00.000000

Changes:
  - Add fraud_score to applications
  - Add fraud_flags to applications
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "l6m7n8o9p0q1"
down_revision = "k5l6m7n8o9p0"
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

    if not _has_column(conn, "applications", "fraud_score"):
        op.add_column("applications", sa.Column("fraud_score", sa.Integer(), nullable=True, server_default="0"))

    if not _has_column(conn, "applications", "fraud_flags"):
        op.add_column(
            "applications",
            sa.Column("fraud_flags", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="'[]'::jsonb"),
        )


def downgrade():
    conn = op.get_bind()

    if _has_column(conn, "applications", "fraud_score"):
        op.drop_column("applications", "fraud_score")

    if _has_column(conn, "applications", "fraud_flags"):
        op.drop_column("applications", "fraud_flags")
