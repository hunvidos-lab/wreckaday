import json
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from decimal import Decimal

import httpx
import pytest
from test_generation import configuration, handler_for, payload, photo

from app.budget_store import BudgetRejected, BudgetStore, DuplicateAttempt
from app.generation import GenerationError, GenerationService, image_url
from app.generation_costs import CostMeter


def test_restart_preserves_daily_budget_and_duplicate_requests(tmp_path):
    config = configuration(
        budget_database_url=f"sqlite:///{tmp_path / 'ledger.sqlite3'}", daily_budget_usd="0.05"
    )
    first = GenerationService(config, today=lambda: date(2026, 11, 2))
    first.reserve("persistent-id", 1)
    restarted = GenerationService(config, today=lambda: date(2026, 11, 2))
    with pytest.raises(GenerationError, match="already attempted") as duplicate:
        restarted.reserve("persistent-id", 1)
    assert duplicate.value.code == "ALREADY_ATTEMPTED"
    with pytest.raises(GenerationError) as cap:
        restarted.reserve("another-id", 1)
    assert cap.value.code == "DAILY_BUDGET_REACHED"
    tomorrow = GenerationService(config, today=lambda: date(2026, 11, 3))
    assert tomorrow.reserve("next-day-id", 1) == Decimal("0.03")


def test_concurrent_connections_cannot_overspend_daily_budget(tmp_path):
    url = f"sqlite:///{tmp_path / 'shared.sqlite3'}"
    stores = [BudgetStore(url) for _ in range(8)]
    for store in stores:
        store.connect()

    def reserve(pair):
        index, store = pair
        try:
            store.reserve(str(index), "2026-11-02", Decimal("0.03"), Decimal("0.10"))
            return True
        except BudgetRejected:
            return False

    with ThreadPoolExecutor(max_workers=8) as executor:
        assert sum(executor.map(reserve, enumerate(stores))) == 3
    assert len(stores[0].records()) == 3


@pytest.mark.skipif(
    not os.getenv("WRECKDAY_TEST_LEDGER_DATABASE_URL"), reason="Isolated PostgreSQL not configured"
)
def test_postgres_concurrent_reservations_and_restart():
    # The opt-in URL MUST point to a fresh disposable test database.
    url = os.environ["WRECKDAY_TEST_LEDGER_DATABASE_URL"]
    stores = [BudgetStore(url) for _ in range(8)]
    for store in stores:
        store.connect()

    def reserve(pair):
        index, store = pair
        try:
            store.reserve(f"postgres-{index}", "2026-11-02", Decimal("0.03"), Decimal("0.10"))
            return index
        except BudgetRejected:
            return None

    with ThreadPoolExecutor(max_workers=8) as executor:
        accepted = [index for index in executor.map(reserve, enumerate(stores)) if index is not None]
    assert len(accepted) == 3
    restarted = BudgetStore(url)
    with pytest.raises(DuplicateAttempt):
        restarted.reserve(f"postgres-{accepted[0]}", "2026-11-03", Decimal("0.03"), Decimal("0.10"))
    restarted.settle(f"postgres-{accepted[0]}", "failed", [{"cost_usd": "0.04"}])
    with pytest.raises(BudgetRejected):
        restarted.reserve("postgres-extra", "2026-11-02", Decimal("0.01"), Decimal("0.10"))


@pytest.mark.parametrize(
    ("content", "finish", "code"),
    [
        ("Here is your JSON: {}", "stop", "TEXT_OUTPUT_FORMAT"),
        ("[]", "stop", "TEXT_OUTPUT_FORMAT"),
        ('{"allowed":true}', "length", "TEXT_OUTPUT_TRUNCATED"),
        ('{"allowed":"false"}', "stop", "TEXT_SCHEMA_INVALID"),
    ],
)
def test_invalid_text_stops_before_images(content, finish, code):
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(
            200, json={"choices": [{"finish_reason": finish, "message": {"content": content}}]}
        )

    service = GenerationService(configuration(), transport=httpx.MockTransport(handler))
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "bad-text-output")
    assert error.value.code == code
    assert len(calls) == 1
    assert service.ledger.records()[0]["status"] == "failed"
    assert not service.busy


@pytest.mark.parametrize(
    "caption",
    [
        "Sitting confidently at the head of the table.",
        "You gaze out at the skyline.",
        "one two three four five six seven eight nine ten eleven",
        "First line\nSecond line",
        "x" * 81,
    ],
)
def test_caption_contract_rejects_stage_directions_and_long_copy(caption):
    fallback = handler_for(1, [])
    calls = []

    def handler(request):
        calls.append(request)
        response = fallback(request)
        if len(calls) == 2:
            result = {
                "scenes": [
                    {"caption": caption, "image_prompt": "Photorealistic adult uploader in a penthouse."}
                ]
            }
            return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(result)}}]})
        return response

    service = GenerationService(configuration(), transport=httpx.MockTransport(handler))
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "bad-caption-id")
    assert error.value.code == "TEXT_SCHEMA_INVALID"
    assert len(calls) == 2


def test_complete_story_records_usage_and_billed_image_without_content():
    text_calls = []
    fallback = handler_for(1, text_calls)

    def handler(request):
        if request.url.host == "text.invalid":
            response = fallback(request)
            data = response.json()
            data["usage"] = {"prompt_tokens": 100, "completion_tokens": 50}
            return httpx.Response(200, json=data)
        if request.url.host == "fal.run":
            return httpx.Response(
                200,
                headers={"x-fal-request-id": "own-request", "x-fal-billable-units": "2"},
                json={"images": [{"url": image_url(photo())}]},
            )
        assert request.url.host == "api.fal.ai"
        assert request.url.params.get_list("request_id") == ["own-request"]
        return httpx.Response(
            200,
            json={
                "has_more": False,
                "billing_events": [
                    {
                        "request_id": "own-request",
                        "endpoint_id": "fal-ai/flux-2/klein/4b/edit",
                        "cost_total": 0.017,
                    },
                    {
                        "request_id": "unrelated-project",
                        "endpoint_id": "fal-ai/flux-2/klein/4b/edit",
                        "cost_total": 999,
                    },
                ],
            },
        )

    config = configuration(
        image_provider="fal",
        image_endpoint="https://fal.run/fal-ai/flux-2/klein/4b/edit",
        text_input_usd_per_million="0.293",
        text_output_usd_per_million="2.253",
    )
    service = GenerationService(config, transport=httpx.MockTransport(handler))
    result = service.generate(payload(), "costed-story")
    assert Decimal(result["actual_cost_usd"]) == Decimal("0.0172839")
    assert result["cost_status"] == "measured"
    record = service.ledger.records()[0]
    assert record["status"] == "completed"
    costs = json.loads(record["costs"])
    assert len(costs) == 3
    assert costs[0]["input_tokens"] == 100
    assert costs[2]["basis"] == "billed"
    serialized = json.dumps(record)
    for private in (payload().premise, "Photorealistic", "secret-", "data:image", "costed-story"):
        assert private not in serialized


def test_missing_usage_and_delayed_billing_are_unknown_not_free():
    meter = CostMeter(configuration(), lambda costs: None)
    meter.begin("text")
    image = meter.begin("image")
    image.update(request_id="pending-request", endpoint_id="fal-ai/flux-2/klein/4b/edit")
    with httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(403))) as client:
        meter.reconcile(client)
    assert meter.summary()["actual_cost_usd"] is None
    assert meter.summary()["cost_status"] == "pending"
    assert meter.summary()["known_cost_usd"] == "0"


def test_observed_overrun_increases_daily_hold_and_settlement_is_idempotent():
    ledger = BudgetStore("sqlite:///:memory:")
    ledger.reserve("overrun", "2026-11-02", Decimal("0.03"), Decimal("0.10"))
    costs = [{"kind": "image", "cost_usd": "0.09", "basis": "billed"}]
    ledger.settle("overrun", "completed", costs)
    ledger.settle("overrun", "completed", costs)
    with pytest.raises(BudgetRejected):
        ledger.reserve("too-much", "2026-11-02", Decimal("0.02"), Decimal("0.10"))
    assert ledger.reserve("remaining", "2026-11-02", Decimal("0.01"), Decimal("0.10")) == Decimal("0.10")


def test_failed_image_retains_partial_text_usage():
    calls = []
    fallback = handler_for(1, calls, fail=True)

    def handler(request):
        response = fallback(request)
        if request.url.host == "text.invalid":
            return httpx.Response(
                200, json={**response.json(), "usage": {"prompt_tokens": 10, "completion_tokens": 2}}
            )
        return response

    service = GenerationService(
        configuration(text_input_usd_per_million="1", text_output_usd_per_million="2"),
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(GenerationError):
        service.generate(payload(), "partial-failure")
    costs = json.loads(service.ledger.records()[0]["costs"])
    assert len(costs) == 3
    assert costs[0]["cost_usd"] == "0.000014"
    assert costs[2]["cost_usd"] is None


def test_cloudflare_exact_model_tariff_and_late_fal_reconciliation():
    config = configuration(
        text_endpoint="https://api.cloudflare.com/client/v4/accounts/fixture/ai/v1/chat/completions",
        text_model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    )
    meter = CostMeter(config, lambda costs: None)
    text = meter.begin("text")
    meter.text(text, httpx.Response(200, json={"usage": {"prompt_tokens": 1000, "completion_tokens": 100}}))
    assert Decimal(text["cost_usd"]) == Decimal("0.0005183")
    assert text["input_usd_per_million"] == "0.293"
    image = meter.begin("image")
    image.update(request_id="late-id", endpoint_id="fal-ai/flux-2/klein/4b/edit")
    with httpx.Client(
        transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"billing_events": []}))
    ) as client:
        meter.reconcile(client)
    assert meter.summary()["actual_cost_usd"] is None
    event = {"request_id": "late-id", "endpoint_id": image["endpoint_id"], "cost_total": 0.018}
    with httpx.Client(
        transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"billing_events": [event]}))
    ) as client:
        meter.reconcile(client)
    assert Decimal(meter.summary()["actual_cost_usd"]) == Decimal("0.0185183")


def test_storage_failure_stops_before_provider_calls(tmp_path):
    blocked = tmp_path / "not-a-directory"
    blocked.write_text("blocked")
    calls = []
    service = GenerationService(
        configuration(budget_database_url=f"sqlite:///{blocked / 'ledger.sqlite3'}"),
        transport=httpx.MockTransport(handler_for(1, calls)),
    )
    with pytest.raises(GenerationError) as error:
        service.generate(payload(), "storage-failure")
    assert error.value.code == "BUDGET_UNAVAILABLE"
    assert not calls


def test_migration_seed_honors_prior_process_reservations():
    ledger = BudgetStore("sqlite:///:memory:")
    ledger.seed_day("2026-11-02", Decimal("0.06"))
    assert ledger.reserve("new", "2026-11-02", Decimal("0.03"), Decimal("0.10")) == Decimal("0.09")
    with pytest.raises(BudgetRejected):
        ledger.reserve("over", "2026-11-02", Decimal("0.02"), Decimal("0.10"))
