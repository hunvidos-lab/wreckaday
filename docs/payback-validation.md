# Payback reference-photo revision — validation, 2026-11-02

## Status

Implemented the founder's correction: payback/revenge-prank positioning,
photorealistic examples before prices, own-photo upload and premise design,
automatic text/image provider plumbing, then review and export. See ADR 0003.
Commit and publication status are recorded in Git history. No production release, live quality benchmark, purchase,
message, anonymous delivery, or store action is claimed.

## What changed

- `apps/mobile/app/index.tsx`, `src/scenario-examples.tsx`: dark, restrained payback
  presentation; “They crossed you. Make them look twice.”; requested spark/flame
  tagline; three photorealistic examples before Flicker/Blaze/Inferno pricing.
- `apps/mobile/assets/examples/{upgrade,penthouse,finale}.png`: built-in imagegen
  assets, individually inspected and copied into the project. Final prompts are
  recorded in `docs/assets/payback-image-prompts.md`. Cartoon product assets removed.
- `apps/mobile/app/compose.tsx`: upload own photo, design premise, choose scope,
  confirm adult/self-photo/provider processing, generate, review/reorder/edit
  returned captions, and export full-bleed photographic PNGs with fixed fiction labels/reveals. No manual-image-composition
  entry flow and no demo generation pretending to use the uploaded identity.
- `src/generation-client.ts`, `photo-data*`, `composer.tsx`: transport selected
  photo only on explicit generation; retain draft/results in memory; abort and
  discard stale results on clear/source changes. No provider keys in client code.
- `services/api/app/generation_config.py`, `.env.example`: server-only text/image
  credentials and models, remote HTTPS/local-loopback endpoints, explicit opt-in,
  conservative cost ceilings, session budget and request limits. Empty cost fields
  parse as unconfigured rather than crashing startup.
- `services/api/app/generation.py`: image decoding/size caps/EXIF stripping, Llama
  review and JSON scene plans, reference-photo BFL and compatible multipart editing
  adapters, exact scene counts, bounded polling, no submission retries, request-ID
  replay refusal, conservative cost reservation and sanitized errors.
- `services/api/app/main.py`: capabilities/disclosed provider hosts, consent-bearing
  generation endpoint, bounded request body, allowed origins, no disk/DB/media
  storage. All old `/v1` account/credit/story/media routes stay retired; worker off.
- Privacy/session screens, README, CI and release checklist now match the revised
  processing boundary. Strictly device-only statements are superseded explicitly.

## Actual checks

| Check | Result |
| --- | --- |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed, contracts and mobile |
| `pnpm test` | 13 historical contract tests + 10 photo/premise state tests passed |
| `ruff check services/api` / `ruff format --check services/api` | Passed |
| `pytest -q services/api/tests` | 38 passed, one upstream Starlette/httpx deprecation warning |
| `.env.example` parsed by GenerationSettings | Passed; disabled and blank cost ceilings unconfigured |
| Expo all-platform export with one worker | Web, Android and iOS/Hermes bundles exported; no native binary verification |
| Browser flow against Metro | Passed all 3 packages with explicitly mocked generation responses |
| Browser flow against static web export | Passed the same flow on local port 8082; no page errors or external model requests |
| `git diff --check` | Passed |

Backend HTTP calls use httpx MockTransport. Tests exercise reference-image
forwarding, stripped metadata, exact server-owned counts, structured output,
moderation denial, BFL regional polling, host restrictions/key isolation, hard polling and concurrent-request limits, self-hosted edit
multipart contract, no automatic retry, retained failure reservations, budget and
request limits, consent validation, origin rejection, disabled service and retired
routes. No Postgres or real provider is used by the tests.

Browser checks confirm examples precede pricing, select/reference/premise flow,
no automatic photo POST, three consent gates, 1/3/5-scene mocked results, caption
editing/reorder, 1080×1920 PNG download including a 140-character caption, 390px overflow, reset/reload, visibly
unavailable providers and discard of a late result after clearing a pending
request. No page errors or external model requests were recorded in the passed
Metro run. A browser screenshot/result is not a live model-quality benchmark.

On this macOS 12 host, current Playwright Chromium cannot be installed. The
repository's current driver used an explicitly selected previously installed
Chromium 130 executable. CI uses a supported Linux browser. Remote CI has not
been run or observed in this session. A later Metro run hit a file-chooser timeout
after UI edits; the final exported SPA passed the full updated script with a
60-second interaction allowance and no hot-refresh changes during the run.

## Reproduce

Follow README for web and the local API. The gallery/brief needs no keys. The API
fails closed for generation until `.env` contains explicitly enabled, complete
provider and budget configuration. Never paste keys into chat or client code.

With Metro or the exported SPA running:

```sh
PLAYWRIGHT_CHROMIUM_PATH='/Users/bbb/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium' node scripts/browser-smoke.cjs
```

For the static export, use `python3 scripts/serve-web.py` (set
`WRECKADAY_WEB_PORT=8082` and `WRECKADAY_WEB_ORIGIN=http://localhost:8082` if Metro
already occupies 8081). Browser artifacts are ignored under `work/browser/payback-*`.

## Real versus mocked, costs and limits

Real: new marketing art, local photo selection, premise drafting, processing
consent, service capability checks, app state, local export and executable provider
adapters. Mocked in tests: both text/image model responses and the browser's
personalized generation results. Marketing art was generated with built-in
imagegen, not with BFL/Qwen or the user's configured credentials.

Configured-provider inference requests made during implementation: zero. No
provider account was connected, credentials modified, purchase made or deployment
performed. Built-in image generation was used; any product-level billing for that
tool is not visible here. Initial image generation was rejected by its safety
system; completed assets used fully clothed photographic prompts recorded in the
asset notes. No safeguard bypass was attempted.

Actual per-story provider cost remains unknown. In-memory reservations use
operator-supplied ceilings, remain consumed after failures, and reset on restart.
They are not billing/receipts or a durable global budget. Development server only;
do not expose publicly or run as production.

Photo/premise processing now goes through the server/providers only after explicit
generation, superseding the earlier device-only requirement at the founder's
request. No first-party content files or DB rows are written; provider retention
still applies. Memory-only operation does not promise forensic erasure, no OS
caches, no backups, GDPR compliance or removal of recipient-held copies.

Remaining prerequisites: configured-provider ten-story quality/cost benchmark,
independent image moderation and production abuse controls, physical iPhone and
Android QA, reliable production queue/auth/budgets, purchase validation and privacy/
processor review. Model/fine-tune investigation is in `docs/model-evaluation.md`.
