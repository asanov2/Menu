import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core import auth_client
from app.core.config import settings
from app.core.database import engine
from app.core.minio_client import ensure_bucket_exists
from app.core.redis_client import close_redis

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
            logger.info("✅ Migrations applied successfully")
            if result.stdout:
                logger.info(result.stdout)
        else:
            logger.error(f"❌ Migration failed: {result.stderr}")
    except Exception as e:
        logger.error(f"❌ Migration error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await asyncio.sleep(3)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_migrations)
    # fix #9: initialize persistent httpx client (reuses TCP connections)
    await auth_client.init_client()
    # fix #22: bucket check only on startup, not on every upload
    await ensure_bucket_exists()
    yield
    await auth_client.close_client()
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

# fix #19: CORS origin from env, not hardcoded
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "admin"}
