import logging
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.core.plan_limits import get_limits

router = APIRouter()
logger = logging.getLogger(__name__)

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-2.5-flash:generateContent"
)

_STYLE_DESCRIPTIONS: dict[str, str] = {
    "classic": "нейтральный, информативный, без лишних эпитетов",
    "appetizing": "аппетитный, акцент на вкус, аромат и текстуру блюда",
    "premium": "изысканный, для премиального ресторана, элегантный язык",
}

_LENGTH_DESCRIPTIONS: dict[str, str] = {
    "short": "1 предложение, максимум 15 слов",
    "medium": "2-3 предложения, около 40 слов",
    "long": "4-5 предложений, около 80 слов",
}

_LANGUAGE_NAMES: dict[str, str] = {
    "ru": "русском языке",
    "kz": "казахском языке",
    "en": "английском языке",
}


class GenerateDescriptionRequest(BaseModel):
    name: str
    category_name: str | None = None
    length: Literal["short", "medium", "long"] = "medium"
    style: Literal["classic", "appetizing", "premium"] = "appetizing"
    language: Literal["ru", "kz", "en"] = "ru"


class GenerateDescriptionResponse(BaseModel):
    description: str


def _require_ai_description(plan: str) -> None:
    if not get_limits(plan).ai_description:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PLAN_LIMIT_REACHED",
                "message": "AI-генерация описаний доступна только на тарифе Про.",
                "upgrade_to": "pro",
            },
        )


@router.post("/items/generate-description", response_model=GenerateDescriptionResponse)
async def generate_description(
    body: GenerateDescriptionRequest,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    _db: AsyncSession = Depends(get_db),
) -> GenerateDescriptionResponse:
    _require_ai_description(current.plan)

    cat_part = body.category_name or "не указана"
    lang_name = _LANGUAGE_NAMES.get(body.language, body.language)
    style_desc = _STYLE_DESCRIPTIONS[body.style]
    length_desc = _LENGTH_DESCRIPTIONS[body.length]

    prompt = (
        f"Ты копирайтер для ресторанного меню. "
        f"Напиши описание блюда '{body.name}' (категория: {cat_part}). "
        f"Стиль: {style_desc}. "
        f"Длина: {length_desc}. "
        f"Язык: {lang_name}. "
        f"Верни ТОЛЬКО текст описания без кавычек, заголовков и пояснений."
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            _GEMINI_URL,
            params={"key": settings.gemini_api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )

    logger.info(
        "generate_description: item=%r status=%d preview=%s",
        body.name,
        resp.status_code,
        resp.text[:200],
    )

    if resp.status_code in (429, 503):
        try:
            detail = resp.json().get("error", {}).get("message", "")
        except Exception:
            detail = resp.text[:200]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI сервис временно недоступен: {detail}" if detail else "AI сервис временно недоступен",
        )
    resp.raise_for_status()

    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

    return GenerateDescriptionResponse(description=text)
