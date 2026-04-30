# === FILE: services/billing/app/services/payment_service.py ===
import hashlib
import hmac
import logging
from decimal import Decimal
from uuid import UUID

logger = logging.getLogger(__name__)

PLAN_PRICES: dict[str, Decimal] = {
    "starter": Decimal("3900.00"),
    "business": Decimal("7900.00"),
    "pro": Decimal("14900.00"),
}


async def create_kaspi_payment(
    amount: Decimal,
    restaurant_id: UUID,
    order_id: UUID,
    plan: str,
) -> str:
    # TODO: replace with real Kaspi API after receiving credentials
    # Real flow: POST to Kaspi API → get payment_url
    logger.info(
        "kaspi_payment: mock payment created order=%s restaurant=%s amount=%s plan=%s",
        order_id,
        restaurant_id,
        amount,
        plan,
    )
    return f"https://pay.kaspi.kz/pay/mock-{order_id}"


async def create_cloudpayments_payment(
    amount: Decimal,
    restaurant_id: UUID,
    order_id: UUID,
    plan: str,
) -> str:
    # TODO: replace with real CloudPayments API after receiving credentials
    logger.info(
        "cloudpayments_payment: mock payment created order=%s restaurant=%s amount=%s plan=%s",
        order_id,
        restaurant_id,
        amount,
        plan,
    )
    return f"https://widget.cloudpayments.ru/pay/mock-{order_id}"


def verify_kaspi_signature(
    raw_body: bytes,
    signature_header: str,
    secret_key: str,
) -> bool:
    expected = hmac.new(
        secret_key.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)


def verify_cloudpayments_signature(
    raw_body: bytes,
    signature_header: str,
    secret_key: str,
) -> bool:
    import base64
    import hmac as hmac_module
    import hashlib as hashlib_module

    mac = hmac_module.new(
        secret_key.encode(),
        raw_body,
        hashlib_module.sha256,
    ).digest()
    expected = base64.b64encode(mac).decode()
    return hmac_module.compare_digest(expected, signature_header)
