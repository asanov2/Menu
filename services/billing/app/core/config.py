# === FILE: services/billing/app/core/config.py ===
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "billing-service"
    DEBUG: bool = False
    PORT: int = 8005

    DATABASE_URL: str
    AUTH_SERVICE_URL: str = "http://auth-service:8002"
    INTERNAL_SECRET: str = "changeme"

    KASPI_MERCHANT_ID: str = "test"
    KASPI_SECRET_KEY: str = "test"
    KASPI_WEBHOOK_SECRET: str = "test"
    KASPI_PAY_API_URL: str = "https://api.kaspi.kz/pay/v1"

    CLOUDPAYMENTS_PUBLIC_ID: str = "test"
    CLOUDPAYMENTS_API_SECRET: str = "test"
    CLOUDPAYMENTS_WEBHOOK_SECRET: str = "test"
    CLOUDPAYMENTS_API_URL: str = "https://api.cloudpayments.ru"

    TRIAL_DAYS: int = 14


settings = Settings()
