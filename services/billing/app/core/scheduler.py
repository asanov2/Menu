# === FILE: services/billing/app/core/scheduler.py ===
import logging
from datetime import datetime, timezone
from decimal import Decimal

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, AuthAsyncSessionLocal
from app.models.billing import Payment, PaymentProvider, PaymentStatus, PlanEnum, Subscription, SubscriptionStatus
from app.services.auth_sync_service import sync_restaurant_status

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def expire_unpaid_subscriptions() -> None:
    now = datetime.now(timezone.utc)
    total = 0
    failed = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Subscription).where(
                Subscription.current_period_end < now,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trial]),
                Subscription.auto_renew.is_(False),
            )
        )
        subscriptions = result.scalars().all()

    for sub in subscriptions:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Subscription).where(Subscription.id == sub.id)
                )
                s = result.scalar_one()
                s.status = SubscriptionStatus.expired
                async with AuthAsyncSessionLocal() as auth_db:
                    await sync_restaurant_status(
                        restaurant_id=s.restaurant_id,
                        is_active=False,
                        plan="starter",
                        db=auth_db,
                    )
                await db.commit()
            total += 1
        except Exception as exc:
            failed += 1
            logger.error(
                "expire: failed for restaurant=%s: %s",
                sub.restaurant_id,
                exc,
            )

    logger.info(
        "expire_unpaid_subscriptions: expired=%d failed=%d",
        total,
        failed,
    )


async def attempt_auto_renewals() -> None:
    from app.services.payment_service import PLAN_PRICES

    now = datetime.now(timezone.utc)
    total = 0
    failed = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Subscription).where(
                Subscription.current_period_end < now,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trial]),
                Subscription.auto_renew.is_(True),
            )
        )
        subscriptions = result.scalars().all()

    for sub in subscriptions:
        try:
            async with AsyncSessionLocal() as db:
                amount = PLAN_PRICES.get(sub.plan.value, Decimal("3900"))
                payment = Payment(
                    subscription_id=sub.id,
                    restaurant_id=sub.restaurant_id,
                    amount=amount,
                    currency="KZT",
                    status=PaymentStatus.pending,
                    provider=PaymentProvider.manual,
                    target_plan=sub.plan,
                )
                db.add(payment)
                await db.commit()
                total += 1
                logger.info(
                    "auto_renewal: created pending payment restaurant=%s plan=%s amount=%s",
                    sub.restaurant_id,
                    sub.plan.value,
                    amount,
                )
        except Exception as exc:
            failed += 1
            logger.error("auto_renewal: failed for restaurant=%s: %s", sub.restaurant_id, exc)

    logger.info("attempt_auto_renewals: queued=%d failed=%d", total, failed)


def init_scheduler() -> None:
    scheduler.add_job(
        expire_unpaid_subscriptions,
        trigger="cron",
        hour=0,
        minute=5,
        id="expire_unpaid_subscriptions",
        replace_existing=True,
    )
    scheduler.add_job(
        attempt_auto_renewals,
        trigger="cron",
        hour=0,
        minute=10,
        id="attempt_auto_renewals",
        replace_existing=True,
    )
