"""telegram_recipients — multiple Telegram recipients per restaurant

Revision ID: 007
Revises: 006
Create Date: 2026-05-31 00:00:00.000000

Adds telegram_recipients table (many per restaurant) to replace the single
telegram_chat_id model. Each recipient has a label (name/role).

Backfill: existing telegram_chat_id values are migrated to telegram_recipients
with label 'Основной' so no restaurant loses its current connection.

Also adds telegram_pending_label column to restaurant_telegram_settings so
the label entered in admin UI is preserved until the code is activated via bot.
"""

from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Store the label entered by admin while the code is pending activation
    op.execute("""
        ALTER TABLE restaurant_telegram_settings
        ADD COLUMN IF NOT EXISTS telegram_pending_label VARCHAR(100)
    """)

    # Create recipients table: one restaurant → many recipients
    op.execute("""
        CREATE TABLE IF NOT EXISTS telegram_recipients (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL,
            chat_id       BIGINT NOT NULL,
            label         VARCHAR(100) NOT NULL DEFAULT 'Основной',
            created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_tr_restaurant
                FOREIGN KEY (restaurant_id)
                REFERENCES restaurant_telegram_settings(restaurant_id)
                ON DELETE CASCADE,
            CONSTRAINT uq_tr_restaurant_chat
                UNIQUE (restaurant_id, chat_id)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_tr_restaurant_id "
        "ON telegram_recipients (restaurant_id)"
    )

    # Backfill: migrate existing single chat_id → first recipient labelled 'Основной'
    op.execute("""
        INSERT INTO telegram_recipients (restaurant_id, chat_id, label)
        SELECT restaurant_id, telegram_chat_id, 'Основной'
        FROM restaurant_telegram_settings
        WHERE telegram_chat_id IS NOT NULL
        ON CONFLICT (restaurant_id, chat_id) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS telegram_recipients")
    op.execute("""
        ALTER TABLE restaurant_telegram_settings
        DROP COLUMN IF EXISTS telegram_pending_label
    """)
