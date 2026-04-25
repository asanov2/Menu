from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ItemResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    sort_order: int
    preparation_time: int | None
    tags: list[str] | None

    model_config = {"from_attributes": True}


class CategoryResponse(BaseModel):
    id: UUID
    menu_id: UUID
    name: str
    description: str | None
    sort_order: int
    is_visible: bool
    items: list[ItemResponse] = []

    model_config = {"from_attributes": True}


class MenuResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    name: str
    is_default: bool
    language: str
    categories: list[CategoryResponse] = []

    model_config = {"from_attributes": True}


class CategoriesOnlyResponse(BaseModel):
    id: UUID
    menu_id: UUID
    name: str
    description: str | None
    sort_order: int
    is_visible: bool

    model_config = {"from_attributes": True}


class ItemsFilterResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    sort_order: int
    preparation_time: int | None
    tags: list[str] | None

    model_config = {"from_attributes": True}
