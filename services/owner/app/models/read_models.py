from sqlalchemy import Boolean, Column, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


# READ-ONLY: maps to auth_service schema
class Restaurant(Base):
    __tablename__ = "restaurants"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    email = Column(String, nullable=False)
    plan = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False)
    is_verified = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)


# READ-ONLY: maps to billing schema
class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False)
    plan = Column(String, nullable=False)
    status = Column(String, nullable=False)
    current_period_end = Column(DateTime(timezone=True))
    trial_ends_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False)


# READ-ONLY: maps to billing schema
class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
