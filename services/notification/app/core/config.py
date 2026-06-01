from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "notification-service"
    DEBUG: bool = False
    PORT: int = 8007

    DATABASE_URL: str
    AUTH_SERVICE_URL: str = "http://auth-service:8002"
    INTERNAL_SECRET: str = "changeme"

    # VAPID keys: private stored as standard base64-encoded PEM, public as base64url uncompressed point
    VAPID_PRIVATE_KEY: str
    VAPID_PUBLIC_KEY: str
    VAPID_SUBJECT: str = "mailto:owner@qrmenu.kz"

    # Shared JWT secret for owner token verification (same key as auth/owner services)
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"


settings = Settings()
