import logging
from math import ceil

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.revenue import PaymentList, PaymentRecord, RevenueMonth

logger = logging.getLogger(__name__)


class RevenueService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_monthly_revenue(self, year: int) -> list[RevenueMonth]:
        result = await self._db.execute(
            text("""
                SELECT
                    to_char(
                        (created_at AT TIME ZONE 'UTC' + INTERVAL '5 hours'),
                        'YYYY-MM'
                    )                                  AS month,
                    COALESCE(SUM(amount), 0)::float    AS amount,
                    COUNT(*)::int                      AS count
                FROM billing.payments
                WHERE status = 'success'
                  AND EXTRACT(YEAR FROM (created_at AT TIME ZONE 'UTC' + INTERVAL '5 hours')) = :year
                GROUP BY month
                ORDER BY month
            """),
            {"year": year},
        )
        rows_by_month = {row["month"]: row for row in result.mappings().all()}

        # Fill all 12 months with zeros for missing months
        return [
            RevenueMonth(
                month=f"{year}-{m:02d}",
                amount=rows_by_month.get(f"{year}-{m:02d}", {}).get("amount", 0.0),
                count=rows_by_month.get(f"{year}-{m:02d}", {}).get("count", 0),
            )
            for m in range(1, 13)
        ]

    async def get_payments(self, page: int, limit: int) -> PaymentList:
        offset = (page - 1) * limit

        count_result = await self._db.execute(
            text("SELECT COUNT(*) FROM billing.payments")
        )
        total: int = count_result.scalar_one()

        rows_result = await self._db.execute(
            text("""
                SELECT
                    p.id,
                    p.amount,
                    p.status,
                    p.provider,
                    p.target_plan,
                    p.created_at,
                    r.name AS restaurant_name
                FROM billing.payments p
                JOIN public.restaurants r ON r.id = p.restaurant_id
                ORDER BY p.created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {"limit": limit, "offset": offset},
        )
        rows = rows_result.mappings().all()

        items = [
            PaymentRecord(
                id=row["id"],
                restaurant_name=row["restaurant_name"],
                amount=float(row["amount"]),
                status=row["status"],
                provider=row["provider"],
                target_plan=row["target_plan"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

        return PaymentList(
            items=items,
            total=total,
            page=page,
            pages=ceil(total / limit) if total else 1,
        )
