# === FILE: services/analytics/app/services/event_service.py ===
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsEvent
from app.schemas.analytics import IncomingEventSchema

logger = logging.getLogger(__name__)


async def save_event(data: IncomingEventSchema, db: AsyncSession) -> None:
    event = AnalyticsEvent(
        restaurant_id=data.restaurant_id,
        item_id=data.item_id,
        event_type=data.event_type,
        device_type=data.device_type,
        occurred_at=data.timestamp,
    )
    db.add(event)
    await db.commit()
    logger.debug(
        "event_service: saved event_type=%s restaurant=%s",
        data.event_type,
        data.restaurant_id,
    )
