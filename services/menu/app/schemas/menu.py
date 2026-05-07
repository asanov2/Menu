from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class RestaurantInfo(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: str | None = None  # not in DB, frontend expects it nullable

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
    price: float  # float so JSON serializes as number, not string
    image_url: str | None = None
    is_available: bool
    sort_order: int
    preparation_time: int | None = None
    tags: list[str] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: object) -> list[str]:
        return list(v) if v is not None else []


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

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: object) -> list[str]:
        return list(v) if v is not None else []
