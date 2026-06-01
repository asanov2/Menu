import base64
import json
import logging

from pywebpush import Vapid01, WebPushException, webpush
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)


def _get_vapid_key() -> Vapid01:
    """Load VAPID private key from base64-encoded PEM via Vapid01.from_pem()."""
    return Vapid01.from_pem(base64.b64decode(settings.VAPID_PRIVATE_KEY))


async def send_push(
    subject_type: str,
    subject_id: str,
    payload: dict,
    db: AsyncSession,
) -> int:
    """Send web push to all subscriptions of a subject. Returns sent count."""
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.subject_type == subject_type,
            PushSubscription.subject_id == subject_id,
        )
    )
    subscriptions = result.scalars().all()

    if not subscriptions:
        logger.debug("No push subscriptions for %s/%s", subject_type, subject_id)
        return 0

    vapid_key = _get_vapid_key()
    sent = 0

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth_key},
                },
                data=json.dumps(payload),
                vapid_private_key=vapid_key,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
            sent += 1
        except WebPushException as exc:
            resp_status = exc.response.status_code if exc.response is not None else None
            if resp_status in (404, 410):
                logger.info(
                    "Removing stale push subscription endpoint=...%s (HTTP %s)",
                    sub.endpoint[-30:],
                    resp_status,
                )
                await db.execute(
                    delete(PushSubscription).where(PushSubscription.id == sub.id)
                )
                await db.commit()
            else:
                logger.warning(
                    "WebPush failed for endpoint=...%s: %s",
                    sub.endpoint[-30:],
                    exc,
                )
        except Exception as exc:
            logger.warning(
                "Unexpected push error for endpoint=...%s: %s",
                sub.endpoint[-30:],
                exc,
            )

    return sent
