from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RevenueMonth(BaseModel):
    month: str  # "2026-01"
    amount: float
    count: int


class PaymentRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant_name: str
    amount: float
    status: str
    provider: str
    created_at: datetime


class PaymentList(BaseModel):
    items: list[PaymentRecord]
    total: int
    page: int
    pages: int
