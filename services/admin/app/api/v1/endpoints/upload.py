from fastapi import APIRouter, Depends, File, UploadFile

from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.schemas.menu import UploadResponse
from app.services.upload_service import upload_image

router = APIRouter()


@router.post("/image", response_model=UploadResponse)
async def upload_image_endpoint(
    file: UploadFile = File(...),
    current: CurrentRestaurant = Depends(get_current_restaurant),
) -> UploadResponse:
    content = await file.read()
    result = await upload_image(content, file.content_type or "")
    return UploadResponse(**result)
