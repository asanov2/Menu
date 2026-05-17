# === FILE: services/analytics/app/api/v1/endpoints/analytics.py ===
import logging
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import PLAN_HISTORY_DAYS, PLAN_UPGRADE_MAP, settings
from app.core.dependencies import get_current_restaurant, get_db
from app.schemas.analytics import CategoryTopItemsSchema, DailyResponse, OverviewResponse, PeakHourRow, TopItemSchema

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_DAYS_HARD = 90
MAX_LIMIT = 20


async def _enrich_names(
    items: list[TopItemSchema],
    restaurant_id: UUID,
    db: AsyncSession,
) -> None:
    if not items:
        return
    ids = [str(item.item_id) for item in items]
    result = await db.execute(
        text("""
            SELECT i.id::text, i.name, i.image_url,
                   i.category_id::text, c.name AS category_name
            FROM items i
            LEFT JOIN categories c ON c.id = i.category_id AND c.deleted_at IS NULL
            WHERE i.id::text = ANY(:ids)
              AND i.restaurant_id = :rid
              AND i.deleted_at IS NULL
        """),
        {"ids": ids, "rid": restaurant_id},
    )
    info_map = {row.id: row for row in result.fetchall()}
    for item in items:
        row = info_map.get(str(item.item_id))
        if row:
            item.name = row.name
            item.image_url = row.image_url
            item.category_id = UUID(row.category_id) if row.category_id else None
            item.category_name = row.category_name


def _enforce_plan(plan: str, requested_days: int) -> None:
    allowed = PLAN_HISTORY_DAYS.get(plan, 7)
    if requested_days > allowed:
        required = PLAN_UPGRADE_MAP.get(plan, "pro")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PLAN_LIMIT_REACHED",
                "message": (
                    f"Аналитика за {requested_days} дней недоступна на вашем тарифе. "
                    f"Перейдите на тариф выше."
                ),
                "current_plan": plan,
                "required_plan": required,
                "upgrade_to": required,
                "upgrade_url": "/billing",
            },
        )


@router.get("/overview", response_model=OverviewResponse)
async def overview(
    days: int = Query(default=7, ge=1, le=MAX_DAYS_HARD),
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> OverviewResponse:
    plan: str = current.get("plan", "starter")
    restaurant_id: UUID = current["restaurant_id"]
    _enforce_plan(plan, days)

    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)

    rows_result = await db.execute(
        text("""
            SELECT
                total_menu_views,
                total_item_views,
                (device_breakdown->>'mobile')::int AS mobile,
                (device_breakdown->>'desktop')::int AS desktop,
                top_items,
                peak_hour
            FROM analytics.daily_aggregates
            WHERE restaurant_id = :rid
              AND date BETWEEN :start_date AND :end_date
        """),
        {"rid": restaurant_id, "start_date": start_date, "end_date": end_date},
    )
    rows = rows_result.fetchall()

    total_menu = sum(r.total_menu_views or 0 for r in rows)
    total_item = sum(r.total_item_views or 0 for r in rows)
    mobile = sum(r.mobile or 0 for r in rows)
    desktop = sum(r.desktop or 0 for r in rows)

    item_views_merged: dict[str, int] = {}
    for r in rows:
        for entry in (r.top_items or []):
            iid = str(entry.get("item_id", ""))
            item_views_merged[iid] = item_views_merged.get(iid, 0) + int(entry.get("views", 0))

    top_items_sorted = sorted(item_views_merged.items(), key=lambda x: x[1], reverse=True)[:10]
    top_items = [
        TopItemSchema(item_id=UUID(iid), views=v, rank=idx + 1)
        for idx, (iid, v) in enumerate(top_items_sorted)
    ]

    await _enrich_names(top_items, restaurant_id, db)

    peak_counter: Counter = Counter(r.peak_hour for r in rows if r.peak_hour is not None)
    most_common_peak = peak_counter.most_common(1)[0][0] if peak_counter else None

    return OverviewResponse(
        period_days=days,
        total_menu_views=total_menu,
        total_item_views=total_item,
        device_breakdown={"mobile": mobile, "desktop": desktop},
        top_items=top_items,
        most_common_peak_hour=most_common_peak,
    )


@router.get("/daily", response_model=list[DailyResponse])
async def daily(
    start: date = Query(...),
    end: date = Query(...),
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[DailyResponse]:
    plan: str = current.get("plan", "starter")
    restaurant_id: UUID = current["restaurant_id"]

    if end < start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end must be >= start")

    days = (end - start).days + 1
    if days > MAX_DAYS_HARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Range cannot exceed {MAX_DAYS_HARD} days",
        )

    _enforce_plan(plan, days)

    result = await db.execute(
        text("""
            SELECT date, total_menu_views, total_item_views, peak_hour
            FROM analytics.daily_aggregates
            WHERE restaurant_id = :rid
              AND date BETWEEN :start_date AND :end_date
            ORDER BY date ASC
        """),
        {"rid": restaurant_id, "start_date": start, "end_date": end},
    )
    rows = result.fetchall()
    return [
        DailyResponse(
            date=r.date,
            menu_views=r.total_menu_views,
            item_views=r.total_item_views,
            peak_hour=r.peak_hour,
        )
        for r in rows
    ]


@router.get("/items/top", response_model=list[TopItemSchema])
async def top_items(
    limit: int = Query(default=10, ge=1, le=MAX_LIMIT),
    days: int = Query(default=7, ge=1, le=MAX_DAYS_HARD),
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[TopItemSchema]:
    plan: str = current.get("plan", "starter")
    restaurant_id: UUID = current["restaurant_id"]
    _enforce_plan(plan, days)

    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)

    result = await db.execute(
        text("""
            SELECT top_items
            FROM analytics.daily_aggregates
            WHERE restaurant_id = :rid
              AND date BETWEEN :start_date AND :end_date
        """),
        {"rid": restaurant_id, "start_date": start_date, "end_date": end_date},
    )
    rows = result.fetchall()

    merged: dict[str, int] = {}
    for r in rows:
        for entry in (r.top_items or []):
            iid = str(entry.get("item_id", ""))
            merged[iid] = merged.get(iid, 0) + int(entry.get("views", 0))

    sorted_items = sorted(merged.items(), key=lambda x: x[1], reverse=True)[:limit]
    result_list = [
        TopItemSchema(item_id=UUID(iid), views=v, rank=idx + 1)
        for idx, (iid, v) in enumerate(sorted_items)
    ]
    await _enrich_names(result_list, restaurant_id, db)
    return result_list


@router.get("/peak-hours", response_model=list[PeakHourRow])
async def peak_hours(
    days: int = Query(default=7, ge=1, le=MAX_DAYS_HARD),
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[PeakHourRow]:
    plan: str = current.get("plan", "starter")
    restaurant_id: UUID = current["restaurant_id"]
    _enforce_plan(plan, days)

    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        text("""
            SELECT EXTRACT(HOUR FROM occurred_at)::int AS hour, COUNT(*) AS views
            FROM analytics.analytics_events
            WHERE restaurant_id = :rid
              AND occurred_at >= :since
            GROUP BY hour
            ORDER BY hour ASC
        """),
        {"rid": restaurant_id, "since": since},
    )
    rows = result.fetchall()

    hours_map = {r.hour: int(r.views) for r in rows}
    return [PeakHourRow(hour=h, views=hours_map.get(h, 0)) for h in range(24)]


@router.get("/items/top-by-category", response_model=list[CategoryTopItemsSchema])
async def top_items_by_category(
    days: int = Query(default=7, ge=1, le=MAX_DAYS_HARD),
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryTopItemsSchema]:
    plan: str = current.get("plan", "starter")
    restaurant_id: UUID = current["restaurant_id"]
    _enforce_plan(plan, days)

    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        text("""
            WITH ranked AS (
                SELECT
                    ae.item_id,
                    COUNT(*) AS views,
                    ROW_NUMBER() OVER (
                        PARTITION BY i.category_id
                        ORDER BY COUNT(*) DESC
                    ) AS cat_rank,
                    i.name AS item_name,
                    i.image_url,
                    i.category_id,
                    c.name AS category_name
                FROM analytics.analytics_events ae
                JOIN items i ON i.id = ae.item_id
                    AND i.deleted_at IS NULL
                    AND i.restaurant_id = :rid
                LEFT JOIN categories c ON c.id = i.category_id
                    AND c.deleted_at IS NULL
                WHERE ae.restaurant_id = :rid
                  AND ae.occurred_at >= :since
                  AND ae.event_type = 'item_view'
                  AND ae.item_id IS NOT NULL
                GROUP BY ae.item_id, i.name, i.image_url, i.category_id, c.name
            )
            SELECT item_id, views, cat_rank, item_name, image_url,
                   category_id, category_name
            FROM ranked
            WHERE cat_rank <= 5
            ORDER BY category_name NULLS LAST, cat_rank
        """),
        {"rid": restaurant_id, "since": since},
    )
    rows = result.fetchall()

    groups: dict[str, dict] = {}
    for row in rows:
        cat_key = str(row.category_id) if row.category_id else "__none__"
        if cat_key not in groups:
            groups[cat_key] = {
                "category_id": row.category_id,
                "category_name": row.category_name,
                "total_views": 0,
                "items": [],
            }
        groups[cat_key]["total_views"] += int(row.views)
        groups[cat_key]["items"].append(
            TopItemSchema(
                item_id=row.item_id,
                views=int(row.views),
                rank=int(row.cat_rank),
                name=row.item_name,
                image_url=row.image_url,
                category_id=row.category_id,
                category_name=row.category_name,
            )
        )

    return sorted(
        [
            CategoryTopItemsSchema(
                category_id=g["category_id"],
                category_name=g["category_name"],
                total_views=g["total_views"],
                items=g["items"],
            )
            for g in groups.values()
        ],
        key=lambda c: c.total_views,
        reverse=True,
    )


@router.post("/internal/backfill", include_in_schema=False)
async def trigger_backfill(
    x_internal_secret: str = Header(alias="X-Internal-Secret"),
) -> dict:
    if x_internal_secret != settings.INTERNAL_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    from app.services.aggregate_service import backfill_all
    await backfill_all()
    return {"status": "ok"}
