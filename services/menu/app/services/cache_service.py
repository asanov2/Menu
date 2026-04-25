import json
import logging
from uuid import UUID

from app.core.config import settings
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


# ── key helpers ──────────────────────────────────────────────────────────────

def _menu_key(slug: str, language: str = "default") -> str:
    return f"menu:{slug}:{language}"


def _categories_key(slug: str) -> str:
    # fix #11: dedicated cache namespace for categories
    return f"categories:{slug}"


def _items_key(slug: str, category_id: UUID | None, available_only: bool) -> str:
    # fix #11: dedicated cache namespace for items
    return f"items:{slug}:{category_id or 'all'}:{available_only}"


# ── full menu ─────────────────────────────────────────────────────────────────

async def get_cached_menu(slug: str, language: str = "default") -> dict | None:
    try:
        redis = await get_redis()
        data = await redis.get(_menu_key(slug, language))
        if data:
            return json.loads(data)
    except Exception as exc:
        logger.warning("Redis get (menu) failed: %s", exc)
    return None


async def set_cached_menu(slug: str, data: dict, language: str = "default") -> None:
    try:
        redis = await get_redis()
        await redis.setex(
            _menu_key(slug, language),
            settings.cache_ttl,
            json.dumps(data, default=str),
        )
    except Exception as exc:
        logger.warning("Redis set (menu) failed: %s", exc)


# ── categories ────────────────────────────────────────────────────────────────

async def get_cached_categories(slug: str) -> list | None:
    try:
        redis = await get_redis()
        data = await redis.get(_categories_key(slug))
        if data:
            return json.loads(data)
    except Exception as exc:
        logger.warning("Redis get (categories) failed: %s", exc)
    return None


async def set_cached_categories(slug: str, data: list) -> None:
    try:
        redis = await get_redis()
        await redis.setex(
            _categories_key(slug),
            settings.cache_ttl,
            json.dumps(data, default=str),
        )
    except Exception as exc:
        logger.warning("Redis set (categories) failed: %s", exc)


# ── items ─────────────────────────────────────────────────────────────────────

async def get_cached_items(
    slug: str, category_id: UUID | None, available_only: bool
) -> list | None:
    try:
        redis = await get_redis()
        data = await redis.get(_items_key(slug, category_id, available_only))
        if data:
            return json.loads(data)
    except Exception as exc:
        logger.warning("Redis get (items) failed: %s", exc)
    return None


async def set_cached_items(
    slug: str, category_id: UUID | None, available_only: bool, data: list
) -> None:
    try:
        redis = await get_redis()
        await redis.setex(
            _items_key(slug, category_id, available_only),
            settings.cache_ttl,
            json.dumps(data, default=str),
        )
    except Exception as exc:
        logger.warning("Redis set (items) failed: %s", exc)
