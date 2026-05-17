# === FILE: services/billing/app/services/subscription_service.py ===
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.billing import (
    Payment,
    PaymentProvider,
    PaymentStatus,
    PlanEnum,
    Subscription,
    SubscriptionStatus,
)
from app.services.payment_service import PLAN_PRICES, create_kaspi_payment

logger = logging.getLogger(__name__)

PLAN_ORDER = [PlanEnum.starter, PlanEnum.business, PlanEnum.pro]


async def get_subscription_with_payments(
    restaurant_id: UUID,
    db: AsyncSession,
) -> Subscription | None:
    result = await db.execute(
        select(Subscription)
        .where(Subscription.restaurant_id == restaurant_id)
        .options(selectinload(Subscription.payments))
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        return None
    sub.payments = sorted(sub.payments, key=lambda p: p.created_at, reverse=True)[:6]

    now = datetime.now(timezone.utc)
    trial_remaining_days = None
    warning_banner = False
    warning_message = None

    if sub.status == SubscriptionStatus.trial:
        if sub.trial_ends_at:
            delta = sub.trial_ends_at - now
            trial_remaining_days = max(0, delta.days)
            if trial_remaining_days <= 5:
                warning_banner = True
                warning_message = (
                    f"Ваш пробный период заканчивается через "
                    f"{trial_remaining_days} дн. "
                    f"({sub.trial_ends_at.strftime('%d.%m.%Y')}). "
                    f"Оформите подписку, чтобы продолжить работу."
                )
    elif sub.status == SubscriptionStatus.expired:
        warning_banner = True
        warning_message = (
            "Ваша подписка истекла. "
            "Оформите подписку для восстановления доступа."
        )

    sub.trial_remaining_days = trial_remaining_days
    sub.warning_banner = warning_banner
    sub.warning_message = warning_message
    return sub


async def upgrade_subscription(
    restaurant_id: UUID,
    new_plan: PlanEnum,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    sub = result.scalar_one_or_none()

    if sub is None:
        raise ValueError("Subscription not found")

    current_index = PLAN_ORDER.index(sub.plan)
    new_index = PLAN_ORDER.index(new_plan)
    if new_index < current_index:
        raise ValueError("Downgrade is not allowed.")

    amount = PLAN_PRICES[new_plan.value]
    payment = Payment(
        subscription_id=sub.id,
        restaurant_id=restaurant_id,
        amount=amount,
        currency="KZT",
        status=PaymentStatus.pending,
        provider=PaymentProvider.kaspi,
        target_plan=new_plan,
    )
    db.add(payment)
    await db.flush()

    payment_url = await create_kaspi_payment(
        amount=amount,
        restaurant_id=restaurant_id,
        order_id=payment.id,
        plan=new_plan.value,
    )

    await db.commit()
    logger.info(
        "upgrade: restaurant=%s from=%s to=%s payment=%s",
        restaurant_id,
        sub.plan.value,
        new_plan.value,
        payment.id,
    )
    return {
        "payment_url": payment_url,
        "payment_id": payment.id,
        "amount": int(amount),
        "plan": new_plan.value,
    }


async def cancel_subscription(
    restaurant_id: UUID,
    db: AsyncSession,
) -> datetime:
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        raise ValueError("Subscription not found")

    sub.auto_renew = False
    await db.commit()
    logger.info("cancel: restaurant=%s active_until=%s", restaurant_id, sub.current_period_end)
    return sub.current_period_end


async def activate_trial(
    restaurant_id: UUID,
    trial_days: int,
    db: AsyncSession,
) -> Subscription:
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=trial_days)

    sub = Subscription(
        restaurant_id=restaurant_id,
        plan=PlanEnum.starter,
        status=SubscriptionStatus.trial,
        current_period_start=now,
        current_period_end=trial_end,
        trial_ends_at=trial_end,
        auto_renew=True,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    logger.info("trial: restaurant=%s trial_ends=%s", restaurant_id, trial_end)
    return sub


async def process_successful_payment(
    provider_transaction_id: str,
    raw_payload: dict,
    restaurant_id: UUID,
    db: AsyncSession,
    auth_db: AsyncSession,
) -> None:
    from app.services.auth_sync_service import sync_restaurant_status

    existing = await db.execute(
        select(Payment).where(Payment.provider_transaction_id == provider_transaction_id)
    )
    if existing.scalar_one_or_none() is not None:
        logger.info("webhook: duplicate transaction_id=%s, skipping", provider_transaction_id)
        return

    result = await db.execute(
        select(Payment)
        .where(
            Payment.restaurant_id == restaurant_id,
            Payment.status == PaymentStatus.pending,
        )
        .order_by(Payment.created_at.desc())
    )
    payment = result.scalars().first()

    sub_result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    sub = sub_result.scalar_one_or_none()

    if payment is None or sub is None:
        logger.error("webhook: no pending payment or subscription for restaurant=%s", restaurant_id)
        return

    now = datetime.now(timezone.utc)
    payment.status = PaymentStatus.success
    payment.provider_transaction_id = provider_transaction_id
    payment.provider_raw_response = raw_payload
    payment.paid_at = now

    if payment.target_plan is not None:
        sub.plan = payment.target_plan

    # Extend from current_period_end if subscription was active and not yet expired
    was_active = sub.status == SubscriptionStatus.active and sub.current_period_end > now
    sub.status = SubscriptionStatus.active
    new_period_start = sub.current_period_end if was_active else now
    sub.current_period_start = new_period_start
    sub.current_period_end = new_period_start + timedelta(days=30)

    await db.commit()

    try:
        await sync_restaurant_status(
            restaurant_id=restaurant_id,
            is_active=True,
            plan=sub.plan.value,
            db=auth_db,
        )
    except Exception as exc:
        logger.critical(
            "CRITICAL: payment success but auth sync FAILED for restaurant=%s. "
            "Manual intervention required. transaction=%s error=%s",
            restaurant_id,
            provider_transaction_id,
            exc,
        )

    logger.info(
        "webhook: payment success restaurant=%s transaction=%s plan=%s",
        restaurant_id,
        provider_transaction_id,
        sub.plan.value,
    )


async def complete_mock_payment(
    restaurant_id: UUID,
    db: AsyncSession,
) -> dict:
    from fastapi import HTTPException, status as http_status

    from app.core.database import AuthAsyncSessionLocal

    result = await db.execute(
        select(Payment)
        .where(
            Payment.restaurant_id == restaurant_id,
            Payment.status == PaymentStatus.pending,
        )
        .order_by(Payment.created_at.desc())
    )
    payment = result.scalars().first()

    if payment is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="No pending payment found",
        )

    mock_transaction_id = f"mock-{payment.id}"

    async with AuthAsyncSessionLocal() as auth_db:
        await process_successful_payment(
            provider_transaction_id=mock_transaction_id,
            raw_payload={"mock": True},
            restaurant_id=restaurant_id,
            db=db,
            auth_db=auth_db,
        )

    sub_result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    sub = sub_result.scalar_one_or_none()

    logger.info("mock_complete: restaurant=%s plan=%s", restaurant_id, sub.plan.value if sub else None)
    return {
        "message": "Платёж успешно обработан",
        "plan": sub.plan.value if sub else None,
        "status": sub.status.value if sub else None,
        "current_period_end": sub.current_period_end.isoformat() if sub else None,
    }
