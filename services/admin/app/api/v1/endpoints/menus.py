from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache_invalidator import invalidate_menu_cache
from app.core.database import get_db
from app.core.dependencies import CurrentRestaurant, get_current_restaurant
from app.schemas.menu import MenuCreate, MenuListWithUsageResponse, MenuOrderSettingsUpdate, MenuResponse, MenuUpdate
from app.services.menu_service import MenuService

router = APIRouter()


@router.get("", response_model=MenuListWithUsageResponse)
async def list_menus(
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuListWithUsageResponse:
    service = MenuService(db)
    menus = await service.list_menus(current.id)
    usage = await service.get_plan_usage(current.id, current.plan)
    return MenuListWithUsageResponse(
        menus=[MenuResponse.model_validate(m) for m in menus],
        usage=usage,
    )


@router.post("", response_model=MenuResponse, status_code=status.HTTP_201_CREATED)
async def create_menu(
    data: MenuCreate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    service = MenuService(db)
    menu = await service.create_menu(current.id, current.plan, data)
    await invalidate_menu_cache(current.slug)
    return MenuResponse.model_validate(menu)


@router.get("/{menu_id}", response_model=MenuResponse)
async def get_menu(
    menu_id: UUID,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    service = MenuService(db)
    menu = await service.get_menu(current.id, menu_id)
    return MenuResponse.model_validate(menu)


@router.put("/{menu_id}", response_model=MenuResponse)
async def update_menu(
    menu_id: UUID,
    data: MenuUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    service = MenuService(db)
    menu = await service.update_menu(current.id, menu_id, current.plan, data)
    await invalidate_menu_cache(current.slug)
    return MenuResponse.model_validate(menu)


@router.patch("/{menu_id}/order-settings", response_model=MenuResponse)
async def update_order_settings(
    menu_id: UUID,
    data: MenuOrderSettingsUpdate,
    current: CurrentRestaurant = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    if current.plan not in ("business", "pro"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order features require Business or Pro plan")
    service = MenuService(db)
    menu = await service.get_menu(current.id, menu_id)
    menu.orders_enabled = data.orders_enabled
    menu.preorders_enabled = data.preorders_enabled
    menu.tables_count = max(1, data.tables_count)
    menu.waiter_call_enabled = data.waiter_call_enabled
    menu.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(menu)
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
