# === FILE: services/billing/app/api/v1/router.py ===
from fastapi import APIRouter

from app.api.v1.endpoints import internal, subscriptions, webhooks

router = APIRouter()

router.include_router(subscriptions.router, tags=["subscriptions"])
router.include_router(webhooks.router, tags=["webhooks"])
router.include_router(internal.router, tags=["internal"])
