import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.api.v1.router import router as api_router
from app.core.auth_client import auth_client
from app.core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


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
            logger.info("Migrations applied successfully")
            if result.stdout:
                logger.info(result.stdout)
        else:
            logger.error("Migration failed: %s", result.stderr)
    except Exception as exc:
        logger.error("Migration error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("notification-service starting up")
    await asyncio.sleep(3)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_migrations)
    yield
    await auth_client.close()
    logger.info("notification-service shut down")


app = FastAPI(
    title="Notification Service",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/api/v1/push")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.APP_NAME}
