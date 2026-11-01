"""Credential-free provider boundary. Live adapters belong to Gate 2."""

from pathlib import Path
from typing import Protocol

from pydantic import BaseModel, Field

from .render import fixture
from .templates import TEMPLATE


class FramePlan(BaseModel):
    caption: str = Field(min_length=1, max_length=140)
    beat: str


class StoryWriter(Protocol):
    def plan(self, inputs: dict) -> list[FramePlan]: ...


class ImageGenerator(Protocol):
    def generate(self, index: int, destination: Path) -> None: ...


class MockStoryWriter:
    def plan(self, inputs: dict) -> list[FramePlan]:
        captions = [f"{inputs['name']} met the love of their life.", *TEMPLATE["captions"][1:]]
        return [
            FramePlan(caption=caption, beat=beat)
            for caption, beat in zip(captions, ("hook", "escalation", "twist"), strict=True)
        ]


class MockImageGenerator:
    def generate(self, index: int, destination: Path) -> None:
        fixture(index).save(destination)
