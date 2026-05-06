"""owner service initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # Owner service reads from existing schemas, no tables needed


def downgrade() -> None:
    pass
