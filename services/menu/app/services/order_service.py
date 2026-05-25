import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.menu import Restaurant
from app.models.order import Order, RestaurantTelegramSettings
from app.schemas.order import OrderCreate

logger = logging.getLogger(__name__)

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


async def _send_telegram(chat_id: int, text: str) -> None:
    token = getattr(settings, "telegram_bot_token", "")
    if not token:
        return
    url = _TELEGRAM_API.format(token=token)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
            )
            if resp.status_code != 200:
                logger.error("Telegram API error %s: %s", resp.status_code, resp.text)
    except Exception as exc:
        logger.error("Failed to send Telegram notification: %s", exc)


def _format_table_order(table_number: int, items: list, total_price: int, now_str: str) -> str:
    lines = [f"<b>🍽 Новый заказ — Стол №{table_number}</b>", ""]
    for item in items:
        name = item.get("name", "—")
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        lines.append(f"{name} x{qty} — {price}₸")
    lines += ["", f"💰 Итого: {total_price}₸", f"⏰ {now_str}"]
    return "\n".join(lines)


def _format_preorder(customer_name: str, customer_phone: str, items: list,
                     total_price: int, comment: str | None, now_str: str) -> str:
    lines = [
        f"<b>📦 Предзаказ — {customer_name}</b>",
        f"📞 {customer_phone}",
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
    menu_id,
    data: OrderCreate,
) -> Order:
    if restaurant.plan not in ("business", "pro"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Orders require Business or Pro plan",
        )

    tg_settings = await get_order_config(db, restaurant)
    if not tg_settings:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Order feature not configured",
        )

    if data.order_type == "table" and not tg_settings.orders_enabled:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Table orders are not enabled for this restaurant",
        )
    if data.order_type == "preorder" and not tg_settings.preorders_enabled:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Pre-orders are not enabled for this restaurant",
        )

    items_data = [item.model_dump() for item in data.items]

    order = Order(
        restaurant_id=restaurant.id,
        menu_id=menu_id,
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

    if tg_settings.telegram_chat_id:
        now_str = datetime.now(tz=timezone(timedelta(hours=5))).strftime("%H:%M")
        if data.order_type == "table" and data.table_number is not None:
            msg = _format_table_order(data.table_number, items_data, data.total_price, now_str)
        else:
            msg = _format_preorder(
                data.customer_name or "—",
                data.customer_phone or "—",
                items_data,
                data.total_price,
                data.comment,
                now_str,
            )
        await _send_telegram(tg_settings.telegram_chat_id, msg)

    return order
