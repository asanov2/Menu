"""push subscriptions

Revision ID: 0001
Revises:
Create Date: 2026-06-01 00:00:00.000000
"""
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE push_subscriptions (
            id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            subject_type VARCHAR(20)  NOT NULL,
            subject_id   VARCHAR(100) NOT NULL,
            endpoint     TEXT         NOT NULL,
            p256dh       TEXT         NOT NULL,
            auth_key     TEXT         NOT NULL,
            device_label VARCHAR(100),
            created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
            CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
        )
    """)
    op.execute("""
        CREATE INDEX ix_push_subscriptions_subject
        ON push_subscriptions (subject_type, subject_id)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_push_subscriptions_subject")
    op.execute("DROP TABLE IF EXISTS push_subscriptions")
