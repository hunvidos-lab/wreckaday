"""Server-only opt-in development provider configuration. No credentials reach the app."""

import os
from decimal import Decimal
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = next(
    (
        parent / ".env"
        for parent in Path(__file__).resolve().parents
        if (parent / "pnpm-workspace.yaml").exists()
    ),
    Path.cwd() / ".env",
)

ENV_FILE = Path(os.environ.get("WRECKDAY_ENV_FILE", ENV_FILE))


class GenerationSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="WRECKDAY_", env_file=ENV_FILE, hide_input_in_errors=True, extra="ignore"
    )
    environment: Literal["development", "production"] = "development"
    key_console_enabled: bool = False
    key_console_token: SecretStr = SecretStr("")
    live_generation_enabled: bool = False
    text_endpoint: str = ""
    text_api_key: SecretStr = SecretStr("")
    text_model: str = "meta-llama/Llama-3.3-70B-Instruct"
    image_provider: Literal["bfl", "image_edits", "fal"] = "bfl"
    image_endpoint: str = "https://api.bfl.ai/v1/flux-2-klein-4b"
    image_api_key: SecretStr = SecretStr("")
    image_model: str = "flux-2-klein-4b"
    session_budget_usd: Decimal = Field(default=Decimal("0"), ge=0)
    # Optional rolling cap per UTC day, applied on top of the process-lifetime session budget.
    daily_budget_usd: Decimal | None = Field(default=Decimal("2"), ge=0)
    # Separate content-free ledger; never use the retired story database.
    budget_database_url: SecretStr = SecretStr(
        f"sqlite:///{ENV_FILE.parent / 'work/generation-ledger.sqlite3'}"
    )
    text_input_usd_per_million: Decimal | None = Field(default=None, ge=0)
    text_output_usd_per_million: Decimal | None = Field(default=None, ge=0)
    fal_billing_api_key: SecretStr = SecretStr("")
    text_cost_ceiling_usd: Decimal | None = Field(default=None, ge=0)
    image_cost_ceiling_usd: Decimal | None = Field(default=None, ge=0)
    max_generation_requests: int = Field(default=3, ge=1, le=10)
    cors_origins: str = "http://localhost:8081,http://localhost:8082"

    @field_validator(
        "text_cost_ceiling_usd",
        "image_cost_ceiling_usd",
        "daily_budget_usd",
        "text_input_usd_per_million",
        "text_output_usd_per_million",
        mode="before",
    )
    @classmethod
    def empty_ceiling(cls, value):
        return None if value == "" else value

    @field_validator("text_endpoint", "image_endpoint")
    @classmethod
    def trusted_endpoint(cls, value: str):
        if not value:
            return value
        url = urlsplit(value)
        loopback = url.hostname in ("localhost", "127.0.0.1", "::1")
        if (url.scheme != "https" and not (url.scheme == "http" and loopback)) or not url.hostname:
            raise ValueError("Provider endpoints require HTTPS, or HTTP on loopback for local inference")
        if url.username or url.password or url.query or url.fragment:
            raise ValueError("Use server-side key fields, not credentials or query strings in endpoints")
        return value.rstrip("/")

    @property
    def configured(self) -> bool:
        return bool(
            self.environment == "development"
            and self.live_generation_enabled
            and self.text_endpoint
            and self.image_endpoint
            and (self.image_provider == "image_edits" or self.image_api_key.get_secret_value())
            and self.session_budget_usd > 0
            and self.text_cost_ceiling_usd is not None
            and self.image_cost_ceiling_usd is not None
        )


settings = GenerationSettings()
