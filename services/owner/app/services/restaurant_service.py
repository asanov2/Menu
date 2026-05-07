import logging
from math import ceil
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.restaurants import PlatformStats, RestaurantItem, RestaurantList, RestaurantPatch

logger = logging.getLogger(__name__)


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

        filters = ["1=1"]
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

        base_sql = f"""
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
                COALESCE(s.status, 'active') AS status,
                s.trial_ends_at
            FROM restaurants r
            LEFT JOIN latest_sub s ON s.restaurant_id = r.id
            WHERE {where}
        """

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

        items = [
            RestaurantItem(
                id=row["id"],
                name=row["name"],
                slug=row["slug"],
                email=row["email"],
                plan=row["plan"],
                status=row["status"],
                is_active=row["is_active"],
                created_at=row["created_at"],
                trial_ends_at=row["trial_ends_at"],
            )
            for row in rows
        ]

        return RestaurantList(
            items=items,
            total=total,
            page=page,
            pages=ceil(total / limit) if total else 1,
        )

    async def get_stats(self) -> PlatformStats:
        result = await self._db.execute(
            text("""
                WITH
                  restaurant_stats AS (
                    SELECT
                      COUNT(*)                                          AS total,
                      COUNT(*) FILTER (WHERE is_active = TRUE)         AS active,
                      COUNT(*) FILTER (WHERE plan = 'starter')         AS starter_count,
                      COUNT(*) FILTER (WHERE plan = 'business')        AS business_count,
                      COUNT(*) FILTER (WHERE plan = 'pro')             AS pro_count
                    FROM restaurants
                  ),
                  latest_sub AS (
                    SELECT DISTINCT ON (restaurant_id) *
                    FROM billing.subscriptions
                    ORDER BY restaurant_id, created_at DESC
                  ),
                  sub_stats AS (
                    SELECT
                      COUNT(*) FILTER (WHERE status = 'trial') AS trial_count
                    FROM latest_sub
                  ),
                  mrr AS (
                    SELECT COALESCE(SUM(amount), 0) AS amount
                    FROM billing.payments
                    WHERE status = 'success'
                      AND created_at >= date_trunc('month', now())
                  )
                SELECT
                  rs.total            AS total_restaurants,
                  rs.active           AS active_restaurants,
                  ss.trial_count,
                  m.amount            AS mrr,
                  rs.starter_count,
                  rs.business_count,
                  rs.pro_count
                FROM restaurant_stats rs, sub_stats ss, mrr m
            """)
        )
        row = result.mappings().one()
        return PlatformStats(
            total_restaurants=row["total_restaurants"],
            active_restaurants=row["active_restaurants"],
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
                text("UPDATE restaurants SET is_active = :is_active WHERE id = :id"),
                {"is_active": patch.is_active, "id": restaurant_id},
            )

        if patch.plan is not None:
            await self._db.execute(
                text("UPDATE restaurants SET plan = :plan WHERE id = :id"),
                {"plan": patch.plan, "id": restaurant_id},
            )
            await self._db.execute(
                text("""
                    UPDATE subscriptions
                    SET plan = :plan
                    WHERE id = (
                        SELECT id FROM billing.subscriptions
                        WHERE restaurant_id = :restaurant_id
                        ORDER BY created_at DESC
                        LIMIT 1
                    )
                """),
                {"plan": patch.plan, "restaurant_id": restaurant_id},
            )

        await self._db.commit()

        row_result = await self._db.execute(
            text("""
                WITH latest_sub AS (
                    SELECT DISTINCT ON (restaurant_id)
                        restaurant_id, status, trial_ends_at
                    FROM billing.subscriptions
                    ORDER BY restaurant_id, created_at DESC
                )
                SELECT
                    r.id, r.name, r.slug, r.email, r.plan,
                    r.is_active, r.created_at,
                    COALESCE(s.status, 'active') AS status,
                    s.trial_ends_at
                FROM restaurants r
                LEFT JOIN latest_sub s ON s.restaurant_id = r.id
                WHERE r.id = :id
            """),
            {"id": restaurant_id},
        )
        row = row_result.mappings().one_or_none()
        if row is None:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

        return RestaurantItem(
            id=row["id"],
            name=row["name"],
            slug=row["slug"],
            email=row["email"],
            plan=row["plan"],
            status=row["status"],
            is_active=row["is_active"],
            created_at=row["created_at"],
            trial_ends_at=row["trial_ends_at"],
        )
