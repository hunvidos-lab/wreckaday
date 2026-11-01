from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class StoryInput(Strict):
    template_slug: Literal["seven-foot-fiancee"]
    name: str = Field(default="Alex", min_length=1, max_length=32)
    setting: str = Field(default="our city apartment", min_length=1, max_length=100)
    custom_details: str = Field(default="", max_length=240)
    photo_realism: int = Field(default=85, ge=0, le=100, strict=True)
    satire_intensity: int = Field(default=80, ge=0, le=100, strict=True)
    frame_count: Literal[3] = 3
    cast_mode: Literal["fictional"] = "fictional"


class Edit(Strict):
    revision: int = Field(ge=0)
    captions: list[str] = Field(min_length=3, max_length=3)
    order: list[int] = Field(min_length=3, max_length=3)
    reveal: str = Field(min_length=1, max_length=180)


class DevLogin(Strict):
    account: Literal["alex", "sam"] = "alex"
