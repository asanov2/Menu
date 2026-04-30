# === FILE: services/analytics/app/api/v1/router.py ===
from fastapi import APIRouter

from app.api.v1.endpoints import analytics

router = APIRouter()

router.include_router(analytics.router, tags=["analytics"])
