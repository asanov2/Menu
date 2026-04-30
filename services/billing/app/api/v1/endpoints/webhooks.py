# === FILE: services/billing/app/api/v1/endpoints/webhooks.py ===
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_auth_db, get_db
from app.services.payment_service import verify_cloudpayments_signature, verify_kaspi_signature
from app.services.subscription_service import process_successful_payment

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/webhook/kaspi")
async def kaspi_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_db: AsyncSession = Depends(get_auth_db),
    x_kaspi_signature: str = Header(default=""),
    x_kaspi_timestamp: str = Header(default=""),
) -> Response:
    try:
        raw_body = await request.body()
        payload: dict[str, Any] = await request.json()

        if not verify_kaspi_signature(
            raw_body, x_kaspi_signature, x_kaspi_timestamp, settings.KASPI_WEBHOOK_SECRET
        ):
            logger.warning("kaspi_webhook: invalid signature")
            return Response(content='{"status":"ok"}', media_type="application/json")

        transaction_id: str = payload.get("transactionId", "")
        restaurant_id_raw: str = payload.get("restaurantId", "")
        kaspi_status: str = payload.get("status", "")

        if kaspi_status.lower() != "success":
            logger.info("kaspi_webhook: non-success status=%s transaction=%s", kaspi_status, transaction_id)
            return Response(content='{"status":"ok"}', media_type="application/json")

        if not transaction_id or not restaurant_id_raw:
            logger.warning("kaspi_webhook: missing transactionId or restaurantId in payload")
            return Response(content='{"status":"ok"}', media_type="application/json")

        await process_successful_payment(
            provider_transaction_id=transaction_id,
            raw_payload=payload,
            restaurant_id=UUID(restaurant_id_raw),
            db=db,
            auth_db=auth_db,
        )
    except Exception as exc:
        logger.exception("kaspi_webhook: unhandled error: %s", exc)

    return Response(content='{"status":"ok"}', media_type="application/json")


@router.post("/webhook/cloudpayments")
async def cloudpayments_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_db: AsyncSession = Depends(get_auth_db),
    x_cloudpayments_hmac_sha256: str = Header(default=""),
) -> Response:
    try:
        raw_body = await request.body()
        payload: dict[str, Any] = await request.json()

        if not verify_cloudpayments_signature(
            raw_body, x_cloudpayments_hmac_sha256, settings.CLOUDPAYMENTS_WEBHOOK_SECRET
        ):
            logger.warning("cloudpayments_webhook: invalid signature")
            return Response(content='{"code":0}', media_type="application/json")

        transaction_id: str = str(payload.get("TransactionId", ""))
        restaurant_id_raw: str = payload.get("InvoiceId", "")
        cp_status: str = payload.get("Status", "")

        if cp_status.lower() != "completed":
            logger.info(
                "cloudpayments_webhook: non-completed status=%s transaction=%s", cp_status, transaction_id
            )
            return Response(content='{"code":0}', media_type="application/json")

        if not transaction_id or not restaurant_id_raw:
            logger.warning("cloudpayments_webhook: missing TransactionId or InvoiceId")
            return Response(content='{"code":0}', media_type="application/json")

        await process_successful_payment(
            provider_transaction_id=transaction_id,
            raw_payload=payload,
            restaurant_id=UUID(restaurant_id_raw),
            db=db,
            auth_db=auth_db,
        )
    except Exception as exc:
        logger.exception("cloudpayments_webhook: unhandled error: %s", exc)

    return Response(content='{"code":0}', media_type="application/json")
