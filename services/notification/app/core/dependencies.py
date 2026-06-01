import logging
from typing import AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_client import auth_client
from app.core.config import settings
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def verify_internal_secret(
    x_internal_secret: str | None = Header(default=None),
) -> None:
    if x_internal_secret != settings.INTERNAL_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


async def get_current_subject(
    authorization: str | None = Header(default=None),
) -> dict:
    """
    Returns {"subject_type": "restaurant"|"owner", "subject_id": str}.

    Owner tokens (type="owner") are verified locally with JWT_SECRET_KEY.
    Restaurant tokens (type="access") are verified via auth-service which
    also checks DB state (is_active, plan, etc.).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        token_type = payload.get("type")

        if token_type == "owner":
            return {"subject_type": "owner", "subject_id": "1"}

        if token_type == "access":
            result = await auth_client.verify_token(token)
            if not result.get("valid"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                )
            return {
                "subject_type": "restaurant",
                "subject_id": str(result["restaurant_id"]),
            }

    except JWTError:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )
