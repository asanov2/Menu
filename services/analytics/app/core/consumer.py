# === FILE: services/analytics/app/core/consumer.py ===
import json
import logging

import aio_pika
from aio_pika.abc import AbstractIncomingMessage
from pydantic import ValidationError

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.schemas.analytics import IncomingEventSchema
from app.services.event_service import save_event

logger = logging.getLogger(__name__)


async def process_message(message: AbstractIncomingMessage) -> None:
    try:
        payload = json.loads(message.body)
        validated = IncomingEventSchema(**payload)
        async with AsyncSessionLocal() as db:
            await save_event(validated, db)
        await message.ack()
        logger.debug(
            "consumer: saved event type=%s restaurant=%s",
            validated.event_type,
            validated.restaurant_id,
        )
    except ValidationError as exc:
        logger.error("consumer: invalid message format, dropping: %s", exc)
        await message.nack(requeue=False)
    except Exception as exc:
        logger.error("consumer: db error saving event, requeueing: %s", exc)
        await message.nack(requeue=True)


async def start_consumer(app_state) -> None:
    connection = await aio_pika.connect_robust(
        settings.RABBITMQ_URL,
        reconnect_interval=5,
    )
    app_state.rabbitmq_connection = connection

    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    exchange = await channel.declare_exchange(
        "menu_events",
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )

    await channel.declare_exchange(
        "analytics_dlx",
        aio_pika.ExchangeType.FANOUT,
        durable=True,
    )

    queue = await channel.declare_queue(
        "analytics_queue",
        durable=True,
        arguments={
            "x-dead-letter-exchange": "analytics_dlx",
            "x-message-ttl": 86400000,
        },
    )

    await queue.bind(exchange, routing_key="#")
    await queue.consume(process_message)

    logger.info("consumer: started, listening on analytics_queue")


async def stop_consumer(app_state) -> None:
    conn = getattr(app_state, "rabbitmq_connection", None)
    if conn and not conn.is_closed:
        await conn.close()
        logger.info("consumer: connection closed")
