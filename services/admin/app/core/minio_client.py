from contextlib import asynccontextmanager
from typing import AsyncGenerator

import aiobotocore.session

from app.core.config import settings

_session: aiobotocore.session.AioSession | None = None


def _get_session() -> aiobotocore.session.AioSession:
    global _session
    if _session is None:
        _session = aiobotocore.session.get_session()
    return _session


@asynccontextmanager
async def get_minio_client() -> AsyncGenerator:
    session = _get_session()
    async with session.create_client(
        "s3",
        endpoint_url=settings.minio_endpoint_url,
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        region_name="us-east-1",
    ) as client:
        yield client


async def ensure_bucket_exists() -> None:
    async with get_minio_client() as client:
        try:
            await client.head_bucket(Bucket=settings.minio_bucket)
        except Exception:
            await client.create_bucket(Bucket=settings.minio_bucket)
