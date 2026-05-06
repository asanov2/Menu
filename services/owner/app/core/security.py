from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_owner_token(owner_email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        hours=settings.owner_token_expire_hours
    )
    payload = {
        "sub": owner_email,
        "type": "owner",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_owner_token(token: str) -> str:
    """Returns owner_email if valid, raises ValueError if not."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "owner":
            raise ValueError("Invalid token type")
        email: str = payload.get("sub", "")
        if not email:
            raise ValueError("Missing subject")
        return email
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")
