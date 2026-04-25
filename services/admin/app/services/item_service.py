from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Item
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

    async def create_item(self, restaurant_id: UUID, data: ItemCreate) -> Item:
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

    async def update_item(
        self, restaurant_id: UUID, item_id: UUID, data: ItemUpdate
    ) -> Item:
        item = await self.get_item(restaurant_id, item_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(item, field, value)
        await self._db.commit()
        await self._db.refresh(item)
        return item

    async def delete_item(self, restaurant_id: UUID, item_id: UUID) -> None:
        item = await self.get_item(restaurant_id, item_id)
        item.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()

    async def toggle_available(self, restaurant_id: UUID, item_id: UUID) -> Item:
        item = await self.get_item(restaurant_id, item_id)
        item.is_available = not item.is_available
        await self._db.commit()
        await self._db.refresh(item)
        return item

    async def reorder_items(self, restaurant_id: UUID, items: list[ItemReorderItem]) -> None:
        for item in items:
            await self._db.execute(
                update(Item)
                .where(
                    and_(
                        Item.id == item.id,
                        Item.restaurant_id == restaurant_id,
                        Item.deleted_at == None,  # noqa: E711
                    )
                )
                .values(sort_order=item.sort_order)
            )
        await self._db.commit()
