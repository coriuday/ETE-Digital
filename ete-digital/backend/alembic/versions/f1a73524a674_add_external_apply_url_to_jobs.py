"""add_external_apply_url_to_jobs

Revision ID: f1a73524a674
Revises: c1d2e3f4a5b6
Create Date: 2026-04-20 16:20:29.085053

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "f1a73524a674"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def _constraint_exists(conn, table: str, constraint_name: str, constraint_type: str) -> bool:
    """Check if a constraint exists in information_schema."""
    type_map = {"unique": "UNIQUE", "foreignkey": "FOREIGN KEY", "primary": "PRIMARY KEY", "check": "CHECK"}
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


def _index_exists(conn, index_name: str, table_name: str) -> bool:
    """Check if a PostgreSQL index exists."""
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM pg_indexes " "WHERE tablename = :t AND indexname = :n"),
            {"t": table_name, "n": index_name},
        ).scalar()
    )


def upgrade():
    conn = op.get_bind()

    # ── applications ────────────────────────────────────────────────────────
    # unique constraint was never created by the initial migration on fresh DBs;
    # only existed on databases where it was manually added
    if _constraint_exists(conn, "applications", "uq_applications_job_candidate", "unique"):
        op.drop_constraint("uq_applications_job_candidate", "applications", type_="unique")

    if _constraint_exists(conn, "applications", "applications_candidate_id_fkey", "foreignkey"):
        op.drop_constraint("applications_candidate_id_fkey", "applications", type_="foreignkey")

    if _constraint_exists(conn, "applications", "applications_job_id_fkey", "foreignkey"):
        op.drop_constraint("applications_job_id_fkey", "applications", type_="foreignkey")

    # ── company_profiles ────────────────────────────────────────────────────
    if _constraint_exists(conn, "company_profiles", "company_profiles_employer_id_key", "unique"):
        op.drop_constraint("company_profiles_employer_id_key", "company_profiles", type_="unique")

    if not _index_exists(conn, "ix_company_profiles_employer_id", "company_profiles"):
        op.create_index(op.f("ix_company_profiles_employer_id"), "company_profiles", ["employer_id"], unique=True)

    if _constraint_exists(conn, "company_profiles", "company_profiles_employer_id_fkey", "foreignkey"):
        op.drop_constraint("company_profiles_employer_id_fkey", "company_profiles", type_="foreignkey")

    # ── interviews ──────────────────────────────────────────────────────────
    if _constraint_exists(conn, "interviews", "interviews_candidate_id_fkey", "foreignkey"):
        op.drop_constraint("interviews_candidate_id_fkey", "interviews", type_="foreignkey")

    if _constraint_exists(conn, "interviews", "interviews_employer_id_fkey", "foreignkey"):
        op.drop_constraint("interviews_employer_id_fkey", "interviews", type_="foreignkey")

    if _constraint_exists(conn, "interviews", "interviews_application_id_fkey", "foreignkey"):
        op.drop_constraint("interviews_application_id_fkey", "interviews", type_="foreignkey")

    # ── jobs ────────────────────────────────────────────────────────────────
    # THE real purpose of this migration: add external_apply_url column
    if not conn.execute(
        sa.text("SELECT 1 FROM information_schema.columns " "WHERE table_name = 'jobs' AND column_name = 'external_apply_url'")
    ).scalar():
        op.add_column("jobs", sa.Column("external_apply_url", sa.String(length=2048), nullable=True))

    if _constraint_exists(conn, "jobs", "jobs_employer_id_fkey", "foreignkey"):
        op.drop_constraint("jobs_employer_id_fkey", "jobs", type_="foreignkey")

    # ── notifications ───────────────────────────────────────────────────────
    if _index_exists(conn, "ix_notifications_user_id_is_read", "notifications"):
        op.drop_index("ix_notifications_user_id_is_read", table_name="notifications")

    if not _index_exists(conn, "ix_notifications_user_id", "notifications"):
        op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)

    if _constraint_exists(conn, "notifications", "notifications_user_id_fkey", "foreignkey"):
        op.drop_constraint("notifications_user_id_fkey", "notifications", type_="foreignkey")

    # ── refresh_tokens ──────────────────────────────────────────────────────
    if _constraint_exists(conn, "refresh_tokens", "refresh_tokens_token_key", "unique"):
        op.drop_constraint("refresh_tokens_token_key", "refresh_tokens", type_="unique")

    if not _index_exists(conn, "ix_refresh_tokens_token", "refresh_tokens"):
        op.create_index(op.f("ix_refresh_tokens_token"), "refresh_tokens", ["token"], unique=True)

    # ── talent_vault_items ──────────────────────────────────────────────────
    op.alter_column(
        "talent_vault_items", "file_size_bytes", existing_type=sa.BIGINT(), type_=sa.Integer(), existing_nullable=True
    )

    if _constraint_exists(conn, "talent_vault_items", "talent_vault_items_candidate_id_fkey", "foreignkey"):
        op.drop_constraint("talent_vault_items_candidate_id_fkey", "talent_vault_items", type_="foreignkey")

    if _constraint_exists(conn, "talent_vault_items", "talent_vault_items_tryout_submission_id_fkey", "foreignkey"):
        op.drop_constraint("talent_vault_items_tryout_submission_id_fkey", "talent_vault_items", type_="foreignkey")

    # ── tryout_submissions ──────────────────────────────────────────────────
    op.alter_column(
        "tryout_submissions",
        "status",
        existing_type=postgresql.ENUM(
            "submitted", "grading", "auto_graded", "graded", "verified", "passed", "failed", name="submissionstatus"
        ),
        type_=sa.Enum(
            "submitted",
            "grading",
            "auto_graded",
            "graded",
            "verified",
            "passed",
            "failed",
            name="submissionstatus",
            native_enum=False,
        ),
        existing_nullable=True,
        existing_server_default=sa.text("'submitted'::submissionstatus"),
    )
    op.alter_column(
        "tryout_submissions",
        "payment_status",
        existing_type=postgresql.ENUM("pending", "escrowed", "released", "refunded", "failed", name="paymentstatus"),
        type_=sa.Enum("pending", "escrowed", "released", "refunded", "failed", name="paymentstatus", native_enum=False),
        existing_nullable=True,
        existing_server_default=sa.text("'pending'::paymentstatus"),
    )
    op.alter_column(
        "tryout_submissions",
        "submitted_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=sa.text("now()"),
    )

    if _constraint_exists(conn, "tryout_submissions", "uq_tryout_submissions_tryout_candidate", "unique"):
        op.drop_constraint("uq_tryout_submissions_tryout_candidate", "tryout_submissions", type_="unique")

    if _constraint_exists(conn, "tryout_submissions", "tryout_submissions_candidate_id_fkey", "foreignkey"):
        op.drop_constraint("tryout_submissions_candidate_id_fkey", "tryout_submissions", type_="foreignkey")

    if _constraint_exists(conn, "tryout_submissions", "tryout_submissions_tryout_id_fkey", "foreignkey"):
        op.drop_constraint("tryout_submissions_tryout_id_fkey", "tryout_submissions", type_="foreignkey")

    # ── tryouts ─────────────────────────────────────────────────────────────
    op.alter_column(
        "tryouts", "duration_days", existing_type=sa.INTEGER(), nullable=True, existing_server_default=sa.text("7")
    )
    op.alter_column(
        "tryouts",
        "submission_format",
        existing_type=sa.VARCHAR(length=100),
        type_=sa.String(length=50),
        existing_nullable=True,
    )
    op.alter_column(
        "tryouts",
        "status",
        existing_type=postgresql.ENUM("draft", "active", "expired", "closed", name="tryoutstatus"),
        type_=sa.Enum("draft", "active", "expired", "closed", name="tryoutstatus", native_enum=False),
        existing_nullable=True,
        existing_server_default=sa.text("'active'::tryoutstatus"),
    )

    if _constraint_exists(conn, "tryouts", "tryouts_job_id_fkey", "foreignkey"):
        op.drop_constraint("tryouts_job_id_fkey", "tryouts", type_="foreignkey")

    # ── users ────────────────────────────────────────────────────────────────
    if _constraint_exists(conn, "users", "users_email_key", "unique"):
        op.drop_constraint("users_email_key", "users", type_="unique")

    if _index_exists(conn, "ix_users_email", "users"):
        op.drop_index("ix_users_email", table_name="users")

    if not _index_exists(conn, "ix_users_email", "users"):
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # ── vault_share_tokens ──────────────────────────────────────────────────
    if _constraint_exists(conn, "vault_share_tokens", "vault_share_tokens_token_key", "unique"):
        op.drop_constraint("vault_share_tokens_token_key", "vault_share_tokens", type_="unique")

    if not _index_exists(conn, "ix_vault_share_tokens_token", "vault_share_tokens"):
        op.create_index(op.f("ix_vault_share_tokens_token"), "vault_share_tokens", ["token"], unique=True)

    if _constraint_exists(conn, "vault_share_tokens", "vault_share_tokens_vault_item_id_fkey", "foreignkey"):
        op.drop_constraint("vault_share_tokens_vault_item_id_fkey", "vault_share_tokens", type_="foreignkey")
    # ### end Alembic commands ###


def downgrade():
    # All constraint/index recreations are guarded — safe on any DB state.
    conn = op.get_bind()

    if not _constraint_exists(conn, "vault_share_tokens", "vault_share_tokens_vault_item_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "vault_share_tokens_vault_item_id_fkey",
            "vault_share_tokens",
            "talent_vault_items",
            ["vault_item_id"],
            ["id"],
            ondelete="CASCADE",
        )

    if _index_exists(conn, "ix_vault_share_tokens_token", "vault_share_tokens"):
        op.drop_index(op.f("ix_vault_share_tokens_token"), table_name="vault_share_tokens")

    if not _constraint_exists(conn, "vault_share_tokens", "vault_share_tokens_token_key", "unique"):
        op.create_unique_constraint("vault_share_tokens_token_key", "vault_share_tokens", ["token"])

    if _index_exists(conn, "ix_users_email", "users"):
        op.drop_index(op.f("ix_users_email"), table_name="users")

    if not _index_exists(conn, "ix_users_email", "users"):
        op.create_index("ix_users_email", "users", ["email"], unique=False)

    if not _constraint_exists(conn, "users", "users_email_key", "unique"):
        op.create_unique_constraint("users_email_key", "users", ["email"])

    if not _constraint_exists(conn, "tryouts", "tryouts_job_id_fkey", "foreignkey"):
        op.create_foreign_key("tryouts_job_id_fkey", "tryouts", "jobs", ["job_id"], ["id"], ondelete="CASCADE")

    op.alter_column(
        "tryouts",
        "status",
        existing_type=sa.Enum("draft", "active", "expired", "closed", name="tryoutstatus", native_enum=False),
        type_=postgresql.ENUM("draft", "active", "expired", "closed", name="tryoutstatus"),
        existing_nullable=True,
        existing_server_default=sa.text("'active'::tryoutstatus"),
    )
    op.alter_column(
        "tryouts",
        "submission_format",
        existing_type=sa.String(length=50),
        type_=sa.VARCHAR(length=100),
        existing_nullable=True,
    )
    op.alter_column(
        "tryouts", "duration_days", existing_type=sa.INTEGER(), nullable=False, existing_server_default=sa.text("7")
    )

    if not _constraint_exists(conn, "tryout_submissions", "tryout_submissions_tryout_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "tryout_submissions_tryout_id_fkey", "tryout_submissions", "tryouts", ["tryout_id"], ["id"], ondelete="CASCADE"
        )

    if not _constraint_exists(conn, "tryout_submissions", "tryout_submissions_candidate_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "tryout_submissions_candidate_id_fkey",
            "tryout_submissions",
            "users",
            ["candidate_id"],
            ["id"],
            ondelete="CASCADE",
        )

    if not _constraint_exists(conn, "tryout_submissions", "uq_tryout_submissions_tryout_candidate", "unique"):
        op.create_unique_constraint(
            "uq_tryout_submissions_tryout_candidate", "tryout_submissions", ["tryout_id", "candidate_id"]
        )

    op.alter_column(
        "tryout_submissions",
        "submitted_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=sa.text("now()"),
    )
    op.alter_column(
        "tryout_submissions",
        "payment_status",
        existing_type=sa.Enum(
            "pending", "escrowed", "released", "refunded", "failed", name="paymentstatus", native_enum=False
        ),
        type_=postgresql.ENUM("pending", "escrowed", "released", "refunded", "failed", name="paymentstatus"),
        existing_nullable=True,
        existing_server_default=sa.text("'pending'::paymentstatus"),
    )
    op.alter_column(
        "tryout_submissions",
        "status",
        existing_type=sa.Enum(
            "submitted",
            "grading",
            "auto_graded",
            "graded",
            "verified",
            "passed",
            "failed",
            name="submissionstatus",
            native_enum=False,
        ),
        type_=postgresql.ENUM(
            "submitted", "grading", "auto_graded", "graded", "verified", "passed", "failed", name="submissionstatus"
        ),
        existing_nullable=True,
        existing_server_default=sa.text("'submitted'::submissionstatus"),
    )

    if not _constraint_exists(conn, "talent_vault_items", "talent_vault_items_tryout_submission_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "talent_vault_items_tryout_submission_id_fkey",
            "talent_vault_items",
            "tryout_submissions",
            ["tryout_submission_id"],
            ["id"],
            ondelete="SET NULL",
        )

    if not _constraint_exists(conn, "talent_vault_items", "talent_vault_items_candidate_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "talent_vault_items_candidate_id_fkey",
            "talent_vault_items",
            "users",
            ["candidate_id"],
            ["id"],
            ondelete="CASCADE",
        )

    op.alter_column(
        "talent_vault_items", "file_size_bytes", existing_type=sa.Integer(), type_=sa.BIGINT(), existing_nullable=True
    )

    if _index_exists(conn, "ix_refresh_tokens_token", "refresh_tokens"):
        op.drop_index(op.f("ix_refresh_tokens_token"), table_name="refresh_tokens")

    if not _constraint_exists(conn, "refresh_tokens", "refresh_tokens_token_key", "unique"):
        op.create_unique_constraint("refresh_tokens_token_key", "refresh_tokens", ["token"])

    if not _constraint_exists(conn, "notifications", "notifications_user_id_fkey", "foreignkey"):
        op.create_foreign_key("notifications_user_id_fkey", "notifications", "users", ["user_id"], ["id"], ondelete="CASCADE")

    if _index_exists(conn, "ix_notifications_user_id", "notifications"):
        op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")

    if not _index_exists(conn, "ix_notifications_user_id_is_read", "notifications"):
        op.create_index("ix_notifications_user_id_is_read", "notifications", ["user_id", "is_read"], unique=False)

    if not _constraint_exists(conn, "jobs", "jobs_employer_id_fkey", "foreignkey"):
        op.create_foreign_key("jobs_employer_id_fkey", "jobs", "users", ["employer_id"], ["id"], ondelete="CASCADE")

    # Drop external_apply_url only if it exists
    if conn.execute(
        sa.text("SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'external_apply_url'")
    ).scalar():
        op.drop_column("jobs", "external_apply_url")

    if not _constraint_exists(conn, "interviews", "interviews_application_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "interviews_application_id_fkey",
            "interviews",
            "applications",
            ["application_id"],
            ["id"],
            ondelete="CASCADE",
        )

    if not _constraint_exists(conn, "interviews", "interviews_employer_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "interviews_employer_id_fkey", "interviews", "users", ["employer_id"], ["id"], ondelete="CASCADE"
        )

    if not _constraint_exists(conn, "interviews", "interviews_candidate_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "interviews_candidate_id_fkey", "interviews", "users", ["candidate_id"], ["id"], ondelete="CASCADE"
        )

    if not _constraint_exists(conn, "company_profiles", "company_profiles_employer_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "company_profiles_employer_id_fkey", "company_profiles", "users", ["employer_id"], ["id"], ondelete="CASCADE"
        )

    if _index_exists(conn, "ix_company_profiles_employer_id", "company_profiles"):
        op.drop_index(op.f("ix_company_profiles_employer_id"), table_name="company_profiles")

    if not _constraint_exists(conn, "company_profiles", "company_profiles_employer_id_key", "unique"):
        op.create_unique_constraint("company_profiles_employer_id_key", "company_profiles", ["employer_id"])

    if not _constraint_exists(conn, "applications", "applications_job_id_fkey", "foreignkey"):
        op.create_foreign_key("applications_job_id_fkey", "applications", "jobs", ["job_id"], ["id"], ondelete="CASCADE")

    if not _constraint_exists(conn, "applications", "applications_candidate_id_fkey", "foreignkey"):
        op.create_foreign_key(
            "applications_candidate_id_fkey", "applications", "users", ["candidate_id"], ["id"], ondelete="CASCADE"
        )

    if not _constraint_exists(conn, "applications", "uq_applications_job_candidate", "unique"):
        op.create_unique_constraint("uq_applications_job_candidate", "applications", ["job_id", "candidate_id"])
    # ### end Alembic commands ###
