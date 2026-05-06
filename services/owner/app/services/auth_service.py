import logging

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_owner_token, verify_password

logger = logging.getLogger(__name__)


class OwnerAuthService:
    def __init__(self) -> None:
        pass  # No DB needed — single owner from config

    def login(self, email: str, password: str) -> str:
        """Returns JWT token or raises HTTPException."""
        if email != settings.owner_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not verify_password(password, settings.owner_password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        logger.info("Owner login successful: %s", email)
        return create_owner_token(email)
