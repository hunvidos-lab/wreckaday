> Historical server-based preview documentation. Superseded for the current app
> by [ADR 0002](adr/0002-device-only-comeback-composer.md) and
> [device-only validation](device-only-validation.md).

# Gate report — 2026-11-01

> Historical Gate 1 report. The founder subsequently changed the direction to still images, no added label on shared images, and a separate reveal. See the decision update in ADR 0001 for current behavior; the MP4 and watermark details below describe the earlier build.

## Status

Gate 0 local setup/architecture checks are implemented. Gate 1's credential-free
mock workflow runs end-to-end on the host and in the browser. **Native-device
verification is pending**, so the complete native Gate 1 exit is not claimed.
No production or store release has occurred.

## Implemented / paths

- Preserved supplied `CLAUDE.md`, `WRECKDAY_MASTER_SPEC.md`, `START_CLAUDE_HERE.md`.
- `apps/mobile/app`: welcome/18+ attestation, public sample, scenario browse/detail,
  draft builder, fixture sign-in, generation progress, caption/reorder/reveal
  editor, preview, library, settings/wallet, cancel/retry and logout.
- `apps/mobile/src`: API client, SecureStore native session, memory-only web
  token, navigation-preserved draft, query cache, native MP4/PNG share helper.
- `services/api/app/main.py`, `auth.py`: ownership-scoped routes, development JWT,
  idempotent story generation, cancellation, re-render, library and deletion.
- `models.py`, `worker.py`: Postgres transactions, immutable business-event keys,
  credit reservations/capture/refund, SKIP LOCKED claim, heartbeat/lease recovery,
  bounded attempts and stale-worker/deletion protections. DB reconnect loop.
- `providers.py`, `render.py`: typed mock provider boundary, pre-rendered sample
  artwork, captions/reveal and visible labels, captioned PNGs, 11-second H.264 MP4.
- `media.py`: five-minute HMAC media capabilities; no public file mount.
- `services/api/migrations`: reversible schema. `packages/contracts`: Zod, API
  JSON Schema, typed output contracts and shared positive/negative fixtures.
- `compose.yaml`, `infrastructure/Dockerfile`, `.github/workflows/checks.yml`:
  local infrastructure and CI definition. Remote CI has not been reported as run.
- `docs/authentication.md`, `docs/adr/0001-gate-1-development-slice.md`,
  `docs/release-compatibility.md`, `docs/release-checklist.md`: decisions/limits.

## Commands actually executed / results

| Check | Result |
| --- | --- |
| `pnpm install` and Expo-compatible dependency install | Passed; lockfile committed |
| `pnpm lint` | Passed: ESLint and Prettier |
| `pnpm typecheck` | Passed: strict mobile and contracts TypeScript |
| `pnpm test` | 13 contract tests passed |
| `pnpm --filter mobile exec expo install --check` | Dependencies compatible |
| `NODE_USE_ENV_PROXY=1 pnpm dlx expo-doctor` in `apps/mobile` | 20/20 passed |
| `pnpm --filter mobile exec expo export --platform all` | Web + iOS + Android JS/Hermes bundles exported; not native binaries |
| `.venv/bin/ruff check services/api` and `ruff format --check services/api` | Passed |
| `.venv/bin/mypy services/api/app/config.py services/api/app/schemas.py` | Passed for these two typed modules; not the entire backend |
| `PYTHONPATH=services/api .venv/bin/python scripts/contracts.py --check` | No input-schema drift |
| `cd services/api && ../../.venv/bin/pytest -q` | 16 passed against real Postgres; one upstream httpx/Starlette deprecation warning |
| Alembic upgrade → check → downgrade → upgrade, isolated migration DB | Passed, no new upgrade operations |
| `docker compose config --quiet` | Passed |
| Docker image build with proxy CA secret | Failed: workspace disk exhausted during image build; cache cleaned, DB recovered; container image not verified |
| Browser smoke against running API/worker/Metro | Passed: sample → builder → sign-in with draft preserved → generate → caption edit/reorder → export → download → delete → logout; zero page errors |
| `ffprobe` on downloaded MP4 | H.264, yuv420p, 1080×1920, 11.000 seconds, no audio |
| Targeted credential-pattern search and `git diff --check` | No detected secret patterns; staged whitespace check flagged preserved source Markdown hard breaks/font-license trailing spaces only; not an exhaustive security audit |

Backend checks cover cross-account isolation, unauthenticated access, tampered
JWT/media links, expired links, deletion invalidation, concurrent idempotency,
parallel-job credit safety, exact settlement/reconciliation, bounded lease
recovery, failure refund, cancellation/retry, deletion during rendering, input
contracts, moderation guardrails, fixed watermarks and long-caption wrapping.
Injected provider-boundary failures include timeout, HTTP 429/500 and malformed
results; no real inference request is made. Failure tests stub rendering; the
main integration test uses real FFmpeg twice (initial output and edited export).

The first Expo Doctor run failed because its Node fetch did not use the session
proxy; the proxy-aware run passed. An actual browser test exposed a stale export
cache after editing; job-completion query invalidation fixed it and smoke passed.
Docker build disk exhaustion interrupted local Postgres; after removing only this
task's browser download and build caches, Postgres recovered and tests passed.

## Live vs mock / costs

Live locally: Postgres, JWT verification, ownership checks, transactional credits,
queue/worker, Pillow/FFmpeg, MP4/PNG downloads, editing, deletion and browser UI.
Mock: a pre-rendered sample image repeated across all three frames, story writing, shared development accounts and
credits. Settings are saved; the mock visual narrative remains deterministic.
Native share code is implemented but has not been exercised on physical devices.

Provider/API spend: **$0**. No paid services, cloud resources, subscriptions,
production deployments or store actions were purchased/performed. Billing for
the pre-existing Codex execution environment is not visible in this session.

## Reproduce

Follow root `README.md` for Docker or the verified host-Python alternative.
Open the Expo web preview, select the hero scenario, choose Alex, generate,
edit/reorder, save, render and download. `scripts/browser-smoke.cjs` automates
that flow and writes screenshots/video under ignored `work/browser`.

## Outstanding risks / actual blockers

- No Xcode, Android SDK, emulators or physical devices here. Native builds,
  permissions, SecureStore, background behavior and messaging-app sharing need
  device testing before native Gate 1 can be signed off.
- Docker image could not be fully built within this workspace disk budget. The
  host setup is verified; Docker requires a roomier machine or later image tuning.
- No model/Supabase/payment credentials are configured. Gate 2's real benchmark
  requires an approved provider, server credentials and a spending cap supplied
  through secure configuration, not pasted into chat.
- No live photo consistency, moderation quality, receipt validation or provider
  costs can be inferred from mock output. One hero template is available.
- Shared fixture accounts, known dev JWT key, no session revocation, local storage,
  simple text safety rules and lack of production rate limits are local-only.
  Non-development config fails closed. Never expose this build publicly.
- Native draft persistence, account deletion, reporting, processor/legal review,
  cloud retention, backups, purchase flows, all 12 templates, accessibility and
  physical-device QA remain later-gate work. No fake completed routes are supplied.

Next implementation slice: native Gate 1 QA on a provisioned SDK/device setup,
then the approved live-provider Gate 2 benchmark. Production auth/storage,
privacy/deletion/reporting and payments follow their specified gates.
