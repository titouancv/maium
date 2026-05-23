from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str  # service role key → bypasses RLS on the backend

    # Mistral
    MISTRAL_API_KEY: str
    MISTRAL_MODEL: str = "mistral-large-latest"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # Scraper
    SCRAPER_TIMEOUT_MS: int = 30_000  # Playwright timeout in ms
    CACHE_TTL_SECONDS: int = 3600 * 24  # 24h cache for scraped job offers

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
