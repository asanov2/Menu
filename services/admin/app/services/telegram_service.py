import logging
import random
import string
from datetime import datetime, timedelta
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.telegram import RestaurantTelegramSettings

logger = logging.getLogger(__name__)

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
_CODE_TTL_MINUTES = 10


async def send_message(chat_id: int, text: str) -> bool:
    if not settings.telegram_bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not set, skipping send_message")
        return False
    url = _TELEGRAM_API.format(token=settings.telegram_bot_token)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
            if resp.status_code != 200:
                logger.error("Telegram API error %s: %s", resp.status_code, resp.text)
                return False
            return True
    except Exception as exc:
        logger.error("Failed to send Telegram message: %s", exc)
        return False


def _random_code() -> str:
    return "".join(random.choices(string.digits, k=6))


async def get_or_create_settings(db: AsyncSession, restaurant_id: UUID) -> RestaurantTelegramSettings:
    result = await db.execute(
        select(RestaurantTelegramSettings).where(
            RestaurantTelegramSettings.restaurant_id == restaurant_id
        )
    )
    settings_row = result.scalar_one_or_none()
    if not settings_row:
        settings_row = RestaurantTelegramSettings(restaurant_id=restaurant_id)
        db.add(settings_row)
        await db.flush()
    return settings_row


async def generate_connect_code(db: AsyncSession, restaurant_id: UUID) -> str:
    row = await get_or_create_settings(db, restaurant_id)
    code = _random_code()
    row.telegram_connect_code = code
    row.telegram_code_expires_at = datetime.utcnow() + timedelta(minutes=_CODE_TTL_MINUTES)
    row.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(row)
    return code


async def activate_connect_code(db: AsyncSession, code: str, chat_id: int) -> bool:
    result = await db.execute(
        select(RestaurantTelegramSettings).where(
            RestaurantTelegramSettings.telegram_connect_code == code
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        return False
    if row.telegram_code_expires_at and row.telegram_code_expires_at < datetime.utcnow():
        return False
    row.telegram_chat_id = chat_id
    row.telegram_connect_code = None
    row.telegram_code_expires_at = None
    row.updated_at = datetime.utcnow()
    await db.commit()
    return True


async def disconnect(db: AsyncSession, restaurant_id: UUID) -> None:
    row = await get_or_create_settings(db, restaurant_id)
    row.telegram_chat_id = None
    row.telegram_connect_code = None
    row.telegram_code_expires_at = None
    row.updated_at = datetime.utcnow()
    await db.commit()


async def disconnect_by_chat_id(db: AsyncSession, chat_id: int) -> bool:
    """Find restaurant by chat_id and disconnect. Returns True if a row was found."""
    result = await db.execute(
        select(RestaurantTelegramSettings).where(
            RestaurantTelegramSettings.telegram_chat_id == chat_id
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        return False
    row.telegram_chat_id = None
    row.telegram_connect_code = None
    row.telegram_code_expires_at = None
    row.updated_at = datetime.utcnow()
    await db.commit()
    return True
