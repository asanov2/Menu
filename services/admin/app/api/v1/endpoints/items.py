from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache_invalidator import invalidate_menu_cache
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.schemas.menu import ItemCreate, ItemReorderItem, ItemResponse, ItemUpdate
from app.services.item_service import ItemService

router = APIRouter()


@router.get("", response_model=list[ItemResponse])
async def list_items(
    category_id: UUID | None = Query(default=None),
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[ItemResponse]:
    service = ItemService(db)
    items = await service.list_items(current.id, category_id)
    return [ItemResponse.model_validate(i) for i in items]


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ItemCreate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> ItemResponse:
    service = ItemService(db)
    item = await service.create_item(current.id, current.plan, data)
    await invalidate_menu_cache(current.slug)
    return ItemResponse.model_validate(item)


@router.put("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_items(
    items: list[ItemReorderItem],
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = ItemService(db)
    await service.reorder_items(current.id, items)
    await invalidate_menu_cache(current.slug)


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID,
    data: ItemUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> ItemResponse:
    service = ItemService(db)
    item = await service.update_item(current.id, item_id, data)
    await invalidate_menu_cache(current.slug)
    return ItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = ItemService(db)
    await service.delete_item(current.id, item_id)
    await invalidate_menu_cache(current.slug)


@router.patch("/{item_id}/toggle-available", response_model=ItemResponse)
async def toggle_available(
    item_id: UUID,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> ItemResponse:
    service = ItemService(db)
    item = await service.toggle_available(current.id, item_id)
    await invalidate_menu_cache(current.slug)
    return ItemResponse.model_validate(item)
