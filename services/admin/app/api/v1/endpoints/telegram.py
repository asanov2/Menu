import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.models.telegram import RestaurantTelegramSettings
from app.schemas.telegram import (
    GenerateCodeResponse,
    TelegramSettingsUpdate,
    TelegramStatusResponse,
    WebhookUpdate,
)
from app.services import telegram_service

logger = logging.getLogger(__name__)

router_admin = APIRouter()
router_webhook = APIRouter()

_CODE_TTL_SECONDS = 600  # 10 minutes


# ── Admin endpoints (require auth) ──────────────────────────────────────────

@router_admin.post("/generate-code", response_model=GenerateCodeResponse)
async def generate_code(
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> GenerateCodeResponse:
    code = await telegram_service.generate_connect_code(db, current.id)
    return GenerateCodeResponse(
        code=code,
        expires_in=_CODE_TTL_SECONDS,
        bot_username=settings.telegram_bot_username,
    )


@router_admin.get("/status", response_model=TelegramStatusResponse)
async def get_status(
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> TelegramStatusResponse:
    result = await db.execute(
        select(RestaurantTelegramSettings).where(
            RestaurantTelegramSettings.restaurant_id == current.id
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        return TelegramStatusResponse(
            connected=False,
            chat_id=None,
            orders_enabled=False,
            preorders_enabled=False,
            tables_count=10,
            bot_username=settings.telegram_bot_username,
        )
    return TelegramStatusResponse(
        connected=row.telegram_chat_id is not None,
        chat_id=row.telegram_chat_id,
        orders_enabled=row.orders_enabled,
        preorders_enabled=row.preorders_enabled,
        tables_count=row.tables_count,
        bot_username=settings.telegram_bot_username,
    )


@router_admin.patch("/settings", status_code=status.HTTP_200_OK)
async def update_settings(
    body: TelegramSettingsUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if current.plan not in ("business", "pro"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Order features require Business or Pro plan",
        )
    row = await telegram_service.get_or_create_settings(db, current.id)
    row.orders_enabled = body.orders_enabled
    row.preorders_enabled = body.preorders_enabled
    row.tables_count = max(1, body.tables_count)
    row.updated_at = datetime.utcnow()
    await db.commit()
    return {"ok": True}


@router_admin.delete("/disconnect", status_code=status.HTTP_200_OK)
async def disconnect_telegram(
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await telegram_service.disconnect(db, current.id)
    return {"ok": True}


# ── Webhook endpoint (no auth) ───────────────────────────────────────────────

@router_webhook.post("/webhook", status_code=status.HTTP_200_OK)
async def telegram_webhook(
    update: WebhookUpdate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Bot was blocked / kicked / removed — auto-disconnect the restaurant
    if update.my_chat_member:
        mcm = update.my_chat_member
        new_status = mcm.get("new_chat_member", {}).get("status", "")
        chat_id: int | None = mcm.get("chat", {}).get("id")
        if chat_id and new_status in ("kicked", "left", "banned"):
            disconnected = await telegram_service.disconnect_by_chat_id(db, chat_id)
            if disconnected:
                logger.info(
                    "Auto-disconnected restaurant via my_chat_member status=%s chat_id=%s",
                    new_status, chat_id,
                )
        return {"ok": True}

    message = update.message
    if not message:
        return {"ok": True}

    chat_id = message.get("chat", {}).get("id")
    text: str = message.get("text", "").strip().replace(" ", "")

    if not chat_id:
        return {"ok": True}

    if text == "/start":
        await telegram_service.send_message(
            chat_id,
            "Привет! Введите код подключения из вашей админ-панели qrmenus.kz",
        )
        return {"ok": True}

    if text.isdigit() and len(text) == 6:
        activated = await telegram_service.activate_connect_code(db, text, chat_id)
        if activated:
            await telegram_service.send_message(
                chat_id,
                "✅ Ресторан подключён! Теперь вы будете получать уведомления.",
            )
        else:
            await telegram_service.send_message(
                chat_id,
                "Код не найден или истёк. Сгенерируйте новый в админ-панели.",
            )
        return {"ok": True}

    await telegram_service.send_message(
        chat_id,
        "Введите код подключения из вашей админ-панели qrmenus.kz",
    )
    return {"ok": True}
