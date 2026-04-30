# === FILE: services/billing/alembic/versions/002_add_payment_target_plan.py ===
"""add target_plan to payments

Revision ID: 002
Revises: 001
Create Date: 2026-04-30 12:00:00.000000
"""
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE billing.payments
        ADD COLUMN IF NOT EXISTS target_plan billing.plan_enum
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE billing.payments
        DROP COLUMN IF EXISTS target_plan
    """)
