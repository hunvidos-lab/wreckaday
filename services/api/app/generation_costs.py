"""Measured provider usage; unknown charges stay unknown, never become ceilings or zero."""

from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit

import httpx


def number(value):
    try:
        amount = Decimal(str(value))
        return amount if amount.is_finite() and amount >= 0 else None
    except (InvalidOperation, ValueError):
        return None


class CostMeter:
    def __init__(self, settings, persist):
        self.settings, self.persist = settings, persist
        self.components = []

    def begin(self, kind: str):
        item = {"kind": kind, "cost_usd": None, "basis": "unknown"}
        self.components.append(item)
        self.persist(self.components)
        return item

    def text(self, item, response):
        try:
            usage = response.json().get("usage", {})
            tokens = [usage.get("prompt_tokens"), usage.get("completion_tokens")]
            if not all(type(value) is int and value >= 0 for value in tokens):
                return
            item.update(input_tokens=tokens[0], output_tokens=tokens[1], model=self.settings.text_model)
            rates = (self.settings.text_input_usd_per_million, self.settings.text_output_usd_per_million)
            if rates == (None, None) and (
                urlsplit(self.settings.text_endpoint).hostname == "api.cloudflare.com"
                and self.settings.text_model == "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
            ):
                # Published Workers AI tariff, verified 2026-11-02. Gross usage before free allowance/tax.
                rates = (Decimal("0.293"), Decimal("2.253"))
            if all(rate is not None for rate in rates):
                item.update(
                    cost_usd=str(
                        sum(token * rate for token, rate in zip(tokens, rates, strict=True))
                        / Decimal(1_000_000)
                    ),
                    basis="measured_tokens_at_tariff",
                    input_usd_per_million=str(rates[0]),
                    output_usd_per_million=str(rates[1]),
                )
        except (ValueError, TypeError, AttributeError):
            pass
        finally:
            self.persist(self.components)

    def image(self, item, response):
        if (
            self.settings.image_provider == "fal"
            and urlsplit(self.settings.image_endpoint).hostname == "fal.run"
        ):
            request_id = response.headers.get("x-fal-request-id", "")
            if request_id and len(request_id) <= 128:
                item.update(
                    request_id=request_id, endpoint_id=urlsplit(self.settings.image_endpoint).path.strip("/")
                )
            units = number(response.headers.get("x-fal-billable-units"))
            if units is not None:
                item["billable_units"] = str(units)
        self.persist(self.components)

    def reconcile(self, client):
        pending = [item for item in self.components if item.get("request_id") and item["basis"] != "billed"]
        if not pending:
            return
        key = (
            self.settings.fal_billing_api_key.get_secret_value()
            or self.settings.image_api_key.get_secret_value()
        )
        try:
            response = client.get(
                "https://api.fal.ai/v1/models/billing-events",
                headers={"Authorization": f"Key {key}"},
                params=[("request_id", item["request_id"]) for item in pending],
                timeout=10,
            )
            response.raise_for_status()
            data = response.json(parse_float=Decimal)
            # A partial/paginated response cannot establish the final per-request charge.
            if data.get("has_more"):
                return
            for item in pending:
                events = [
                    event
                    for event in data.get("billing_events", [])
                    if event.get("request_id") == item["request_id"]
                    and event.get("endpoint_id") == item["endpoint_id"]
                ]
                costs = [number(event.get("cost_total")) for event in events]
                if costs and all(cost is not None for cost in costs):
                    item.update(cost_usd=str(sum(costs)), basis="billed")
        except (httpx.HTTPError, ValueError, TypeError, AttributeError):
            # Billing permission or posting delay must never re-trigger inference.
            pass
        finally:
            self.persist(self.components)

    def summary(self):
        known = [Decimal(item["cost_usd"]) for item in self.components if item["cost_usd"] is not None]
        complete = bool(self.components) and len(known) == len(self.components)
        return {
            "actual_cost_usd": str(sum(known)) if complete else None,
            "actual_cost_basis": "provider_usage_before_free_allowances_and_tax",
            "known_cost_usd": str(sum(known, Decimal(0))),
            "cost_status": "measured" if complete else "pending",
            "cost_components": self.components,
        }
