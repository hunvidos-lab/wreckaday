# Codex follow-through — 2026-11-02

Implements the open backend work in [Claude's handoff](handoff-codex.md), preserving
the redesign and the square 9:16 export. This remains a development preview.

## Changes

- `services/api/app/generation.py`: premise-specific dry payback caption examples;
  single-line captions limited to 80 characters/10 words, with descriptive openings
  rejected. Separate errors for non-JSON text, truncation and schema/count failures;
  strict review booleans. Invalid plans stop before any image submission. No repair
  request or automatic retry introduces an additional charge.
- `generation_costs.py`: record both text calls' actual tokens and applicable tariff,
  fal request IDs/units and request-filtered billed costs. Missing data stays pending.
  Gross usage cost is distinguished from a net invoice after shared free allowances.
- `budget_store.py`: atomic daily reservations, durable hashed idempotency keys,
  content-free cost records and overrun holds, on SQLite or PostgreSQL. Database
  failure prevents submission. Failed requests retain reservations and partial usage.
- `generation_ledger.py`: local inspection, billing-only reconciliation and additive
  migration seed commands. See [operations](generation-accounting.md) and
  [ADR 0005](adr/0005-durable-preview-budget-and-measured-costs.md).
- API disclosure and mobile privacy copy now disclose saved budget/usage metadata.
  No photos, premises, scene prompts or captions are written to the ledger.
- `tests/conftest.py`: API tests explicitly disable live settings even when the
  founder's `.env` enables generation. Provider tests use isolated in-memory ledgers.
- `scripts/browser-smoke.cjs`: update accessible consent roles/names and the CTA
  selector to match Claude's redesign. `apps/mobile/tsconfig.json` excludes exported
  `dist` files, preventing checks from racing generated bundles during export.
- CI was restored in separate commit `411b6f4`, using the connected GitHub app
  despite the CLI token's missing workflow scope. It restores the `00d38e6` quality
  workflow and adds PostgreSQL coverage for the new shared reservation test.
  Remote run: [41509227564](https://github.com/hunvidos-lab/wreckaday/actions/runs/41509227564).
  The run was in progress when this report was updated; local success is reported below.

## Verification

| Check | Result |
| --- | --- |
| `pnpm lint && pnpm typecheck && pnpm test` | Passed; 13 contract + 10 composer tests |
| `ruff check services/api` and `ruff format --check services/api` | Passed |
| `cd services/api && ../../.venv/bin/python -m pytest -q` | 59 passed, 1 PostgreSQL-only skip |
| Same pytest command with fresh isolated PostgreSQL URL | 60 passed |
| `expo export --platform all --max-workers 1` | Web, iOS and Android JS bundles exported |
| `expo export --platform web --max-workers 1` after final privacy text | Passed |
| `node scripts/browser-smoke.cjs` against static export | Passed: all 3 packages; examples before prices; consent/photo gate; editable/reordered scenes; 1080×1920 exports; 390px layout; clear/reload; unavailable provider; late-result cancellation; zero page errors |
| `expo install --check` | Dependencies up to date |
| Workflow YAML parse | Passed |

The PostgreSQL run used a disposable `pgserver` instance with `LC_ALL=C`, deleted
after testing. It did not use existing databases. CI runs that test through
`WRECKDAY_TEST_LEDGER_DATABASE_URL` pointing at a fresh PostgreSQL service.
There is one existing Starlette/httpx TestClient deprecation warning.

Browser evidence is in ignored `work/browser/payback-{flicker,blaze,inferno}*` and
`payback-landing.png`. On this Mac the check used installed Chromium 130 through
`PLAYWRIGHT_CHROMIUM_PATH` and `WRECKADAY_WEB_ORIGIN=http://localhost:8082`.
The browser and backend tests mock all provider inference. **New cloud inference
charges: $0.00.** Local live credentials/configuration and the running API were
left untouched. No deployment or external message was sent.

## Remaining validation and migration

- Before restarting the live API, seed known reservations from the old in-memory
  process into the ledger exactly once; historical spend cannot be reconstructed
  automatically. The handoff's one $0.06 reservation is a known minimum, not proof
  there were no subsequent calls. Follow the operations guide.
- Live caption quality needs human review; bounds and mocked tests do not prove
  the model is funny or that image identity/continuity meets release quality.
- fal costs may remain pending until events post and the configured key has billing
  read permission. Reconcile later without submitting inference again. BFL/generic
  image-edits costs remain unknown rather than fabricated.
- Physical iOS/Android QA, signed builds, production migrations/auth/queue/customer
  billing and store release work remain outstanding. JS export is not device QA.
