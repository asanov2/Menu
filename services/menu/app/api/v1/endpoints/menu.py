from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rabbitmq import publish_menu_event
from app.schemas.menu import (
    CategoriesOnlyResponse,
    ItemsFilterResponse,
    MenuResponse,
)
from app.services.cache_service import get_cached_menu, set_cached_menu
from app.services.menu_service import MenuService

router = APIRouter()


@router.get("/{slug}", response_model=MenuResponse)
async def get_menu(
    request: Request,
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> MenuResponse:
    cached = await get_cached_menu(slug)
    if cached:
        return MenuResponse(**cached)

    service = MenuService(db)
    restaurant, menu = await service.get_full_menu(slug)

    # Eagerly load categories + items via ORM relationships (selectin loaded)
    response = MenuResponse.model_validate(menu)
    await set_cached_menu(slug, response.model_dump())

    device_type = request.headers.get("User-Agent", "unknown")[:50]
    publish_menu_event("menu_view", str(restaurant.id), device_type=device_type)

    return response


@router.get("/{slug}/categories", response_model=list[CategoriesOnlyResponse])
async def get_categories(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> list[CategoriesOnlyResponse]:
    service = MenuService(db)
    restaurant, menu = await service.get_full_menu(slug)
    categories = await service.get_categories(restaurant.id, menu.id)
    return [CategoriesOnlyResponse.model_validate(c) for c in categories]


@router.get("/{slug}/items", response_model=list[ItemsFilterResponse])
async def get_items(
    slug: str,
    category_id: UUID | None = Query(default=None),
    available_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
) -> list[ItemsFilterResponse]:
    service = MenuService(db)
    restaurant, _ = await service.get_full_menu(slug)
    items = await service.get_items(restaurant.id, category_id, available_only)
    return [ItemsFilterResponse.model_validate(i) for i in items]
