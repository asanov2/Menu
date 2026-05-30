"""menu_order_settings — per-menu order config columns

Revision ID: 006
Revises: 005
Create Date: 2026-05-30 00:00:00.000000

Adds orders_enabled, preorders_enabled, tables_count directly to the menus
table so each menu can have independent order settings.

Backfill strategy: copies current restaurant-level settings from
restaurant_telegram_settings into every non-deleted menu of that restaurant,
so live restaurants on prod keep their existing configuration after deploy.
"""

from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE menus
            ADD COLUMN IF NOT EXISTS orders_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS preorders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS tables_count      INTEGER NOT NULL DEFAULT 10
    """)

    # Backfill from restaurant_telegram_settings
    op.execute("""
        UPDATE menus m
        SET orders_enabled    = rts.orders_enabled,
            preorders_enabled = rts.preorders_enabled,
            tables_count      = rts.tables_count
        FROM restaurant_telegram_settings rts
        WHERE m.restaurant_id = rts.restaurant_id
          AND m.deleted_at IS NULL
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE menus
            DROP COLUMN IF EXISTS orders_enabled,
            DROP COLUMN IF EXISTS preorders_enabled,
            DROP COLUMN IF EXISTS tables_count
    """)
