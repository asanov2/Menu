from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Category, CategoryTranslation, Item, ItemTranslation, Menu, Restaurant


class MenuService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_restaurant_by_slug(self, slug: str) -> Restaurant:
        result = await self._db.execute(
            select(Restaurant).where(
                and_(Restaurant.slug == slug, Restaurant.is_active == True)  # noqa: E712
            )
        )
        restaurant = result.scalar_one_or_none()
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found",
            )
        return restaurant

    async def get_default_menu(self, restaurant_id: UUID) -> Menu:
        result = await self._db.execute(
            select(Menu).where(
                and_(
                    Menu.restaurant_id == restaurant_id,
                    Menu.is_default == True,  # noqa: E712
                    Menu.deleted_at == None,  # noqa: E711
                )
            )
        )
        menu = result.scalar_one_or_none()
        if not menu:
            result = await self._db.execute(
                select(Menu).where(
                    and_(
                        Menu.restaurant_id == restaurant_id,
                        Menu.deleted_at == None,  # noqa: E711
                    )
                ).order_by(Menu.created_at).limit(1)
            )
            menu = result.scalars().first()
        if not menu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu not found",
            )
        return menu

    async def get_menu_by_id(self, restaurant_id: UUID, menu_id: UUID) -> Menu:
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu not found",
            )
        return menu

    async def get_menu_by_language(self, restaurant_id: UUID, language: str) -> Menu | None:
        result = await self._db.execute(
            select(Menu).where(
                and_(
                    Menu.restaurant_id == restaurant_id,
                    Menu.language == language,
                    Menu.deleted_at == None,  # noqa: E711
                )
            ).order_by(Menu.is_default.desc(), Menu.created_at)
        )
        return result.scalars().first()

    async def get_full_menu(
        self, slug: str, menu_id: UUID | None = None, lang: str | None = None
    ) -> tuple[Restaurant, Menu]:
        restaurant = await self.get_restaurant_by_slug(slug)
        if menu_id:
            menu = await self.get_menu_by_id(restaurant.id, menu_id)
        elif lang:
            menu = await self.get_menu_by_language(restaurant.id, lang)
            if not menu:
                menu = await self.get_default_menu(restaurant.id)
        else:
            menu = await self.get_default_menu(restaurant.id)
        return restaurant, menu

    async def get_categories(self, restaurant_id: UUID, menu_id: UUID) -> list[Category]:
        result = await self._db.execute(
            select(Category)
            .where(
                and_(
                    Category.restaurant_id == restaurant_id,
                    Category.menu_id == menu_id,
                    Category.is_visible == True,  # noqa: E712
                    Category.deleted_at == None,  # noqa: E711
                )
            )
            .order_by(Category.sort_order)
        )
        return list(result.scalars().all())

    async def get_translations(
        self,
        category_ids: list[UUID],
        item_ids: list[UUID],
        lang: str,
    ) -> tuple[dict[UUID, str], dict[UUID, tuple[str, str | None]]]:
        """Returns (cat_name_by_id, {item_id: (name, description)}) for the given language."""
        cat_trans: dict[UUID, str] = {}
        if category_ids:
            result = await self._db.execute(
                select(CategoryTranslation).where(
                    and_(
                        CategoryTranslation.category_id.in_(category_ids),
                        CategoryTranslation.language == lang,
                    )
                )
            )
            for t in result.scalars():
                cat_trans[t.category_id] = t.name

        item_trans: dict[UUID, tuple[str, str | None]] = {}
        if item_ids:
            result = await self._db.execute(
                select(ItemTranslation).where(
                    and_(
                        ItemTranslation.item_id.in_(item_ids),
                        ItemTranslation.language == lang,
                    )
                )
            )
            for t in result.scalars():
                item_trans[t.item_id] = (t.name, t.description)

        return cat_trans, item_trans

    async def get_items(
        self,
        restaurant_id: UUID,
        category_id: UUID | None = None,
        available_only: bool = False,
    ) -> list[Item]:
        conditions = [
            Item.restaurant_id == restaurant_id,
            Item.deleted_at == None,  # noqa: E711
        ]
        if category_id:
            conditions.append(Item.category_id == category_id)
        if available_only:
            conditions.append(Item.is_available == True)  # noqa: E712

        result = await self._db.execute(
            select(Item).where(and_(*conditions)).order_by(Item.sort_order)
        )
        return list(result.scalars().all())
