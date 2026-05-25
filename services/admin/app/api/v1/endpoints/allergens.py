from fastapi import APIRouter, Depends

from app.core.allergens import ALLERGENS, AllergenInfo
from app.core.dependencies import get_current_restaurant

router = APIRouter()


@router.get("", response_model=list[AllergenInfo])
async def list_allergens(
    _current=Depends(get_current_restaurant),
) -> list[AllergenInfo]:
    return ALLERGENS
