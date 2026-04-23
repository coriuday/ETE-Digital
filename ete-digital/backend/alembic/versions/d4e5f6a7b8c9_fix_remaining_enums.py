"""Fix remaining enum types to lowercase

Revision ID: d4e5f6a7b8c9
Revises: f1a73524a674
Create Date: 2026-04-21 00:00:00.000000

Fixes enums left unfixed after c1d2e3f4a5b6:
  - notificationtype: APPLICATION/TRYOUT/MESSAGE/PAYMENT/SYSTEM
    → application/tryout/message/payment/system
  - auditaction: VAULT_ACCESS/VAULT_SHARE/... → vault_access/vault_share/...
  - companysize: STARTUP/SMALL/MEDIUM/LARGE/ENTERPRISE
    → 1-10/11-50/51-200/201-1000/1000+  (ORM uses descriptive strings)
  - interviewtype: VIDEO/PHONE/IN_PERSON/... → video/phone/in_person/...
  - interviewstatus: SCHEDULED/COMPLETED/CANCELLED/NO_SHOW
    → scheduled/completed/cancelled/no_show

Strategy: RENAME old → CREATE new → CAST column data → DROP old
This avoids ALTER TYPE limitations on older PostgreSQL versions and is
fully transactional — any failure rolls back the entire migration.
"""

from alembic import op
import sqlalchemy as sa


revision = "d4e5f6a7b8c9"
down_revision = "f1a73524a674"
branch_labels = None
depends_on = None


def upgrade():
    # ── notificationtype ─────────────────────────────────────────────────────
    # Only run if the enum still has uppercase values (idempotency guard).
    conn = op.get_bind()

    _uppercase_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'notificationtype' AND e.enumlabel = 'APPLICATION'"
        )
    ).scalar()

    if _uppercase_exists:
        op.execute("ALTER TYPE notificationtype RENAME TO notificationtype_old")
        op.execute("CREATE TYPE notificationtype AS ENUM " "('application', 'tryout', 'message', 'payment', 'system')")
        op.execute(
            """
            ALTER TABLE notifications
                ALTER COLUMN type TYPE notificationtype
                USING lower(type::text)::notificationtype
            """
        )
        op.execute("DROP TYPE notificationtype_old")

    # ── auditaction ───────────────────────────────────────────────────────────
    _uppercase_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'auditaction' AND e.enumlabel = 'VAULT_ACCESS'"
        )
    ).scalar()

    if _uppercase_exists:
        op.execute("ALTER TYPE auditaction RENAME TO auditaction_old")
        op.execute(
            "CREATE TYPE auditaction AS ENUM "
            "('vault_access', 'vault_share', 'data_export', 'data_deletion', "
            "'profile_update', 'password_change', 'admin_action')"
        )
        op.execute(
            """
            ALTER TABLE audit_logs
                ALTER COLUMN action TYPE auditaction
                USING lower(action::text)::auditaction
            """
        )
        op.execute("DROP TYPE auditaction_old")

    # ── companysize ───────────────────────────────────────────────────────────
    # ORM values are '1-10', '11-50', '51-200', '201-1000', '1000+'
    # DB has 'STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'
    _uppercase_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'companysize' AND e.enumlabel = 'STARTUP'"
        )
    ).scalar()

    if _uppercase_exists:
        op.execute("ALTER TYPE companysize RENAME TO companysize_old")
        op.execute("CREATE TYPE companysize AS ENUM " "('1-10', '11-50', '51-200', '201-1000', '1000+')")
        op.execute(
            """
            ALTER TABLE company_profiles
                ALTER COLUMN company_size TYPE companysize
                USING CASE company_size::text
                    WHEN 'STARTUP'    THEN '1-10'
                    WHEN 'SMALL'      THEN '11-50'
                    WHEN 'MEDIUM'     THEN '51-200'
                    WHEN 'LARGE'      THEN '201-1000'
                    WHEN 'ENTERPRISE' THEN '1000+'
                    ELSE NULL
                END::companysize
            """
        )
        op.execute("DROP TYPE companysize_old")

    # ── interviewtype ─────────────────────────────────────────────────────────
    _uppercase_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'interviewtype' AND e.enumlabel = 'VIDEO'"
        )
    ).scalar()

    if _uppercase_exists:
        op.execute("ALTER TYPE interviewtype RENAME TO interviewtype_old")
        op.execute("CREATE TYPE interviewtype AS ENUM " "('video', 'phone', 'in_person', 'technical', 'hr', 'final')")
        op.execute(
            """
            ALTER TABLE interviews
                ALTER COLUMN interview_type TYPE interviewtype
                USING CASE interview_type::text
                    WHEN 'IN_PERSON'  THEN 'in_person'
                    WHEN 'TECHNICAL'  THEN 'technical'
                    ELSE lower(interview_type::text)
                END::interviewtype
            """
        )
        op.execute("DROP TYPE interviewtype_old")

    # ── interviewstatus ───────────────────────────────────────────────────────
    _uppercase_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'interviewstatus' AND e.enumlabel = 'SCHEDULED'"
        )
    ).scalar()

    if _uppercase_exists:
        op.execute("ALTER TYPE interviewstatus RENAME TO interviewstatus_old")
        op.execute("CREATE TYPE interviewstatus AS ENUM " "('scheduled', 'completed', 'cancelled', 'no_show')")
        op.execute(
            """
            ALTER TABLE interviews
                ALTER COLUMN status TYPE interviewstatus
                USING CASE status::text
                    WHEN 'NO_SHOW' THEN 'no_show'
                    ELSE lower(status::text)
                END::interviewstatus
            """
        )
        op.execute("DROP TYPE interviewstatus_old")


def downgrade():
    # ── interviewstatus ───────────────────────────────────────────────────────
    conn = op.get_bind()

    _lc_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'interviewstatus' AND e.enumlabel = 'scheduled'"
        )
    ).scalar()

    if _lc_exists:
        op.execute("ALTER TYPE interviewstatus RENAME TO interviewstatus_new")
        op.execute("CREATE TYPE interviewstatus AS ENUM " "('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')")
        op.execute(
            """
            ALTER TABLE interviews
                ALTER COLUMN status TYPE interviewstatus
                USING CASE status::text
                    WHEN 'no_show' THEN 'NO_SHOW'
                    ELSE upper(status::text)
                END::interviewstatus
            """
        )
        op.execute("DROP TYPE interviewstatus_new")

    # ── interviewtype ─────────────────────────────────────────────────────────
    _lc_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'interviewtype' AND e.enumlabel = 'video'"
        )
    ).scalar()

    if _lc_exists:
        op.execute("ALTER TYPE interviewtype RENAME TO interviewtype_new")
        op.execute("CREATE TYPE interviewtype AS ENUM " "('VIDEO', 'PHONE', 'IN_PERSON', 'TECHNICAL', 'HR', 'FINAL')")
        op.execute(
            """
            ALTER TABLE interviews
                ALTER COLUMN interview_type TYPE interviewtype
                USING CASE interview_type::text
                    WHEN 'in_person'  THEN 'IN_PERSON'
                    WHEN 'technical'  THEN 'TECHNICAL'
                    ELSE upper(interview_type::text)
                END::interviewtype
            """
        )
        op.execute("DROP TYPE interviewtype_new")

    # ── companysize ───────────────────────────────────────────────────────────
    _lc_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'companysize' AND e.enumlabel = '1-10'"
        )
    ).scalar()

    if _lc_exists:
        op.execute("ALTER TYPE companysize RENAME TO companysize_new")
        op.execute("CREATE TYPE companysize AS ENUM " "('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE')")
        op.execute(
            """
            ALTER TABLE company_profiles
                ALTER COLUMN company_size TYPE companysize
                USING CASE company_size::text
                    WHEN '1-10'     THEN 'STARTUP'
                    WHEN '11-50'    THEN 'SMALL'
                    WHEN '51-200'   THEN 'MEDIUM'
                    WHEN '201-1000' THEN 'LARGE'
                    WHEN '1000+'    THEN 'ENTERPRISE'
                    ELSE NULL
                END::companysize
            """
        )
        op.execute("DROP TYPE companysize_new")

    # ── auditaction ───────────────────────────────────────────────────────────
    _lc_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'auditaction' AND e.enumlabel = 'vault_access'"
        )
    ).scalar()

    if _lc_exists:
        op.execute("ALTER TYPE auditaction RENAME TO auditaction_new")
        op.execute(
            "CREATE TYPE auditaction AS ENUM "
            "('VAULT_ACCESS', 'VAULT_SHARE', 'DATA_EXPORT', 'DATA_DELETION', "
            "'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'ADMIN_ACTION')"
        )
        op.execute(
            """
            ALTER TABLE audit_logs
                ALTER COLUMN action TYPE auditaction
                USING upper(action::text)::auditaction
            """
        )
        op.execute("DROP TYPE auditaction_new")

    # ── notificationtype ──────────────────────────────────────────────────────
    _lc_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e "
            "JOIN pg_type t ON t.oid = e.enumtypid "
            "WHERE t.typname = 'notificationtype' AND e.enumlabel = 'application'"
        )
    ).scalar()

    if _lc_exists:
        op.execute("ALTER TYPE notificationtype RENAME TO notificationtype_new")
        op.execute("CREATE TYPE notificationtype AS ENUM " "('APPLICATION', 'TRYOUT', 'MESSAGE', 'PAYMENT', 'SYSTEM')")
        op.execute(
            """
            ALTER TABLE notifications
                ALTER COLUMN type TYPE notificationtype
                USING upper(type::text)::notificationtype
            """
        )
        op.execute("DROP TYPE notificationtype_new")
