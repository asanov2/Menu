"""allergen_table — item_allergens composite-PK table

Revision ID: 004
Revises: 003
Create Date: 2026-05-24 00:00:00.000000
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS item_allergens (
            item_id       UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            allergen_code VARCHAR(30) NOT NULL,
            PRIMARY KEY (item_id, allergen_code)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_item_allergens_item_id ON item_allergens (item_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS item_allergens")
