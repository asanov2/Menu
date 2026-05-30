from pydantic import BaseModel


class GenerateCodeResponse(BaseModel):
    code: str
    expires_in: int
    bot_username: str


class TelegramStatusResponse(BaseModel):
    connected: bool
    chat_id: int | None
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
