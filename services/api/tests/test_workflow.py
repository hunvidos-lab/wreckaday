import json
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

import pytest
from sqlalchemy import func, select

from app import media, worker
from app.config import Settings
from app.models import Account, Job, Ledger, Session, Story, now
from app.schemas import StoryInput

PAYLOAD = {"template_slug": "seven-foot-fiancee", "name": "Alex"}


def story(client, headers):
    response = client.post("/v1/stories", headers=headers, json=PAYLOAD)
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def enqueue(client, headers, sid, key="generation-test-0001"):
    return client.post(f"/v1/stories/{sid}/generate", headers={**headers, "Idempotency-Key": key})


def fake_render(directory, frames, reveal, output):
    output.write_bytes(b"fake-test-video")
    for index in range(3):
        (directory / f"card-{index}.png").write_bytes(b"fake-test-still")


def test_real_end_to_end_export_edit_and_delete(client, headers, other):
    sid = story(client, headers)
    queued = enqueue(client, headers, sid)
    assert queued.status_code == 202
    jid = queued.json()["data"]["id"]
    assert client.get("/v1/wallet", headers=headers).json()["data"]["reserved"] == 3
    assert worker.run_once() == jid
    job = client.get(f"/v1/jobs/{jid}", headers=headers).json()["data"]
    assert job["state"] == "completed"
    assert job["provider_cost_usd"] == 0
    result = client.get(f"/v1/stories/{sid}", headers=headers).json()["data"]
    assert len(result["frames"]) == 3
    assert client.get(result["frames"][0]["still_url"]).status_code == 200
    from PIL import Image

    with Image.open(media.path(result["frames"][0]["still_key"])) as still:
        assert still.size == (1080, 1920)
        assert still.format == "PNG"
    assert result["export_url"] is None
    assert client.get(f"/v1/stories/{sid}", headers=other).status_code == 404
    assert client.get(f"/v1/jobs/{jid}", headers=other).status_code == 404
    wallet = client.get("/v1/wallet", headers=headers).json()["data"]
    assert wallet["available"] == 27 and wallet["reserved"] == 0
    edit = {
        "revision": 0,
        "captions": ["New hook.", "Bad plan.", "Better ceiling."],
        "order": [2, 0, 1],
        "reveal": "That was entirely fictional.",
    }
    edited = client.patch(f"/v1/stories/{sid}", headers=headers, json=edit)
    assert edited.status_code == 200
    assert edited.json()["data"]["frames"][0]["caption"] == "Better ceiling."
    assert edited.json()["data"]["export_url"] is None
    assert client.patch(f"/v1/stories/{sid}", headers=headers, json=edit).status_code == 409
    exported = client.post(f"/v1/stories/{sid}/export", headers=headers)
    assert exported.status_code == 202
    assert worker.run_once()
    final = client.get(f"/v1/stories/{sid}", headers=headers).json()["data"]
    assert client.get(final["frames"][0]["still_url"]).status_code == 200
    assert client.get("/v1/wallet", headers=headers).json()["data"]["available"] == 27
    assert client.delete(f"/v1/stories/{sid}", headers=headers).status_code == 200
    assert client.get(final["frames"][0]["still_url"]).status_code == 404
    assert not media.path(sid).exists()


def test_auth_every_private_route(client, headers, other):
    sid = story(client, headers)
    jid = enqueue(client, headers, sid).json()["data"]["id"]
    for method, path, body in [
        ("GET", "/v1/me", None),
        ("GET", "/v1/wallet", None),
        ("GET", "/v1/stories", None),
        ("POST", "/v1/stories", PAYLOAD),
        ("GET", f"/v1/stories/{sid}", None),
        ("GET", f"/v1/jobs/{jid}", None),
        ("POST", f"/v1/stories/{sid}/export", None),
        ("DELETE", f"/v1/stories/{sid}", None),
    ]:
        assert client.request(method, path, json=body).status_code == 401
    for method, path, body in [
        ("GET", f"/v1/stories/{sid}", None),
        ("POST", f"/v1/stories/{sid}/export", None),
        ("DELETE", f"/v1/stories/{sid}", None),
        (
            "PATCH",
            f"/v1/stories/{sid}",
            {"revision": 0, "captions": ["a", "b", "c"], "order": [0, 1, 2], "reveal": "fiction"},
        ),
    ]:
        assert client.request(method, path, headers=other, json=body).status_code == 404
    assert enqueue(client, other, sid).status_code == 404
    assert client.get("/v1/stories", headers=other).json()["data"] == []
    assert client.get("/v1/wallet", headers={"Authorization": "Bearer forged"}).status_code == 401


def test_idempotency_concurrency_and_insufficient_funds(client, headers):
    sid = story(client, headers)
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(pool.map(lambda _: enqueue(client, headers, sid), range(4)))
    assert all(r.status_code == 202 for r in responses)
    assert len({r.json()["data"]["id"] for r in responses}) == 1
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(Job)) == 1
        assert db.scalar(select(func.count()).select_from(Ledger).where(Ledger.event == "reserve")) == 1
    sid2 = story(client, headers)
    assert enqueue(client, headers, sid2, "generation-different").status_code == 409
    client.delete(f"/v1/stories/{sid}", headers=headers)
    with Session.begin() as db:
        account = db.scalar(select(Account).with_for_update())
        account.available = 2
    assert enqueue(client, headers, sid2, "no-funds-test").status_code == 402
    assert client.get("/v1/wallet", headers=headers).json()["data"]["reserved"] == 0


def test_failure_releases_once_and_claim_is_exclusive(client, headers):
    sid = story(client, headers)
    jid = enqueue(client, headers, sid).json()["data"]["id"]
    with ThreadPoolExecutor(max_workers=2) as pool:
        claims = list(pool.map(worker.claim, ["worker-a", "worker-b"]))
    assert claims.count(jid) == 1 and claims.count(None) == 1
    owner = "worker-a" if claims[0] else "worker-b"
    with patch("app.worker.render", side_effect=RuntimeError("render failed")):
        worker.process(jid, owner)
    assert worker.run_once() is None
    wallet = client.get("/v1/wallet", headers=headers).json()["data"]
    assert wallet["available"] == 30 and wallet["reserved"] == 0
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(Ledger).where(Ledger.event == "release")) == 1


def test_lease_recovery_and_retry_bound(client, headers):
    sid = story(client, headers)
    jid = enqueue(client, headers, sid).json()["data"]["id"]
    assert worker.claim("dead-worker") == jid
    with Session.begin() as db:
        db.get(Job, jid).lease_expires_at = now() - timedelta(seconds=1)
    assert worker.claim("second-worker") == jid
    with Session.begin() as db:
        db.get(Job, jid).lease_expires_at = now() - timedelta(seconds=1)
    assert worker.claim("third-worker") is None
    assert client.get(f"/v1/jobs/{jid}", headers=headers).json()["data"]["state"] == "failed"
    assert client.get("/v1/wallet", headers=headers).json()["data"]["reserved"] == 0


def test_deletion_during_worker_does_not_resurrect_media(client, headers):
    sid = story(client, headers)
    jid = enqueue(client, headers, sid).json()["data"]["id"]
    worker.claim("active")

    def delete_while_rendering(directory, frames, reveal, output):
        assert client.delete(f"/v1/stories/{sid}", headers=headers).status_code == 200
        fake_render(directory, frames, reveal, output)

    with patch("app.worker.render", side_effect=delete_while_rendering):
        worker.process(jid, "active")
    assert not media.path(sid).exists()
    assert client.get("/v1/wallet", headers=headers).json()["data"]["available"] == 30


def test_signed_urls_expiry_tampering_and_traversal(client, headers):
    sid = story(client, headers)
    enqueue(client, headers, sid)
    with patch("app.worker.render", side_effect=fake_render):
        worker.run_once()
    s = client.get(f"/v1/stories/{sid}", headers=headers).json()["data"]
    url = s["frames"][0]["url"]
    assert client.get(url).status_code == 200
    assert client.get(url.replace("frame-0", "frame-1")).status_code == 403
    assert client.get(url.replace("signature=", "signature=invalid")).status_code == 403
    with patch("app.media.time.time", return_value=99999999999):
        assert client.get(url).status_code == 403
    with pytest.raises(ValueError):
        media.path("../../outside")


def test_inputs_shared_contract_and_safety(client, headers):
    fixtures = json.loads((Path(__file__).parents[3] / "packages/contracts/fixtures.json").read_text())
    for fixture in fixtures:
        try:
            StoryInput.model_validate(fixture["input"])
            valid = True
        except ValueError:
            valid = False
        assert valid == fixture["valid"]
    assert (
        client.post(
            "/v1/stories", headers=headers, json={**PAYLOAD, "custom_details": "fake bomb emergency"}
        ).status_code
        == 422
    )
    assert client.get("/v1/wallet", headers=headers).json()["data"]["available"] == 30
    with pytest.raises(ValueError):
        Settings(environment="production", dev_auth=False)


def test_duplicate_key_cannot_target_another_story(client, headers):
    first = story(client, headers)
    second = story(client, headers)
    enqueue(client, headers, first)
    assert enqueue(client, headers, second).status_code == 409


def test_cancel_refund_and_retry(client, headers, other):
    sid = story(client, headers)
    jid = enqueue(client, headers, sid).json()["data"]["id"]
    assert client.post(f"/v1/jobs/{jid}/cancel", headers=other).status_code == 404
    assert client.post(f"/v1/jobs/{jid}/cancel", headers=headers).json()["data"]["state"] == "canceled"
    assert client.post(f"/v1/jobs/{jid}/cancel", headers=headers).status_code == 200
    assert client.get("/v1/wallet", headers=headers).json()["data"]["available"] == 30
    new = enqueue(client, headers, sid, "retry-canceled-unique").json()["data"]["id"]
    with patch("app.worker.render", side_effect=fake_render):
        assert worker.run_once() == new
        worker.process(new, "unrelated-worker")
    with Session() as db:
        account = db.scalar(select(Account).where(Account.id == db.get(Story, sid).owner))
        total = db.scalar(select(func.sum(Ledger.amount)).where(Ledger.owner == account.id))
        assert total == account.available + account.reserved == 27
        assert db.scalar(select(func.count()).select_from(Ledger).where(Ledger.event == "capture")) == 1


def test_stills_preserve_source_edges_without_added_labels_and_wrap_captions():
    from PIL import Image, ImageChops, ImageDraw, ImageOps

    from app.render import captioned, fixture, font, wrap_pixels

    im = fixture(0)
    source = Path(__file__).parents[1] / "app/assets/editorial-sample.png"
    with Image.open(source) as image:
        expected = ImageOps.fit(image.convert("RGB"), (1080, 1920), method=Image.Resampling.LANCZOS)
    assert ImageChops.difference(im, expected).getbbox() is None
    output = captioned(im, "W" * 140)
    assert ImageChops.difference(im.crop((0, 0, 1080, 150)), output.crop((0, 0, 1080, 150))).getbbox() is None
    assert (
        ImageChops.difference(im.crop((0, 1800, 1080, 1920)), output.crop((0, 1800, 1080, 1920))).getbbox()
        is None
    )
    drawing = ImageDraw.Draw(output)
    assert wrap_pixels("A questionable decision", drawing, font(54, True), 500) == [
        "A questionable",
        "decision",
    ]
    assert all(
        drawing.textlength(line, font=font(54, True)) <= 960
        for line in wrap_pixels("W" * 140, drawing, font(54, True))
    )


def test_parallel_new_jobs_cannot_overspend(client, headers):
    first, second = story(client, headers), story(client, headers)
    with Session.begin() as db:
        account = db.scalar(select(Account).with_for_update())
        account.available = 3
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(
                lambda pair: enqueue(client, headers, pair[0], pair[1]),
                [(first, "parallel-first"), (second, "parallel-second")],
            )
        )
    assert sorted(r.status_code for r in responses) in ([202, 409], [202, 402])
    wallet = client.get("/v1/wallet", headers=headers).json()["data"]
    assert wallet["available"] == 0 and wallet["reserved"] == 3


@pytest.mark.parametrize("failure", ["timeout", "429", "500", "malformed"])
def test_mock_provider_failures_refund(client, headers, failure):
    sid = story(client, headers)
    jid = enqueue(client, headers, sid).json()["data"]["id"]
    import httpx

    if failure == "timeout":
        error = TimeoutError("provider timed out")
    elif failure in ("429", "500"):
        request = httpx.Request("POST", "https://fixture.invalid/generate")
        error = httpx.HTTPStatusError(
            "provider rejected request",
            request=request,
            response=httpx.Response(int(failure), request=request),
        )
    else:
        error = ValueError("malformed provider result")
    with patch("app.worker.MockImageGenerator.generate", side_effect=error):
        assert worker.run_once() == jid
    assert client.get(f"/v1/jobs/{jid}", headers=headers).json()["data"]["state"] == "failed"
    wallet = client.get("/v1/wallet", headers=headers).json()["data"]
    assert wallet["available"] == 30 and wallet["reserved"] == 0


def test_old_labeled_stills_are_replaced_before_sharing(client, headers):
    from PIL import ImageChops, ImageDraw

    from app.render import fixture

    sid = story(client, headers)
    enqueue(client, headers, sid)
    worker.run_once()
    with Session.begin() as db:
        item = db.get(Story, sid)
        frames = [dict(frame) for frame in item.frames]
        for frame in frames:
            frame["still_key"] = frame["still_key"].replace("-v2.png", ".png")
            image = fixture(0)
            ImageDraw.Draw(image).rectangle((0, 0, 1080, 120), fill="red")
            image.save(media.path(frame["key"]))
        item.frames = frames
        old_url = media.sign(sid, frames[0]["still_key"])
    assert client.get(old_url).status_code == 404
    assert client.get(f"/v1/stories/{sid}", headers=headers).json()["data"]["frames"][0]["still_url"] is None
    assert client.post(f"/v1/stories/{sid}/export", headers=headers).status_code == 202
    worker.run_once()
    updated = client.get(f"/v1/stories/{sid}", headers=headers).json()["data"]
    assert client.get(updated["frames"][0]["still_url"]).status_code == 200
    from PIL import Image

    with Image.open(media.path(updated["frames"][0]["key"])) as rebuilt:
        assert ImageChops.difference(rebuilt.convert("RGB"), fixture(0)).getbbox() is None
