import json
import logging

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


class SuggestNutritionRequest(BaseModel):
    name: str
    description: str | None = None


class SuggestNutritionResponse(BaseModel):
    calories: float
    protein: float
    fat: float
    carbs: float


def _require_ai_nutrition(plan: str) -> None:
    if not get_limits(plan).ai_nutrition:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PLAN_LIMIT_REACHED",
                "message": "AI-помощник КБЖУ доступен только на тарифе Бизнес и выше.",
                "upgrade_to": "business",
            },
        )


@router.post("/items/suggest-nutrition", response_model=SuggestNutritionResponse)
async def suggest_nutrition(
    body: SuggestNutritionRequest,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    _db: AsyncSession = Depends(get_db),
) -> SuggestNutritionResponse:
    _require_ai_nutrition(current.plan)

    desc_part = body.description or ""
    prompt = (
        f"Ты диетолог. Дай примерное КБЖУ на 100г для блюда '{body.name}'. "
        f"Описание: '{desc_part}'. "
        f'Верни ТОЛЬКО валидный JSON: {{"calories": float, "protein": float, "fat": float, "carbs": float}}. '
        f"Округли до 1 знака после запятой."
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            _GEMINI_URL,
            params={"key": settings.gemini_api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            },
        )

    logger.info(
        "suggest_nutrition: item=%r status=%d preview=%s",
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
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(raw_text)

    return SuggestNutritionResponse(
        calories=round(float(parsed["calories"]), 1),
        protein=round(float(parsed["protein"]), 1),
        fat=round(float(parsed["fat"]), 1),
        carbs=round(float(parsed["carbs"]), 1),
    )
