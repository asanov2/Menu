import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.email_verification import EmailVerification
from app.models.restaurant import Restaurant, RestaurantStatus
from app.schemas.auth import RegisterRequest, RegisterVerifyRequest
from app.services.email_service import send_verification_email

_RATE_PREFIX = "email_verify_rate:"
_RATE_MAX = 5
_RATE_WINDOW = 300  # 5 min
_CODE_TTL_MIN = 10
_MAX_ATTEMPTS = 5


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, restaurant_id: UUID) -> Restaurant | None:
        result = await self._db.execute(
            select(Restaurant).where(Restaurant.id == restaurant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Restaurant | None:
        result = await self._db.execute(
            select(Restaurant).where(
                Restaurant.email == email,
                Restaurant.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Restaurant | None:
        result = await self._db.execute(
            select(Restaurant).where(
                Restaurant.slug == slug,
                Restaurant.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def authenticate(self, email: str, password: str) -> Restaurant:
        restaurant = await self.get_by_email(email)
        if not restaurant or not verify_password(password, restaurant.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if restaurant.status == RestaurantStatus.inactive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Аккаунт деактивирован. Обратитесь к администратору.",
            )
        return restaurant

    def create_tokens(self, restaurant: Restaurant) -> tuple[str, str]:
        access_token = create_access_token(
            subject=str(restaurant.id),
            extra={"plan": restaurant.plan.value, "slug": restaurant.slug},
        )
        refresh_token = create_refresh_token(subject=str(restaurant.id))
        return access_token, refresh_token

    async def refresh_access_token(self, refresh_token: str) -> str:
        try:
            payload = decode_token(refresh_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        restaurant_id = payload.get("sub")
        if not restaurant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        restaurant = await self.get_by_id(UUID(restaurant_id))
        if not restaurant or not restaurant.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Restaurant not found or inactive",
            )

        return create_access_token(
            subject=str(restaurant.id),
            extra={"plan": restaurant.plan.value, "slug": restaurant.slug},
        )

    async def update_profile(self, restaurant_id: UUID, name: str | None, email: str | None) -> "Restaurant":
        restaurant = await self.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        if name is not None:
            restaurant.name = name
        if email is not None:
            restaurant.email = email
        try:
            await self._db.commit()
        except IntegrityError:
            await self._db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        await self._db.refresh(restaurant)
        return restaurant

    async def change_password(self, restaurant_id: UUID, old_password: str, new_password: str) -> None:
        restaurant = await self.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        if not verify_password(old_password, restaurant.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        restaurant.hashed_password = hash_password(new_password)
        await self._db.commit()

    async def register_request(
        self, data: RegisterRequest, redis_client: aioredis.Redis
    ) -> None:
        # Check email not taken
        if await self.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        # Check slug not taken
        if await self.get_by_slug(data.slug):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slug already taken",
            )
        # Rate limit: max 3 sends per email per 5 min
        rate_key = f"{_RATE_PREFIX}{data.email}"
        count = await redis_client.incr(rate_key)
        if count == 1:
            await redis_client.expire(rate_key, _RATE_WINDOW)
        if count > _RATE_MAX:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Слишком много попыток. Подождите 5 минут.",
            )

        code = str(secrets.randbelow(900000) + 100000)
        pending = {
            "hashed_password": hash_password(data.password),
            "name": data.name,
            "slug": data.slug,
            "phone": data.phone,
            "city": data.city,
            "type": data.type,
        }
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=_CODE_TTL_MIN)

        # Delete any existing pending verification for this email
        await self._db.execute(
            delete(EmailVerification).where(EmailVerification.email == data.email)
        )

        verification = EmailVerification(
            email=data.email,
            code=code,
            pending_data=pending,
            attempts=0,
            expires_at=expires_at,
        )
        self._db.add(verification)

        # Send email first — if it fails, don't commit
        try:
            await send_verification_email(data.email, code)
        except Exception:
            await self._db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось отправить код подтверждения. Попробуйте позже.",
            )

        await self._db.commit()

    async def register_verify(self, data: RegisterVerifyRequest) -> Restaurant:
        result = await self._db.execute(
            select(EmailVerification).where(EmailVerification.email == data.email)
        )
        verification = result.scalar_one_or_none()

        if not verification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Код неверный или истёк. Запросите новый.",
            )

        if datetime.now(timezone.utc) > verification.expires_at:
            await self._db.delete(verification)
            await self._db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Код истёк. Запросите новый.",
            )

        if verification.attempts >= _MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Код заблокирован. Запросите новый.",
            )

        if verification.code != data.code:
            verification.attempts += 1
            await self._db.commit()
            remaining = _MAX_ATTEMPTS - verification.attempts
            if remaining <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Код заблокирован после 5 неверных попыток. Запросите новый.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неверный код. Осталось попыток: {remaining}.",
            )

        # Code correct — create restaurant from pending data, immediately active
        pending = verification.pending_data
        restaurant = Restaurant(
            email=data.email,
            hashed_password=pending["hashed_password"],
            name=pending["name"],
            slug=pending["slug"],
            status=RestaurantStatus.active,
            is_active=True,
            phone=pending.get("phone"),
            city=pending.get("city"),
            venue_type=pending.get("type"),
        )
        self._db.add(restaurant)
        await self._db.delete(verification)

        try:
            await self._db.commit()
        except IntegrityError as exc:
            await self._db.rollback()
            orig = str(exc.orig).lower()
            if "email" in orig:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered",
                )
            if "slug" in orig:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Slug already taken",
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate value",
            )

        await self._db.refresh(restaurant)
        return restaurant

    async def verify_token_payload(self, token: str) -> dict:
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                return {"valid": False}

            restaurant_id = UUID(payload["sub"])
            restaurant = await self.get_by_id(restaurant_id)
            if not restaurant or not restaurant.is_active:
                return {"valid": False}

            return {
                "valid": True,
                "restaurant_id": restaurant_id,
                # Always read plan from DB — JWT plan can be stale after billing upgrade
                "plan": restaurant.plan.value,
                "slug": payload.get("slug"),
            }
        except (ValueError, KeyError):
            return {"valid": False}
