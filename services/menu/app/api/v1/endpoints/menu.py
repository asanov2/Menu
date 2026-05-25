from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.allergens import ALLERGENS, AllergenInfo
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
from app.schemas.order import OrderConfigResponse, OrderCreate, OrderResponse
from app.services.cache_service import (
    get_cached_categories,
    get_cached_items,
    get_cached_menu,
    set_cached_categories,
    set_cached_items,
    set_cached_menu,
)
from app.services.menu_service import MenuService
from app.services.order_service import create_order as _create_order, get_order_config as _get_order_config

router = APIRouter()


@router.get("/allergens", response_model=list[AllergenInfo])
async def list_allergens() -> list[AllergenInfo]:
    return ALLERGENS

_MOBILE_KEYWORDS = (
    "mobile", "android", "iphone", "ipad",
    "ipod", "blackberry", "windows phone",
)


def detect_device_type(user_agent: str) -> str:
    ua = user_agent.lower()
    return "mobile" if any(kw in ua for kw in _MOBILE_KEYWORDS) else "desktop"


class WaiterCallRequest(BaseModel):
    table: int


@router.get("/{slug}", response_model=MenuPageResponse)
async def get_menu(
    request: Request,
    slug: str,
    lang: str = Query(default="ru"),
    menu_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> MenuPageResponse:
    if menu_id is None:
        cached = await get_cached_menu(slug, language=lang)
        if cached:
            return MenuPageResponse.model_validate(cached)

    service = MenuService(db)
    restaurant, menu = await service.get_full_menu(slug, menu_id=menu_id, lang=lang)

    visible_cats = sorted(
        [c for c in menu.categories if c.is_visible],
        key=lambda c: c.sort_order,
    )
    for cat in visible_cats:
        cat.items = sorted(cat.items, key=lambda i: i.sort_order)

    categories_response = [CategoryResponse.model_validate(c) for c in visible_cats]

    # Apply translations when a non-base language is requested
    if lang and lang != "ru":
        cat_ids = [c.id for c in visible_cats]
        item_ids = [UUID(str(item.id)) for c in visible_cats for item in c.items]
        cat_trans, item_trans = await service.get_translations(cat_ids, item_ids, lang)

        for cat_resp, cat_orm in zip(categories_response, visible_cats):
            if cat_orm.id in cat_trans:
                cat_resp.name = cat_trans[cat_orm.id]
            for item_resp in cat_resp.items:
                item_uuid = UUID(str(item_resp.id))
                if item_uuid in item_trans:
                    translated_name, translated_desc = item_trans[item_uuid]
                    item_resp.name = translated_name
                    if translated_desc is not None:
                        item_resp.description = translated_desc

    response = MenuPageResponse(
        restaurant=RestaurantInfo.model_validate(restaurant),
        menu=MenuInfo.model_validate(menu),
        categories=categories_response,
    )

    if menu_id is None:
        await set_cached_menu(slug, response.model_dump(mode="json"), language=lang)

    device_type = detect_device_type(request.headers.get("User-Agent", ""))
    publish_menu_event("menu_view", str(restaurant.id), device_type=device_type)

    return response


@router.post("/{slug}/call-waiter", status_code=status.HTTP_204_NO_CONTENT)
async def call_waiter(
    slug: str,
    body: WaiterCallRequest,
) -> None:
    pass


@router.post("/{slug}/items/{item_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def track_item_view(
    request: Request,
    slug: str,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    cached = await get_cached_menu(slug)
    if cached:
        restaurant_id = cached.get("restaurant", {}).get("id")
    else:
        service = MenuService(db)
        try:
            restaurant, _ = await service.get_full_menu(slug)
            restaurant_id = str(restaurant.id)
        except Exception:
            return
    device_type = detect_device_type(request.headers.get("User-Agent", ""))
    publish_menu_event("item_view", str(restaurant_id), item_id=str(item_id), device_type=device_type)


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


@router.get("/{slug}/order-config", response_model=OrderConfigResponse)
async def get_order_config(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> OrderConfigResponse:
    service = MenuService(db)
    restaurant, _ = await service.get_full_menu(slug)
    tg_settings = await _get_order_config(db, restaurant)
    if not tg_settings or restaurant.plan not in ("business", "pro"):
        return OrderConfigResponse(orders_enabled=False, preorders_enabled=False, tables_count=10)
    return OrderConfigResponse(
        orders_enabled=tg_settings.orders_enabled,
        preorders_enabled=tg_settings.preorders_enabled,
        tables_count=tg_settings.tables_count,
    )


@router.post("/{slug}/order", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    slug: str,
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    service = MenuService(db)
    restaurant, menu = await service.get_full_menu(slug)
    order = await _create_order(db, restaurant, menu.id, body)
    msg = "Заказ принят! Ожидайте звонка" if body.order_type == "preorder" else "Заказ передан на кухню"
    return OrderResponse(order_id=str(order.id), message=msg)
