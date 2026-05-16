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
    status: str               # subscription status: trial / active / expired / cancelled
    registration_status: str  # registration status: pending / active / inactive
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
    status: str | None = None  # registration status: pending / active / inactive


class PlatformStats(BaseModel):
    total_restaurants: int
    active_restaurants: int
    trial_count: int
    mrr: float
    starter_count: int
    business_count: int
    pro_count: int


class ApplicationItem(BaseModel):
    id: UUID
    name: str
    slug: str
    email: str
    phone: str | None
    city: str | None
    type: str | None
    created_at: datetime


class ApplicationsResponse(BaseModel):
    items: list[ApplicationItem]
    total: int
    page: int
    pages: int
