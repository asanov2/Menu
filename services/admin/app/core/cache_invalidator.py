import logging

from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

# Patterns that must be invalidated on any write to menus/categories/items
_PATTERNS = [
    "menu:{slug}:*",
    "categories:{slug}*",
    "items:{slug}:*",
]


async def invalidate_menu_cache(slug: str) -> None:
    # fix #1: SCAN instead of KEYS (non-blocking, O(1) per call)
    # fix #10: reuse singleton Redis pool from redis_client.py
    # fix #11: invalidate all three cache namespaces
    try:
        redis = await get_redis()
        patterns = [p.format(slug=slug) for p in _PATTERNS]

        keys_to_delete: list[str] = []
        for pattern in patterns:
            cursor = 0
            while True:
                cursor, keys = await redis.scan(cursor, match=pattern, count=100)
                keys_to_delete.extend(keys)
                if cursor == 0:
                    break

        if keys_to_delete:
            await redis.delete(*keys_to_delete)
            logger.debug("Invalidated %d cache keys for slug=%s", len(keys_to_delete), slug)
    except Exception as exc:
        logger.warning("Cache invalidation failed for slug=%s: %s", slug, exc)
