"""partial_unique_email_slug — exclude soft-deleted from unique constraints

Revision ID: 005
Revises: 004
Create Date: 2026-06-05 00:00:00.000000
"""

from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop full unique constraints
    op.execute("ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS uq_restaurants_email")
    op.execute("ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS uq_restaurants_slug")

    # Partial unique indexes — only enforce uniqueness for non-deleted rows
    op.execute("""
        CREATE UNIQUE INDEX uq_restaurants_email
        ON restaurants(email)
        WHERE deleted_at IS NULL
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_restaurants_slug
        ON restaurants(slug)
        WHERE deleted_at IS NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_restaurants_email")
    op.execute("DROP INDEX IF EXISTS uq_restaurants_slug")
    op.execute("ALTER TABLE restaurants ADD CONSTRAINT uq_restaurants_email UNIQUE (email)")
    op.execute("ALTER TABLE restaurants ADD CONSTRAINT uq_restaurants_slug UNIQUE (slug)")
