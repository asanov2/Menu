import logging
from math import ceil
from uuid import UUID

import httpx
from fastapi import HTTPException, status as http_status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.schemas.restaurants import (
    ApplicationItem,
    ApplicationsResponse,
    PlatformStats,
    RestaurantItem,
    RestaurantList,
    RestaurantPatch,
)

logger = logging.getLogger(__name__)

_PLAN_PRICES = {"starter": 3900, "business": 9900, "pro": 24900}
_VALID_PLANS = {"starter", "business", "pro"}

_RESTAURANT_SELECT = """
    WITH latest_sub AS (
        SELECT DISTINCT ON (restaurant_id)
            restaurant_id, plan, status, trial_ends_at, created_at
        FROM billing.subscriptions
        ORDER BY restaurant_id, created_at DESC
    )
    SELECT
        r.id,
        r.name,
        r.slug,
        r.email,
        r.plan,
        r.is_active,
        r.created_at,
        r.status              AS registration_status,
        COALESCE(s.status, 'active') AS status,
        s.trial_ends_at
    FROM restaurants r
    LEFT JOIN latest_sub s ON s.restaurant_id = r.id
"""


def _row_to_item(row: dict) -> RestaurantItem:
    return RestaurantItem(
        id=row["id"],
        name=row["name"],
        slug=row["slug"],
        email=row["email"],
        plan=row["plan"],
        status=row["status"],
        registration_status=row["registration_status"],
        is_active=row["is_active"],
        created_at=row["created_at"],
        trial_ends_at=row["trial_ends_at"],
    )


class RestaurantService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_list(
        self,
        page: int,
        limit: int,
        search: str,
        plan: str,
        status: str,
    ) -> RestaurantList:
        offset = (page - 1) * limit

        filters = ["r.deleted_at IS NULL"]
        params: dict = {"limit": limit, "offset": offset}

        if search:
            filters.append("(r.name ILIKE :search OR r.email ILIKE :search)")
            params["search"] = f"%{search}%"
        if plan:
            filters.append("r.plan = :plan")
            params["plan"] = plan
        if status:
            filters.append("s.status = :status")
            params["status"] = status

        where = " AND ".join(filters)
        base_sql = f"{_RESTAURANT_SELECT} WHERE {where}"

        count_result = await self._db.execute(
            text(f"SELECT COUNT(*) FROM ({base_sql}) AS sub"),
            params,
        )
        total: int = count_result.scalar_one()

        rows_result = await self._db.execute(
            text(f"{base_sql} ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset"),
            params,
        )
        rows = rows_result.mappings().all()

        return RestaurantList(
            items=[_row_to_item(row) for row in rows],
            total=total,
            page=page,
            pages=ceil(total / limit) if total else 1,
        )

    async def get_stats(self) -> PlatformStats:
        result = await self._db.execute(
            text("""
                WITH
                  latest_sub AS (
                    SELECT DISTINCT ON (restaurant_id)
                        restaurant_id, plan, status, trial_ends_at, current_period_end, created_at
                    FROM billing.subscriptions
                    ORDER BY restaurant_id, created_at DESC
                  ),
                  restaurant_stats AS (
                    SELECT
                      COUNT(*)                                             AS total,
                      COUNT(*) FILTER (WHERE is_active = FALSE)           AS inactive_count,
                      COUNT(*) FILTER (WHERE plan = 'starter')            AS starter_count,
                      COUNT(*) FILTER (WHERE plan = 'business')           AS business_count,
                      COUNT(*) FILTER (WHERE plan = 'pro')                AS pro_count
                    FROM restaurants
                  ),
                  sub_stats AS (
                    SELECT
                      COUNT(*) FILTER (WHERE status = 'active'
                        AND current_period_end > NOW())                   AS paying_count,
                      COUNT(*) FILTER (WHERE status = 'trial'
                        AND trial_ends_at > NOW())                        AS trial_count
                    FROM latest_sub
                  ),
                  mrr AS (
                    SELECT COALESCE(SUM(
                      CASE plan
                        WHEN 'starter'  THEN 3900
                        WHEN 'business' THEN 9900
                        WHEN 'pro'      THEN 24900
                        ELSE 0
                      END
                    ), 0) AS amount
                    FROM latest_sub
                    WHERE status = 'active'
                      AND current_period_end > NOW()
                  )
                SELECT
                  rs.total            AS total_restaurants,
                  ss.paying_count,
                  ss.trial_count,
                  m.amount            AS mrr,
                  rs.starter_count,
                  rs.business_count,
                  rs.pro_count,
                  rs.inactive_count
                FROM restaurant_stats rs, sub_stats ss, mrr m
            """)
        )
        row = result.mappings().one()
        return PlatformStats(
            total_restaurants=row["total_restaurants"],
            paying_count=row["paying_count"],
            inactive_count=row["inactive_count"],
            trial_count=row["trial_count"],
            mrr=float(row["mrr"]),
            starter_count=row["starter_count"],
            business_count=row["business_count"],
            pro_count=row["pro_count"],
        )

    async def update_restaurant(
        self,
        restaurant_id: UUID,
        patch: RestaurantPatch,
    ) -> RestaurantItem:
        if patch.is_active is not None:
            await self._db.execute(
                text("UPDATE restaurants SET is_active = :is_active, updated_at = NOW() WHERE id = :id"),
                {"is_active": patch.is_active, "id": restaurant_id},
            )

        if patch.plan is not None:
            if patch.plan not in _VALID_PLANS:
                raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid plan")

            await self._db.execute(
                text("UPDATE restaurants SET plan = :plan, updated_at = NOW() WHERE id = :id"),
                {"plan": patch.plan, "id": restaurant_id},
            )

            # UPSERT subscription — create if missing, update plan+period if exists
            await self._db.execute(
                text("""
                    INSERT INTO billing.subscriptions
                      (restaurant_id, plan, status, current_period_start,
                       current_period_end, auto_renew)
                    VALUES
                      (:rid, :plan, 'active',
                       NOW(), NOW() + INTERVAL '30 days', true)
                    ON CONFLICT (restaurant_id) DO UPDATE SET
                      plan                 = EXCLUDED.plan,
                      status               = 'active',
                      current_period_start = NOW(),
                      current_period_end   = NOW() + INTERVAL '30 days',
                      updated_at           = NOW()
                """),
                {"rid": restaurant_id, "plan": patch.plan},
            )

            # Audit payment record — manual admin action
            await self._db.execute(
                text("""
                    INSERT INTO billing.payments
                      (subscription_id, restaurant_id, amount, currency,
                       status, provider, paid_at, target_plan)
                    SELECT s.id, :rid, :amount, 'KZT',
                           'success', 'manual', NOW(), :plan
                    FROM billing.subscriptions s
                    WHERE s.restaurant_id = :rid
                """),
                {
                    "rid": restaurant_id,
                    "amount": _PLAN_PRICES.get(patch.plan, 0),
                    "plan": patch.plan,
                },
            )
            logger.info(
                "plan_change: restaurant=%s new_plan=%s amount=%s (manual admin)",
                restaurant_id, patch.plan, _PLAN_PRICES.get(patch.plan, 0),
            )

        if patch.status is not None:
            is_active_val = patch.status == "active"
            await self._db.execute(
                text("""
                    UPDATE restaurants
                    SET status = :status, is_active = :is_active, updated_at = NOW()
                    WHERE id = :id
                """),
                {"status": patch.status, "is_active": is_active_val, "id": restaurant_id},
            )

        await self._db.commit()
        return await self._fetch_one(restaurant_id)

    async def get_applications(self, page: int, limit: int) -> ApplicationsResponse:
        offset = (page - 1) * limit

        count_result = await self._db.execute(
            text("SELECT COUNT(*) FROM restaurants WHERE status = 'pending'")
        )
        total: int = count_result.scalar_one()

        rows_result = await self._db.execute(
            text("""
                SELECT id, name, slug, email, phone, city, type, created_at
                FROM restaurants
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT :limit OFFSET :offset
            """),
            {"limit": limit, "offset": offset},
        )
        rows = rows_result.mappings().all()

        items = [
            ApplicationItem(
                id=row["id"],
                name=row["name"],
                slug=row["slug"],
                email=row["email"],
                phone=row["phone"],
                city=row["city"],
                type=row["type"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

        return ApplicationsResponse(
            items=items,
            total=total,
            page=page,
            pages=ceil(total / limit) if total else 1,
        )

    async def approve_restaurant(self, restaurant_id: UUID) -> RestaurantItem:
        result = await self._db.execute(
            text("""
                UPDATE restaurants
                SET status = 'active', is_active = true, updated_at = NOW()
                WHERE id = :id AND status = 'pending'
            """),
            {"id": restaurant_id},
        )
        if result.rowcount == 0:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Application not found or already processed",
            )
        await self._db.commit()

        # Activate trial subscription in billing service (fire-and-forget — don't fail approval)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.billing_service_url}/api/v1/billing/internal/activate-trial",
                    json={"restaurant_id": str(restaurant_id)},
                    headers={"X-Internal-Secret": settings.internal_secret},
                )
                if resp.status_code not in (200, 201):
                    logger.error(
                        "approve: billing trial activation failed restaurant=%s status=%d body=%s",
                        restaurant_id, resp.status_code, resp.text,
                    )
                else:
                    logger.info("approve: trial activated for restaurant=%s", restaurant_id)
        except Exception as exc:
            logger.error(
                "approve: billing service unreachable for restaurant=%s error=%s",
                restaurant_id, exc,
            )

        return await self._fetch_one(restaurant_id)

    async def reject_restaurant(self, restaurant_id: UUID) -> RestaurantItem:
        result = await self._db.execute(
            text("""
                UPDATE restaurants
                SET status = 'inactive', is_active = false, updated_at = NOW()
                WHERE id = :id AND status = 'pending'
            """),
            {"id": restaurant_id},
        )
        if result.rowcount == 0:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Application not found or already processed",
            )
        await self._db.commit()
        return await self._fetch_one(restaurant_id)

    async def delete_restaurant(self, restaurant_id: UUID) -> None:
        result = await self._db.execute(
            text("""
                UPDATE restaurants
                SET deleted_at = NOW(), is_active = false, status = 'inactive', updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL
            """),
            {"id": restaurant_id},
        )
        if result.rowcount == 0:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found",
            )
        await self._db.execute(
            text("""
                UPDATE billing.subscriptions
                SET status = 'cancelled', updated_at = NOW()
                WHERE restaurant_id = :id AND status IN ('active', 'trial')
            """),
            {"id": restaurant_id},
        )
        await self._db.commit()

    async def _fetch_one(self, restaurant_id: UUID) -> RestaurantItem:
        row_result = await self._db.execute(
            text(f"{_RESTAURANT_SELECT} WHERE r.id = :id AND r.deleted_at IS NULL"),
            {"id": restaurant_id},
        )
        row = row_result.mappings().one_or_none()
        if row is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found",
            )
        return _row_to_item(row)
