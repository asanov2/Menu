from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rabbitmq import publish_menu_event
from app.schemas.menu import (
    CategoriesOnlyResponse,
    CategoryResponse,
    ItemsFilterResponse,
    MenuInfo,
    MenuPageResponse,
    RestaurantInfo,
)
from app.services.cache_service import (
    get_cached_categories,
    get_cached_items,
    get_cached_menu,
    set_cached_categories,
    set_cached_items,
    set_cached_menu,
)
from app.services.menu_service import MenuService

router = APIRouter()


@router.get("/{slug}", response_model=MenuPageResponse)
async def get_menu(
    request: Request,
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> MenuPageResponse:
    cached = await get_cached_menu(slug)
    if cached:
        return MenuPageResponse.model_validate(cached)

    service = MenuService(db)
    restaurant, menu = await service.get_full_menu(slug)

    visible_cats = [c for c in menu.categories if c.is_visible]

    response = MenuPageResponse(
        restaurant=RestaurantInfo.model_validate(restaurant),
        menu=MenuInfo.model_validate(menu),
        categories=[CategoryResponse.model_validate(c) for c in visible_cats],
    )

    # mode='json' serialises UUIDs to str for Redis storage
    await set_cached_menu(slug, response.model_dump(mode="json"))

    device_type = request.headers.get("User-Agent", "unknown")[:50]
    publish_menu_event("menu_view", str(restaurant.id), device_type=device_type)

    return response


@router.get("/{slug}/categories", response_model=list[CategoriesOnlyResponse])
async def get_categories(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> list[CategoriesOnlyResponse]:
    cached = await get_cached_categories(slug)
    if cached:
        return [CategoriesOnlyResponse(**c) for c in cached]

    service = MenuService(db)
    restaurant, menu = await service.get_full_menu(slug)
    categories = await service.get_categories(restaurant.id, menu.id)

    response = [CategoriesOnlyResponse.model_validate(c) for c in categories]
    await set_cached_categories(slug, [r.model_dump(mode="json") for r in response])
    return response


@router.get("/{slug}/items", response_model=list[ItemsFilterResponse])
async def get_items(
    slug: str,
    category_id: UUID | None = Query(default=None),
    available_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
) -> list[ItemsFilterResponse]:
    cached = await get_cached_items(slug, category_id, available_only)
    if cached:
        return [ItemsFilterResponse(**i) for i in cached]

    service = MenuService(db)
    restaurant, _ = await service.get_full_menu(slug)
    items = await service.get_items(restaurant.id, category_id, available_only)

    response = [ItemsFilterResponse.model_validate(i) for i in items]
    await set_cached_items(slug, category_id, available_only, [r.model_dump(mode="json") for r in response])
    return response
