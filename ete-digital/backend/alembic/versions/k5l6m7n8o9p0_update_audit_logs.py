"""update_audit_logs

Revision ID: k5l6m7n8o9p0
Revises: j4k5l6m7n8o9
Create Date: 2026-06-18 11:20:00.000000

Changes:
  - Add org_id to audit_logs
  - Add new HR actions to auditaction enum
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "k5l6m7n8o9p0"
down_revision = "j4k5l6m7n8o9"
branch_labels = None
depends_on = None

NEW_ACTIONS = [
    "job_created",
    "job_updated",
    "bulk_upload",
    "member_invited",
    "member_removed",
    "role_changed",
    "subscription_updated",
]


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

    # Add org_id column if it doesn't exist
    if not _has_column(conn, "audit_logs", "org_id"):
        op.add_column("audit_logs", sa.Column("org_id", postgresql.UUID(as_uuid=True), nullable=True))
        op.create_index(op.f("ix_audit_logs_org_id"), "audit_logs", ["org_id"], unique=False)

    # Add new values to the enum
    # In postgres, we must do this with autocommit block or individual execute.
    # Since alembic runs in a transaction, ALTER TYPE ... ADD VALUE cannot run inside a transaction block
    # unless we use `op.execute` with `commit()` if outside transaction, but alembic context is transactional.
    # Postgres 12+ allows ALTER TYPE ADD VALUE in a transaction IF the type was created in the same transaction,
    # otherwise it errors. A common workaround is op.execute("COMMIT") first.

    op.execute("COMMIT")
    for action in NEW_ACTIONS:
        try:
            op.execute(f"ALTER TYPE auditaction ADD VALUE IF NOT EXISTS '{action}'")
        except sa.exc.ProgrammingError:
            pass  # Ignore if it already exists or errors out gracefully
    op.execute("BEGIN")


def downgrade():
    conn = op.get_bind()
    if _has_column(conn, "audit_logs", "org_id"):
        op.drop_index(op.f("ix_audit_logs_org_id"), table_name="audit_logs")
        op.drop_column("audit_logs", "org_id")

    # Removing enum values in postgres is not natively supported easily.
    # We will leave the enum values alone.
