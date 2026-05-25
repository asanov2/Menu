from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class RestaurantInfo(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    plan: str = "starter"

    model_config = ConfigDict(from_attributes=True)


class MenuInfo(BaseModel):
    id: UUID
    name: str
    is_default: bool
    language: str

    model_config = ConfigDict(from_attributes=True)


class ItemResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    description: str | None = None
    price: float
    image_url: str | None = None
    is_available: bool
    sort_order: int
    preparation_time: int | None = None
    tags: list[str] = []
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    allergens: list[str] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: object) -> list[str]:
        return list(v) if v is not None else []

    @field_validator("allergens", mode="before")
    @classmethod
    def coerce_allergens(cls, v: object) -> list[str]:
        if not v:
            return []
        items = list(v)
        if items and not isinstance(items[0], str):
            return [a.allergen_code for a in items]
        return items


class CategoryResponse(BaseModel):
    id: UUID
    menu_id: UUID
    name: str
    description: str | None = None
    sort_order: int
    is_visible: bool
    items: list[ItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class MenuPageResponse(BaseModel):
    restaurant: RestaurantInfo
    menu: MenuInfo
    categories: list[CategoryResponse] = []


# Keep alias so cache_service imports that reference MenuResponse still work
MenuResponse = MenuPageResponse


class CategoriesOnlyResponse(BaseModel):
    id: UUID
    menu_id: UUID
    name: str
    description: str | None = None
    sort_order: int
    is_visible: bool

    model_config = ConfigDict(from_attributes=True)


class ItemsFilterResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    description: str | None = None
    price: float
    image_url: str | None = None
    is_available: bool
    sort_order: int
    preparation_time: int | None = None
    tags: list[str] = []
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    allergens: list[str] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: object) -> list[str]:
        return list(v) if v is not None else []

    @field_validator("allergens", mode="before")
    @classmethod
    def coerce_allergens(cls, v: object) -> list[str]:
        if not v:
            return []
        items = list(v)
        if items and not isinstance(items[0], str):
            return [a.allergen_code for a in items]
        return items
