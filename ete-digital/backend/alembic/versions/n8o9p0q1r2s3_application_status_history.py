"""application_status_history

Revision ID: n8o9p0q1r2s3
Revises: m7n8o9p0q1r2
Create Date: 2026-06-19 12:00:00.000000

Changes:
  - Add application_status_history table
  - Add applications.stage_entered_at
  - Backfill initial history rows for existing applications
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "n8o9p0q1r2s3"
down_revision = "m7n8o9p0q1r2"
branch_labels = None
depends_on = None


def _has_table(conn, table: str) -> bool:
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.tables " "WHERE table_schema = 'public' AND table_name = :t"),
            {"t": table},
        ).scalar()
    )


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

    if not _has_column(conn, "applications", "stage_entered_at"):
        op.add_column(
            "applications",
            sa.Column(
                "stage_entered_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.execute(sa.text("UPDATE applications SET stage_entered_at = COALESCE(updated_at, created_at)"))

    if not _has_table(conn, "application_status_history"):
        op.create_table(
            "application_status_history",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "application_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("applications.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "old_status",
                postgresql.ENUM(
                    "pending",
                    "reviewed",
                    "shortlisted",
                    "rejected",
                    "hired",
                    "withdrawn",
                    name="applicationstatus",
                    create_type=False,
                ),
                nullable=True,
            ),
            sa.Column(
                "new_status",
                postgresql.ENUM(
                    "pending",
                    "reviewed",
                    "shortlisted",
                    "rejected",
                    "hired",
                    "withdrawn",
                    name="applicationstatus",
                    create_type=False,
                ),
                nullable=False,
            ),
            sa.Column("changed_by", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column(
                "changed_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("notes", sa.Text(), nullable=True),
        )
        op.create_index(
            "ix_application_status_history_application_id",
            "application_status_history",
            ["application_id"],
        )
        op.create_index(
            "ix_application_status_history_changed_at",
            "application_status_history",
            ["changed_at"],
        )
        op.create_index(
            "ix_application_status_history_app_changed",
            "application_status_history",
            ["application_id", "changed_at"],
        )

        # Backfill one history row per existing application
        op.execute(
            sa.text(
                """
                INSERT INTO application_status_history
                    (id, application_id, old_status, new_status, changed_by, changed_at)
                SELECT
                    gen_random_uuid(),
                    a.id,
                    NULL,
                    a.status,
                    j.employer_id,
                    a.created_at
                FROM applications a
                INNER JOIN jobs j ON j.id = a.job_id
                """
            )
        )

    # Extend auditaction enum for status change logging (PostgreSQL)
    if conn.dialect.name == "postgresql":
        op.execute(
            sa.text(
                """
                DO $$ BEGIN
                    ALTER TYPE auditaction ADD VALUE 'application_status_changed';
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
                """
            )
        )


def downgrade():
    conn = op.get_bind()

    if _has_table(conn, "application_status_history"):
        op.drop_index("ix_application_status_history_app_changed", "application_status_history")
        op.drop_index("ix_application_status_history_changed_at", "application_status_history")
        op.drop_index("ix_application_status_history_application_id", "application_status_history")
        op.drop_table("application_status_history")

    if _has_column(conn, "applications", "stage_entered_at"):
        op.drop_column("applications", "stage_entered_at")
