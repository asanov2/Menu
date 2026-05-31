import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GenerateCodeRequest(BaseModel):
    label: str = Field(min_length=1, max_length=100)


class GenerateCodeResponse(BaseModel):
    code: str
    expires_in: int
    bot_username: str


class TelegramRecipientOut(BaseModel):
    id: uuid.UUID
    chat_id: int
    label: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TelegramStatusResponse(BaseModel):
    connected: bool
    recipients: list[TelegramRecipientOut] = []
    orders_enabled: bool
    preorders_enabled: bool
    tables_count: int
    bot_username: str = "qrmenuskz_bot"


class TelegramSettingsUpdate(BaseModel):
    orders_enabled: bool
    preorders_enabled: bool
    tables_count: int


class WebhookUpdate(BaseModel):
    update_id: int
    message: dict | None = None
    my_chat_member: dict | None = None
