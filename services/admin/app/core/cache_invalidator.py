import logging

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)


async def invalidate_menu_cache(slug: str) -> None:
    try:
        redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        async with redis.client() as conn:
            pattern = f"menu:{slug}:*"
            keys = await conn.keys(pattern)
            if keys:
                await conn.delete(*keys)
        await redis.aclose()
    except Exception as exc:
        logger.warning("Cache invalidation failed for slug=%s: %s", slug, exc)
