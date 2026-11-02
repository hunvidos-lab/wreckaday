import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import main
from app.generation_config import GenerationSettings
from app.generation import GenerationService


@pytest.fixture(autouse=True)
def offline_settings(monkeypatch):
    settings = GenerationSettings(
        _env_file=None, live_generation_enabled=False, budget_database_url="sqlite:///:memory:"
    )
    monkeypatch.setattr(main, "settings", settings)
    monkeypatch.setattr(main, "service", GenerationService(settings))


@pytest.fixture
def client():
    return TestClient(app)
