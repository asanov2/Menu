from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Integer, and_, bindparam, func, select, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.plan_errors import items_limit_error, stoplist_limit_error
from app.core.plan_limits import get_limits
from app.models.menu import Category, Item
from app.schemas.menu import ItemCreate, ItemReorderItem, ItemUpdate


class ItemService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_items(self, restaurant_id: UUID, category_id: UUID | None = None) -> list[Item]:
        conditions = [
            Item.restaurant_id == restaurant_id,
            Item.deleted_at == None,  # noqa: E711
        ]
        if category_id:
            conditions.append(Item.category_id == category_id)

        result = await self._db.execute(
            select(Item).where(and_(*conditions)).order_by(Item.sort_order)
        )
        return list(result.scalars().all())

    async def get_item(self, restaurant_id: UUID, item_id: UUID) -> Item:
        result = await self._db.execute(
            select(Item).where(
                and_(
                    Item.id == item_id,
                    Item.restaurant_id == restaurant_id,
                    Item.deleted_at == None,  # noqa: E711
                )
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
        return item

    async def _validate_category_ownership(
        self, restaurant_id: UUID, category_id: UUID
    ) -> None:
        # fix #6: ensure category_id belongs to THIS restaurant before inserting
        result = await self._db.execute(
            select(Category).where(
                and_(
                    Category.id == category_id,
                    Category.restaurant_id == restaurant_id,
                    Category.deleted_at == None,  # noqa: E711
                )
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Category does not belong to your restaurant",
            )

    async def create_item(self, restaurant_id: UUID, plan: str, data: ItemCreate) -> Item:
        limits = get_limits(plan)
        if limits.max_items is not None:
            count_result = await self._db.execute(
                select(func.count(Item.id)).where(
                    Item.restaurant_id == restaurant_id,
                    Item.deleted_at.is_(None),
                )
            )
            current_count: int = count_result.scalar_one()
            if current_count >= limits.max_items:
                raise items_limit_error(plan)

        await self._validate_category_ownership(restaurant_id, data.category_id)
        item = Item(
            restaurant_id=restaurant_id,
            category_id=data.category_id,
            name=data.name,
            description=data.description,
            price=data.price,
            image_url=data.image_url,
            is_available=data.is_available,
            sort_order=data.sort_order,
            preparation_time=data.preparation_time,
            tags=data.tags,
        )
        self._db.add(item)
        await self._db.commit()
        await self._db.refresh(item)
        return item

    async def update_item(self, restaurant_id: UUID, item_id: UUID, data: ItemUpdate) -> Item:
        item = await self.get_item(restaurant_id, item_id)
        # fix #17: exclude_unset so PATCH {"image_url": null} clears the field
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        await self._db.commit()
        await self._db.refresh(item)
        return item

    async def delete_item(self, restaurant_id: UUID, item_id: UUID) -> None:
        item = await self.get_item(restaurant_id, item_id)
        item.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()

    async def toggle_available(self, restaurant_id: UUID, item_id: UUID, plan: str) -> Item:
        limits = get_limits(plan)
        if not limits.can_stoplist:
            raise stoplist_limit_error()
        item = await self.get_item(restaurant_id, item_id)
        item.is_available = not item.is_available
        await self._db.commit()
        await self._db.refresh(item)
        return item

    async def reorder_items(self, restaurant_id: UUID, items: list[ItemReorderItem]) -> None:
        if not items:
            return
        # bindparam with explicit ARRAY type avoids the :param::cast[] syntax
        # conflict that breaks SQLAlchemy's asyncpg dialect parameter parser.
        await self._db.execute(
            text("""
                UPDATE items
                SET sort_order = v.sort_order
                FROM (
                    SELECT unnest(:ids) AS id,
                           unnest(:orders) AS sort_order
                ) AS v
                WHERE items.id = v.id
                  AND items.restaurant_id = :restaurant_id
                  AND items.deleted_at IS NULL
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
