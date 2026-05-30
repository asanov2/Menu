from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.plan_errors import items_limit_error, language_limit_error, menus_limit_error
from app.core.plan_limits import get_allowed_languages, get_limits
from app.models.menu import Category, Item, Menu
from app.schemas.menu import MenuCreate, MenuUpdate, PlanUsageResponse


class MenuService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_menus(self, restaurant_id: UUID) -> list[dict]:
        items_count_sq = (
            select(func.count(Item.id))
            .join(Category, Item.category_id == Category.id)
            .where(
                Category.menu_id == Menu.id,
                Item.deleted_at.is_(None),
                Category.deleted_at.is_(None),
            )
            .correlate(Menu)
            .scalar_subquery()
        )

        result = await self._db.execute(
            select(Menu, items_count_sq.label("items_count"))
            .where(
                Menu.restaurant_id == restaurant_id,
                Menu.deleted_at.is_(None),
            )
            .order_by(Menu.created_at)
        )

        return [
            {
                "id": menu.id,
                "restaurant_id": menu.restaurant_id,
                "name": menu.name,
                "is_default": menu.is_default,
                "language": menu.language,
                "orders_enabled": menu.orders_enabled,
                "preorders_enabled": menu.preorders_enabled,
                "tables_count": menu.tables_count,
                "items_count": count or 0,
                "created_at": menu.created_at,
                "updated_at": menu.updated_at,
            }
            for menu, count in result.all()
        ]

    async def get_menu(self, restaurant_id: UUID, menu_id: UUID) -> Menu:
        result = await self._db.execute(
            select(Menu).where(
                and_(
                    Menu.id == menu_id,
                    Menu.restaurant_id == restaurant_id,
                    Menu.deleted_at == None,  # noqa: E711
                )
            )
        )
        menu = result.scalar_one_or_none()
        if not menu:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
        return menu

    async def create_menu(self, restaurant_id: UUID, plan: str, data: MenuCreate) -> Menu:
        limits = get_limits(plan)

        # Check language first — more specific error, shown regardless of menu count
        allowed_langs = get_allowed_languages(plan)
        if data.language not in allowed_langs:
            raise language_limit_error(plan, data.language)

        if limits.max_menus is not None:
            count_result = await self._db.execute(
                select(func.count(Menu.id)).where(
                    Menu.restaurant_id == restaurant_id,
                    Menu.deleted_at.is_(None),
                )
            )
            current_count: int = count_result.scalar_one()
            if current_count >= limits.max_menus:
                raise menus_limit_error(plan)

        if data.is_default:
            await self._unset_default(restaurant_id)

        menu = Menu(
            restaurant_id=restaurant_id,
            name=data.name,
            is_default=data.is_default,
            language=data.language,
        )
        self._db.add(menu)
        await self._db.commit()
        await self._db.refresh(menu)
        return menu

    async def update_menu(self, restaurant_id: UUID, menu_id: UUID, plan: str, data: MenuUpdate) -> Menu:
        menu = await self.get_menu(restaurant_id, menu_id)

        if data.language is not None:
            allowed_langs = get_allowed_languages(plan)
            if data.language not in allowed_langs:
                raise language_limit_error(plan, data.language)

        if data.is_default is True:
            await self._unset_default(restaurant_id)

        # fix #17: exclude_unset so explicit null values are written to DB
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(menu, field, value)

        await self._db.commit()
        await self._db.refresh(menu)
        return menu

    async def get_plan_usage(self, restaurant_id: UUID, plan: str) -> PlanUsageResponse:
        limits = get_limits(plan)

        menus_result = await self._db.execute(
            select(func.count(Menu.id)).where(
                Menu.restaurant_id == restaurant_id,
                Menu.deleted_at.is_(None),
            )
        )
        menus_used: int = menus_result.scalar_one()

        items_result = await self._db.execute(
            select(func.count(Item.id)).where(
                Item.restaurant_id == restaurant_id,
                Item.deleted_at.is_(None),
            )
        )
        items_used: int = items_result.scalar_one()

        return PlanUsageResponse(
            menus_used=menus_used,
            menus_limit=limits.max_menus,
            items_used=items_used,
            items_limit=limits.max_items,
        )

    async def delete_menu(self, restaurant_id: UUID, menu_id: UUID) -> None:
        menu = await self.get_menu(restaurant_id, menu_id)
        menu.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()

    async def _unset_default(self, restaurant_id: UUID) -> None:
        result = await self._db.execute(
            select(Menu).where(
                and_(
                    Menu.restaurant_id == restaurant_id,
                    Menu.is_default == True,  # noqa: E712
                    Menu.deleted_at == None,  # noqa: E711
                )
            )
        )
        for menu in result.scalars().all():
            menu.is_default = False
