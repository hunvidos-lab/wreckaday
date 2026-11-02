"""The former content API must remain disabled, including signed-media routes."""

import subprocess
import sys
from pathlib import Path

import pytest


@pytest.mark.parametrize(
    "method,path",
    [
        ("POST", "/v1/dev/session"),
        ("GET", "/v1/templates"),
        ("GET", "/v1/me"),
        ("GET", "/v1/wallet"),
        ("GET", "/v1/stories"),
        ("POST", "/v1/stories"),
        ("PATCH", "/v1/stories/old-story"),
        ("DELETE", "/v1/stories/old-story"),
        ("POST", "/v1/stories/old-story/generate"),
        ("POST", "/v1/stories/old-story/export"),
        ("GET", "/v1/jobs/old-job"),
        ("POST", "/v1/jobs/old-job/cancel"),
        ("GET", "/v1/media/old-story/frame-0.png?signature=old"),
        ("POST", "/delivery"),
        ("GET", "/recipient/old-link"),
        ("GET", "/docs"),
    ],
)
def test_content_routes_are_gone(client, method, path):
    response = client.request(method, path, content=b"private-content-must-not-be-processed")
    assert response.status_code == 410
    assert response.json()["error"]["code"] == "LEGACY_API_RETIRED"
    assert response.headers["cache-control"] == "no-store"


def test_rejection_does_not_consume_request_body():
    import asyncio

    from app.main import app

    async def check():
        sent = []

        async def receive():
            raise AssertionError("Content body must never be read")

        async def send(message):
            sent.append(message)

        await app(
            {
                "type": "http",
                "asgi": {"version": "3.0"},
                "http_version": "1.1",
                "method": "POST",
                "scheme": "http",
                "path": "/v1/stories",
                "raw_path": b"/v1/stories",
                "query_string": b"",
                "root_path": "",
                "headers": [],
                "server": ("test", 80),
                "client": ("test", 1),
            },
            receive,
            send,
        )
        assert sent[0]["status"] == 410

    asyncio.run(check())


def test_health_needs_no_database_or_content_storage(client):
    for path in ("/healthz", "/readyz"):
        assert client.get(path).json()["data"]["content_api"] is False


def test_service_imports_no_database_media_or_provider():
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import sys; import app.main; import app.worker; "
            "assert not {'app.models', 'app.media', 'app.providers', 'app.auth'} & sys.modules.keys(); "
            "assert app.worker.run_once() is None",
        ],
        cwd=Path(__file__).parents[1],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
