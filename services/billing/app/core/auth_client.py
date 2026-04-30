# === FILE: services/billing/app/core/auth_client.py ===
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class AuthServiceClient:
    _client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=settings.AUTH_SERVICE_URL,
                timeout=httpx.Timeout(10.0),
                headers={"X-Internal-Secret": settings.INTERNAL_SECRET},
            )
        return self._client

    async def verify_token(self, token: str) -> dict[str, Any]:
        client = await self._get_client()
        try:
            response = await client.get(
                "/api/v1/auth/verify-token",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            logger.error("auth-service verify-token failed: %s", exc)
            return {"valid": False}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


auth_client = AuthServiceClient()
