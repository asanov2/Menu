from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RestaurantItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    email: str
    plan: str
    status: str
    is_active: bool
    created_at: datetime
    trial_ends_at: datetime | None = None


class RestaurantList(BaseModel):
    items: list[RestaurantItem]
    total: int
    page: int
    pages: int


class RestaurantPatch(BaseModel):
    is_active: bool | None = None
    plan: str | None = None


class PlatformStats(BaseModel):
    total_restaurants: int
    active_restaurants: int
    trial_count: int
    mrr: float
    starter_count: int
    business_count: int
    pro_count: int
