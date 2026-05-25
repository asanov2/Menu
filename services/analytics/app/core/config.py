# === FILE: services/analytics/app/core/config.py ===
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

PLAN_HISTORY_DAYS: dict[str, int] = {
    "starter": 7,
    "business": 30,
    "pro": 90,
}

PLAN_UPGRADE_MAP: dict[str, str] = {
    "starter": "business",
    "business": "pro",
}


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "analytics-service"
    DEBUG: bool = False
    PORT: int = 8004

    DATABASE_URL: str
    RABBITMQ_URL: str
    AUTH_SERVICE_URL: str = "http://auth-service:8002"
    INTERNAL_SECRET: str
    TELEGRAM_BOT_TOKEN: str = ""


settings = Settings()
