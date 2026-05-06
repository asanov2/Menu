from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.restaurants import router as restaurants_router
from app.api.v1.endpoints.revenue import router as revenue_router
from app.api.v1.endpoints.system import router as system_router

router = APIRouter()
router.include_router(auth_router, prefix="/owner", tags=["owner-auth"])
router.include_router(restaurants_router, prefix="/owner", tags=["owner-restaurants"])
router.include_router(revenue_router, prefix="/owner", tags=["owner-revenue"])
router.include_router(system_router, prefix="/owner", tags=["owner-system"])
