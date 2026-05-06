from fastapi import APIRouter

from app.schemas.auth import OwnerLoginRequest, OwnerLoginResponse
from app.services.auth_service import OwnerAuthService

router = APIRouter()


@router.post("/login", response_model=OwnerLoginResponse)
async def login(body: OwnerLoginRequest) -> OwnerLoginResponse:
    token = OwnerAuthService().login(body.email, body.password)
    return OwnerLoginResponse(access_token=token)
