import json
import stat

import httpx
import pytest
from fastapi.testclient import TestClient

from app import main
from app.dev_keys import DevKeyConsole
from app.generation import GenerationService
from app.generation_config import GenerationSettings

SECRET = "fixture-private-key-ab12"
TOKEN = "fixture-startup-console-password"
AUTH = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
def console(tmp_path, monkeypatch):
    path = tmp_path / ".env"
    path.write_bytes(
        b"# Keep this comment exactly\r\nUNRELATED='value # literal'\r\nWRECKDAY_TEXT_API_KEY=old-key\r\n"
    )
    settings = GenerationSettings(
        _env_file=None,
        key_console_enabled=True,
        key_console_token=TOKEN,
        text_api_key=SECRET,
        image_api_key=SECRET,
        image_provider="fal",
        image_endpoint="https://fal.run/fal-ai/flux-2/klein/4b/edit",
        text_endpoint="https://api.cloudflare.com/client/v4/accounts/fixture/ai/v1/chat/completions",
        budget_database_url="sqlite:///:memory:",
    )
    instance = DevKeyConsole(settings, path)
    monkeypatch.setitem(main.app.state._state, "key_console", instance)
    monkeypatch.setattr(main, "settings", settings)
    monkeypatch.setattr(main, "service", GenerationService(settings))
    return instance


def local_client(host="127.0.0.1", base="http://localhost:8000"):
    return TestClient(main.app, base_url=base, client=(host, 12345))


@pytest.mark.parametrize(
    ("method", "path"), [("GET", "/v2/dev/keys"), ("PUT", "/v2/dev/keys"), ("POST", "/v2/dev/keys/test")]
)
@pytest.mark.parametrize("gate", ["disabled", "remote", "production", "host", "origin"])
def test_console_gates_return_404(console, method, path, gate):
    headers = dict(AUTH)
    client = local_client()
    if gate == "disabled":
        console.settings = console.settings.model_copy(update={"key_console_enabled": False})
    elif gate == "production":
        console.settings = console.settings.model_copy(update={"environment": "production"})
    elif gate == "remote":
        client = local_client(host="203.0.113.9")
    elif gate == "host":
        client = local_client(base="http://attacker.example:8000")
    elif gate == "origin":
        headers["Origin"] = "https://attacker.example"
    assert client.request(method, path, headers=headers).status_code == 404


@pytest.mark.parametrize("password", [None, "wrong-password"])
@pytest.mark.parametrize(
    ("method", "path"), [("GET", "/v2/dev/keys"), ("PUT", "/v2/dev/keys"), ("POST", "/v2/dev/keys/test")]
)
def test_missing_or_wrong_password_is_401(console, password, method, path):
    headers = {} if password is None else {"Authorization": f"Bearer {password}"}
    assert local_client().request(method, path, headers=headers).status_code == 401


def test_get_masks_secrets_and_does_not_expose_console_token(console):
    response = local_client().get("/v2/dev/keys", headers=AUTH)
    assert response.status_code == 200
    assert SECRET not in response.text and TOKEN not in response.text
    assert response.json()["data"]["values"]["WRECKDAY_TEXT_API_KEY"] == {"set": True, "last4": "ab12"}
    assert "UNRELATED" not in response.text
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize(
    "values",
    [
        {"OTHER_KEY": SECRET},
        {"WRECKDAY_TEXT_API_KEY": "first\nsecond"},
        {"WRECKDAY_TEXT_API_KEY": "x\ry"},
        {"WRECKDAY_TEXT_API_KEY": "x" * 513},
        {"WRECKDAY_TEXT_API_KEY": "=invalid"},
        {"WRECKDAY_TEXT_API_KEY": "${UNRELATED}"},
        {"WRECKDAY_TEXT_ENDPOINT": "http://remote.example/v1/chat/completions"},
        {"WRECKDAY_TEXT_ENDPOINT": "https://host.example/path?key=secret"},
        {"WRECKDAY_IMAGE_PROVIDER": "unknown"},
        {"WRECKDAY_DAILY_BUDGET_USD": "-1"},
        {"WRECKDAY_IMAGE_COST_CEILING_USD": "NaN"},
        {"WRECKDAY_TEXT_COST_CEILING_USD": "Infinity"},
        {"WRECKDAY_TEXT_API_KEY": {"bad": SECRET}},
    ],
)
def test_invalid_values_are_rejected_without_echo(console, values):
    before = console.path.read_bytes()
    response = local_client().put("/v2/dev/keys", headers=AUTH, json={"values": values})
    assert response.status_code == 422
    assert SECRET not in response.text
    assert console.path.read_bytes() == before


def test_atomic_save_preserves_comments_permissions_and_hot_reloads(console):
    before = console.path.read_bytes()
    reserved = main.service.reserved
    response = local_client().put(
        "/v2/dev/keys",
        headers=AUTH,
        json={
            "values": {
                "WRECKDAY_TEXT_API_KEY": SECRET,
                "WRECKDAY_DAILY_BUDGET_USD": "2.00",
            }
        },
    )
    assert response.status_code == 200
    assert SECRET not in response.text
    assert console.path.read_bytes().startswith(before.split(b"WRECKDAY_TEXT_API_KEY")[0])
    assert stat.S_IMODE(console.path.stat().st_mode) == 0o600
    assert not list(console.path.parent.glob(".wreckaday-env-*"))
    assert main.settings.text_api_key.get_secret_value() == SECRET
    assert main.service.settings is main.settings
    assert main.service.reserved == reserved
    assert response.json()["data"]["restart_required"] is False


def test_secret_round_trip_special_characters_and_blank_leave_unchanged(console):
    special = "key-'quote-\"-\\-#-space-$-é-ab12"
    client = local_client()
    response = client.put("/v2/dev/keys", headers=AUTH, json={"values": {"WRECKDAY_TEXT_API_KEY": special}})
    assert response.status_code == 200 and special not in response.text
    reloaded = GenerationSettings(_env_file=console.path)
    assert reloaded.text_api_key.get_secret_value() == special
    assert (
        client.put("/v2/dev/keys", headers=AUTH, json={"values": {"WRECKDAY_TEXT_API_KEY": ""}}).status_code
        == 200
    )
    assert main.settings.text_api_key.get_secret_value() == special


def test_busy_service_blocks_writes_and_preserves_reservations(console):
    before = console.path.read_bytes()
    main.service.busy = True
    response = local_client().put(
        "/v2/dev/keys", headers=AUTH, json={"values": {"WRECKDAY_DAILY_BUDGET_USD": "1"}}
    )
    assert response.status_code == 409
    assert console.path.read_bytes() == before


@pytest.mark.parametrize(
    ("status", "expected"), [(422, True), (401, False), (403, False), (200, False), (500, False)]
)
def test_fal_empty_body_probe_has_no_inference_input_or_response_echo(console, status, expected):
    calls = []

    def handler(request):
        calls.append(request)
        assert request.method == "POST" and json.loads(request.content) == {}
        assert request.url == "https://fal.run/fal-ai/flux-2/klein/4b/edit"
        assert request.headers["authorization"] == f"Key {SECRET}"
        return httpx.Response(status, json={"private": SECRET})

    console.transport = httpx.MockTransport(handler)
    response = local_client().post("/v2/dev/keys/test", headers=AUTH, json={"target": "image"})
    assert response.status_code == 200
    assert response.json()["data"]["ok"] is expected
    assert SECRET not in response.text
    assert len(calls) == 1


@pytest.mark.parametrize("target", ["text", "image"])
def test_unsupported_hosts_never_receive_probe_or_key(console, target):
    console.settings = console.settings.model_copy(
        update={
            "text_endpoint": "https://unrecognized.example/chat",
            "image_endpoint": "https://unrecognized.example/edit",
        }
    )
    console.transport = httpx.MockTransport(lambda request: pytest.fail("Must not call this host"))
    response = local_client().post("/v2/dev/keys/test", headers=AUTH, json={"target": target})
    assert not response.json()["data"]["ok"]
    assert "paid call" in response.json()["data"]["message"]


def test_text_probe_uses_read_only_model_list_never_chat(console):
    calls = []

    def handler(request):
        calls.append(request)
        assert request.method == "GET"
        assert request.url.path == "/client/v4/accounts/fixture/ai/models/search"
        return httpx.Response(200, json={"private": SECRET})

    console.transport = httpx.MockTransport(handler)
    response = local_client().post("/v2/dev/keys/test", headers=AUTH, json={"target": "text"})
    assert response.json()["data"]["ok"] and len(calls) == 1
    assert SECRET not in response.text


def test_cors_preflight_allows_authenticated_put(console):
    response = local_client().options(
        "/v2/dev/keys",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"


def test_short_key_is_not_disclosed_in_full_and_old_password_expires(console):
    console.settings = console.settings.model_copy(
        update={"text_api_key": main.settings.text_api_key.__class__("tiny")}
    )
    response = local_client().get("/v2/dev/keys", headers=AUTH)
    assert "tiny" not in response.text
    assert response.json()["data"]["values"]["WRECKDAY_TEXT_API_KEY"] == {"set": True, "last4": ""}
    console.token = "different-next-launch-password"
    assert local_client().get("/v2/dev/keys", headers=AUTH).status_code == 401


@pytest.mark.parametrize("content", [b'{"values":', b"[]", b"x" * 16385])
def test_malformed_or_oversized_body_is_sanitized(console, content):
    response = local_client().put("/v2/dev/keys", headers=AUTH, content=content)
    assert response.status_code == 422
    assert SECRET not in response.text
