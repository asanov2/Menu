"""waiter_calls table + waiter_call_enabled in menus

Revision ID: 003
Revises: 002
Create Date: 2026-05-31 00:00:00.000000
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE menus
            ADD COLUMN IF NOT EXISTS waiter_call_enabled BOOLEAN NOT NULL DEFAULT false
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS waiter_calls (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL,
            menu_id       UUID NOT NULL,
            table_number  INTEGER NOT NULL,
            status        VARCHAR(10) NOT NULL DEFAULT 'new',
            created_at    TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_waiter_calls_rest_status ON waiter_calls (restaurant_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_waiter_calls_created_at ON waiter_calls (created_at DESC)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_waiter_calls_created_at")
    op.execute("DROP INDEX IF EXISTS ix_waiter_calls_rest_status")
    op.execute("DROP TABLE IF EXISTS waiter_calls")
    op.execute("ALTER TABLE menus DROP COLUMN IF EXISTS waiter_call_enabled")
