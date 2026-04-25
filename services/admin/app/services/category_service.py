from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Category
from app.schemas.menu import CategoryCreate, CategoryReorderItem, CategoryUpdate


class CategoryService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_categories(self, restaurant_id: UUID, menu_id: UUID | None = None) -> list[Category]:
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category

    async def create_category(self, restaurant_id: UUID, data: CategoryCreate) -> Category:
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
        for field, value in data.model_dump(exclude_none=True).items():
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
        for item in items:
            await self._db.execute(
                update(Category)
                .where(
                    and_(
                        Category.id == item.id,
                        Category.restaurant_id == restaurant_id,
                        Category.deleted_at == None,  # noqa: E711
                    )
                )
                .values(sort_order=item.sort_order)
            )
        await self._db.commit()
