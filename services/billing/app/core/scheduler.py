# === FILE: services/billing/app/core/scheduler.py ===
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, AuthAsyncSessionLocal
from app.models.billing import Subscription, SubscriptionStatus, Payment, PaymentStatus, PaymentProvider, PlanEnum
from app.services.auth_sync_service import sync_restaurant_status

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def expire_unpaid_subscriptions() -> None:
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Subscription).where(
                Subscription.current_period_end < now,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trial]),
                Subscription.auto_renew.is_(False),
            )
        )
        subscriptions = result.scalars().all()

        count = 0
        for sub in subscriptions:
            sub.status = SubscriptionStatus.expired
            async with AuthAsyncSessionLocal() as auth_db:
                await sync_restaurant_status(
                    restaurant_id=sub.restaurant_id,
                    is_active=False,
                    plan="starter",
                    db=auth_db,
                )
            count += 1

        if count:
            await db.commit()

    logger.info("expire_unpaid_subscriptions: expired %d subscriptions", count)


async def attempt_auto_renewals() -> None:
    from decimal import Decimal
    from app.services.payment_service import PLAN_PRICES

    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Subscription).where(
                Subscription.current_period_end < now,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trial]),
                Subscription.auto_renew.is_(True),
            )
        )
        subscriptions = result.scalars().all()

        count = 0
        for sub in subscriptions:
            amount = PLAN_PRICES.get(sub.plan.value, Decimal("3900"))
            payment = Payment(
                subscription_id=sub.id,
                restaurant_id=sub.restaurant_id,
                amount=amount,
                currency="KZT",
                status=PaymentStatus.pending,
                provider=PaymentProvider.manual,
            )
            db.add(payment)
            count += 1
            logger.info(
                "auto_renewal: created pending payment for restaurant=%s plan=%s amount=%s",
                sub.restaurant_id,
                sub.plan.value,
                amount,
            )

        if count:
            await db.commit()

    logger.info("attempt_auto_renewals: queued %d renewal payments", count)


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
