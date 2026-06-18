"""add_subscriptions_table

Revision ID: j4k5l6m7n8o9
Revises: i3j4k5l6m7n8
Create Date: 2026-06-18 11:05:00.000000

Changes:
  - subscriptions table (org billing plans, Stripe IDs, limits)
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "j4k5l6m7n8o9"
down_revision = "i3j4k5l6m7n8"
branch_labels = None
depends_on = None


def _table_exists(conn, table: str) -> bool:
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.tables " "WHERE table_schema = 'public' AND table_name = :t"),
            {"t": table},
        ).scalar()
    )


def upgrade():
    conn = op.get_bind()

    if _table_exists(conn, "subscriptions"):
        return  # Idempotent

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "plan",
            sa.Enum("free", "starter", "pro", "enterprise", name="plantier"),
            nullable=False,
            server_default="free",
        ),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True, unique=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("seat_limit_override", sa.Integer(), nullable=True),
        sa.Column("job_limit_override", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_subscriptions_org_id", "subscriptions", ["org_id"], unique=True)


def downgrade():
    conn = op.get_bind()
    if _table_exists(conn, "subscriptions"):
        op.drop_index("ix_subscriptions_org_id", table_name="subscriptions")
        op.drop_table("subscriptions")
    # Drop the enum type
    conn.execute(sa.text("DROP TYPE IF EXISTS plantier"))
