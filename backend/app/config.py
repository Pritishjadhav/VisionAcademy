from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="OMR_", extra="ignore")

    allowed_origins: str = "http://localhost:3000"
    max_upload_bytes: int = 10 * 1024 * 1024
    grade_limit: int = 20
    generate_limit: int = 10
    rate_window_seconds: int = 60
    internal_api_key: str = ""

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
