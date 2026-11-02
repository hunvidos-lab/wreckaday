# WRECKDAY — Gate 1 development preview

A native Expo/React Native app and FastAPI/Postgres service for creating
fictional comedy images. This milestone runs end-to-end
with a pre-rendered editorial sample image, **zero inference spend**, and no
external accounts. It is not a production or store-ready build.

Implemented: sample browse, hero scenario, draft builder, development accounts,
server-owned demo credits, durable job worker, three-frame editor/reordering,
a separately shared reveal, 1080×1920 PNG stills, download/native
share adapter, saved library, story/media deletion, cancellation/retry and logout.

## Quick start

Requires Docker/Compose, Node 24, pnpm 11.25 and Python 3.12. Use this only on a
trusted local machine. The two fixture accounts are shared testing accounts.

```sh
pnpm install --frozen-lockfile
# Starts local Postgres, migration, API and worker. No inference keys needed.
docker compose up --build
```

In a second terminal:

```sh
pnpm --filter mobile web
# Open http://localhost:8081
```

Try a sample without an account, or pick “She's moving in” → Make mine → select
Alex/Sam → review and confirm 3 demo credits → edit → save → render → download.
The first generation includes PNG images; editing requires a free re-render. Choose a clean photo or an image with your caption. Shared images have no added label. Keep the reveal message separate until you choose to send it.

For a native development build, configure a reachable API host in
`EXPO_PUBLIC_API_URL` and `WRECKDAY_PUBLIC_API_URL`, allow your origin if using web,
and use `pnpm --filter mobile exec expo run:android` or `expo run:ios` on a machine
with the appropriate SDKs. Compose binds API to loopback by default; deliberately
adjust the binding for trusted LAN testing. Native sharing uses `expo-sharing`
and a downloaded local PNG, without access to contacts or messaging histories.
Native binaries, physical devices and messaging-app sharing have not been tested
in this cloud environment. EAS configuration is supplied but no build was sent.

## Host Python development (alternative to API/worker containers)

```sh
python -m venv .venv
.venv/bin/pip install -r services/api/requirements.lock
# Start just the database (API and worker will run on the host).
docker compose up -d db
cp .env.example .env
# Export these development settings to all following processes.
set -a
. ./.env
set +a
(cd services/api && ../../.venv/bin/alembic upgrade head)
PYTHONPATH=services/api .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log
```

In another terminal, export the same `.env` settings and run:

```sh
PYTHONPATH=services/api .venv/bin/python -m app.worker
```

The worker imports shared domain code, not the FastAPI application. Health/readiness:
`http://localhost:8000/healthz`, `/readyz`; API docs: `/docs`.
Storage is a private local directory, not a public static mount. No real identity,
photo, email or payment data belongs in this preview. Production config is refused.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter mobile exec expo install --check
pnpm --filter mobile exec expo export --platform all
.venv/bin/ruff check services/api
.venv/bin/ruff format --check services/api
.venv/bin/mypy services/api/app/config.py services/api/app/schemas.py
PYTHONPATH=services/api .venv/bin/python scripts/contracts.py --check
# Dedicated disposable test DB; tests refuse other database names.
docker compose exec db createdb -U wreckday wreckday_test
(cd services/api && ../../.venv/bin/pytest -q)
```

API tests exercise real Postgres and the still-image generation/edit/export cycle.
Other failure/concurrency tests replace rendering, never paid inference. Test DB
schema is reset per test; do not place anything valuable in `wreckday_test`.

With API, worker and Metro already running, browser e2e:

```sh
pnpm exec playwright install chromium
node scripts/browser-smoke.cjs
# Optionally use system Chromium:
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium node scripts/browser-smoke.cjs
```

The smoke creates and deletes its own fixture story, downloads its still image and
captures screenshots in ignored `work/browser`. GitHub Actions contains unit,
contract, lint/type checks, web bundle and Postgres/migration/API checks. Browser
smoke is currently a local integration check, not a CI job.

## Layout and limitations

- `apps/mobile`: Expo Router UI, auth/session, API client, share/cache handling.
- `services/api/app`: config, JWT fixture auth, models, endpoints, queue, providers,
  private media capabilities and Pillow still-image renderer.
- `services/api/migrations`: reversible Alembic schema.
- `packages/contracts`: Zod input, typed outputs, API JSON Schema and shared cases.
- `docs/authentication.md`: implemented auth flow and production target.
- `docs/gate-report.md`: exact checks, evidence, costs and outstanding blockers.
- `docs/release-checklist.md`: remaining production gates.

One hero scenario ships. Intensity, setting and extra details are stored; the
mock visual narrative is intentionally deterministic. No self-photo upload, live
inference, Supabase, purchases, account deletion, cloud retention, reviewed legal
pages or reporting is claimed. These are explicit later gates, not fake routes.

The supplied `CLAUDE.md`, `WRECKDAY_MASTER_SPEC.md`, and `START_CLAUDE_HERE.md` are
preserved. Changes/deviations are documented in `docs/adr/0001-…`. Model weights
are not included. The mock generator repeats one pre-rendered AI-fiction sample image across the three frames; bundled fonts
carry their DejaVu license in `services/api/app/fonts/LICENSE.txt`.
