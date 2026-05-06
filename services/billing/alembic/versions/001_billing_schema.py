# === FILE: services/billing/alembic/versions/001_billing_schema.py ===
"""billing schema

Revision ID: 001
Revises:
Create Date: 2026-04-30 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS billing")

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE billing.plan_enum AS ENUM ('starter', 'business', 'pro');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE billing.subscription_status_enum AS ENUM ('active', 'expired', 'cancelled', 'trial');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE billing.payment_status_enum AS ENUM ('pending', 'success', 'failed', 'refunded');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE billing.payment_provider_enum AS ENUM ('kaspi', 'cloudpayments', 'manual');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    op.execute("""
        CREATE TABLE billing.subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL UNIQUE,
            plan billing.plan_enum NOT NULL DEFAULT 'starter',
            status billing.subscription_status_enum NOT NULL DEFAULT 'trial',
            current_period_start TIMESTAMPTZ NOT NULL,
            current_period_end TIMESTAMPTZ NOT NULL,
            trial_ends_at TIMESTAMPTZ,
            auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE INDEX ix_subscriptions_restaurant_id ON billing.subscriptions (restaurant_id)
    """)

    op.execute("""
        CREATE TABLE billing.payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subscription_id UUID NOT NULL REFERENCES billing.subscriptions(id) ON DELETE RESTRICT,
            restaurant_id UUID NOT NULL,
            amount NUMERIC(10, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
            status billing.payment_status_enum NOT NULL DEFAULT 'pending',
            provider billing.payment_provider_enum NOT NULL,
            provider_transaction_id VARCHAR(255) UNIQUE,
            provider_raw_response JSONB,
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE INDEX ix_payments_restaurant_id ON billing.payments (restaurant_id)
    """)
    op.execute("""
        CREATE INDEX ix_payments_subscription_id ON billing.payments (subscription_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS billing.payments")
    op.execute("DROP TABLE IF EXISTS billing.subscriptions")
    op.execute("DROP TYPE IF EXISTS billing.payment_provider_enum")
    op.execute("DROP TYPE IF EXISTS billing.payment_status_enum")
    op.execute("DROP TYPE IF EXISTS billing.subscription_status_enum")
    op.execute("DROP TYPE IF EXISTS billing.plan_enum")
    op.execute("DROP SCHEMA IF EXISTS billing")
