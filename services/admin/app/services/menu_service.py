from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Category, Item, Menu
from app.schemas.menu import MenuCreate, MenuUpdate


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

    async def create_menu(self, restaurant_id: UUID, data: MenuCreate) -> Menu:
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

    async def update_menu(self, restaurant_id: UUID, menu_id: UUID, data: MenuUpdate) -> Menu:
        menu = await self.get_menu(restaurant_id, menu_id)

        if data.is_default is True:
            await self._unset_default(restaurant_id)

        # fix #17: exclude_unset so explicit null values are written to DB
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(menu, field, value)

        await self._db.commit()
        await self._db.refresh(menu)
        return menu

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
