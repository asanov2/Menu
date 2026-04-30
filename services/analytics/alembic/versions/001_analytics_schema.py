# === FILE: services/analytics/alembic/versions/001_analytics_schema.py ===
"""analytics schema

Revision ID: 001
Revises:
Create Date: 2026-04-30 00:00:00.000000
"""
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS analytics")

    op.execute("""
        CREATE TYPE analytics.event_type_enum AS ENUM ('menu_view', 'item_view')
    """)

    op.execute("""
        CREATE TABLE analytics.analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL,
            item_id UUID,
            event_type analytics.event_type_enum NOT NULL,
            device_type VARCHAR(20) NOT NULL,
            occurred_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("CREATE INDEX ix_events_restaurant_id ON analytics.analytics_events (restaurant_id)")
    op.execute("CREATE INDEX ix_events_item_id ON analytics.analytics_events (item_id)")
    op.execute("CREATE INDEX ix_events_occurred_at ON analytics.analytics_events (occurred_at)")
    op.execute("CREATE INDEX ix_events_restaurant_occurred ON analytics.analytics_events (restaurant_id, occurred_at)")

    op.execute("""
        CREATE TABLE analytics.daily_aggregates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL,
            date DATE NOT NULL,
            total_menu_views INTEGER NOT NULL DEFAULT 0,
            total_item_views INTEGER NOT NULL DEFAULT 0,
            top_items JSONB NOT NULL DEFAULT '[]',
            device_breakdown JSONB NOT NULL DEFAULT '{}',
            peak_hour INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_restaurant_date UNIQUE (restaurant_id, date)
        )
    """)

    op.execute("CREATE INDEX ix_aggregates_restaurant_id ON analytics.daily_aggregates (restaurant_id)")
    op.execute("CREATE INDEX ix_aggregates_date ON analytics.daily_aggregates (date)")
    op.execute("CREATE INDEX ix_aggregates_restaurant_date ON analytics.daily_aggregates (restaurant_id, date)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS analytics.daily_aggregates")
    op.execute("DROP TABLE IF EXISTS analytics.analytics_events")
    op.execute("DROP TYPE IF EXISTS analytics.event_type_enum")
    op.execute("DROP SCHEMA IF EXISTS analytics")
