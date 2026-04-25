from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth_client import verify_token

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentRestaurant:
    id: UUID
    plan: str
    slug: str


async def get_current_restaurant(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentRestaurant:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await verify_token(credentials.credentials)

    if not result.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentRestaurant(
        id=UUID(result["restaurant_id"]),
        plan=result.get("plan", "starter"),
        slug=result.get("slug", ""),
    )
