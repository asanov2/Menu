import logging

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)


async def _push_owner_new_restaurant(name: str, city: str | None) -> None:
    """Notify platform owner of a new restaurant registration. Catches all errors."""
    body = f"{name} · {city}" if city else name
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{settings.notification_service_url}/api/v1/push/internal/send-push",
                json={
                    "subject_type": "owner",
                    "subject_id": "1",
                    "title": "Новая заявка ресторана",
                    "body": body,
                    "data": {"type": "restaurant_request"},
                },
                headers={"X-Internal-Secret": settings.internal_secret},
            )
    except Exception as exc:
        logger.warning("Push to owner skipped (new restaurant): %s", exc)
from app.core.dependencies import get_current_restaurant
from app.models.restaurant import Restaurant
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    RestaurantResponse,
    TokenResponse,
    UpdateProfileRequest,
    VerifyTokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/register", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RestaurantResponse:
    service = AuthService(db)
    restaurant = await service.register(data)
    await _push_owner_new_restaurant(restaurant.name, restaurant.city)
    return RestaurantResponse.model_validate(restaurant)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    service = AuthService(db)
    restaurant = await service.authenticate(data.email, data.password)
    access_token, refresh_token = service.create_tokens(restaurant)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/v1/auth/refresh",
    )

    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )
    service = AuthService(db)
    access_token = await service.refresh_access_token(refresh_token)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=RestaurantResponse)
async def me(
    current_restaurant: Restaurant = Depends(get_current_restaurant),
) -> RestaurantResponse:
    return RestaurantResponse.model_validate(current_restaurant)


@router.put("/profile", response_model=RestaurantResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_restaurant: Restaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> RestaurantResponse:
    service = AuthService(db)
    restaurant = await service.update_profile(current_restaurant.id, data.name, data.email)
    return RestaurantResponse.model_validate(restaurant)


@router.put("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    current_restaurant: Restaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = AuthService(db)
    await service.change_password(current_restaurant.id, data.old_password, data.new_password)


# fix #16 + #12: db IS used now — verify_token_payload checks is_active in DB.
# The previous audit found db was injected but never used (sync decode only).
# Now it's async and does one DB lookup to catch deactivated restaurants.
@router.get("/verify-token", response_model=VerifyTokenResponse)
async def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> VerifyTokenResponse:
    if not credentials:
        return VerifyTokenResponse(valid=False)

    service = AuthService(db)
    result = await service.verify_token_payload(credentials.credentials)
    return VerifyTokenResponse(**result)
