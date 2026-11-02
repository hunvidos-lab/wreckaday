from datetime import date
import base64
import io
import json
from decimal import Decimal

import httpx
import pytest
from PIL import Image

from app.generation import GenerateInput, GenerationError, GenerationService, decode_photo
from app.generation_config import GenerationSettings


def photo():
    output = io.BytesIO()
    image = Image.new("RGB", (48, 64), "#993311")
    exif = Image.Exif()
    exif[315] = "private photographer metadata"
    image.save(output, "JPEG", exif=exif)
    return output.getvalue()


def payload(package="flicker"):
    return GenerateInput(
        package_id=package,
        premise="Put me in a cinematic penthouse surrounded by red roses.",
        photo_data_url="data:image/jpeg;base64," + base64.b64encode(photo()).decode(),
        adult_confirmed=True,
        own_photo_confirmed=True,
        provider_processing_confirmed=True,
    )


def configuration(**overrides):
    values = dict(
        _env_file=None,
        live_generation_enabled=True,
        text_endpoint="https://text.invalid/v1/chat/completions",
        text_api_key="secret-text-fixture",
        image_api_key="secret-image-fixture",
        session_budget_usd="1.00",
        text_cost_ceiling_usd="0.01",
        image_cost_ceiling_usd="0.02",
    )
    values.update(overrides)
    return GenerationSettings(**values)


def handler_for(count, calls, *, review=True, bad_polling=False, fail=False, regional_polling=False):
    def handler(request):
        calls.append(request)
        if request.url.host == "text.invalid":
            assert request.headers["authorization"] == "Bearer secret-text-fixture"
            body = json.loads(request.content)
            schema = body["response_format"]["json_schema"]["schema"]
            assert body["model"] == "meta-llama/Llama-3.3-70B-Instruct"
            result = (
                {"allowed": review}
                if "allowed" in schema["properties"]
                else {
                    "scenes": [
                        {
                            "caption": f"Scene {i + 1}. Point made.",
                            "image_prompt": "Photorealistic adult uploader in the same penthouse with red roses.",
                        }
                        for i in range(count)
                    ]
                }
            )
            return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(result)}}]})
        if request.url.path == "/v1/flux-2-klein-4b":
            assert request.headers["x-key"] == "secret-image-fixture"
            body = json.loads(request.content)
            reference = Image.open(io.BytesIO(base64.b64decode(body["input_image"])))
            assert not reference.getexif()
            assert reference.size == (48, 64)
            assert "safety_tolerance" not in body
            if fail:
                return httpx.Response(429, json={"private": "secret-image-fixture"})
            return httpx.Response(
                200,
                json={
                    "polling_url": "https://evil.invalid/steal-key"
                    if bad_polling
                    else (
                        "https://api.eu.bfl.ai/v1/get_result?id=fixture"
                        if regional_polling
                        else "https://api.bfl.ai/v1/get_result?id=fixture"
                    )
                },
            )
        if request.url.path == "/v1/get_result":
            return httpx.Response(
                200, json={"status": "Ready", "result": {"sample": "https://delivery.bfl.ai/result.jpg"}}
            )
        if request.url.host == "delivery.bfl.ai":
            assert "x-key" not in request.headers
            return httpx.Response(200, content=photo())
        raise AssertionError("Unexpected provider request")

    return handler


@pytest.mark.parametrize("package,count", [("flicker", 1), ("blaze", 3), ("inferno", 5)])
def test_reference_photo_pipeline_generates_server_owned_scene_count(package, count):
    calls = []
    service = GenerationService(
        configuration(), httpx.MockTransport(handler_for(count, calls)), sleep=lambda _: None
    )
    result = service.generate(payload(package), "generation-fixture")
    assert len(result["scenes"]) == count
    assert sum(request.url.path == "/v1/flux-2-klein-4b" for request in calls) == count
    assert sum(request.url.host == "text.invalid" for request in calls) == 2
    assert result["actual_cost_usd"] is None
    assert Decimal(result["cost_ceiling_usd"]) == Decimal("0.01") + count * Decimal("0.02")
    assert all(
        not Image.open(io.BytesIO(decode_photo(scene["image_data_url"]))).getexif()
        for scene in result["scenes"]
    )


def test_failed_provider_has_no_retry_and_keeps_conservative_reservation():
    calls = []
    service = GenerationService(
        configuration(), httpx.MockTransport(handler_for(1, calls, fail=True)), sleep=lambda _: None
    )
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "generation-fail")
    assert error.value.code == "PROVIDER_FAILED"
    assert "secret" not in error.value.message
    assert sum(request.url.path == "/v1/flux-2-klein-4b" for request in calls) == 1
    assert service.reserved == Decimal("0.03")
    assert service.busy is False
    before = len(calls)
    with pytest.raises(GenerationError, match="already attempted"):
        service.generate(payload(), "generation-fail")
    assert len(calls) == before


def test_provider_cannot_redirect_api_key_to_arbitrary_polling_host():
    calls = []
    service = GenerationService(
        configuration(), httpx.MockTransport(handler_for(1, calls, bad_polling=True)), sleep=lambda _: None
    )
    with pytest.raises(GenerationError):
        service.generate(payload(), "generation-bad-host")
    assert all(request.url.host != "evil.invalid" for request in calls)


def test_budget_and_request_limits_block_before_provider_calls():
    service = GenerationService(configuration(session_budget_usd="0.02"))
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "generation-over-budget")
    assert error.value.code == "BUDGET_REACHED"
    assert service.reserved == 0
    service = GenerationService(configuration(max_generation_requests=1))
    service.reserve("first", 1)
    service.busy = False
    with pytest.raises(GenerationError):
        service.reserve("second", 1)


def test_moderation_rejects_before_image_generation():
    calls = []
    service = GenerationService(configuration(), httpx.MockTransport(handler_for(1, calls, review=False)))
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "generation-denied")
    assert error.value.code == "PREMISE_NOT_SUPPORTED"
    assert len(calls) == 1
    body = payload().model_copy(update={"premise": "Make a fake police report and blackmail someone"})
    calls.clear()
    with pytest.raises(GenerationError):
        service.generate(body, "generation-denied-locally")
    assert calls == []


def test_self_hosted_edits_contract_includes_photo_and_model():
    calls = []
    standard = handler_for(1, calls)

    def handler(request):
        if request.url.host == "127.0.0.1":
            assert request.headers["authorization"] == "Bearer secret-image-fixture"
            assert b'name="image"' in request.content
            assert b"reference.jpg" in request.content
            assert b"Qwen/Qwen-Image-Edit" in request.content
            return httpx.Response(200, json={"data": [{"b64_json": base64.b64encode(photo()).decode()}]})
        return standard(request)

    service = GenerationService(
        configuration(
            image_provider="image_edits",
            image_endpoint="http://127.0.0.1:9000/v1/images/edits",
            image_model="Qwen/Qwen-Image-Edit",
        ),
        httpx.MockTransport(handler),
    )
    assert len(service.generate(payload(), "generation-local")["scenes"]) == 1


def test_disabled_generation_and_invalid_photo_do_not_call_provider():
    service = GenerationService(configuration(live_generation_enabled=False))
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "generation-disabled")
    assert error.value.status == 503
    for value in (
        "https://evil.invalid/photo.jpg",
        "data:image/png;base64,!!!",
        "data:image/jpeg;base64," + base64.b64encode(b"not an image").decode(),
    ):
        with pytest.raises(GenerationError):
            decode_photo(value)


@pytest.mark.parametrize(
    "endpoint",
    [
        "http://remote.invalid/endpoint",
        "https://key:secret@host.invalid/endpoint",
        "https://host.invalid/endpoint?key=secret",
    ],
)
def test_endpoint_config_refuses_insecure_or_embedded_credentials(endpoint):
    with pytest.raises(ValueError):
        configuration(text_endpoint=endpoint)


def test_api_generation_and_capabilities_without_legacy_storage(client, monkeypatch):
    import app.main as main

    calls = []
    configured = configuration()
    monkeypatch.setattr(main, "settings", configured)
    monkeypatch.setattr(
        main,
        "service",
        GenerationService(configured, httpx.MockTransport(handler_for(1, calls)), sleep=lambda _: None),
    )
    assert client.get("/v2/capabilities").json()["data"]["generation_available"] is True
    response = client.post(
        "/v2/generate", headers={"Idempotency-Key": "api-generation-fixture"}, json=payload().model_dump()
    )
    assert response.status_code == 200, response.text
    assert len(response.json()["data"]["scenes"]) == 1
    assert "secret-" not in response.text
    body = payload().model_dump()
    body["own_photo_confirmed"] = False
    assert (
        client.post("/v2/generate", headers={"Idempotency-Key": "api-invalid-consent"}, json=body).status_code
        == 422
    )
    assert (
        client.post(
            "/v2/generate",
            headers={"Origin": "https://untrusted.invalid", "Idempotency-Key": "api-forged-origin"},
            json=payload().model_dump(),
        ).status_code
        == 403
    )


def test_unconfigured_api_blocks_photo_body_and_allows_local_cors(client, monkeypatch):
    import app.main as main

    monkeypatch.setattr(main, "settings", GenerationSettings(_env_file=None, live_generation_enabled=False))
    response = client.post(
        "/v2/generate",
        headers={"Origin": "http://localhost:8081"},
        content=b"invalid JSON should not be read",
    )
    assert response.status_code == 503
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"


def test_bfl_regional_polling_url_is_supported_without_trusting_arbitrary_hosts():
    calls = []
    service = GenerationService(
        configuration(),
        httpx.MockTransport(handler_for(1, calls, regional_polling=True)),
        sleep=lambda _: None,
    )
    assert len(service.generate(payload(), "generation-regional")["scenes"]) == 1
    assert any(
        request.url.host == "api.eu.bfl.ai" and request.headers["x-key"] == "secret-image-fixture"
        for request in calls
    )


def test_bfl_pending_status_has_a_hard_poll_limit_and_no_resubmission():
    calls = []
    standard = handler_for(1, calls)

    def handler(request):
        if request.url.path == "/v1/get_result":
            calls.append(request)
            return httpx.Response(200, json={"status": "Pending"})
        return standard(request)

    service = GenerationService(configuration(), httpx.MockTransport(handler), sleep=lambda _: None)
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "generation-poll-limit")
    assert error.value.code == "PROVIDER_TIMEOUT"
    assert sum(request.url.path == "/v1/get_result" for request in calls) == 30
    assert sum(request.url.path == "/v1/flux-2-klein-4b" for request in calls) == 1
    assert service.reserved == Decimal("0.03")


def test_only_one_in_flight_generation_can_reserve_a_budget():
    service = GenerationService(configuration())
    service.reserve("first", 1)
    with pytest.raises(GenerationError) as error:
        service.reserve("parallel", 1)
    assert error.value.code == "BUSY"
    assert service.request_ids == {"first"}
    assert service.reserved == Decimal("0.03")


def test_daily_budget_blocks_then_resets_next_utc_day():
    days = iter([date(2026, 11, 2), date(2026, 11, 2), date(2026, 11, 3)])
    service = GenerationService(
        configuration(daily_budget_usd="0.03", session_budget_usd="1.00", max_generation_requests=10),
        today=lambda: next(days),
    )
    service.reserve("day-one", 1)
    service.busy = False
    with pytest.raises(GenerationError) as error:
        service.reserve("day-one-again", 1)
    assert error.value.code == "DAILY_BUDGET_REACHED"
    service.reserve("day-two", 1)
    assert service.day_reserved == Decimal("0.03")
    assert service.reserved == Decimal("0.06")


def test_fal_edit_sends_inline_photo_and_decodes_inline_result():
    seen = {}
    jpeg = io.BytesIO()
    Image.new("RGB", (8, 8)).save(jpeg, "JPEG")

    def handler(request):
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        encoded = base64.b64encode(jpeg.getvalue()).decode()
        return httpx.Response(200, json={"images": [{"url": "data:image/jpeg;base64," + encoded}]})

    service = GenerationService(
        configuration(image_provider="fal", image_endpoint="https://fal.run/fal-ai/flux-2/klein/4b/edit")
    )
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        assert service.edit(client, jpeg.getvalue(), "scene") == jpeg.getvalue()
    assert seen["auth"] == "Key secret-image-fixture"
    assert seen["body"]["sync_mode"] is True
    assert seen["body"]["image_urls"][0].startswith("data:image/jpeg;base64,")


def test_fal_edit_rejects_remote_result_url():
    def handler(request):
        return httpx.Response(200, json={"images": [{"url": "https://evil.invalid/x.jpg"}]})

    service = GenerationService(configuration(image_provider="fal"))
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(ValueError):
            service.edit(client, b"photo", "scene")
