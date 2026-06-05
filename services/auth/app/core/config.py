from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "QRMenu Auth Service"
    debug: bool = False

    database_url: str
    redis_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    frontend_url: str = "http://localhost:5173"

    notification_service_url: str = "http://notification-service:8007"
    billing_service_url: str = "http://billing-service:8005"
    internal_secret: str = "changeme"

    resend_api_key: str
    resend_from: str = "noreply@qrmenus.kz"


settings = Settings()
