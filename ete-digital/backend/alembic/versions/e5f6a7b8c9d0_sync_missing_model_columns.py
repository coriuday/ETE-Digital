"""Sync missing model columns and restore FK constraints

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-21 00:01:00.000000

Adds every column present in the ORM models but absent from the DB schema.
All additions use nullable=True or a server_default — zero data loss.

Also restores FK constraints that were dropped (never recreated) by
migration f1a73524a674. Adding FKs on an empty DB is always safe.

Tables touched:
  users            — email_verified, phone_verified, totp_*, oauth_*, avatar_url
  user_profiles    — phone_verified_at
  tryouts          — title, description, scoring_rubric, auto_grade_enabled,
                     submissions_count, payment_currency, max_submissions, updated_at
  tryout_submissions — notes, created_at, updated_at, payment_escrowed_at,
                       reviewed_by, reviewed_at

FK constraints restored:
  applications  → users (candidate_id), jobs (job_id)
  jobs          → users (employer_id)
  notifications → users (user_id)
  tryouts       → jobs (job_id)
  tryout_submissions → tryouts (tryout_id), users (candidate_id)
  talent_vault_items → users (candidate_id), tryout_submissions (tryout_submission_id)
  vault_share_tokens → talent_vault_items (vault_item_id)
  company_profiles   → users (employer_id)
  interviews    → applications, users (employer_id), users (candidate_id)
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def _col_exists(conn, table: str, column: str) -> bool:
    """Check if a column already exists (idempotency guard)."""
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.columns " "WHERE table_name = :t AND column_name = :c"),
            {"t": table, "c": column},
        ).scalar()
    )


def _fk_exists(conn, constraint_name: str) -> bool:
    """Check if a FK constraint already exists."""
    return bool(
        conn.execute(
            sa.text(
                "SELECT 1 FROM information_schema.table_constraints "
                "WHERE constraint_type = 'FOREIGN KEY' "
                "AND constraint_name = :n"
            ),
            {"n": constraint_name},
        ).scalar()
    )


def upgrade():
    conn = op.get_bind()

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 1 — users table
    # ════════════════════════════════════════════════════════════════════════
    if not _col_exists(conn, "users", "email_verified"):
        op.add_column(
            "users",
            sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
        )

    if not _col_exists(conn, "users", "phone_verified"):
        op.add_column(
            "users",
            sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default="false"),
        )

    if not _col_exists(conn, "users", "totp_secret"):
        op.add_column("users", sa.Column("totp_secret", sa.String(length=255), nullable=True))

    if not _col_exists(conn, "users", "totp_enabled"):
        op.add_column(
            "users",
            sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default="false"),
        )

    if not _col_exists(conn, "users", "totp_backup_codes"):
        op.add_column(
            "users",
            sa.Column(
                "totp_backup_codes",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
                server_default="[]",
            ),
        )

    if not _col_exists(conn, "users", "oauth_provider"):
        op.add_column("users", sa.Column("oauth_provider", sa.String(length=50), nullable=True))

    if not _col_exists(conn, "users", "oauth_provider_id"):
        op.add_column("users", sa.Column("oauth_provider_id", sa.String(length=255), nullable=True))

    if not _col_exists(conn, "users", "avatar_url"):
        op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 2 — user_profiles table
    # ════════════════════════════════════════════════════════════════════════
    if not _col_exists(conn, "user_profiles", "phone_verified_at"):
        op.add_column(
            "user_profiles",
            sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True),
        )

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 3 — tryouts table
    # ════════════════════════════════════════════════════════════════════════
    if not _col_exists(conn, "tryouts", "title"):
        op.add_column(
            "tryouts",
            sa.Column("title", sa.String(length=255), nullable=True),
        )

    if not _col_exists(conn, "tryouts", "description"):
        op.add_column("tryouts", sa.Column("description", sa.Text(), nullable=True))

    if not _col_exists(conn, "tryouts", "requirements"):
        op.add_column("tryouts", sa.Column("requirements", sa.Text(), nullable=True))

    if not _col_exists(conn, "tryouts", "scoring_rubric"):
        op.add_column(
            "tryouts",
            sa.Column(
                "scoring_rubric",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
                server_default="{}",
            ),
        )

    if not _col_exists(conn, "tryouts", "estimated_duration_hours"):
        op.add_column(
            "tryouts",
            sa.Column("estimated_duration_hours", sa.Integer(), nullable=True, server_default="4"),
        )

    if not _col_exists(conn, "tryouts", "payment_currency"):
        op.add_column(
            "tryouts",
            sa.Column("payment_currency", sa.String(length=3), nullable=True, server_default="INR"),
        )

    if not _col_exists(conn, "tryouts", "auto_grade_enabled"):
        op.add_column(
            "tryouts",
            sa.Column("auto_grade_enabled", sa.Boolean(), nullable=True, server_default="false"),
        )

    if not _col_exists(conn, "tryouts", "max_submissions"):
        op.add_column(
            "tryouts",
            sa.Column("max_submissions", sa.Integer(), nullable=True, server_default="1"),
        )

    if not _col_exists(conn, "tryouts", "submissions_count"):
        op.add_column(
            "tryouts",
            sa.Column("submissions_count", sa.Integer(), nullable=True, server_default="0"),
        )

    if not _col_exists(conn, "tryouts", "expected_deliverables"):
        op.add_column(
            "tryouts",
            sa.Column(
                "expected_deliverables",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
            ),
        )

    if not _col_exists(conn, "tryouts", "updated_at"):
        op.add_column("tryouts", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 4 — tryout_submissions table
    # ════════════════════════════════════════════════════════════════════════
    if not _col_exists(conn, "tryout_submissions", "notes"):
        op.add_column("tryout_submissions", sa.Column("notes", sa.Text(), nullable=True))

    if not _col_exists(conn, "tryout_submissions", "created_at"):
        op.add_column(
            "tryout_submissions",
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("now()"),
            ),
        )

    if not _col_exists(conn, "tryout_submissions", "updated_at"):
        op.add_column(
            "tryout_submissions",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _col_exists(conn, "tryout_submissions", "payment_escrowed_at"):
        op.add_column(
            "tryout_submissions",
            sa.Column("payment_escrowed_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _col_exists(conn, "tryout_submissions", "reviewed_by"):
        op.add_column(
            "tryout_submissions",
            sa.Column("reviewed_by", sa.String(length=255), nullable=True),
        )

    if not _col_exists(conn, "tryout_submissions", "reviewed_at"):
        op.add_column(
            "tryout_submissions",
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        )

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 5 — Restore FK constraints (dropped by f1a73524a674)
    # ════════════════════════════════════════════════════════════════════════

    # applications → users (candidate)
    if not _fk_exists(conn, "applications_candidate_id_fkey"):
        op.create_foreign_key(
            "applications_candidate_id_fkey",
            "applications",
            "users",
            ["candidate_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # applications → jobs
    if not _fk_exists(conn, "applications_job_id_fkey"):
        op.create_foreign_key(
            "applications_job_id_fkey",
            "applications",
            "jobs",
            ["job_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # jobs → users (employer)
    if not _fk_exists(conn, "jobs_employer_id_fkey"):
        op.create_foreign_key(
            "jobs_employer_id_fkey",
            "jobs",
            "users",
            ["employer_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # notifications → users
    if not _fk_exists(conn, "notifications_user_id_fkey"):
        op.create_foreign_key(
            "notifications_user_id_fkey",
            "notifications",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # tryouts → jobs
    if not _fk_exists(conn, "tryouts_job_id_fkey"):
        op.create_foreign_key(
            "tryouts_job_id_fkey",
            "tryouts",
            "jobs",
            ["job_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # tryout_submissions → tryouts
    if not _fk_exists(conn, "tryout_submissions_tryout_id_fkey"):
        op.create_foreign_key(
            "tryout_submissions_tryout_id_fkey",
            "tryout_submissions",
            "tryouts",
            ["tryout_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # tryout_submissions → users (candidate)
    if not _fk_exists(conn, "tryout_submissions_candidate_id_fkey"):
        op.create_foreign_key(
            "tryout_submissions_candidate_id_fkey",
            "tryout_submissions",
            "users",
            ["candidate_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # talent_vault_items → users (candidate)
    if not _fk_exists(conn, "talent_vault_items_candidate_id_fkey"):
        op.create_foreign_key(
            "talent_vault_items_candidate_id_fkey",
            "talent_vault_items",
            "users",
            ["candidate_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # talent_vault_items → tryout_submissions
    if not _fk_exists(conn, "talent_vault_items_tryout_submission_id_fkey"):
        op.create_foreign_key(
            "talent_vault_items_tryout_submission_id_fkey",
            "talent_vault_items",
            "tryout_submissions",
            ["tryout_submission_id"],
            ["id"],
            ondelete="SET NULL",
        )

    # vault_share_tokens → talent_vault_items
    if not _fk_exists(conn, "vault_share_tokens_vault_item_id_fkey"):
        op.create_foreign_key(
            "vault_share_tokens_vault_item_id_fkey",
            "vault_share_tokens",
            "talent_vault_items",
            ["vault_item_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # company_profiles → users (employer)
    if not _fk_exists(conn, "company_profiles_employer_id_fkey"):
        op.create_foreign_key(
            "company_profiles_employer_id_fkey",
            "company_profiles",
            "users",
            ["employer_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # interviews → applications
    if not _fk_exists(conn, "interviews_application_id_fkey"):
        op.create_foreign_key(
            "interviews_application_id_fkey",
            "interviews",
            "applications",
            ["application_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # interviews → users (employer)
    if not _fk_exists(conn, "interviews_employer_id_fkey"):
        op.create_foreign_key(
            "interviews_employer_id_fkey",
            "interviews",
            "users",
            ["employer_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # interviews → users (candidate)
    if not _fk_exists(conn, "interviews_candidate_id_fkey"):
        op.create_foreign_key(
            "interviews_candidate_id_fkey",
            "interviews",
            "users",
            ["candidate_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade():
    # Remove FK constraints
    fk_list = [
        ("interviews", "interviews_candidate_id_fkey"),
        ("interviews", "interviews_employer_id_fkey"),
        ("interviews", "interviews_application_id_fkey"),
        ("company_profiles", "company_profiles_employer_id_fkey"),
        ("vault_share_tokens", "vault_share_tokens_vault_item_id_fkey"),
        ("talent_vault_items", "talent_vault_items_tryout_submission_id_fkey"),
        ("talent_vault_items", "talent_vault_items_candidate_id_fkey"),
        ("tryout_submissions", "tryout_submissions_candidate_id_fkey"),
        ("tryout_submissions", "tryout_submissions_tryout_id_fkey"),
        ("tryouts", "tryouts_job_id_fkey"),
        ("notifications", "notifications_user_id_fkey"),
        ("jobs", "jobs_employer_id_fkey"),
        ("applications", "applications_job_id_fkey"),
        ("applications", "applications_candidate_id_fkey"),
    ]

    conn = op.get_bind()
    for table, name in fk_list:
        if _fk_exists(conn, name):
            op.drop_constraint(name, table, type_="foreignkey")

    # Remove added columns (reverse order)
    cols_to_drop = [
        ("tryout_submissions", "reviewed_at"),
        ("tryout_submissions", "reviewed_by"),
        ("tryout_submissions", "payment_escrowed_at"),
        ("tryout_submissions", "updated_at"),
        ("tryout_submissions", "created_at"),
        ("tryout_submissions", "notes"),
        ("tryouts", "updated_at"),
        ("tryouts", "expected_deliverables"),
        ("tryouts", "submissions_count"),
        ("tryouts", "max_submissions"),
        ("tryouts", "auto_grade_enabled"),
        ("tryouts", "payment_currency"),
        ("tryouts", "estimated_duration_hours"),
        ("tryouts", "scoring_rubric"),
        ("tryouts", "requirements"),
        ("tryouts", "description"),
        ("tryouts", "title"),
        ("user_profiles", "phone_verified_at"),
        ("users", "avatar_url"),
        ("users", "oauth_provider_id"),
        ("users", "oauth_provider"),
        ("users", "totp_backup_codes"),
        ("users", "totp_enabled"),
        ("users", "totp_secret"),
        ("users", "phone_verified"),
        ("users", "email_verified"),
    ]

    for table, col in cols_to_drop:
        if _col_exists(conn, table, col):
            op.drop_column(table, col)
