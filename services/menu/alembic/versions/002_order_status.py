"""order status field

Revision ID: 002
Revises: 001
Create Date: 2026-05-31 00:00:00.000000

Adds status column to orders table. Existing rows become 'new'.
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'new'
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_orders_status ON orders (restaurant_id, status)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_orders_status")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS status")
