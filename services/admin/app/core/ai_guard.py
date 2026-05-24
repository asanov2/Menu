"""
Shared guards for AI endpoints: rate limiting, daily quotas, input validation,
and structured logging. All limits are enforced via the existing Redis singleton.
"""
import logging
from datetime import date, timezone, datetime
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


# ── Rate-limit (sliding fixed-window via INCR+EXPIRE) ───────────────────────

async def check_rate_limit(
    redis: aioredis.Redis,
    restaurant_id: UUID,
    endpoint: str,
    max_requests: int,
    window_seconds: int,
) -> None:
    """
    Increment a per-restaurant per-endpoint counter.
    TTL is set only on the first hit so the window doesn't reset on every call.
    Raises 429 when the limit is exceeded.
    """
    key = f"ai_rl:{restaurant_id}:{endpoint}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, window_seconds)
    if count > max_requests:
        ttl = await redis.ttl(key)
        wait = max(ttl, 1)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Слишком много запросов, подождите {wait} секунд",
        )


# ── Daily quota ──────────────────────────────────────────────────────────────

async def check_daily_limit(
    redis: aioredis.Redis,
    restaurant_id: UUID,
    endpoint: str,
    max_per_day: int,
) -> None:
    """
    Enforce a per-restaurant per-endpoint daily quota.
    Key resets automatically after 24 h (TTL set on first hit of each UTC day).
    Raises 429 when the quota is exhausted.
    """
    today = date.today().isoformat()
    key = f"ai_limit:{restaurant_id}:{endpoint}:{today}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 86400)
    if count > max_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Дневной лимит исчерпан, лимит обновится завтра",
        )


# ── Input validation ─────────────────────────────────────────────────────────

def validate_name(name: str) -> None:
    if len(name) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поле 'name' не должно превышать 100 символов (получено {len(name)})",
        )


def validate_description(description: str | None) -> None:
    if description and len(description) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поле 'description' не должно превышать 500 символов (получено {len(description)})",
        )


# ── Structured AI call logging ───────────────────────────────────────────────

def log_ai_call(
    restaurant_id: UUID,
    endpoint: str,
    prompt: str | None = None,
    *,
    extra: str = "",
) -> None:
    tokens_approx = len(prompt) // 4 if prompt else 0
    ts = datetime.now(tz=timezone.utc).isoformat(timespec="seconds")
    logger.info(
        "ai_call restaurant_id=%s endpoint=%s timestamp=%s tokens_approx=%d%s",
        restaurant_id,
        endpoint,
        ts,
        tokens_approx,
        f" {extra}" if extra else "",
    )
