"""telegram_settings — per-restaurant Telegram connection & order config

Revision ID: 005
Revises: 004
Create Date: 2026-05-25 00:00:00.000000
"""

from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS restaurant_telegram_settings (
            restaurant_id         UUID PRIMARY KEY,
            telegram_chat_id      BIGINT,
            telegram_connect_code VARCHAR(10) UNIQUE,
            telegram_code_expires_at TIMESTAMP,
            orders_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
            preorders_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
            tables_count          INTEGER NOT NULL DEFAULT 10,
            created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_rts_connect_code "
        "ON restaurant_telegram_settings (telegram_connect_code) "
        "WHERE telegram_connect_code IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS restaurant_telegram_settings")
