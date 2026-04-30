# === FILE: services/billing/app/services/auth_sync_service.py ===
import logging
from uuid import UUID

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import Restaurant

logger = logging.getLogger(__name__)


async def sync_restaurant_status(
    restaurant_id: UUID,
    is_active: bool,
    plan: str,
    db: AsyncSession,
) -> None:
    await db.execute(
        update(Restaurant)
        .where(Restaurant.id == restaurant_id)
        .values(is_active=is_active, plan=plan)
    )
    await db.commit()
    logger.info(
        "auth_sync: restaurant=%s is_active=%s plan=%s",
        restaurant_id,
        is_active,
        plan,
    )
