import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def verify_token(token: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.auth_service_url}/api/v1/auth/verify-token",
                headers={"Authorization": f"Bearer {token}"},
            )
            if response.status_code == 200:
                return response.json()
    except httpx.RequestError as exc:
        logger.error("Auth service request failed: %s", exc)
    return {"valid": False}
