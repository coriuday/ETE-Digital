"""Fix userrole enum to use lowercase values matching the ORM model

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-04-09 14:20:00.000000

The initial migration created the userrole enum with uppercase values
('CANDIDATE', 'EMPLOYER', 'ADMIN') but the ORM model uses lowercase
('candidate', 'employer', 'admin') via values_callable. This migration
reconciles the database with the ORM.

Similar mismatches exist for other enums — this migration fixes them all
to be consistent with the lowercase values_callable pattern in models.
"""

from alembic import op
import sqlalchemy as sa


revision = "c1d2e3f4a5b6"
down_revision = "7e8b57e72ffd"
branch_labels = None
depends_on = None


def upgrade():
    # ── userrole ─────────────────────────────────────────────────────────────
    # Add lowercase values alongside the existing uppercase ones, then
    # migrate all rows, then drop the old enum and rename the new one.
    # PostgreSQL doesn't support renaming enum values directly before PG13,
    # so we use the "new type" approach.

    op.execute("ALTER TYPE userrole RENAME TO userrole_old")
    op.execute("CREATE TYPE userrole AS ENUM ('candidate', 'employer', 'admin')")
    op.execute(
        """
        ALTER TABLE users
            ALTER COLUMN role TYPE userrole
            USING CASE role::text
                WHEN 'CANDIDATE' THEN 'candidate'
                WHEN 'EMPLOYER'  THEN 'employer'
                WHEN 'ADMIN'     THEN 'admin'
                ELSE lower(role::text)
            END::userrole
        """
    )
    op.execute("DROP TYPE userrole_old")

    # ── applicationstatus ────────────────────────────────────────────────────
    op.execute("ALTER TYPE applicationstatus RENAME TO applicationstatus_old")
    op.execute(
        "CREATE TYPE applicationstatus AS ENUM " "('pending', 'reviewed', 'shortlisted', 'rejected', 'hired', 'withdrawn')"
    )
    # Must drop DEFAULT before changing column type (PostgreSQL can't auto-cast)
    op.execute("ALTER TABLE applications ALTER COLUMN status DROP DEFAULT")
    op.execute(
        """
        ALTER TABLE applications
            ALTER COLUMN status TYPE applicationstatus
            USING lower(status::text)::applicationstatus
        """
    )
    op.execute("ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'pending'::applicationstatus")
    op.execute("DROP TYPE applicationstatus_old")

    # ── jobtype ──────────────────────────────────────────────────────────────
    op.execute("ALTER TYPE jobtype RENAME TO jobtype_old")
    op.execute("CREATE TYPE jobtype AS ENUM ('full_time', 'part_time', 'contract', 'internship')")
    op.execute("ALTER TABLE jobs ALTER COLUMN job_type DROP DEFAULT")
    op.execute(
        """
        ALTER TABLE jobs
            ALTER COLUMN job_type TYPE jobtype
            USING CASE job_type::text
                WHEN 'FULL_TIME'   THEN 'full_time'
                WHEN 'PART_TIME'   THEN 'part_time'
                WHEN 'CONTRACT'    THEN 'contract'
                WHEN 'INTERNSHIP'  THEN 'internship'
                ELSE lower(job_type::text)
            END::jobtype
        """
    )
    op.execute("DROP TYPE jobtype_old")

    # ── jobstatus ────────────────────────────────────────────────────────────
    op.execute("ALTER TYPE jobstatus RENAME TO jobstatus_old")
    op.execute("CREATE TYPE jobstatus AS ENUM ('draft', 'active', 'closed', 'archived')")
    op.execute("ALTER TABLE jobs ALTER COLUMN status DROP DEFAULT")
    # Supabase RLS policy references jobs.status — must drop it before type change
    op.execute('DROP POLICY IF EXISTS "Public can view active jobs" ON jobs')
    op.execute(
        """
        ALTER TABLE jobs
            ALTER COLUMN status TYPE jobstatus
            USING lower(status::text)::jobstatus
        """
    )
    op.execute("ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'draft'::jobstatus")
    # Recreate the RLS policy with the new lowercase enum value
    op.execute('CREATE POLICY "Public can view active jobs" ON jobs ' "FOR SELECT USING (status = 'active'::jobstatus)")
    op.execute("DROP TYPE jobstatus_old")


def downgrade():
    # Reverse: restore uppercase enum values

    # userrole
    op.execute("ALTER TYPE userrole RENAME TO userrole_new")
    op.execute("CREATE TYPE userrole AS ENUM ('CANDIDATE', 'EMPLOYER', 'ADMIN')")
    op.execute(
        """
        ALTER TABLE users
            ALTER COLUMN role TYPE userrole
            USING upper(role::text)::userrole
        """
    )
    op.execute("DROP TYPE userrole_new")

    # applicationstatus
    op.execute("ALTER TYPE applicationstatus RENAME TO applicationstatus_new")
    op.execute(
        "CREATE TYPE applicationstatus AS ENUM " "('PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN')"
    )
    op.execute(
        """
        ALTER TABLE applications
            ALTER COLUMN status TYPE applicationstatus
            USING upper(status::text)::applicationstatus
        """
    )
    op.execute("DROP TYPE applicationstatus_new")

    # jobtype
    op.execute("ALTER TYPE jobtype RENAME TO jobtype_new")
    op.execute("CREATE TYPE jobtype AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')")
    op.execute(
        """
        ALTER TABLE jobs
            ALTER COLUMN job_type TYPE jobtype
            USING CASE job_type::text
                WHEN 'full_time'  THEN 'FULL_TIME'
                WHEN 'part_time'  THEN 'PART_TIME'
                WHEN 'contract'   THEN 'CONTRACT'
                WHEN 'internship' THEN 'INTERNSHIP'
                ELSE upper(job_type::text)
            END::jobtype
        """
    )
    op.execute("DROP TYPE jobtype_new")

    # jobstatus
    op.execute("ALTER TYPE jobstatus RENAME TO jobstatus_new")
    op.execute("CREATE TYPE jobstatus AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED')")
    op.execute(
        """
        ALTER TABLE jobs
            ALTER COLUMN status TYPE jobstatus
            USING upper(status::text)::jobstatus
        """
    )
    op.execute("DROP TYPE jobstatus_new")
