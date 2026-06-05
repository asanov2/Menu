"""add_email_verifications

Revision ID: 004
Revises: 003
Create Date: 2026-06-04 00:00:00.000000
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS email_verifications (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email        VARCHAR(255) NOT NULL,
            code         CHAR(6) NOT NULL,
            pending_data JSONB NOT NULL,
            attempts     INTEGER NOT NULL DEFAULT 0,
            expires_at   TIMESTAMPTZ NOT NULL,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_email_verifications_email
        ON email_verifications(email)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_email_verifications_email")
    op.execute("DROP TABLE IF EXISTS email_verifications")
