import json
import logging

from app.core.config import settings
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


def _cache_key(slug: str, language: str = "default") -> str:
    return f"menu:{slug}:{language}"


async def get_cached_menu(slug: str, language: str = "default") -> dict | None:
    try:
        redis = await get_redis()
        data = await redis.get(_cache_key(slug, language))
        if data:
            return json.loads(data)
    except Exception as exc:
        logger.warning("Redis get failed: %s", exc)
    return None


async def set_cached_menu(slug: str, data: dict, language: str = "default") -> None:
    try:
        redis = await get_redis()
        await redis.setex(
            _cache_key(slug, language),
            settings.cache_ttl,
            json.dumps(data, default=str),
        )
    except Exception as exc:
        logger.warning("Redis set failed: %s", exc)
