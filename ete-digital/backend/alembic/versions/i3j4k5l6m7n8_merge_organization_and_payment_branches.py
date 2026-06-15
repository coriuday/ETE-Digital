"""merge_organization_and_payment_branches

Revision ID: i3j4k5l6m7n8
Revises: a2b3c4d5e6f7, h2i3j4k5l6m7
Create Date: 2026-06-15 10:30:00.000000

Merge two parallel branches:
  - a2b3c4d5e6f7: add_organization_tables
  - h2i3j4k5l6m7: add_payment_intent_id_to_submissions
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "i3j4k5l6m7n8"
down_revision = ("a2b3c4d5e6f7", "h2i3j4k5l6m7")
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
