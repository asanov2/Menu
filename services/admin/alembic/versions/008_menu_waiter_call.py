"""add waiter_call_enabled to menus

Revision ID: 008
Revises: 007
Create Date: 2026-05-31 00:00:00.000000
"""

from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE menus
            ADD COLUMN IF NOT EXISTS waiter_call_enabled BOOLEAN NOT NULL DEFAULT false
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE menus DROP COLUMN IF EXISTS waiter_call_enabled")
