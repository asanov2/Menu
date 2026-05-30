from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ─── Menu ─────────────────────────────────────────────────────────────────────

class MenuCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    is_default: bool = False
    language: str = "ru"


class MenuUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_default: bool | None = None
    language: str | None = None


class MenuOrderSettingsUpdate(BaseModel):
    orders_enabled: bool
    preorders_enabled: bool
    tables_count: int


class MenuResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    name: str
    is_default: bool
    language: str
    orders_enabled: bool = False
    preorders_enabled: bool = False
    tables_count: int = 10
    items_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlanUsageResponse(BaseModel):
    menus_used: int
    menus_limit: Optional[int]
    items_used: int
    items_limit: Optional[int]


class MenuListWithUsageResponse(BaseModel):
    menus: list[MenuResponse]
    usage: PlanUsageResponse


# ─── Category ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    menu_id: UUID
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    sort_order: int = 0
    is_visible: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    sort_order: int | None = None
    is_visible: bool | None = None


class CategoryReorderItem(BaseModel):
    id: UUID
    sort_order: int


class CategoryResponse(BaseModel):
    id: UUID
    menu_id: UUID
    restaurant_id: UUID
    name: str
    description: str | None
    sort_order: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Item ─────────────────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    category_id: UUID
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(gt=Decimal('0'), le=Decimal('9999999.99'))
    image_url: str | None = None
    is_available: bool = True
    sort_order: int = 0
    preparation_time: int | None = None
    tags: list[str] | None = None
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    allergens: list[str] | None = None


class ItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=Decimal('0'), le=Decimal('9999999.99'))
    image_url: str | None = None
    is_available: bool | None = None
    sort_order: int | None = None
    preparation_time: int | None = None
    tags: list[str] | None = None
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    allergens: list[str] | None = None


class ItemReorderItem(BaseModel):
    id: UUID
    sort_order: int


class ItemResponse(BaseModel):
    id: UUID
    category_id: UUID
    restaurant_id: UUID
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    sort_order: int
    preparation_time: int | None
    tags: list[str] | None
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    allergens: list[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("allergens", mode="before")
    @classmethod
    def coerce_allergens(cls, v: object) -> list[str]:
        if not v:
            return []
        items = list(v)
        if items and not isinstance(items[0], str):
            return [a.allergen_code for a in items]
        return items


# ─── Upload ───────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    url: str
    key: str
