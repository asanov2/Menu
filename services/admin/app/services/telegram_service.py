import logging
import random
import string
from datetime import datetime, timedelta
from uuid import UUID

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.telegram import RestaurantTelegramSettings, TelegramRecipient

logger = logging.getLogger(__name__)

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
_CODE_TTL_MINUTES = 10
_MAX_RECIPIENTS = 15


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
    row = result.scalar_one_or_none()
    if not row:
        row = RestaurantTelegramSettings(restaurant_id=restaurant_id)
        db.add(row)
        await db.flush()
    return row


async def get_recipients(db: AsyncSession, restaurant_id: UUID) -> list[TelegramRecipient]:
    result = await db.execute(
        select(TelegramRecipient)
        .where(TelegramRecipient.restaurant_id == restaurant_id)
        .order_by(TelegramRecipient.created_at)
    )
    return list(result.scalars().all())


async def generate_connect_code(db: AsyncSession, restaurant_id: UUID, label: str) -> str:
    row = await get_or_create_settings(db, restaurant_id)
    recipients = await get_recipients(db, restaurant_id)
    if len(recipients) >= _MAX_RECIPIENTS:
        raise ValueError(f"Достигнут лимит получателей ({_MAX_RECIPIENTS})")
    code = _random_code()
    row.telegram_connect_code = code
    row.telegram_code_expires_at = datetime.utcnow() + timedelta(minutes=_CODE_TTL_MINUTES)
    row.telegram_pending_label = label.strip()
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

    label = (row.telegram_pending_label or "Основной").strip()

    # Upsert: if this chat_id is already a recipient of this restaurant, update its label
    existing = await db.execute(
        select(TelegramRecipient).where(
            TelegramRecipient.restaurant_id == row.restaurant_id,
            TelegramRecipient.chat_id == chat_id,
        )
    )
    existing_row = existing.scalar_one_or_none()
    if existing_row:
        existing_row.label = label
    else:
        db.add(TelegramRecipient(restaurant_id=row.restaurant_id, chat_id=chat_id, label=label))

    # Keep telegram_chat_id pointing to a valid recipient for analytics backward compat
    row.telegram_chat_id = chat_id
    row.telegram_connect_code = None
    row.telegram_code_expires_at = None
    row.telegram_pending_label = None
    row.updated_at = datetime.utcnow()
    await db.commit()
    return True


async def disconnect_recipient(db: AsyncSession, restaurant_id: UUID, recipient_id: UUID) -> bool:
    result = await db.execute(
        select(TelegramRecipient).where(
            TelegramRecipient.id == recipient_id,
            TelegramRecipient.restaurant_id == restaurant_id,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        return False
    removed_chat_id = row.chat_id
    await db.delete(row)
    await db.flush()

    # If settings.telegram_chat_id pointed to the removed recipient,
    # update it to another remaining recipient (for analytics backward compat).
    settings_row = await get_or_create_settings(db, restaurant_id)
    if settings_row.telegram_chat_id == removed_chat_id:
        remaining = await get_recipients(db, restaurant_id)
        settings_row.telegram_chat_id = remaining[0].chat_id if remaining else None
        settings_row.updated_at = datetime.utcnow()

    await db.commit()
    return True


async def disconnect_by_chat_id(db: AsyncSession, chat_id: int) -> bool:
    """Remove recipient(s) by chat_id across all restaurants (webhook: bot kicked/blocked)."""
    result = await db.execute(
        select(TelegramRecipient).where(TelegramRecipient.chat_id == chat_id)
    )
    rows = list(result.scalars().all())
    if not rows:
        return False

    affected_restaurant_ids = [r.restaurant_id for r in rows]
    for row in rows:
        await db.delete(row)
    await db.flush()

    # Update telegram_chat_id in settings for affected restaurants
    for restaurant_id in affected_restaurant_ids:
        settings_result = await db.execute(
            select(RestaurantTelegramSettings).where(
                RestaurantTelegramSettings.restaurant_id == restaurant_id,
                RestaurantTelegramSettings.telegram_chat_id == chat_id,
            )
        )
        settings_row = settings_result.scalar_one_or_none()
        if settings_row:
            remaining = await get_recipients(db, restaurant_id)
            settings_row.telegram_chat_id = remaining[0].chat_id if remaining else None
            settings_row.updated_at = datetime.utcnow()

    await db.commit()
    return True


async def disconnect(db: AsyncSession, restaurant_id: UUID) -> None:
    """Remove all recipients for a restaurant."""
    await db.execute(
        delete(TelegramRecipient).where(TelegramRecipient.restaurant_id == restaurant_id)
    )
    row = await get_or_create_settings(db, restaurant_id)
    row.telegram_chat_id = None
    row.telegram_connect_code = None
    row.telegram_code_expires_at = None
    row.telegram_pending_label = None
    row.updated_at = datetime.utcnow()
    await db.commit()
