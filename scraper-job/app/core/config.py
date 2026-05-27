from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Mistral
    MISTRAL_API_KEY: str
    MISTRAL_MODEL: str = "mistral-large-latest"
    MISTRAL_MAX_TOKENS: int = 4096
    MISTRAL_TEMPERATURE: float = 0.3
    PROMPT_VERSION: str = "v2"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # Scraper
    SCRAPER_TIMEOUT_MS: int = 30_000
    JOB_CACHE_TTL_SECONDS: int = 3600 * 24   # jobs table dedup window
    CACHE_TTL_SECONDS: int = 3600 * 24        # kept for legacy cached_jobs

    # Rate limiting (per user, sliding window)
    RATE_LIMIT_REQUESTS_PER_HOUR: int = 10

    # Safety caps for LLM input
    MAX_JOB_DESCRIPTION_CHARS: int = 15_000   # after sanitization
    MAX_HTML_SIZE_BYTES: int = 2_000_000       # 2 MB hard cap on raw HTML

    # Estimated pipeline duration returned to the client
    ESTIMATED_DURATION_SECONDS: int = 45

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
