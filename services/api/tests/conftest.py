import os
from pathlib import Path
import pytest

# Tests refuse to operate on any database without the explicit test suffix.
os.environ.setdefault(
    "WRECKDAY_DATABASE_URL", "postgresql+psycopg://wreckday:local-only@127.0.0.1:55432/wreckday_test"
)
if not os.environ["WRECKDAY_DATABASE_URL"].endswith("/wreckday_test"):
    raise RuntimeError("Tests require the dedicated wreckday_test database")
os.environ["WRECKDAY_STORAGE_ROOT"] = str(Path(__file__).parents[3] / "work" / "test-media")
from app.models import Base, engine
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def clean_db(tmp_path, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "storage_root", tmp_path / "media")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def headers(client):
    token = client.post("/v1/dev/session", json={"account": "alex"}).json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other(client):
    token = client.post("/v1/dev/session", json={"account": "sam"}).json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
