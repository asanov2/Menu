from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache_invalidator import invalidate_menu_cache
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.schemas.menu import (
    CategoryCreate,
    CategoryReorderItem,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.category_service import CategoryService

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    menu_id: UUID | None = Query(default=None),
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryResponse]:
    service = CategoryService(db)
    categories = await service.list_categories(current.id, menu_id)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    service = CategoryService(db)
    category = await service.create_category(current.id, data)
    await invalidate_menu_cache(current.slug)
    return CategoryResponse.model_validate(category)


@router.put("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_categories(
    items: list[CategoryReorderItem],
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = CategoryService(db)
    await service.reorder_categories(current.id, items)
    await invalidate_menu_cache(current.slug)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    service = CategoryService(db)
    category = await service.update_category(current.id, category_id, data)
    await invalidate_menu_cache(current.slug)
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = CategoryService(db)
    await service.delete_category(current.id, category_id)
    await invalidate_menu_cache(current.slug)
