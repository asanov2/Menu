from datetime import datetime

from pydantic import BaseModel


class ServiceHealth(BaseModel):
    name: str
    status: str  # "online" | "offline"
    response_ms: float | None = None
    checked_at: datetime


class SystemHealthResponse(BaseModel):
    services: list[ServiceHealth]
    all_healthy: bool
