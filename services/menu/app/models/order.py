import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    menu_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    order_type: Mapped[str] = mapped_column(String(10), nullable=False)
    table_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(10), nullable=False, server_default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class RestaurantTelegramSettings(Base):
    """Read-only mirror — managed by admin service migrations."""

    __tablename__ = "restaurant_telegram_settings"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    orders_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preorders_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tables_count: Mapped[int] = mapped_column(Integer, default=10, nullable=False)


class TelegramRecipient(Base):
    """Read-only mirror — managed by admin service migrations."""

    __tablename__ = "telegram_recipients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    chat_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
