"""merge branches

Revision ID: 7e8b57e72ffd
Revises: 71bc124d75eb, b2c3d4e5f6a7
Create Date: 2026-04-09 16:46:54.771201

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7e8b57e72ffd'
down_revision = ('71bc124d75eb', 'b2c3d4e5f6a7')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
