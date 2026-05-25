"""orders table

Revision ID: 001
Revises:
Create Date: 2026-05-25 00:00:00.000000
"""

from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL,
            menu_id       UUID NOT NULL,
            order_type    VARCHAR(10) NOT NULL,
            table_number  INTEGER,
            customer_name VARCHAR(100),
            customer_phone VARCHAR(20),
            items         JSONB NOT NULL DEFAULT '[]',
            total_price   INTEGER NOT NULL DEFAULT 0,
            comment       TEXT,
            created_at    TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_orders_restaurant_id ON orders (restaurant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders (created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS orders")
