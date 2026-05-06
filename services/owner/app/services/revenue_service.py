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
                    to_char(created_at, 'YYYY-MM') AS month,
                    SUM(amount)::float             AS amount,
                    COUNT(*)::int                  AS count
                FROM billing.payments
                WHERE status = 'success'
                  AND EXTRACT(YEAR FROM created_at) = :year
                GROUP BY month
                ORDER BY month
            """),
            {"year": year},
        )
        return [
            RevenueMonth(month=row["month"], amount=row["amount"], count=row["count"])
            for row in result.mappings().all()
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
