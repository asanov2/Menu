from fastapi import APIRouter

from app.api.v1.endpoints.allergens import router as allergens_router
from app.api.v1.endpoints.categories import router as categories_router
from app.api.v1.endpoints.description import router as description_router
from app.api.v1.endpoints.items import router as items_router
from app.api.v1.endpoints.menus import router as menus_router
from app.api.v1.endpoints.nutrition import router as nutrition_router
from app.api.v1.endpoints.translate import router as translate_router
from app.api.v1.endpoints.upload import router as upload_router

router = APIRouter()
router.include_router(menus_router, prefix="/admin/menus", tags=["admin-menus"])
router.include_router(categories_router, prefix="/admin/categories", tags=["admin-categories"])
router.include_router(items_router, prefix="/admin/items", tags=["admin-items"])
router.include_router(upload_router, prefix="/admin/upload", tags=["admin-upload"])
router.include_router(translate_router, prefix="/admin", tags=["admin-translate"])
router.include_router(nutrition_router, prefix="/admin", tags=["admin-nutrition"])
router.include_router(description_router, prefix="/admin", tags=["admin-description"])
router.include_router(allergens_router, prefix="/admin/allergens", tags=["admin-allergens"])
