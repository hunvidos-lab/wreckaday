import json

import httpx
import pytest

from app.providers import HostedStoryWriter


def test_writer_validates_provider_output_and_sends_auth():
    def handler(request):
        assert request.headers["authorization"] == "Bearer fixture-key"
        payload = json.loads(request.content)
        assert payload["model"] == "fixture-model"
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                [
                                    {"caption": "A bad idea.", "beat": "hook"},
                                    {"caption": "A worse plan.", "beat": "escalation"},
                                    {"caption": "A fictional twist.", "beat": "twist"},
                                ]
                            )
                        }
                    }
                ]
            },
        )

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        writer = HostedStoryWriter(
            client, "https://provider.invalid/chat/completions", "fixture-key", "fixture-model"
        )
        assert len(writer.plan({"name": "Alex"})) == 3


def test_writer_rejects_invalid_structure():
    def handler(request):
        return httpx.Response(200, json={"choices": [{"message": {"content": "[]"}}]})

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        writer = HostedStoryWriter(
            client, "https://provider.invalid/chat/completions", "fixture-key", "fixture-model"
        )
        with pytest.raises(ValueError):
            writer.plan({"name": "Alex"})
