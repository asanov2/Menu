# === FILE: services/analytics/app/services/aggregate_service.py ===
import json
import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def aggregate_yesterday() -> None:
    """Aggregate last 3 days to catch delayed RabbitMQ events."""
    today = datetime.now(timezone.utc).date()
    async with AsyncSessionLocal() as db:
        for days_back in range(1, 4):
            target_date = today - timedelta(days=days_back)
            await _aggregate_date(db, target_date)


async def backfill_all() -> None:
    """Backfill all dates that have events — fixes historical aggregates."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("""
                SELECT DISTINCT (occurred_at AT TIME ZONE 'UTC')::date AS event_date
                FROM analytics.analytics_events
                ORDER BY event_date
            """)
        )
        dates = [row.event_date for row in result.fetchall()]
        logger.info("backfill_all: found %d distinct dates", len(dates))
        for d in dates:
            await _aggregate_date(db, d)
            logger.info("backfill_all: aggregated %s", d)
        logger.info("backfill_all: done, processed %d dates", len(dates))


async def _aggregate_date(db: AsyncSession, target_date: date) -> None:
    restaurants_result = await db.execute(
        text("""
            SELECT DISTINCT restaurant_id
            FROM analytics.analytics_events
            WHERE (occurred_at AT TIME ZONE 'UTC')::date = :target_date
        """),
        {"target_date": target_date},
    )
    restaurant_ids = [row[0] for row in restaurants_result.fetchall()]

    count = 0
    for rid in restaurant_ids:
        try:
            await _upsert_aggregate(db, rid, target_date)
            count += 1
        except Exception as exc:
            logger.error("aggregate: failed for restaurant=%s date=%s: %s", rid, target_date, exc)

    logger.info("aggregate: processed %d restaurants for date=%s", count, target_date)


async def _upsert_aggregate(db: AsyncSession, restaurant_id: uuid.UUID, target_date: date) -> None:
    totals = await db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (WHERE event_type = 'menu_view') AS menu_views,
                COUNT(*) FILTER (WHERE event_type = 'item_view') AS item_views,
                COUNT(*) FILTER (WHERE device_type = 'mobile') AS mobile,
                COUNT(*) FILTER (WHERE device_type = 'desktop') AS desktop
            FROM analytics.analytics_events
            WHERE restaurant_id = :rid
              AND (occurred_at AT TIME ZONE 'UTC')::date = :target_date
        """),
        {"rid": restaurant_id, "target_date": target_date},
    )
    row = totals.fetchone()
    menu_views = int(row.menu_views or 0)
    item_views = int(row.item_views or 0)
    mobile = int(row.mobile or 0)
    desktop = int(row.desktop or 0)

    peak_result = await db.execute(
        text("""
            SELECT EXTRACT(HOUR FROM (occurred_at AT TIME ZONE 'UTC'))::int AS hour,
                   COUNT(*) AS cnt
            FROM analytics.analytics_events
            WHERE restaurant_id = :rid
              AND (occurred_at AT TIME ZONE 'UTC')::date = :target_date
            GROUP BY hour
            ORDER BY cnt DESC
            LIMIT 1
        """),
        {"rid": restaurant_id, "target_date": target_date},
    )
    peak_row = peak_result.fetchone()
    peak_hour = int(peak_row.hour) if peak_row else None

    top_result = await db.execute(
        text("""
            SELECT item_id::text, COUNT(*) AS views
            FROM analytics.analytics_events
            WHERE restaurant_id = :rid
              AND (occurred_at AT TIME ZONE 'UTC')::date = :target_date
              AND item_id IS NOT NULL
              AND event_type = 'item_view'
            GROUP BY item_id
            ORDER BY views DESC
            LIMIT 10
        """),
        {"rid": restaurant_id, "target_date": target_date},
    )
    top_items = [
        {"item_id": r.item_id, "views": int(r.views), "rank": idx + 1}
        for idx, r in enumerate(top_result.fetchall())
    ]

    await db.execute(
        text("""
            INSERT INTO analytics.daily_aggregates
                (id, restaurant_id, date, total_menu_views, total_item_views,
                 top_items, device_breakdown, peak_hour, created_at, updated_at)
            VALUES
                (gen_random_uuid(), :rid, :target_date, :menu_views, :item_views,
                 CAST(:top_items AS jsonb), CAST(:device_breakdown AS jsonb), :peak_hour, NOW(), NOW())
            ON CONFLICT (restaurant_id, date)
            DO UPDATE SET
                total_menu_views = EXCLUDED.total_menu_views,
                total_item_views = EXCLUDED.total_item_views,
                top_items = EXCLUDED.top_items,
                device_breakdown = EXCLUDED.device_breakdown,
                peak_hour = EXCLUDED.peak_hour,
                updated_at = NOW()
        """),
        {
            "rid": restaurant_id,
            "target_date": target_date,
            "menu_views": menu_views,
            "item_views": item_views,
            "top_items": json.dumps(top_items),
            "device_breakdown": json.dumps({"mobile": mobile, "desktop": desktop}),
            "peak_hour": peak_hour,
        },
    )
    await db.commit()
    logger.debug(
        "aggregate: upserted restaurant=%s date=%s menu=%d item=%d",
        restaurant_id,
        target_date,
        menu_views,
        item_views,
    )
