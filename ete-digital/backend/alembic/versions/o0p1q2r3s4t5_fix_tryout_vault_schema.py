"""fix_tryout_vault_schema

Revision ID: o0p1q2r3s4t5
Revises: n9o0p1q2r3s4
Create Date: 2026-06-29 12:00:00.000000

Changes:
  - Add tryouts.submission_format if missing (ORM expects it; initial migration omitted it)
  - Migrate vaultitemtype enum from uppercase to lowercase (matches VaultItemType model)
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "o0p1q2r3s4t5"
down_revision = "n9o0p1q2r3s4"
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


def _enum_has_label(conn, enum_name: str, label: str) -> bool:
    return bool(
        conn.execute(
            sa.text(
                "SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid " "WHERE t.typname = :n AND e.enumlabel = :l"
            ),
            {"n": enum_name, "l": label},
        ).scalar()
    )


def upgrade():
    conn = op.get_bind()

    if not _has_column(conn, "tryouts", "submission_format"):
        op.add_column(
            "tryouts",
            sa.Column("submission_format", sa.String(length=50), nullable=True, server_default="url"),
        )

    # Legacy columns from initial migration; ORM uses title/description/scoring_rubric
    for col, coltype in (
        ("task_description", sa.Text()),
        ("rubric", postgresql.JSONB()),
        ("duration_days", sa.Integer()),
        ("payment_amount", sa.Numeric(precision=10, scale=2)),
    ):
        if _has_column(conn, "tryouts", col):
            op.alter_column("tryouts", col, existing_type=coltype, nullable=True)

    if _enum_has_label(conn, "vaultitemtype", "PROJECT"):
        op.execute("ALTER TYPE vaultitemtype RENAME TO vaultitemtype_old")
        op.execute("CREATE TYPE vaultitemtype AS ENUM " "('project', 'verified_sample', 'badge', 'certificate', 'other')")
        op.execute(
            """
            ALTER TABLE talent_vault_items
                ALTER COLUMN type TYPE vaultitemtype
                USING CASE type::text
                    WHEN 'PROJECT'          THEN 'project'
                    WHEN 'VERIFIED_SAMPLE'  THEN 'verified_sample'
                    WHEN 'BADGE'            THEN 'badge'
                    WHEN 'CERTIFICATE'      THEN 'certificate'
                    WHEN 'OTHER'            THEN 'other'
                    ELSE lower(type::text)
                END::vaultitemtype
            """
        )
        op.execute("DROP TYPE vaultitemtype_old")


def downgrade():
    conn = op.get_bind()

    if _enum_has_label(conn, "vaultitemtype", "project"):
        op.execute("ALTER TYPE vaultitemtype RENAME TO vaultitemtype_new")
        op.execute("CREATE TYPE vaultitemtype AS ENUM " "('PROJECT', 'VERIFIED_SAMPLE', 'BADGE', 'CERTIFICATE', 'OTHER')")
        op.execute(
            """
            ALTER TABLE talent_vault_items
                ALTER COLUMN type TYPE vaultitemtype
                USING CASE type::text
                    WHEN 'project'          THEN 'PROJECT'
                    WHEN 'verified_sample'  THEN 'VERIFIED_SAMPLE'
                    WHEN 'badge'            THEN 'BADGE'
                    WHEN 'certificate'      THEN 'CERTIFICATE'
                    WHEN 'other'            THEN 'OTHER'
                    ELSE upper(type::text)
                END::vaultitemtype
            """
        )
        op.execute("DROP TYPE vaultitemtype_new")

    if _has_column(conn, "tryouts", "submission_format"):
        op.drop_column("tryouts", "submission_format")
