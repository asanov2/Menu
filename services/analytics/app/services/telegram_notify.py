"""Daily Telegram summary for Pro-plan restaurants."""
import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import text

from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

KZ_TZ = timezone(timedelta(hours=5))

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


async def _send_telegram(token: str, chat_id: int, text_msg: str) -> None:
    url = _TELEGRAM_API.format(token=token)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url, json={"chat_id": chat_id, "text": text_msg, "parse_mode": "HTML"}
            )
            if resp.status_code != 200:
                logger.error("Telegram API error %s: %s", resp.status_code, resp.text)
    except Exception as exc:
        logger.error("Failed to send Telegram notification: %s", exc)


def _format_summary(restaurant_name: str, date_str: str, total_views: int,
                    top_items: list[dict], peak_hour: int | None) -> str:
    lines = [
        f"<b>📊 Сводка за {date_str} — {restaurant_name}</b>",
        "",
        f"👁 Просмотров меню: {total_views}",
    ]
    if top_items:
        lines.append("")
        lines.append("🍽 Топ блюда:")
        for idx, item in enumerate(top_items[:3], start=1):
            name = item.get("name") or "—"
            views = item.get("views", 0)
            lines.append(f"  {idx}. {name} — {views} просм.")
    if peak_hour is not None:
        lines.append("")
        lines.append(f"⏰ Пиковое время: {peak_hour}:00–{peak_hour + 1}:00")
    lines.append("")
    lines.append("qrmenus.kz")
    return "\n".join(lines)


async def send_daily_summaries(bot_token: str) -> None:
    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not set, skipping daily summaries")
        return

    yesterday = (datetime.now(KZ_TZ) - timedelta(days=1)).date()
    date_str = yesterday.strftime("%d.%m.%Y")

    async with AsyncSessionLocal() as db:
        # Get all Pro restaurants with a connected Telegram chat
        result = await db.execute(
            text("""
                SELECT
                    r.id        AS restaurant_id,
                    r.name      AS restaurant_name,
                    ts.telegram_chat_id
                FROM restaurants r
                JOIN restaurant_telegram_settings ts
                    ON ts.restaurant_id = r.id
                WHERE r.plan = 'pro'
                  AND ts.telegram_chat_id IS NOT NULL
                  AND r.is_active = TRUE
            """)
        )
        restaurants = result.fetchall()

    if not restaurants:
        logger.info("daily_summary: no Pro restaurants with Telegram connected")
        return

    logger.info("daily_summary: sending summaries for %d restaurants", len(restaurants))

    for row in restaurants:
        try:
            await _process_restaurant(
                bot_token=bot_token,
                restaurant_id=str(row.restaurant_id),
                restaurant_name=row.restaurant_name,
                chat_id=row.telegram_chat_id,
                target_date=yesterday,
                date_str=date_str,
            )
        except Exception as exc:
            logger.error("daily_summary: error for %s: %s", row.restaurant_id, exc)


async def _process_restaurant(
    bot_token: str,
    restaurant_id: str,
    restaurant_name: str,
    chat_id: int,
    target_date,
    date_str: str,
) -> None:
    async with AsyncSessionLocal() as db:
        # Total menu views yesterday
        views_result = await db.execute(
            text("""
                SELECT COUNT(*) AS total_views
                FROM analytics.analytics_events
                WHERE restaurant_id = CAST(:rid AS UUID)
                  AND event_type = 'menu_view'
                  AND (occurred_at AT TIME ZONE 'UTC' + INTERVAL '5 hours')::date = :target_date
            """),
            {"rid": restaurant_id, "target_date": target_date},
        )
        total_views = int(views_result.scalar() or 0)

        # Top 3 items with names
        top_result = await db.execute(
            text("""
                SELECT
                    ae.item_id::text,
                    i.name,
                    COUNT(*) AS views
                FROM analytics.analytics_events ae
                LEFT JOIN items i ON i.id = ae.item_id
                WHERE ae.restaurant_id = CAST(:rid AS UUID)
                  AND ae.event_type = 'item_view'
                  AND ae.item_id IS NOT NULL
                  AND (ae.occurred_at AT TIME ZONE 'UTC' + INTERVAL '5 hours')::date = :target_date
                GROUP BY ae.item_id, i.name
                ORDER BY views DESC
                LIMIT 3
            """),
            {"rid": restaurant_id, "target_date": target_date},
        )
        top_items = [
            {"name": r.name, "views": int(r.views)}
            for r in top_result.fetchall()
        ]

        # Peak hour
        peak_result = await db.execute(
            text("""
                SELECT EXTRACT(HOUR FROM (occurred_at AT TIME ZONE 'UTC' + INTERVAL '5 hours'))::int AS hour,
                       COUNT(*) AS cnt
                FROM analytics.analytics_events
                WHERE restaurant_id = CAST(:rid AS UUID)
                  AND (occurred_at AT TIME ZONE 'UTC' + INTERVAL '5 hours')::date = :target_date
                GROUP BY hour
                ORDER BY cnt DESC
                LIMIT 1
            """),
            {"rid": restaurant_id, "target_date": target_date},
        )
        peak_row = peak_result.fetchone()
        peak_hour = int(peak_row.hour) if peak_row else None

    msg = _format_summary(restaurant_name, date_str, total_views, top_items, peak_hour)
    await _send_telegram(bot_token, chat_id, msg)
    logger.info("daily_summary: sent to restaurant=%s chat=%s", restaurant_id, chat_id)
