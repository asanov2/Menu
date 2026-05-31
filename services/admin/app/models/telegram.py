import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RestaurantTelegramSettings(Base):
    __tablename__ = "restaurant_telegram_settings"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    telegram_connect_code: Mapped[str | None] = mapped_column(String(10), unique=True, nullable=True)
    telegram_code_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    telegram_pending_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    orders_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preorders_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tables_count: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class TelegramRecipient(Base):
    __tablename__ = "telegram_recipients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurant_telegram_settings.restaurant_id", ondelete="CASCADE"),
        nullable=False,
    )
    chat_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False, default="Основной")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
