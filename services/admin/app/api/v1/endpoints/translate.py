from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache_invalidator import invalidate_menu_cache
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.core.plan_limits import get_limits
from app.services.menu_service import MenuService
from app.services.translation_service import TranslationService

router = APIRouter()

_VALID_LANGS = {"kz", "en"}


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
) -> TranslateResponse:
    _require_ai_translation(current.plan)

    languages = [lang for lang in body.languages if lang in _VALID_LANGS]
    if not languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите хотя бы один поддерживаемый язык: kz, en",
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
) -> TranslateResponse:
    _require_ai_translation(current.plan)

    languages = [lang for lang in body.languages if lang in _VALID_LANGS]
    if not languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите хотя бы один поддерживаемый язык: kz, en",
        )

    result = await TranslationService(db).translate_item(current.id, item_id, languages)
    await invalidate_menu_cache(current.slug)
    return TranslateResponse(**result)
