# === FILE: services/billing/app/services/auth_sync_service.py ===
import logging
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def sync_restaurant_status(
    restaurant_id: UUID,
    is_active: bool,
    plan: str,
    db: AsyncSession,
) -> None:
    await db.execute(
        text(
            "UPDATE restaurants SET is_active = :is_active, plan = CAST(:plan AS plantype), "
            "updated_at = NOW() WHERE id = :id"
        ),
        {"is_active": is_active, "plan": plan, "id": restaurant_id},
    )
    await db.commit()
    logger.info(
        "auth_sync: restaurant=%s is_active=%s plan=%s",
        restaurant_id,
        is_active,
        plan,
    )
