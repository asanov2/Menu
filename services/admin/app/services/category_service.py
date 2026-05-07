from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Integer, and_, bindparam, select, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Category, Menu
from app.schemas.menu import CategoryCreate, CategoryReorderItem, CategoryUpdate


class CategoryService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_categories(
        self, restaurant_id: UUID, menu_id: UUID | None = None
    ) -> list[Category]:
        conditions = [
            Category.restaurant_id == restaurant_id,
            Category.deleted_at == None,  # noqa: E711
        ]
        if menu_id:
            conditions.append(Category.menu_id == menu_id)

        result = await self._db.execute(
            select(Category).where(and_(*conditions)).order_by(Category.sort_order)
        )
        return list(result.scalars().all())

    async def get_category(self, restaurant_id: UUID, category_id: UUID) -> Category:
        result = await self._db.execute(
            select(Category).where(
                and_(
                    Category.id == category_id,
                    Category.restaurant_id == restaurant_id,
                    Category.deleted_at == None,  # noqa: E711
                )
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )
        return category

    async def _validate_menu_ownership(
        self, restaurant_id: UUID, menu_id: UUID
    ) -> None:
        # fix #6: ensure menu_id belongs to THIS restaurant before inserting
        result = await self._db.execute(
            select(Menu).where(
                and_(
                    Menu.id == menu_id,
                    Menu.restaurant_id == restaurant_id,
                    Menu.deleted_at == None,  # noqa: E711
                )
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Menu does not belong to your restaurant",
            )

    async def create_category(self, restaurant_id: UUID, data: CategoryCreate) -> Category:
        await self._validate_menu_ownership(restaurant_id, data.menu_id)
        category = Category(
            restaurant_id=restaurant_id,
            menu_id=data.menu_id,
            name=data.name,
            description=data.description,
            sort_order=data.sort_order,
            is_visible=data.is_visible,
        )
        self._db.add(category)
        await self._db.commit()
        await self._db.refresh(category)
        return category

    async def update_category(
        self, restaurant_id: UUID, category_id: UUID, data: CategoryUpdate
    ) -> Category:
        category = await self.get_category(restaurant_id, category_id)
        # fix #17: exclude_unset so PATCH {"description": null} clears the field
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await self._db.commit()
        await self._db.refresh(category)
        return category

    async def delete_category(self, restaurant_id: UUID, category_id: UUID) -> None:
        category = await self.get_category(restaurant_id, category_id)
        category.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()

    async def reorder_categories(
        self, restaurant_id: UUID, items: list[CategoryReorderItem]
    ) -> None:
        if not items:
            return
        # bindparam with explicit ARRAY type avoids the :param::cast[] syntax
        # conflict that breaks SQLAlchemy's asyncpg dialect parameter parser.
        await self._db.execute(
            text("""
                UPDATE categories
                SET sort_order = v.sort_order
                FROM (
                    SELECT unnest(:ids) AS id,
                           unnest(:orders) AS sort_order
                ) AS v
                WHERE categories.id = v.id
                  AND categories.restaurant_id = :restaurant_id
                  AND categories.deleted_at IS NULL
            """).bindparams(
                bindparam("ids", type_=ARRAY(pgUUID(as_uuid=True))),
                bindparam("orders", type_=ARRAY(Integer())),
            ),
            {
                "ids": [item.id for item in items],
                "orders": [item.sort_order for item in items],
                "restaurant_id": restaurant_id,
            },
        )
        await self._db.commit()
