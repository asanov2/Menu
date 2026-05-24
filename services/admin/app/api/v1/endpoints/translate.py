import logging
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_guard import check_daily_limit, check_rate_limit, log_ai_call
from app.core.cache_invalidator import invalidate_menu_cache
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.core.plan_limits import get_limits
from app.core.redis_client import get_redis
from app.services.menu_service import MenuService
from app.services.translation_service import TranslationService

router = APIRouter()
logger = logging.getLogger(__name__)

_VALID_LANGS = {"kz", "en"}

# Both translate endpoints share the same rate-limit and daily-quota bucket
# because translating a whole menu is expensive and a single click can trigger
# multiple Gemini calls (one per language).
_RL_ENDPOINT = "translate"
_RL_MAX_PER_HOUR = 5
_RL_WINDOW_SECONDS = 3600
_DAILY_MAX = 10


class TranslateRequest(BaseModel):
    languages: list[str]


class TranslateResponse(BaseModel):
    translated_categories: int
    translated_items: int


def _require_ai_translation(plan: str) -> None:
    if not get_limits(plan).ai_translation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PLAN_LIMIT_REACHED",
                "message": "AI-перевод меню доступен только на тарифе Бизнес и выше.",
                "upgrade_to": "business",
            },
        )


@router.post("/menus/{menu_id}/translate", response_model=TranslateResponse)
async def translate_menu(
    menu_id: UUID,
    body: TranslateRequest,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> TranslateResponse:
    _require_ai_translation(current.plan)

    languages = [lang for lang in body.languages if lang in _VALID_LANGS]
    if not languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите хотя бы один поддерживаемый язык: kz, en",
        )

    # Rate limit: 5 requests / hour per restaurant (shared with translate_item)
    await check_rate_limit(redis, current.id, _RL_ENDPOINT, _RL_MAX_PER_HOUR, _RL_WINDOW_SECONDS)

    # Daily quota: 10 requests / day per restaurant (shared with translate_item)
    await check_daily_limit(redis, current.id, _RL_ENDPOINT, _DAILY_MAX)

    log_ai_call(
        current.id,
        "translate_menu",
        extra=f"menu_id={menu_id} langs={languages}",
    )

    # Verify menu belongs to this restaurant
    await MenuService(db).get_menu(current.id, menu_id)

    result = await TranslationService(db).translate_menu(current.id, menu_id, languages)
    await invalidate_menu_cache(current.slug)
    return TranslateResponse(**result)


@router.post("/items/{item_id}/translate", response_model=TranslateResponse)
async def translate_item(
    item_id: UUID,
    body: TranslateRequest,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> TranslateResponse:
    _require_ai_translation(current.plan)

    languages = [lang for lang in body.languages if lang in _VALID_LANGS]
    if not languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите хотя бы один поддерживаемый язык: kz, en",
        )

    # Rate limit: 5 requests / hour per restaurant (shared with translate_menu)
    await check_rate_limit(redis, current.id, _RL_ENDPOINT, _RL_MAX_PER_HOUR, _RL_WINDOW_SECONDS)

    # Daily quota: 10 requests / day per restaurant (shared with translate_menu)
    await check_daily_limit(redis, current.id, _RL_ENDPOINT, _DAILY_MAX)

    log_ai_call(
        current.id,
        "translate_item",
        extra=f"item_id={item_id} langs={languages}",
    )

    result = await TranslationService(db).translate_item(current.id, item_id, languages)
    await invalidate_menu_cache(current.slug)
    return TranslateResponse(**result)
