# ADR 0005: Durable preview reservations and content-free cost records

Date: 2026-11-02. Status: accepted for the development preview.

## Decision

Replace the process-local daily cap from ADR 0004 with an atomic SQL ledger.
Keep creative content transient. Store UTC day totals, SHA-256 request identifiers,
reservation/attempt status, token counts, tariffs, fal request IDs and billed costs.
Reserve before the first external call, and journal each call before submission.
Failed, interrupted and unpriced calls retain their conservative reservation.
Duplicate identifiers cannot submit twice, including after a restart.

Use SQLite by default for this single-machine development app, avoiding a mandatory
database server for the photo preview. SQLAlchemy also supports PostgreSQL with the
same transactional reservation contract, tested against an isolated local database.
All instances must share the same database to share a cap. Session budget and
request-count limits remain per-process. This is separate from the retired story
database, user credits, production queues and purchase accounting.

Tables initialize lazily with `create_all` in this development-only service. A
deployed production service still needs managed migrations, authentication,
monitoring, retention controls and account-level billing reconciliation.

## Measurement

Record both Llama calls' reported input/output tokens and value them at a recorded
tariff. The exact configured Workers AI Llama model has published default rates;
other models require explicit rate configuration. Never substitute a ceiling for
actual usage. Workers AI's shared free allocation means gross usage cost differs
from the account's final invoice.

Record fal's response request ID and billable units, then query billing events
filtered to those IDs and matched to the configured endpoint. No unfiltered account
usage is retrieved. Delayed events or a key without billing permissions leave the
cost pending; a local reconciliation command can read those events later without
submitting new inference. Other image adapters remain unpriced unless measured
charges become available. Observed costs above a reservation increase the hold;
operator ceilings cannot guarantee that a mispriced provider never exceeds a cap.

## Consequences

Restarts no longer reset daily reservations. Database failures block new work.
Persisting metadata introduces an operator-managed ledger even though photos,
premises and scenes are not saved. Deleting or changing the ledger resets that
protection; copy/back up the database when moving the server. Before migration,
seed known reservations from the old process: historical in-memory spend cannot
be recovered from this ledger. No running live service is restarted automatically.

Sources, verified 2026-11-02:

- [Workers AI Llama model and rates](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/)
- [Workers AI pricing and free allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [fal synchronous inference](https://fal.ai/docs/api-reference/inference-api/sync/run-path)
- [fal per-request billing events](https://fal.ai/docs/platform-apis/v1/models/billing-events)
- [fal platform API permissions](https://fal.ai/docs/api-reference/platform-apis/authentication)
