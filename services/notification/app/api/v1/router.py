from fastapi import APIRouter

from app.api.v1.endpoints import push

router = APIRouter()
router.include_router(push.router, tags=["push"])
