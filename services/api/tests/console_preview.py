"""Explicit browser-test fixture. Fake credentials and HTTP only; never launch as the real API."""

import base64
import io
import json
import os
from pathlib import Path

import httpx
from PIL import Image

from app import main
from app.dev_keys import DevKeyConsole
from app.generation import GenerationService
from app.generation_config import GenerationSettings

path = Path(os.environ["WRECKDAY_TEST_ENV_FILE"])
assert path.name == "fixture.env" and "wreckaday-console-test-" in str(path.parent)
settings = GenerationSettings(
    _env_file=path,
    key_console_enabled=True,
    key_console_token="test-console-password",
    budget_database_url="sqlite:///:memory:",
)


def provider(request):
    if request.method == "GET":
        assert request.url.path.endswith("/ai/models/search")
        return httpx.Response(200, json={"success": True})
    data = json.loads(request.content)
    if request.url.host == "fal.run":
        if data == {}:
            return httpx.Response(422)
        image = io.BytesIO()
        Image.new("RGB", (120, 180), "#b35a37").save(image, "JPEG")
        return httpx.Response(
            200,
            json={
                "images": [{"url": "data:image/jpeg;base64," + base64.b64encode(image.getvalue()).decode()}]
            },
        )
    assert request.url.host == "api.cloudflare.com"
    schema = data["response_format"]["json_schema"]["schema"]
    result = (
        {"allowed": True}
        if "allowed" in schema["properties"]
        else {
            "scenes": [
                {
                    "caption": "Petty? The chandelier cost more.",
                    "image_prompt": "Photorealistic adult reference subject in a penthouse with red roses.",
                }
            ]
        }
    )
    return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(result)}}]})


main.install_settings(settings)
main.service = GenerationService(settings, transport=httpx.MockTransport(provider))
main.app.state.key_console = DevKeyConsole(settings, path, transport=httpx.MockTransport(provider))
app = main.app
