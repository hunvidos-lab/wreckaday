"""Opt-in development reference-photo service. No accounts or media storage; content-free budget metadata is durable."""

import json
from urllib.parse import urlsplit

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from .dev_keys import DevKeyConsole
from .dev_keys import router as key_router
from .generation import GenerateInput, GenerationError, GenerationService
from .generation_config import ENV_FILE, settings

app = FastAPI(title="Wreckaday — payback preview", docs_url=None, redoc_url=None, openapi_url=None)
service = GenerationService(settings)
app.state.key_console = DevKeyConsole(settings, ENV_FILE)
app.state.generation_service = lambda: service


def install_settings(updated):
    global settings
    settings = updated


app.state.install_settings = install_settings
app.include_router(key_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Idempotency-Key", "Authorization"],
)


def error(code, message, status):
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message}},
        headers={"Cache-Control": "no-store"},
    )


@app.middleware("http")
async def boundary(request: Request, call_next):
    origin = request.headers.get("origin")
    console_path = request.url.path.startswith("/v2/dev/keys")
    if console_path and not app.state.key_console.allowed(request):
        response = error("NOT_FOUND", "Not found.", 404)
    elif origin and origin not in settings.cors_origins.split(","):
        response = error("ORIGIN_NOT_ALLOWED", "This origin is not allowed.", 403)
    elif not console_path and request.url.path not in (
        "/healthz",
        "/readyz",
        "/v2/capabilities",
        "/v2/generate",
    ):
        response = error("LEGACY_API_RETIRED", "This route is no longer available.", 410)
    elif request.url.path == "/v2/generate" and request.method != "OPTIONS" and not settings.configured:
        response = error(
            "PROVIDERS_NOT_CONFIGURED",
            "Generation is not connected. Your photo has not been sent to a model.",
            503,
        )
    else:
        response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    # The outer boundary also covers errors generated before CORS middleware.
    origin = request.headers.get("origin")
    if origin in settings.cors_origins.split(","):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    return response


@app.get("/healthz")
@app.get("/readyz")
def health():
    return {"data": {"status": "ok", "mode": "payback-preview", "content_api": settings.configured}}


@app.get("/v2/capabilities")
def capabilities():
    text_host = urlsplit(settings.text_endpoint).hostname or "the configured text provider"
    image_host = urlsplit(settings.image_endpoint).hostname or "the configured image provider"
    return {
        "data": {
            "generation_available": settings.configured,
            "photo_processing": f"This development server processes your photo and premise in memory. Your premise is sent to {text_host}; your reference photo and scene prompts are sent to {image_host}. Their retention policies apply. This server does not save photos, premises or generated scenes to disk. It retains content-free budget and provider-usage metadata.",
        }
    }


@app.post("/v2/generate")
async def generate(request: Request):
    request_id = request.headers.get("idempotency-key", "")
    if not 8 <= len(request_id) <= 128:
        return error("INVALID_REQUEST_ID", "Start a new generation request.", 422)
    chunks, size = [], 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > 14 * 1024 * 1024:
            return error("PHOTO_TOO_LARGE", "Use a photo under 10 MB.", 413)
        chunks.append(chunk)
    try:
        body = GenerateInput.model_validate_json(b"".join(chunks))
    except (ValidationError, json.JSONDecodeError):
        return error(
            "INVALID_BRIEF", "Add your premise and confirm age, photo rights and provider processing.", 422
        )
    try:
        result = await run_in_threadpool(service.generate, body, request_id)
        return {"data": result}
    except GenerationError as exc:
        return error(exc.code, exc.message, exc.status)
