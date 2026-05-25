# === FILE: services/analytics/app/main.py ===
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.api.v1.router import router as api_router
from app.core.auth_client import auth_client
from app.core.config import settings
from app.core.consumer import start_consumer, stop_consumer
from app.services.aggregate_service import aggregate_yesterday
from app.services.telegram_notify import send_daily_summaries

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


def run_migrations() -> None:
    import subprocess
    import sys
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd="/app",
        )
        if result.returncode == 0:
            logger.info("✅ Migrations applied successfully")
            if result.stdout:
                logger.info(result.stdout)
        else:
            logger.error(f"❌ Migration failed: {result.stderr}")
    except Exception as e:
        logger.error(f"❌ Migration error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("analytics-service starting up")
    await asyncio.sleep(3)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_migrations)

    await start_consumer(app.state)

    scheduler.add_job(
        aggregate_yesterday,
        trigger="cron",
        hour=1,
        minute=0,
        id="aggregate_yesterday",
        replace_existing=True,
    )
    async def _run_daily_summaries() -> None:
        await send_daily_summaries(settings.TELEGRAM_BOT_TOKEN)

    # 09:00 Asia/Almaty = 04:00 UTC
    scheduler.add_job(
        _run_daily_summaries,
        trigger="cron",
        hour=4,
        minute=0,
        id="telegram_daily_summary",
        replace_existing=True,
    )
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)
    await stop_consumer(app.state)
    await auth_client.close()
    logger.info("analytics-service shut down")


app = FastAPI(
    title="Analytics Service",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/api/v1/analytics")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.APP_NAME}
