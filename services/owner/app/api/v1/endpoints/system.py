from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_owner
from app.schemas.system import SystemHealthResponse
from app.services.system_service import SystemService

router = APIRouter()


@router.get("/system/health", response_model=SystemHealthResponse)
async def system_health(
    owner: str = Depends(get_current_owner),
) -> SystemHealthResponse:
    return await SystemService().get_health()
