# === FILE: services/billing/app/main.py ===
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.api.v1.router import router as api_router
from app.core.auth_client import auth_client
from app.core.config import settings
from app.core.scheduler import init_scheduler, scheduler

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("billing-service starting up")
    init_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await auth_client.close()
    logger.info("billing-service shut down")


app = FastAPI(
    title="Billing Service",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/api/v1/billing")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.APP_NAME}
