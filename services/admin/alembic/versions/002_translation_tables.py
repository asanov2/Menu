"""translation_tables — category_translations, item_translations

Revision ID: 002
Revises: 001
Create Date: 2026-05-23 00:00:00.000000
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS category_translations (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            language    VARCHAR(10) NOT NULL,
            name        VARCHAR(255) NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (category_id, language)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_cat_trans_category_id ON category_translations (category_id)"
    )

    op.execute("""
        CREATE TABLE IF NOT EXISTS item_translations (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            language    VARCHAR(10) NOT NULL,
            name        VARCHAR(255) NOT NULL,
            description TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (item_id, language)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_item_trans_item_id ON item_translations (item_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS item_translations")
    op.execute("DROP TABLE IF EXISTS category_translations")
