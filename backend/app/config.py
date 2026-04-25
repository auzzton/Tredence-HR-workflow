from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(..., description="asyncpg connection string for the app")
    alembic_database_url: str | None = Field(
        default=None,
        description="Non-pooled URL for Alembic (Neon requirement). Falls back to database_url.",
    )
    log_level: str = Field(default="INFO")
    env: str = Field(default="dev")
    cors_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated list of allowed CORS origins",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def effective_alembic_url(self) -> str:
        """Return the migration URL, preferring the dedicated non-pooled URL for Neon."""
        return self.alembic_database_url or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
