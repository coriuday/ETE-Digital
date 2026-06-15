"""h2i3j4k5l6m7_add_payment_intent_id_to_submissions

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2026-06-15 12:00:00.000000

Changes:
  - tryout_submissions: add payment_intent_id VARCHAR(255)
    (stores the Stripe PaymentIntent ID so we can capture/refund by ID)
"""

from alembic import op
import sqlalchemy as sa


revision = "h2i3j4k5l6m7"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    col_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'tryout_submissions' AND column_name = 'payment_intent_id'"
        )
    ).scalar()
    if not col_exists:
        op.add_column(
            "tryout_submissions",
            sa.Column("payment_intent_id", sa.String(length=255), nullable=True),
        )


def downgrade():
    conn = op.get_bind()
    col_exists = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'tryout_submissions' AND column_name = 'payment_intent_id'"
        )
    ).scalar()
    if col_exists:
        op.drop_column("tryout_submissions", "payment_intent_id")
