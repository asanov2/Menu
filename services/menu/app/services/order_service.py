import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status as http_status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis_client import get_redis
from app.models.menu import Menu, Restaurant, WaiterCall
from app.models.order import Order, RestaurantTelegramSettings, TelegramRecipient
from app.schemas.order import OrderCreate

logger = logging.getLogger(__name__)

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


async def _fire_push(subject_type: str, subject_id: str, title: str, body: str, data: dict) -> None:
    """Send push notification via notification-service. Catches all errors — never propagates."""
    ntf_url = settings.notification_service_url
    if not ntf_url:
        return
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{ntf_url}/api/v1/push/internal/send-push",
                json={
                    "subject_type": subject_type,
                    "subject_id": subject_id,
                    "title": title,
                    "body": body,
                    "data": data,
                },
                headers={"X-Internal-Secret": settings.internal_secret},
            )
    except Exception as exc:
        logger.warning("Push notification skipped: %s", exc)

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
      None  — fatal failure (403 / chat not found), caller must remove this recipient
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
                return None
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
    return False


async def _auto_disconnect_recipient(db: AsyncSession, chat_id: int) -> None:
    """Remove only the specific recipient after a fatal delivery failure."""
    try:
        await db.execute(
            delete(TelegramRecipient).where(TelegramRecipient.chat_id == chat_id)
        )
        await db.commit()
        logger.info(
            "Auto-removed Telegram recipient chat_id=%s after fatal send error", chat_id
        )
    except Exception as exc:
        logger.error("Failed to auto-remove Telegram recipient: %s", exc)


def _format_table_order(
    table_number: int, menu_name: str, items: list,
    total_price: int, comment: str | None, now_str: str,
) -> str:
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


def _format_preorder(
    customer_name: str, customer_phone: str, menu_name: str, items: list,
    total_price: int, comment: str | None, now_str: str,
) -> str:
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


async def get_recipients(db: AsyncSession, restaurant_id) -> list[TelegramRecipient]:
    result = await db.execute(
        select(TelegramRecipient).where(TelegramRecipient.restaurant_id == restaurant_id)
    )
    return list(result.scalars().all())


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

    recipients = await get_recipients(db, restaurant.id)
    now_str = datetime.now(tz=timezone(timedelta(hours=5))).strftime("%H:%M")
    if data.order_type == "table" and data.table_number is not None:
        msg = _format_table_order(
            data.table_number, menu.name, items_data, data.total_price, data.comment, now_str
        )
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

    # Send to ALL recipients; on fatal error remove only that specific recipient
    for recipient in recipients:
        result = await _send_telegram(recipient.chat_id, msg)
        if result is None:
            await _send_telegram(
                recipient.chat_id,
                "⚠️ Связь с ботом потеряна. Пожалуйста, переподключите Telegram в панели администратора qrmenus.kz",
            )
            await _auto_disconnect_recipient(db, recipient.chat_id)

    item_count = len(items_data)
    if data.order_type == "table" and data.table_number is not None:
        push_body = f"Стол №{data.table_number} · {item_count} поз. · {data.total_price}₸"
    else:
        push_body = f"Предзаказ: {data.customer_name or '—'} · {item_count} поз. · {data.total_price}₸"
    await _fire_push(
        "restaurant", str(restaurant.id),
        "Новый заказ", push_body,
        {"type": "order", "order_id": str(order.id)},
    )

    return order


def _format_waiter_call(table_number: int, menu_name: str, now_str: str) -> str:
    return f"<b>🔔 Вызов официанта — Стол №{table_number}</b>\n📋 Меню: {menu_name}\n⏰ {now_str}"


async def check_waiter_cooldown(menu_id: object, table_number: int) -> None:
    """Block duplicate waiter calls within 60 s per (menu, table) via Redis NX key."""
    key = f"waiter_call:{menu_id}:{table_number}"
    try:
        redis = await get_redis()
        set_ok = await redis.set(key, 1, nx=True, ex=60)
        if set_ok is None:
            ttl = await redis.ttl(key)
            raise HTTPException(
                status_code=http_status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Официант уже вызван, подождите {max(ttl, 1)} сек",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Redis waiter cooldown check failed: %s", exc)


async def create_waiter_call(
    db: AsyncSession,
    restaurant: Restaurant,
    menu: Menu,
    table_number: int,
) -> WaiterCall:
    if restaurant.plan not in ("business", "pro"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Waiter call requires Business or Pro plan")

    if not menu.waiter_call_enabled:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Waiter call is not enabled for this menu")

    if table_number < 1 or table_number > menu.tables_count:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"table_number must be between 1 and {menu.tables_count}",
        )

    await check_waiter_cooldown(menu.id, table_number)

    call = WaiterCall(
        restaurant_id=restaurant.id,
        menu_id=menu.id,
        table_number=table_number,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    recipients = await get_recipients(db, restaurant.id)
    now_str = datetime.now(tz=timezone(timedelta(hours=5))).strftime("%H:%M")
    msg = _format_waiter_call(table_number, menu.name, now_str)

    for recipient in recipients:
        result = await _send_telegram(recipient.chat_id, msg)
        if result is None:
            await _auto_disconnect_recipient(db, recipient.chat_id)

    await _fire_push(
        "restaurant", str(restaurant.id),
        "Вызов официанта", f"Стол №{table_number}",
        {"type": "waiter_call"},
    )

    return call
