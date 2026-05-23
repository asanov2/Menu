import json
import logging
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.menu import Category, CategoryTranslation, Item, ItemTranslation

logger = logging.getLogger(__name__)

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-2.5-flash:generateContent"
)

_LANGUAGE_NAMES: dict[str, str] = {
    "kz": "казахский язык",
    "en": "английский язык",
}


async def _call_gemini(texts: dict[str, str], language: str) -> dict[str, str]:
    """One Gemini REST call — translates all texts to target language in one shot."""
    lang_name = _LANGUAGE_NAMES.get(language, language)
    prompt = (
        f"Ты профессиональный переводчик для ресторанного меню. "
        f"Переведи следующие тексты на {lang_name}. "
        f"Верни ТОЛЬКО валидный JSON объект с теми же ключами и переведёнными значениями. "
        f"Не добавляй пояснений и не меняй ключи.\n\n"
        f"{json.dumps(texts, ensure_ascii=False)}"
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
        "Gemini response lang=%s status=%d body_preview=%s",
        language,
        resp.status_code,
        resp.text[:300],
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
    return json.loads(raw_text)


class TranslationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def translate_menu(
        self,
        restaurant_id: UUID,
        menu_id: UUID,
        languages: list[str],
    ) -> dict[str, int]:
        # Load all active categories for this menu
        cat_result = await self._db.execute(
            select(Category).where(
                and_(
                    Category.menu_id == menu_id,
                    Category.restaurant_id == restaurant_id,
                    Category.deleted_at == None,  # noqa: E711
                )
            )
        )
        categories = list(cat_result.scalars().all())

        if not categories:
            return {"translated_categories": 0, "translated_items": 0}

        cat_ids = [c.id for c in categories]

        # Load all active items for those categories
        item_result = await self._db.execute(
            select(Item).where(
                and_(
                    Item.restaurant_id == restaurant_id,
                    Item.category_id.in_(cat_ids),
                    Item.deleted_at == None,  # noqa: E711
                )
            )
        )
        items = list(item_result.scalars().all())

        # Build flat text dict with short index keys to minimise token overhead.
        texts: dict[str, str] = {}
        cat_key_map: dict[str, UUID] = {}    # "c0" -> category_id
        item_name_map: dict[str, UUID] = {}  # "i3n" -> item_id
        item_desc_map: dict[str, UUID] = {}  # "i3d" -> item_id

        for i, cat in enumerate(categories):
            key = f"c{i}"
            texts[key] = cat.name
            cat_key_map[key] = cat.id

        for j, item in enumerate(items):
            nk = f"i{j}n"
            texts[nk] = item.name
            item_name_map[nk] = item.id
            if item.description:
                dk = f"i{j}d"
                texts[dk] = item.description
                item_desc_map[dk] = item.id

        logger.info(
            "translate_menu: menu=%s langs=%s texts_count=%d",
            menu_id, languages, len(texts),
        )

        translated_cats = 0
        translated_items_count = 0

        for lang in languages:
            # Raises HTTPException on Gemini errors — propagates to client
            translated = await _call_gemini(texts, lang)
            logger.info("Gemini returned %d keys for lang=%s", len(translated), lang)

            # Upsert category translations
            for key, cat_id in cat_key_map.items():
                value = translated.get(key)
                if not value:
                    continue
                existing = (
                    await self._db.execute(
                        select(CategoryTranslation).where(
                            and_(
                                CategoryTranslation.category_id == cat_id,
                                CategoryTranslation.language == lang,
                            )
                        )
                    )
                ).scalar_one_or_none()
                if existing:
                    existing.name = value
                else:
                    self._db.add(
                        CategoryTranslation(category_id=cat_id, language=lang, name=value)
                    )
                translated_cats += 1

            # Upsert item translations
            item_fields: dict[UUID, dict[str, str]] = {}
            for key, item_id in item_name_map.items():
                v = translated.get(key)
                if v:
                    item_fields.setdefault(item_id, {})["name"] = v
            for key, item_id in item_desc_map.items():
                v = translated.get(key)
                if v:
                    item_fields.setdefault(item_id, {})["desc"] = v

            for item_id, fields in item_fields.items():
                if "name" not in fields:
                    continue
                existing = (
                    await self._db.execute(
                        select(ItemTranslation).where(
                            and_(
                                ItemTranslation.item_id == item_id,
                                ItemTranslation.language == lang,
                            )
                        )
                    )
                ).scalar_one_or_none()
                if existing:
                    existing.name = fields["name"]
                    if "desc" in fields:
                        existing.description = fields["desc"]
                else:
                    self._db.add(
                        ItemTranslation(
                            item_id=item_id,
                            language=lang,
                            name=fields["name"],
                            description=fields.get("desc"),
                        )
                    )
                translated_items_count += 1

        await self._db.commit()

        logger.info(
            "translate_menu done: cats=%d items=%d",
            translated_cats // max(len(languages), 1),
            translated_items_count // max(len(languages), 1),
        )

        return {
            "translated_categories": translated_cats // max(len(languages), 1),
            "translated_items": translated_items_count // max(len(languages), 1),
        }

    async def translate_item(
        self,
        restaurant_id: UUID,
        item_id: UUID,
        languages: list[str],
    ) -> dict[str, int]:
        item_result = await self._db.execute(
            select(Item).where(
                and_(
                    Item.id == item_id,
                    Item.restaurant_id == restaurant_id,
                    Item.deleted_at == None,  # noqa: E711
                )
            )
        )
        item = item_result.scalar_one_or_none()
        if not item:
            return {"translated_categories": 0, "translated_items": 0}

        texts: dict[str, str] = {"name": item.name}
        if item.description:
            texts["desc"] = item.description

        logger.info("translate_item: item=%s langs=%s", item_id, languages)

        translated_count = 0

        for lang in languages:
            translated = await _call_gemini(texts, lang)

            name = translated.get("name")
            if not name:
                logger.warning("Gemini returned no 'name' key for lang=%s item=%s", lang, item_id)
                continue

            existing = (
                await self._db.execute(
                    select(ItemTranslation).where(
                        and_(
                            ItemTranslation.item_id == item_id,
                            ItemTranslation.language == lang,
                        )
                    )
                )
            ).scalar_one_or_none()
            if existing:
                existing.name = name
                if "desc" in translated and translated["desc"]:
                    existing.description = translated["desc"]
            else:
                self._db.add(
                    ItemTranslation(
                        item_id=item_id,
                        language=lang,
                        name=name,
                        description=translated.get("desc"),
                    )
                )
            translated_count += 1

        await self._db.commit()
        return {"translated_categories": 0, "translated_items": translated_count}
