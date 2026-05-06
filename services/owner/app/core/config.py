from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "QRMenu Owner Service"
    debug: bool = False
    database_url: str
    redis_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    owner_token_expire_hours: int = 24
    # Single owner account — credentials from env
    owner_email: str = "owner@qrmenu.kz"
    owner_password_hash: str = "$2b$12$defaulthashthatshouldbechangedinproduction00000000000"


settings = Settings()
