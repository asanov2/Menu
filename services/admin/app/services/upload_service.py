import io
import uuid
from functools import partial

from fastapi import HTTPException, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.minio_client import get_minio_client

# fix #7: decompression bomb protection — limits decoded pixel count
Image.MAX_IMAGE_PIXELS = 50_000_000  # ~7070x7070 px

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
THUMBNAIL_SIZE = (400, 400)

_CONTENT_TYPE_TO_FORMAT = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}
_CONTENT_TYPE_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _process_image(file_content: bytes, content_type: str) -> bytes:
    """Pure sync function — runs in thread pool via run_in_executor."""
    # fix #7: catch decompression bomb and unidentified images
    try:
        image = Image.open(io.BytesIO(file_content))
        image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    except UnidentifiedImageError:
        raise ValueError("Cannot identify image file")

    output = io.BytesIO()
    fmt = _CONTENT_TYPE_TO_FORMAT[content_type]
    save_kwargs: dict = {"format": fmt}
    if fmt == "JPEG":
        save_kwargs["quality"] = 85
    image.save(output, **save_kwargs)
    return output.getvalue()


async def upload_image(file_content: bytes, content_type: str) -> dict[str, str]:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 5MB",
        )

    # fix #2: Pillow runs in a thread pool so it doesn't block the event loop
    import asyncio

    loop = asyncio.get_event_loop()
    try:
        thumbnail_bytes = await loop.run_in_executor(
            None, partial(_process_image, file_content, content_type)
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    ext = _CONTENT_TYPE_TO_EXT[content_type]
    key = f"items/{uuid.uuid4()}.{ext}"

    # fix #22: ensure_bucket_exists() removed — called once at startup in lifespan
    async with get_minio_client() as client:
        await client.put_object(
            Bucket=settings.minio_bucket,
            Key=key,
            Body=thumbnail_bytes,
            ContentType=content_type,
            ContentLength=len(thumbnail_bytes),
        )

    url = f"/images/{key}"
    return {"url": url, "key": key}
