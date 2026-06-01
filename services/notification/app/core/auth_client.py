import logging
from typing import Any

import httpx
from fastapi import HTTPException, status

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
        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            logger.error("auth-service unreachable: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth service unavailable",
            )
        except httpx.HTTPStatusError:
            return {"valid": False}
        except httpx.RequestError as exc:
            logger.error("auth-service request error: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth service unavailable",
            )

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


auth_client = AuthServiceClient()
