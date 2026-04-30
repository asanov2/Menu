# === FILE: services/billing/app/schemas/billing.py ===
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.billing import PaymentProvider, PaymentStatus, PlanEnum, SubscriptionStatus


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subscription_id: UUID
    restaurant_id: UUID
    amount: Decimal
    currency: str
    status: PaymentStatus
    provider: PaymentProvider
    provider_transaction_id: str | None
    paid_at: datetime | None
    created_at: datetime


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant_id: UUID
    plan: PlanEnum
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    trial_ends_at: datetime | None
    auto_renew: bool
    created_at: datetime
    updated_at: datetime
    payments: list[PaymentOut] = []


class SubscriptionWithPaymentsOut(SubscriptionOut):
    payments: list[PaymentOut]


class UpgradeRequest(BaseModel):
    plan: PlanEnum

    model_config = ConfigDict(use_enum_values=True)


class UpgradeResponse(BaseModel):
    payment_url: str
    payment_id: UUID


class CancelResponse(BaseModel):
    message: str
    active_until: datetime


class ActivateTrialRequest(BaseModel):
    restaurant_id: UUID


class ActivateTrialResponse(BaseModel):
    subscription_id: UUID
    trial_ends_at: datetime


class CheckSubscriptionResponse(BaseModel):
    active: bool
    plan: str
    status: str
    trial_remaining_days: int | None
    current_period_end: datetime
