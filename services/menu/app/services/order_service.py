import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status as http_status
from sqlalchemy import update as sql_update
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.menu import Menu, Restaurant
from app.models.order import Order, RestaurantTelegramSettings
from app.schemas.order import OrderCreate

logger = logging.getLogger(__name__)

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"

# 400-body phrases that mean the chat is permanently unreachable
_FATAL_400_PHRASES = (
    "chat not found",
    "chat_id is empty",
    "user not found",
    "deactivated",
    "bot was blocked by the user",
    "user is deactivated",
    "group chat was upgraded",
)


def _is_fatal_error(status_code: int, body: str) -> bool:
    """Return True only for errors that mean the bot can never reach this chat again."""
    if status_code == 403:
        return True
    if status_code == 400:
        body_lower = body.lower()
        return any(phrase in body_lower for phrase in _FATAL_400_PHRASES)
    return False


async def _send_telegram(chat_id: int, text: str) -> bool | None:
    """
    Send a Telegram message. Returns:
      True  — delivered successfully
      False — temporary failure (429 / 5xx / network), binding kept
      None  — fatal failure (403 / chat not found), caller must disconnect
    """
    token = getattr(settings, "telegram_bot_token", "")
    if not token:
        return False
    url = _TELEGRAM_API.format(token=token)
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
                )
            if resp.status_code == 200:
                return True
            if _is_fatal_error(resp.status_code, resp.text):
                logger.error(
                    "Fatal Telegram error chat_id=%s: %s %s",
                    chat_id, resp.status_code, resp.text,
                )
                return None  # signal fatal to caller
            # temporary (429, 5xx, etc.)
            logger.warning(
                "Temporary Telegram error attempt=%d chat_id=%s: %s %s",
                attempt + 1, chat_id, resp.status_code, resp.text,
            )
        except Exception as exc:
            logger.warning(
                "Telegram network error attempt=%d chat_id=%s: %s",
                attempt + 1, chat_id, exc,
            )
        if attempt == 0:
            await asyncio.sleep(1)
    return False  # exhausted retries, temporary failure


async def _auto_disconnect(db: AsyncSession, tg_settings: RestaurantTelegramSettings) -> None:
    """Clear telegram_chat_id after a fatal delivery failure."""
    try:
        await db.execute(
            sql_update(RestaurantTelegramSettings)
            .where(RestaurantTelegramSettings.restaurant_id == tg_settings.restaurant_id)
            .values(telegram_chat_id=None)
        )
        await db.commit()
        logger.info(
            "Auto-disconnected Telegram for restaurant_id=%s after fatal send error",
            tg_settings.restaurant_id,
        )
    except Exception as exc:
        logger.error("Failed to auto-disconnect Telegram: %s", exc)


def _format_table_order(table_number: int, menu_name: str, items: list, total_price: int, comment: str | None, now_str: str) -> str:
    lines = [f"<b>🍽 Новый заказ — Стол №{table_number}</b>", f"📋 Меню: {menu_name}", ""]
    for item in items:
        name = item.get("name", "—")
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        lines.append(f"{name} x{qty} — {price}₸")
    lines += ["", f"💰 Итого: {total_price}₸"]
    if comment:
        lines.append(f"💬 {comment}")
    lines.append(f"⏰ {now_str}")
    return "\n".join(lines)


def _format_preorder(customer_name: str, customer_phone: str, menu_name: str, items: list,
                     total_price: int, comment: str | None, now_str: str) -> str:
    lines = [
        f"<b>📦 Предзаказ — {customer_name}</b>",
        f"📞 {customer_phone}",
        f"📋 Меню: {menu_name}",
        "",
    ]
    for item in items:
        name = item.get("name", "—")
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        lines.append(f"{name} x{qty} — {price}₸")
    lines += ["", f"💰 Итого: {total_price}₸"]
    if comment:
        lines.append(f"💬 {comment}")
    lines.append(f"⏰ {now_str}")
    return "\n".join(lines)


async def get_order_config(
    db: AsyncSession, restaurant: Restaurant
) -> RestaurantTelegramSettings | None:
    result = await db.execute(
        select(RestaurantTelegramSettings).where(
            RestaurantTelegramSettings.restaurant_id == restaurant.id
        )
    )
    return result.scalar_one_or_none()


async def create_order(
    db: AsyncSession,
    restaurant: Restaurant,
    menu: Menu,
    data: OrderCreate,
) -> Order:
    if restaurant.plan not in ("business", "pro"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Orders require Business or Pro plan",
        )

    tg_settings = await get_order_config(db, restaurant)
    if not tg_settings or tg_settings.telegram_chat_id is None:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Order feature not configured",
        )

    if data.order_type == "table" and not menu.orders_enabled:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Table orders are not enabled for this menu",
        )
    if data.order_type == "preorder" and not menu.preorders_enabled:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Pre-orders are not enabled for this menu",
        )

    items_data = [item.model_dump() for item in data.items]

    order = Order(
        restaurant_id=restaurant.id,
        menu_id=menu.id,
        order_type=data.order_type,
        table_number=data.table_number,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        items=items_data,
        total_price=data.total_price,
        comment=data.comment,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    now_str = datetime.now(tz=timezone(timedelta(hours=5))).strftime("%H:%M")
    if data.order_type == "table" and data.table_number is not None:
        msg = _format_table_order(data.table_number, menu.name, items_data, data.total_price, data.comment, now_str)
    else:
        msg = _format_preorder(
            data.customer_name or "—",
            data.customer_phone or "—",
            menu.name,
            items_data,
            data.total_price,
            data.comment,
            now_str,
        )
    result = await _send_telegram(tg_settings.telegram_chat_id, msg)
    if result is None:
        # Fatal error — bot is blocked/kicked. Best-effort warning before clearing.
        await _send_telegram(
            tg_settings.telegram_chat_id,
            "⚠️ Связь с ботом потеряна. Пожалуйста, переподключите Telegram в панели администратора qrmenus.kz",
        )
        await _auto_disconnect(db, tg_settings)

    return order
