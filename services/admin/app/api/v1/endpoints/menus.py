from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache_invalidator import invalidate_menu_cache
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.schemas.menu import MenuCreate, MenuResponse, MenuUpdate
from app.services.menu_service import MenuService

router = APIRouter()


@router.get("", response_model=list[MenuResponse])
async def list_menus(
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> list[MenuResponse]:
    service = MenuService(db)
    menus = await service.list_menus(current.id)
    return [MenuResponse.model_validate(m) for m in menus]


@router.post("", response_model=MenuResponse, status_code=status.HTTP_201_CREATED)
async def create_menu(
    data: MenuCreate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    service = MenuService(db)
    menu = await service.create_menu(current.id, data)
    await invalidate_menu_cache(current.slug)
    return MenuResponse.model_validate(menu)


@router.put("/{menu_id}", response_model=MenuResponse)
async def update_menu(
    menu_id: UUID,
    data: MenuUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    service = MenuService(db)
    menu = await service.update_menu(current.id, menu_id, data)
    await invalidate_menu_cache(current.slug)
    return MenuResponse.model_validate(menu)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu(
    menu_id: UUID,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = MenuService(db)
    await service.delete_menu(current.id, menu_id)
    await invalidate_menu_cache(current.slug)
