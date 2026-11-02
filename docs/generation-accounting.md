# Generation budget and cost operations

The development API creates `work/generation-ledger.sqlite3` lazily on the first
reservation. The ignored ledger contains no photos, premises, prompts or captions.
It keeps hashed local request IDs, UTC-day reservations, attempt status and numeric
provider usage/cost metadata. fal IDs are needed to reconcile these requests only.

`WRECKDAY_BUDGET_DATABASE_URL` selects a different shared SQLite file or PostgreSQL
database (`postgresql+psycopg://...`). Keep credentials server-side. Never point this
preview at an unrelated application's database. All API processes must share this
URL; separate ledgers produce separate budgets. SQLite is for one local machine.

Reservation = text ceiling (both text calls) + scene count × image ceiling. Daily
reservations are atomic, survive restarts, and reset by UTC date without deleting
old cost records. Session limits and request count still reset with the process.
Failures/unknowns keep the hold. Observed overruns increase it. Inaccurate ceilings,
external account usage and provider charges posted later can exceed estimates;
this is not a provider-side billing lock or a customer-credit ledger.

## Migration from the old in-memory counter

Do this before restarting an existing live server, while generations are stopped:

```sh
cd services/api
# ADD the old process's known reservation total exactly once, not its actual invoice.
# Claude's handoff reports one earlier $0.06 reservation; include any later requests too.
../../.venv/bin/python -m app.generation_ledger seed-day --day 2026-11-02 --reserved-usd 0.06
```

The amount is additive. Do not repeat it. If the prior total is unknown, account for
it conservatively before enabling more generations; deleting the ledger is not a
budget reset mechanism. This implementation did not restart the live service or
modify the founder's `.env`.

## Inspect and reconcile

```sh
cd services/api
../../.venv/bin/python -m app.generation_ledger show
# Read-only external billing queries; no inference is submitted and no retries occur.
../../.venv/bin/python -m app.generation_ledger reconcile
```

The generation response and local report contain `cost_components`,
`known_cost_usd`, `cost_status`, `actual_cost_basis` and `actual_cost_usd`.
The total is populated only when every submitted call has measured cost. Unknown
costs remain null, with `cost_status=pending`; the known subtotal can be zero even
when the unknown remainder is chargeable. Failed attempts retain partial usage.
Interrupted attempts remain reserved/processing, with unknown calls recorded.

Text usage uses `prompt_tokens` and `completion_tokens`. For exactly
`@cf/meta/llama-3.3-70b-instruct-fp8-fast` on `api.cloudflare.com`, defaults are
$0.293/million input tokens and $2.253/million output tokens, verified 2026-11-02.
Other hosts/models need both `WRECKDAY_TEXT_INPUT_USD_PER_MILLION` and
`WRECKDAY_TEXT_OUTPUT_USD_PER_MILLION`. Explicit values also override defaults.
Tariffs are recorded with usage; review them when changing providers or prices.
These are gross usage costs before account free allocations and tax, **not a net
invoice**. [Cloudflare model rates](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/),
[pricing/free allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/).

fal inference reports `x-fal-request-id` and, when available,
`X-Fal-Billable-Units`. Final USD cost comes from
`GET https://api.fal.ai/v1/models/billing-events`, filtered by these saved IDs and
matched to the image endpoint. Responses with more pages are left pending.
`WRECKDAY_FAL_BILLING_API_KEY` may supply `billing:usage:read`; otherwise the image
key is used. Permission errors or posting delays do not fail successful images or
trigger inference again. No key or unrelated account metadata is persisted.
[fal billing API](https://fal.ai/docs/platform-apis/v1/models/billing-events),
[permissions](https://fal.ai/docs/api-reference/platform-apis/authentication).

The BFL and generic image-edits adapters still report image cost as unknown; there
is no invented conversion from provider credits or image dimensions to dollars.
No inference or billing query is performed by default in tests.
