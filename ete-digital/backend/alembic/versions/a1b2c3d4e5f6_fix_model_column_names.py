"""Fix model column names — aligns DB schema with service/schema layer

Revision ID: a1b2c3d4e5f6
Revises: 4f07eaeed159
Create Date: 2026-02-24

Changes:
  jobs table:
    - ADD company (VARCHAR 255, not null default '')
    - ADD remote_ok (BOOLEAN default false)  [was is_remote]
    - ADD salary_min, salary_max (INTEGER nullable)
    - ADD salary_currency (VARCHAR 3, default 'INR')
    - ADD skills_required (JSONB default [])
    - ADD experience_required (VARCHAR 50)
    - ADD has_tryout (BOOLEAN default false)   [was is_tryout_enabled]
    - ADD custom_questions (JSONB)
    - ADD views_count (INTEGER default 0)      [was view_count]
    - ADD applications_count (INTEGER default 0) [was application_count]
    - ADD published_at (TIMESTAMP WITH TIME ZONE)
    - DROP is_remote, salary_range, is_tryout_enabled, view_count, application_count

  applications table:
    - ADD custom_answers (JSONB)               [was custom_responses]
    - ADD vault_share_token (VARCHAR 500)      [was vault_token]
    - ADD created_at (TIMESTAMP WITH TIME ZONE, server_default=now()) [was applied_at]
    - ADD match_explanation (JSONB)            [was match_breakdown]
    - DROP custom_responses, vault_token, applied_at, match_breakdown
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'a1b2c3d4e5f6'
down_revision = '4f07eaeed159'
branch_labels = None
depends_on = None


def upgrade():
    # ==== JOBS TABLE ====
    op.add_column('jobs', sa.Column('company', sa.String(length=255), nullable=True))
    op.add_column('jobs', sa.Column('remote_ok', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('jobs', sa.Column('salary_min', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('salary_max', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('salary_currency', sa.String(length=3), nullable=True, server_default='INR'))
    op.add_column('jobs', sa.Column('skills_required', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('jobs', sa.Column('experience_required', sa.String(length=50), nullable=True))
    op.add_column('jobs', sa.Column('has_tryout', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('jobs', sa.Column('custom_questions', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('jobs', sa.Column('views_count', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('jobs', sa.Column('applications_count', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('jobs', sa.Column('published_at', sa.DateTime(timezone=True), nullable=True))

    # Migrate data from old to new columns
    op.execute("UPDATE jobs SET company = '' WHERE company IS NULL")
    op.execute("UPDATE jobs SET remote_ok = is_remote WHERE remote_ok IS NULL")
    op.execute("UPDATE jobs SET has_tryout = is_tryout_enabled WHERE has_tryout IS NULL")
    op.execute("UPDATE jobs SET views_count = COALESCE(view_count, 0) WHERE views_count IS NULL OR views_count = 0")
    op.execute("UPDATE jobs SET applications_count = COALESCE(application_count, 0) WHERE applications_count IS NULL OR applications_count = 0")

    # Drop old columns
    op.drop_column('jobs', 'is_remote')
    op.drop_column('jobs', 'salary_range')
    op.drop_column('jobs', 'is_tryout_enabled')
    op.drop_column('jobs', 'view_count')
    op.drop_column('jobs', 'application_count')

    # ==== APPLICATIONS TABLE ====
    op.add_column('applications', sa.Column('custom_answers', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('applications', sa.Column('vault_share_token', sa.String(length=500), nullable=True))
    op.add_column('applications', sa.Column('created_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('applications', sa.Column('match_explanation', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Migrate data
    op.execute("UPDATE applications SET custom_answers = custom_responses")
    op.execute("UPDATE applications SET vault_share_token = vault_token")
    op.execute("UPDATE applications SET created_at = applied_at")
    op.execute("UPDATE applications SET match_explanation = match_breakdown")

    # Set server_default for new created_at (for future inserts)
    op.execute("ALTER TABLE applications ALTER COLUMN created_at SET DEFAULT NOW()")

    # Drop old columns
    op.drop_column('applications', 'custom_responses')
    op.drop_column('applications', 'vault_token')
    op.drop_column('applications', 'applied_at')
    op.drop_column('applications', 'match_breakdown')
    op.drop_column('applications', 'reviewed_at')


def downgrade():
    # ==== APPLICATIONS TABLE (reverse) ====
    op.add_column('applications', sa.Column('custom_responses', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('applications', sa.Column('vault_token', sa.String(length=500), nullable=True))
    op.add_column('applications', sa.Column('applied_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))
    op.add_column('applications', sa.Column('match_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('applications', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

    op.execute("UPDATE applications SET custom_responses = custom_answers")
    op.execute("UPDATE applications SET vault_token = vault_share_token")
    op.execute("UPDATE applications SET applied_at = COALESCE(created_at, NOW())")
    op.execute("UPDATE applications SET match_breakdown = match_explanation")

    op.drop_column('applications', 'custom_answers')
    op.drop_column('applications', 'vault_share_token')
    op.drop_column('applications', 'created_at')
    op.drop_column('applications', 'match_explanation')

    # ==== JOBS TABLE (reverse) ====
    op.add_column('jobs', sa.Column('is_remote', sa.Boolean(), nullable=True))
    op.add_column('jobs', sa.Column('salary_range', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('jobs', sa.Column('is_tryout_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('jobs', sa.Column('view_count', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('application_count', sa.Integer(), nullable=True))

    op.execute("UPDATE jobs SET is_remote = remote_ok")
    op.execute("UPDATE jobs SET is_tryout_enabled = has_tryout")
    op.execute("UPDATE jobs SET view_count = views_count")
    op.execute("UPDATE jobs SET application_count = applications_count")

    op.drop_column('jobs', 'company')
    op.drop_column('jobs', 'remote_ok')
    op.drop_column('jobs', 'salary_min')
    op.drop_column('jobs', 'salary_max')
    op.drop_column('jobs', 'salary_currency')
    op.drop_column('jobs', 'skills_required')
    op.drop_column('jobs', 'experience_required')
    op.drop_column('jobs', 'has_tryout')
    op.drop_column('jobs', 'custom_questions')
    op.drop_column('jobs', 'views_count')
    op.drop_column('jobs', 'applications_count')
    op.drop_column('jobs', 'published_at')
