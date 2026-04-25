import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import aio_pika
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.core.database import engine
from app.core.rabbitmq import close_rabbitmq
from app.core.redis_client import close_redis

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # fix #23: declare RabbitMQ exchange at startup — not on first request
    try:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        channel = await connection.channel()
        await channel.declare_exchange(
            "menu_events", aio_pika.ExchangeType.TOPIC, durable=True
        )
        await connection.close()
        logger.info("RabbitMQ exchange 'menu_events' declared")
    except Exception as exc:
        logger.warning("Could not pre-declare RabbitMQ exchange: %s", exc)

    yield

    await close_redis()
    await close_rabbitmq()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "menu"}
