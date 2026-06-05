import logging

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_restaurant
from app.core.redis import get_redis
from app.models.restaurant import Restaurant
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    RegisterRequestResponse,
    RegisterVerifyRequest,
    RegisterVerifyResponse,
    RestaurantResponse,
    TokenResponse,
    UpdateProfileRequest,
    VerifyTokenResponse,
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
bearer_scheme = HTTPBearer(auto_error=False)


async def _activate_trial(restaurant_id: str) -> None:
    """Call billing-service to start 14-day trial. Fire-and-forget — catches all errors."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.billing_service_url}/api/v1/billing/internal/activate-trial",
                json={"restaurant_id": restaurant_id},
                headers={"X-Internal-Secret": settings.internal_secret},
            )
            if resp.status_code not in (200, 201):
                logger.error(
                    "activate_trial failed restaurant=%s status=%d body=%s",
                    restaurant_id, resp.status_code, resp.text,
                )
            else:
                logger.info("activate_trial ok restaurant=%s", restaurant_id)
    except Exception as exc:
        logger.error("activate_trial unreachable restaurant=%s error=%s", restaurant_id, exc)


@router.post("/register-request", response_model=RegisterRequestResponse)
async def register_request(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> RegisterRequestResponse:
    service = AuthService(db)
    await service.register_request(data, redis)
    return RegisterRequestResponse(detail="Код подтверждения отправлен на ваш email")


@router.post("/register-verify", response_model=RegisterVerifyResponse)
async def register_verify(
    data: RegisterVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterVerifyResponse:
    service = AuthService(db)
    restaurant = await service.register_verify(data)

    # Generate tokens the same way login does
    access_token, _ = service.create_tokens(restaurant)

    # Start 14-day trial (fire-and-forget)
    await _activate_trial(str(restaurant.id))

    return RegisterVerifyResponse(
        access_token=access_token,
        id=restaurant.id,
        email=restaurant.email,
        name=restaurant.name,
        slug=restaurant.slug,
        plan=restaurant.plan.value,
        is_active=restaurant.is_active,
    )


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
