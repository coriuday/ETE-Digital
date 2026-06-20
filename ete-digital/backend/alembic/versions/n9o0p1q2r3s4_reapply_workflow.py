"""reapply_workflow

Revision ID: n9o0p1q2r3s4
Revises: m7n8o9p0q1r2
Create Date: 2026-06-19 14:00:00.000000

Changes:
  - Add reopened to applicationstatus enum
  - Add rejected_at, talent_pool_at to applications
  - Add reapply_cooldown_days to organizations
  - Add application_reopened, application_reapplied to auditaction enum
  - Backfill rejected_at from status history
"""

from alembic import op
import sqlalchemy as sa

revision = "n9o0p1q2r3s4"
down_revision = "n8o9p0q1r2s3"
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


def _enum_has_value(conn, enum_name: str, value: str) -> bool:
    return bool(
        conn.execute(
            sa.text(
                "SELECT 1 FROM pg_enum e "
                "JOIN pg_type t ON e.enumtypid = t.oid "
                "WHERE t.typname = :enum_name AND e.enumlabel = :value"
            ),
            {"enum_name": enum_name, "value": value},
        ).scalar()
    )


def upgrade() -> None:
    conn = op.get_bind()

    if not _enum_has_value(conn, "applicationstatus", "reopened"):
        op.execute("ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'reopened'")

    for action in ("application_reopened", "application_reapplied"):
        if not _enum_has_value(conn, "auditaction", action):
            op.execute(f"ALTER TYPE auditaction ADD VALUE IF NOT EXISTS '{action}'")

    if not _has_column(conn, "applications", "rejected_at"):
        op.add_column(
            "applications",
            sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _has_column(conn, "applications", "talent_pool_at"):
        op.add_column(
            "applications",
            sa.Column("talent_pool_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _has_column(conn, "organizations", "reapply_cooldown_days"):
        op.add_column(
            "organizations",
            sa.Column("reapply_cooldown_days", sa.Integer(), nullable=False, server_default="60"),
        )

    # Backfill rejected_at from latest rejection in status history
    op.execute(
        sa.text(
            """
            UPDATE applications a
            SET rejected_at = sub.changed_at
            FROM (
                SELECT DISTINCT ON (application_id)
                    application_id,
                    changed_at
                FROM application_status_history
                WHERE new_status = 'rejected'
                ORDER BY application_id, changed_at DESC
            ) sub
            WHERE a.id = sub.application_id
              AND a.status = 'rejected'
              AND a.rejected_at IS NULL
            """
        )
    )


def downgrade() -> None:
    conn = op.get_bind()

    if _has_column(conn, "organizations", "reapply_cooldown_days"):
        op.drop_column("organizations", "reapply_cooldown_days")

    if _has_column(conn, "applications", "talent_pool_at"):
        op.drop_column("applications", "talent_pool_at")

    if _has_column(conn, "applications", "rejected_at"):
        op.drop_column("applications", "rejected_at")

    # PostgreSQL does not support removing enum values safely — leave reopened / audit values in place
