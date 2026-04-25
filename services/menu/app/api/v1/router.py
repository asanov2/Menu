from fastapi import APIRouter

from app.api.v1.endpoints.menu import router as menu_router

router = APIRouter()
router.include_router(menu_router, prefix="/menu", tags=["menu"])
