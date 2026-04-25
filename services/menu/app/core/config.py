from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "QRMenu Menu Service"
    debug: bool = False

    database_url: str
    redis_url: str
    rabbitmq_url: str

    auth_service_url: str = "http://auth-service:8002"
    cache_ttl: int = 300


settings = Settings()
