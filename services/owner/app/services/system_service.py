import asyncio
import logging
import time
from datetime import datetime, timezone

import httpx

from app.schemas.system import ServiceHealth, SystemHealthResponse

logger = logging.getLogger(__name__)

SERVICES = [
    {"name": "auth-service",      "url": "http://auth-service:8002/health"},
    {"name": "menu-service",      "url": "http://menu-service:8001/health"},
    {"name": "admin-service",     "url": "http://admin-service:8003/health"},
    {"name": "billing-service",   "url": "http://billing-service:8005/health"},
    {"name": "analytics-service", "url": "http://analytics-service:8004/health"},
]


async def _check_service(client: httpx.AsyncClient, name: str, url: str) -> ServiceHealth:
    checked_at = datetime.now(timezone.utc)
    start = time.monotonic()
    try:
        response = await client.get(url, timeout=3.0)
        elapsed_ms = (time.monotonic() - start) * 1000
        status = "online" if response.status_code == 200 else "offline"
        return ServiceHealth(name=name, status=status, response_ms=round(elapsed_ms, 2), checked_at=checked_at)
    except Exception as exc:
        logger.warning("Health check failed for %s: %s", name, exc)
        return ServiceHealth(name=name, status="offline", response_ms=None, checked_at=checked_at)


class SystemService:
    async def get_health(self) -> SystemHealthResponse:
        async with httpx.AsyncClient() as client:
            results = await asyncio.gather(
                *[_check_service(client, svc["name"], svc["url"]) for svc in SERVICES]
            )
        services = list(results)
        all_healthy = all(s.status == "online" for s in services)
        return SystemHealthResponse(services=services, all_healthy=all_healthy)
