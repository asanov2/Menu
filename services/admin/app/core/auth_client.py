import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# fix #9: singleton client — created once in lifespan, reuses TCP connections
_client: httpx.AsyncClient | None = None


async def init_client() -> None:
    global _client
    _client = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=3.0, read=5.0, write=5.0, pool=5.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    )


async def close_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def verify_token(token: str) -> dict:
    if _client is None:
        # Should not happen if lifespan initializes correctly
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service client not initialized",
        )
    try:
        response = await _client.get(
            f"{settings.auth_service_url}/api/v1/auth/verify-token",
            headers={"Authorization": f"Bearer {token}"},
        )
        # fix #20: 4xx from auth-service → invalid token (401)
        if response.status_code == 200:
            return response.json()
        return {"valid": False}
    except httpx.RequestError as exc:
        # fix #20: network failure → 503, not 401
        logger.error("Auth service unreachable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable",
        )
