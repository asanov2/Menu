from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_owner
from app.schemas.revenue import PaymentList, RevenueMonth
from app.services.revenue_service import RevenueService

router = APIRouter()


@router.get("/revenue", response_model=list[RevenueMonth])
async def get_monthly_revenue(
    year: int = Query(default_factory=lambda: datetime.now(timezone.utc).year),
    owner: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> list[RevenueMonth]:
    return await RevenueService(db).get_monthly_revenue(year)


@router.get("/payments", response_model=PaymentList)
async def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    owner: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> PaymentList:
    return await RevenueService(db).get_payments(page=page, limit=limit)
