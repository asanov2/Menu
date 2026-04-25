from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "QRMenu Admin Service"
    debug: bool = False

    database_url: str
    redis_url: str

    auth_service_url: str = "http://auth-service:8002"

    minio_endpoint_url: str = "http://minio:9000"
    minio_root_user: str = "minioadmin"
    minio_root_password: str = "minioadmin"
    minio_bucket: str = "menu-images"
    minio_public_url: str = "http://localhost:9000"


settings = Settings()
