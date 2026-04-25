import asyncio
import json
import logging
from datetime import datetime, timezone

import aio_pika

from app.core.config import settings

logger = logging.getLogger(__name__)

_connection: aio_pika.RobustConnection | None = None
_channel: aio_pika.RobustChannel | None = None


async def _get_channel() -> aio_pika.RobustChannel | None:
    global _connection, _channel
    try:
        if _connection is None or _connection.is_closed:
            _connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        if _channel is None or _channel.is_closed:
            _channel = await _connection.channel()
        return _channel
    except Exception as exc:
        logger.warning("RabbitMQ unavailable: %s", exc)
        return None


async def _publish(event_type: str, restaurant_id: str, **kwargs: object) -> None:
    channel = await _get_channel()
    if not channel:
        return

    try:
        exchange = await channel.declare_exchange(
            "menu_events", aio_pika.ExchangeType.TOPIC, durable=True
        )
        message_body = {
            "event_type": event_type,
            "restaurant_id": restaurant_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **kwargs,
        }
        routing_key = "menu.viewed" if event_type == "menu_view" else "item.viewed"
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(message_body).encode(),
                content_type="application/json",
            ),
            routing_key=routing_key,
        )
    except Exception as exc:
        logger.warning("Failed to publish RabbitMQ event: %s", exc)


def publish_menu_event(event_type: str, restaurant_id: str, **kwargs: object) -> None:
    asyncio.create_task(_publish(event_type, restaurant_id, **kwargs))


async def close_rabbitmq() -> None:
    global _connection, _channel
    if _channel and not _channel.is_closed:
        await _channel.close()
    if _connection and not _connection.is_closed:
        await _connection.close()
