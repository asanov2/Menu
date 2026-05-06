"""initial_schema — restaurants table

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
            CREATE TYPE plantype AS ENUM ('starter', 'business', 'pro');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS restaurants (
            id              UUID PRIMARY KEY,
            email           VARCHAR(255) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            name            VARCHAR(255) NOT NULL,
            slug            VARCHAR(100) NOT NULL,
            plan            plantype NOT NULL DEFAULT 'starter',
            is_active       BOOLEAN NOT NULL DEFAULT true,
            is_verified     BOOLEAN NOT NULL DEFAULT false,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_restaurants_email UNIQUE (email),
            CONSTRAINT uq_restaurants_slug  UNIQUE (slug)
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_restaurants_email ON restaurants (email)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_restaurants_slug  ON restaurants (slug)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS restaurants")
    op.execute("DROP TYPE  IF EXISTS plantype")
