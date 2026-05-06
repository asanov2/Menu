from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.restaurant import Restaurant
from app.schemas.auth import RegisterRequest


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
            select(Restaurant).where(Restaurant.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Restaurant | None:
        result = await self._db.execute(
            select(Restaurant).where(Restaurant.slug == slug)
        )
        return result.scalar_one_or_none()

    async def register(self, data: RegisterRequest) -> Restaurant:
        # fix #3: removed pre-insert uniqueness checks (TOCTOU race condition).
        # DB unique constraints are the single source of truth.
        # IntegrityError is caught and mapped to 409 with a meaningful message.
        restaurant = Restaurant(
            email=data.email,
            hashed_password=hash_password(data.password),
            name=data.name,
            slug=data.slug,
        )
        self._db.add(restaurant)
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

    async def authenticate(self, email: str, password: str) -> Restaurant:
        restaurant = await self.get_by_email(email)
        if not restaurant or not verify_password(password, restaurant.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not restaurant.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Restaurant account is disabled",
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

    async def verify_token_payload(self, token: str) -> dict:
        # fix #12 + #16: now async — checks is_active in DB so deactivated
        # restaurants cannot use their remaining token lifetime.
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
                "plan": payload.get("plan"),
                "slug": payload.get("slug"),
            }
        except (ValueError, KeyError):
            return {"valid": False}
