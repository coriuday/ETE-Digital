"""Add AI matching columns to user_profiles

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-08

Changes:
  user_profiles table:
    - ADD salary_expectation_min (INTEGER, nullable) — candidate's minimum salary expectation
    - ADD salary_expectation_max (INTEGER, nullable) — candidate's maximum salary expectation
    - ADD preferred_job_types   (JSONB, default []) — e.g. ["full_time", "contract"]
    - ADD preferred_locations   (JSONB, default []) — e.g. ["Mumbai", "Remote"]

These columns feed the AI matching engine's salary and location scoring factors.
They are optional — the engine defaults to neutral scores when they are absent.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Salary expectations for matching against job salary bands
    op.add_column(
        'user_profiles',
        sa.Column('salary_expectation_min', sa.Integer(), nullable=True),
    )
    op.add_column(
        'user_profiles',
        sa.Column('salary_expectation_max', sa.Integer(), nullable=True),
    )

    # Preferred job types for matching boost (e.g. prefers contract → ranks contract jobs higher)
    op.add_column(
        'user_profiles',
        sa.Column(
            'preferred_job_types',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            server_default='[]',
        ),
    )

    # Preferred locations for matching (supplements profile.location field)
    op.add_column(
        'user_profiles',
        sa.Column(
            'preferred_locations',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            server_default='[]',
        ),
    )


def downgrade():
    op.drop_column('user_profiles', 'preferred_locations')
    op.drop_column('user_profiles', 'preferred_job_types')
    op.drop_column('user_profiles', 'salary_expectation_max')
    op.drop_column('user_profiles', 'salary_expectation_min')
