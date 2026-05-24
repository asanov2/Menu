"""nutrition_columns — add calories/protein/fat/carbs to items

Revision ID: 003
Revises: 002
Create Date: 2026-05-23 00:00:00.000000
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS calories FLOAT")
    op.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS protein  FLOAT")
    op.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS fat      FLOAT")
    op.execute("ALTER TABLE items ADD COLUMN IF NOT EXISTS carbs    FLOAT")


def downgrade() -> None:
    op.execute("ALTER TABLE items DROP COLUMN IF EXISTS calories")
    op.execute("ALTER TABLE items DROP COLUMN IF EXISTS protein")
    op.execute("ALTER TABLE items DROP COLUMN IF EXISTS fat")
    op.execute("ALTER TABLE items DROP COLUMN IF EXISTS carbs")
