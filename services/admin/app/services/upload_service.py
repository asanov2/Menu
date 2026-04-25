import io
import uuid

from fastapi import HTTPException, status
from PIL import Image

from app.core.config import settings
from app.core.minio_client import ensure_bucket_exists, get_minio_client

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


async def upload_image(file_content: bytes, content_type: str) -> dict[str, str]:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 5MB",
        )

    image = Image.open(io.BytesIO(file_content))
    image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

    output = io.BytesIO()
    fmt = _CONTENT_TYPE_TO_FORMAT[content_type]
    save_kwargs = {"format": fmt}
    if fmt == "JPEG":
        save_kwargs["quality"] = 85
    image.save(output, **save_kwargs)
    thumbnail_bytes = output.getvalue()

    ext = _CONTENT_TYPE_TO_EXT[content_type]
    key = f"items/{uuid.uuid4()}.{ext}"

    await ensure_bucket_exists()
    async with get_minio_client() as client:
        await client.put_object(
            Bucket=settings.minio_bucket,
            Key=key,
            Body=thumbnail_bytes,
            ContentType=content_type,
            ContentLength=len(thumbnail_bytes),
        )

    url = f"{settings.minio_public_url}/{settings.minio_bucket}/{key}"
    return {"url": url, "key": key}
