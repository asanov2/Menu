import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.core.config import settings
from app.core.dependencies import get_db, get_current_subject, verify_internal_secret
from app.models.push_subscription import PushSubscription
from app.schemas.push import (
    SendPushRequest,
    SubscribeRequest,
    UnsubscribeRequest,
    VapidPublicKeyResponse,
)
from app.services.push_service import send_push

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/vapid-public-key", response_model=VapidPublicKeyResponse)
async def get_vapid_public_key() -> VapidPublicKeyResponse:
    return VapidPublicKeyResponse(public_key=settings.VAPID_PUBLIC_KEY)


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe(
    body: SubscribeRequest,
    subject: dict = Depends(get_current_subject),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stmt = (
        pg_insert(PushSubscription)
        .values(
            subject_type=subject["subject_type"],
            subject_id=subject["subject_id"],
            endpoint=body.endpoint,
            p256dh=body.keys.p256dh,
            auth_key=body.keys.auth,
            device_label=body.device_label,
        )
        .on_conflict_do_update(
            index_elements=["endpoint"],
            set_={
                "subject_type": subject["subject_type"],
                "subject_id": subject["subject_id"],
                "p256dh": body.keys.p256dh,
                "auth_key": body.keys.auth,
                "device_label": body.device_label,
            },
        )
    )
    await db.execute(stmt)
    await db.commit()
    logger.info(
        "Push subscription upserted: %s/%s",
        subject["subject_type"],
        subject["subject_id"],
    )
    return {"ok": True}


@router.delete("/unsubscribe", status_code=status.HTTP_200_OK)
async def unsubscribe(
    body: UnsubscribeRequest,
    subject: dict = Depends(get_current_subject),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        delete(PushSubscription)
        .where(
            PushSubscription.endpoint == body.endpoint,
            PushSubscription.subject_type == subject["subject_type"],
            PushSubscription.subject_id == subject["subject_id"],
        )
        .returning(PushSubscription.id)
    )
    deleted = result.fetchall()
    await db.commit()
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    return {"ok": True}


@router.post("/internal/send-push", dependencies=[Depends(verify_internal_secret)])
async def send_push_endpoint(
    body: SendPushRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    payload = {"title": body.title, "body": body.body}
    if body.data:
        payload["data"] = body.data
    count = await send_push(
        subject_type=body.subject_type,
        subject_id=body.subject_id,
        payload=payload,
        db=db,
    )
    return {"ok": True, "sent": count}
