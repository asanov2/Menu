# === FILE: services/billing/app/api/v1/endpoints/internal.py ===
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db, verify_internal_secret
from app.models.billing import Subscription, SubscriptionStatus
from app.schemas.billing import (
    ActivateTrialRequest,
    ActivateTrialResponse,
    CheckSubscriptionResponse,
)
from app.services.subscription_service import activate_trial

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/internal/activate-trial",
    response_model=ActivateTrialResponse,
    dependencies=[Depends(verify_internal_secret)],
)
async def activate_trial_endpoint(
    body: ActivateTrialRequest,
    db: AsyncSession = Depends(get_db),
) -> ActivateTrialResponse:
    sub = await activate_trial(
        restaurant_id=body.restaurant_id,
        trial_days=settings.TRIAL_DAYS,
        db=db,
    )
    return ActivateTrialResponse(
        subscription_id=sub.id,
        trial_ends_at=sub.trial_ends_at,
    )


@router.get(
    "/internal/check/{restaurant_id}",
    response_model=CheckSubscriptionResponse,
    dependencies=[Depends(verify_internal_secret)],
)
async def check_subscription(
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> CheckSubscriptionResponse:
    from datetime import datetime, timezone

    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    now = datetime.now(timezone.utc)

    # Lazy expiry: trial past due → mark expired
    if (
        sub.status == SubscriptionStatus.trial
        and sub.trial_ends_at is not None
        and sub.trial_ends_at < now
    ):
        sub.status = SubscriptionStatus.expired
        await db.commit()

    is_active = sub.status in (SubscriptionStatus.active, SubscriptionStatus.trial)

    trial_remaining_days: int | None = None
    if sub.status == SubscriptionStatus.trial and sub.trial_ends_at is not None:
        delta = sub.trial_ends_at - now
        trial_remaining_days = max(0, delta.days)

    return CheckSubscriptionResponse(
        active=is_active,
        plan=sub.plan.value,
        status=sub.status.value,
        trial_remaining_days=trial_remaining_days,
        current_period_end=sub.current_period_end,
    )
