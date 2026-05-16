"""add_restaurant_status_and_contacts

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE restaurant_status AS ENUM ('pending', 'active', 'inactive');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    op.execute("""
        ALTER TABLE restaurants
        ADD COLUMN IF NOT EXISTS status restaurant_status NOT NULL DEFAULT 'active'
    """)

    op.execute("""
        UPDATE restaurants SET status = 'inactive' WHERE is_active = false
    """)

    op.execute("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone VARCHAR(20)")
    op.execute("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city VARCHAR(100)")
    op.execute("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS type VARCHAR(50)")


def downgrade() -> None:
    op.execute("ALTER TABLE restaurants DROP COLUMN IF EXISTS type")
    op.execute("ALTER TABLE restaurants DROP COLUMN IF EXISTS city")
    op.execute("ALTER TABLE restaurants DROP COLUMN IF EXISTS phone")
    op.execute("ALTER TABLE restaurants DROP COLUMN IF EXISTS status")
    op.execute("DROP TYPE IF EXISTS restaurant_status")
