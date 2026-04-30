# === FILE: services/billing/app/api/v1/endpoints/subscriptions.py ===
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_restaurant, get_db
from app.models.billing import PlanEnum
from app.schemas.billing import (
    CancelResponse,
    SubscriptionWithPaymentsOut,
    UpgradeRequest,
    UpgradeResponse,
)
from app.services.subscription_service import (
    cancel_subscription,
    get_subscription_with_payments,
    upgrade_subscription,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/subscription", response_model=SubscriptionWithPaymentsOut)
async def get_subscription(
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionWithPaymentsOut:
    restaurant_id: UUID = current["restaurant_id"]
    sub = await get_subscription_with_payments(restaurant_id, db)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return SubscriptionWithPaymentsOut.model_validate(sub)


@router.post("/subscription/upgrade", response_model=UpgradeResponse)
async def upgrade(
    body: UpgradeRequest,
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> UpgradeResponse:
    restaurant_id: UUID = current["restaurant_id"]
    try:
        payment_url, payment_id = await upgrade_subscription(
            restaurant_id=restaurant_id,
            new_plan=PlanEnum(body.plan),
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return UpgradeResponse(payment_url=payment_url, payment_id=payment_id)


@router.post("/subscription/cancel", response_model=CancelResponse)
async def cancel(
    current: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> CancelResponse:
    restaurant_id: UUID = current["restaurant_id"]
    try:
        active_until = await cancel_subscription(restaurant_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return CancelResponse(
        message="Auto-renewal disabled. Your subscription remains active until the end of the current period.",
        active_until=active_until,
    )
