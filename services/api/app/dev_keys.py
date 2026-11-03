"""Loopback-only development console. No submitted values or provider bodies are returned/logged."""

import hmac
import json
import os
import re
import secrets
import sys
import tempfile
import threading
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, ValidationError
from starlette.concurrency import run_in_threadpool

from .generation_config import GenerationSettings

FIELDS = {
    "WRECKDAY_TEXT_ENDPOINT": "text_endpoint",
    "WRECKDAY_TEXT_API_KEY": "text_api_key",
    "WRECKDAY_TEXT_MODEL": "text_model",
    "WRECKDAY_IMAGE_PROVIDER": "image_provider",
    "WRECKDAY_IMAGE_ENDPOINT": "image_endpoint",
    "WRECKDAY_IMAGE_API_KEY": "image_api_key",
    "WRECKDAY_DAILY_BUDGET_USD": "daily_budget_usd",
    "WRECKDAY_TEXT_COST_CEILING_USD": "text_cost_ceiling_usd",
    "WRECKDAY_IMAGE_COST_CEILING_USD": "image_cost_ceiling_usd",
    "WRECKDAY_LIVE_GENERATION_ENABLED": "live_generation_enabled",
}
SECRET_FIELDS = {"WRECKDAY_TEXT_API_KEY", "WRECKDAY_IMAGE_API_KEY"}
LOOPBACK = {"localhost", "127.0.0.1", "::1"}
router = APIRouter(prefix="/v2/dev/keys")


def failure(message, status):
    return JSONResponse(
        {"error": {"message": message}}, status_code=status, headers={"Cache-Control": "no-store"}
    )


class KeyValues(BaseModel):
    model_config = ConfigDict(extra="forbid", hide_input_in_errors=True)
    values: dict[str, str]


class DevKeyConsole:
    def __init__(self, settings: GenerationSettings, path: Path, transport=None):
        self.settings, self.path, self.transport = settings, path, transport
        self.lock = threading.Lock()
        self.token = settings.key_console_token.get_secret_value()
        if settings.key_console_enabled and settings.environment == "development" and not self.token:
            # Direct terminal launch is supported, but never emit a password into redirected logs.
            if sys.stderr.isatty():
                self.token = secrets.token_urlsafe(24)
                print(f"Key console token: {self.token}", file=sys.stderr)

    def allowed(self, request: Request):
        try:
            host = urlsplit("http://" + request.headers.get("host", "")).hostname
            origin = request.headers.get("origin")
            return bool(
                self.settings.environment == "development"
                and self.settings.key_console_enabled
                and self.token
                and request.client
                and request.client.host in {"127.0.0.1", "::1"}
                and host in LOOPBACK
                and (
                    not origin
                    or (
                        origin in self.settings.cors_origins.split(",")
                        and urlsplit(origin).hostname in LOOPBACK
                    )
                )
            )
        except ValueError:
            return False

    def authorized(self, request):
        value = request.headers.get("authorization", "")
        return hmac.compare_digest(value.encode(), ("Bearer " + self.token).encode())

    def snapshot(self):
        settings = self.settings
        values = {}
        for key, field in FIELDS.items():
            value = getattr(settings, field)
            if key in SECRET_FIELDS:
                secret = value.get_secret_value()
                # A short malformed key must never be revealed in full by last4.
                values[key] = {"set": bool(secret), "last4": secret[-4:] if len(secret) > 4 else ""}
            else:
                values[key] = value if isinstance(value, bool) else "" if value is None else str(value)
        return {
            "data": {
                "values": values,
                "generation_available": settings.configured,
                "restart_required": False,
            }
        }

    def write(self, values: dict, service, install):
        if not values or set(values) - FIELDS.keys():
            return failure("Use only the supported settings.", 422)
        if any(
            len(value) > 512
            or value.startswith("=")
            or "${" in value
            or any(ord(char) < 32 or ord(char) == 127 for char in value)
            for value in values.values()
        ):
            return failure(
                "Values must be single-line text, at most 512 characters, without interpolation.", 422
            )
        # Blank secret input means leave the saved key unchanged.
        values = {key: value for key, value in values.items() if key not in SECRET_FIELDS or value}
        with self.lock, service.lock:
            if service.busy:
                return failure("Wait for generation to finish before changing keys.", 409)
            try:
                candidate = GenerationSettings(
                    _env_file=None,
                    **{**self.settings.model_dump(), **{FIELDS[key]: value for key, value in values.items()}},
                )
            except ValidationError:
                return failure(
                    "Check URLs, model/provider names, nonnegative budgets and on/off values.", 422
                )
            try:
                original = self.path.read_bytes() if self.path.exists() else b""
                lines, matched = [], set()
                for line in original.splitlines(keepends=True):
                    match = re.match(rb"[ \t]*(?:export[ \t]+)?([A-Z_][A-Z0-9_]*)[ \t]*=", line)
                    key = match[1].decode() if match else None
                    if key in values:
                        ending = b"\r\n" if line.endswith(b"\r\n") else b"\n" if line.endswith(b"\n") else b""
                        line = (key + "=" + json.dumps(values[key], ensure_ascii=False)).encode() + ending
                        matched.add(key)
                    lines.append(line)
                updated = b"".join(lines)
                for key in values.keys() - matched:
                    if updated and not updated.endswith(b"\n"):
                        updated += b"\n"
                    updated += (key + "=" + json.dumps(values[key], ensure_ascii=False) + "\n").encode()
                descriptor, name = tempfile.mkstemp(prefix=".wreckaday-env-", dir=self.path.parent)
                try:
                    with os.fdopen(descriptor, "wb") as target:
                        target.write(updated)
                        target.flush()
                        os.fsync(target.fileno())
                        os.fchmod(target.fileno(), 0o600)
                    os.replace(name, self.path)
                    os.chmod(self.path, 0o600)
                finally:
                    if os.path.exists(name):
                        os.unlink(name)
            except OSError:
                return failure(
                    "Could not update the local .env. No key was returned. Check file permissions.", 503
                )
            self.settings = candidate
            service.settings = candidate  # Preserve session reservations, request IDs and the shared ledger.
            install(candidate)
            return self.snapshot()

    def test(self, target):
        settings = self.settings  # Stable snapshot for the entire zero-inference probe.
        endpoint = settings.text_endpoint if target == "text" else settings.image_endpoint
        key = (settings.text_api_key if target == "text" else settings.image_api_key).get_secret_value()
        url = urlsplit(endpoint)
        if not endpoint or not key:
            return {"ok": False, "message": "Save an endpoint and key first."}
        headers = {"Authorization": f"Bearer {key}"}
        if target == "text":
            # Only documented read-only endpoints; never submit chat or discover arbitrary paths.
            if url.hostname == "api.cloudflare.com":
                match = re.fullmatch(r"/client/v4/accounts/([a-zA-Z0-9_-]+)/ai/v1/chat/completions", url.path)
                if not match:
                    return {"ok": False, "message": "This text endpoint is not testable without a paid call."}
                probe = f"https://api.cloudflare.com/client/v4/accounts/{match[1]}/ai/models/search"
            elif url.hostname == "openrouter.ai":
                probe = "https://openrouter.ai/api/v1/key"
            else:
                return {"ok": False, "message": "This text host is not testable without a paid call."}
            method = "GET"
        elif settings.image_provider == "fal" and url.hostname == "fal.run":
            # Supported edit schema requires prompt/image_urls. Empty input cannot run inference.
            if url.path.rstrip("/") != "/fal-ai/flux-2/klein/4b/edit":
                return {
                    "ok": False,
                    "message": "Zero-cost testing supports only the documented Klein 4B edit endpoint.",
                }
            probe, method = endpoint, "POST"
            headers = {"Authorization": f"Key {key}"}
        else:
            return {"ok": False, "message": "This image host is not testable without a paid call."}
        try:
            with httpx.Client(transport=self.transport, follow_redirects=False, timeout=10) as client:
                response = client.request(
                    method, probe, headers=headers, **({"json": {}} if method == "POST" else {})
                )
            accepted = response.status_code == (422 if method == "POST" else 200)
            if accepted:
                return {
                    "ok": True,
                    "message": "Key accepted by the no-generation check. No story was generated.",
                }
            if response.status_code in (401, 403):
                return {"ok": False, "message": "The provider rejected the key or its permissions."}
            return {
                "ok": False,
                "message": "The provider could not confirm this key. No generation was requested.",
            }
        except httpx.HTTPError:
            return {"ok": False, "message": "The provider could not be reached. No generation was requested."}


def access(request):
    console = request.app.state.key_console
    if not console.allowed(request):
        return failure("Not found.", 404)
    if not console.authorized(request):
        return failure("Paste the console token from this launch's Terminal window.", 401)
    return None


async def body(request):
    chunks, size = [], 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > 16_384:
            raise ValueError()
        chunks.append(chunk)
    return json.loads(b"".join(chunks))


@router.get("")
def get_keys(request: Request):
    denied = access(request)
    return denied if denied is not None else request.app.state.key_console.snapshot()


@router.put("")
async def put_keys(request: Request):
    denied = access(request)
    if denied is not None:
        return denied
    try:
        values = KeyValues.model_validate(await body(request)).values
    except (ValidationError, ValueError, TypeError):
        return failure("Enter the supported settings as single-line text values.", 422)
    return await run_in_threadpool(
        request.app.state.key_console.write,
        values,
        request.app.state.generation_service(),
        request.app.state.install_settings,
    )


@router.post("/test")
async def test_keys(request: Request):
    denied = access(request)
    if denied is not None:
        return denied
    try:
        data = await body(request)
        if not isinstance(data, dict) or set(data) != {"target"} or data["target"] not in ("text", "image"):
            raise ValueError()
    except (ValueError, TypeError):
        return failure("Choose text or image to test.", 422)
    return {"data": await run_in_threadpool(request.app.state.key_console.test, data["target"])}
