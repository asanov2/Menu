from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_restaurant
from app.models.restaurant import Restaurant
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RestaurantResponse,
    TokenResponse,
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
