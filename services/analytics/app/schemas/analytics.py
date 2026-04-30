# === FILE: services/analytics/app/schemas/analytics.py ===
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.analytics import EventTypeEnum


class IncomingEventSchema(BaseModel):
    restaurant_id: UUID
    item_id: UUID | None = None
    event_type: EventTypeEnum
    device_type: str
    timestamp: datetime

    @field_validator("device_type")
    @classmethod
    def normalize_device_type(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ("mobile", "desktop"):
            return "desktop"
        return v


class TopItemSchema(BaseModel):
    item_id: UUID
    views: int
    rank: int


class DailyRowSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    menu_views: int
    item_views: int
    peak_hour: int | None


class OverviewResponse(BaseModel):
    period_days: int
    total_menu_views: int
    total_item_views: int
    device_breakdown: dict[str, int]
    top_items: list[TopItemSchema]
    most_common_peak_hour: int | None


class DailyResponse(BaseModel):
    date: date
    menu_views: int
    item_views: int
    peak_hour: int | None


class PeakHourRow(BaseModel):
    hour: int
    views: int
