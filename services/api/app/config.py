from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WRECKDAY_", env_file=".env", extra="ignore")
    environment: str = "development"
    database_url: str = "postgresql+psycopg://wreckday:local-only@127.0.0.1:55432/wreckday"
    storage_root: Path = Path("work/media")
    dev_auth: bool = True
    signing_secret: str = "development-only-never-deploy-this-key"
    public_api_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:8081,http://localhost:8082"

    @model_validator(mode="after")
    def prohibit_production(self):
        if self.environment != "development":
            raise ValueError("Gate 1 is development-only; production auth/storage are not implemented")
        return self


settings = Settings()
