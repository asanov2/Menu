"""initial_schema — menus, categories, items tables

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""

from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE languagetype AS ENUM ('ru', 'kz', 'en');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS menus (
            id            UUID PRIMARY KEY,
            restaurant_id UUID NOT NULL,
            name          VARCHAR(255) NOT NULL,
            is_default    BOOLEAN NOT NULL DEFAULT false,
            language      languagetype NOT NULL DEFAULT 'ru',
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at    TIMESTAMPTZ
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_menus_restaurant_id ON menus (restaurant_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id            UUID PRIMARY KEY,
            menu_id       UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
            restaurant_id UUID NOT NULL,
            name          VARCHAR(255) NOT NULL,
            description   TEXT,
            sort_order    INTEGER NOT NULL DEFAULT 0,
            is_visible    BOOLEAN NOT NULL DEFAULT true,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at    TIMESTAMPTZ
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_categories_menu_id       ON categories (menu_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_categories_restaurant_id ON categories (restaurant_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id               UUID PRIMARY KEY,
            category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            restaurant_id    UUID NOT NULL,
            name             VARCHAR(255) NOT NULL,
            description      TEXT,
            price            NUMERIC(10,2) NOT NULL,
            image_url        VARCHAR(500),
            is_available     BOOLEAN NOT NULL DEFAULT true,
            sort_order       INTEGER NOT NULL DEFAULT 0,
            preparation_time INTEGER,
            tags             TEXT[],
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at       TIMESTAMPTZ
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_items_category_id   ON items (category_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_items_restaurant_id ON items (restaurant_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS items")
    op.execute("DROP TABLE IF EXISTS categories")
    op.execute("DROP TABLE IF EXISTS menus")
    op.execute("DROP TYPE  IF EXISTS languagetype")
