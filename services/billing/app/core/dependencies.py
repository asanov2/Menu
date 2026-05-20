# === FILE: services/billing/app/core/dependencies.py ===
from typing import AsyncGenerator
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_client import auth_client
from app.core.config import settings
from app.core.database import AsyncSessionLocal, AuthAsyncSessionLocal




async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_auth_db() -> AsyncGenerator[AsyncSession, None]:
    async with AuthAsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_restaurant(
    authorization: str | None = Header(default=None),
) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    result = await auth_client.verify_token(token)
    if not result.get("valid"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    result["restaurant_id"] = UUID(result["restaurant_id"])
    return result


async def verify_internal_secret(
    x_internal_secret: str | None = Header(default=None),
) -> None:
    if x_internal_secret != settings.INTERNAL_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
