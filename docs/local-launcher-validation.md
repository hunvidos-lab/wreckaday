# Local launcher and key console — 2026-11-02

Implements parts A–D of [the task](tasks/local-launcher-and-key-console.md), in
order, on `feat/local-launcher-key-console`, based on `feat/redesign-live-providers`.
The existing content-floor/Inferno commit is preserved; two of its lines were
formatted to pass Ruff without changing behavior.

## Implemented

- `scripts/dev-up.sh`, `dev-process.py`, root `pnpm dev`: prerequisites and missing
  dependency installation, existing `.env` preservation, occupied-port rejection,
  loopback API, readiness deadlines, browser opening, status and per-server logs.
  Dedicated process groups stop descendants on Ctrl+C, SIGHUP/Terminal close or
  exit; an unexpected server exit stops the other server too.
- `scripts/make-desktop-launcher.sh`: executable `~/Desktop/Wreckaday.command`,
  path quoting and optional existing `fileicon`. Its test-only output directory
  allows an isolated fake Desktop. The founder's real Desktop is unchanged.
- `services/api/app/dev_keys.py`, `main.py`, `generation_config.py`: authenticated
  local GET/PUT/test endpoints; strict allow-list; masked reads; bounded bodies;
  sanitized errors; atomic mode-600 `.env` writes preserving unrelated bytes;
  settings hot reload while preserving budget reservations and idempotency state.
  Writes during generation are rejected. Console defaults off and is always off
  in production mode or for non-loopback clients/Host/unapproved origins.
- `apps/mobile/app/dev-keys.tsx`, `src/dev-console*.tsx`, `dev-keys-form.tsx`,
  `ui.tsx`: token unlock, empty masked key fields, save, both Test buttons, spending
  controls and explicit live-generation toggle. No keys go into storage, query
  caches, URLs or shared context. Pasted keys clear on save and route blur, including
  retained Router screens. The admin password alone lives in session component state.
- `metro.config.cjs`: replaces the console implementation with empty modules for
  production exports. Compiled-artifact tests prove it is absent, not merely hidden.
- `.env.example`: $2/day default, $14 session allowance, live generation off,
  explicit cost ceilings still required. Existing `.env` remains unchanged.
- README: launcher/install/first-open steps and checked Cloudflare/fal/BFL/OpenRouter
  setup links. fal's current public docs say **Create Key**, replacing **Add key**.
  Private dashboards required login; their authenticated layouts were not claimed
  as observed. OpenRouter's link redirects through workspace selection.
- CI: backend tests, release-console exclusion check, and a real local API/browser
  console-to-one-scene flow with all provider HTTP explicitly mocked.

The task's authenticated-GET/link bootstrap conflict is resolved with **Setup**
for the unlock form, then **Keys** only after a successful authenticated GET.
See [ADR 0007](adr/0007-local-launcher-and-key-console.md).

## Commands and actual results

| Command/check | Result |
| --- | --- |
| `pnpm dev` in the real repo | API/web ready; browser opened; status printed; existing configuration preserved |
| Second simultaneous `pnpm dev` | Rejected: `Port 8000 is already in use` |
| Ctrl+C then `lsof` on 8000/8081 | Neither port listening |
| `.venv/bin/python scripts/test-dev-launcher.py` | Passed with empty temporary `.env`, spaced path and fake Desktop; no generation connection; duplicate launch rejected; child cleanup passed |
| Same command with `--hangup` | Passed; Terminal SIGHUP frees both ports |
| `bash -n scripts/dev-up.sh scripts/make-desktop-launcher.sh` | Passed |
| `pnpm typecheck && pnpm lint && pnpm test` | Passed; 13 contract tests + 10 composer tests |
| `cd services/api && ../../.venv/bin/python -m pytest -q` | **118 passed, 1 skipped** (PostgreSQL opt-in) |
| Same pytest command with isolated PostgreSQL URL | **119 passed** |
| `pytest -q tests/test_dev_keys.py` | **51 passed** |
| `ruff check services/api`, `ruff format --check services/api` | Passed; 26 files formatted |
| `expo install --check` | Dependencies up to date |
| `expo export --platform all --max-workers 1` | Web/iOS/Android JS/Hermes exports passed |
| `node scripts/check-console-release.cjs` | **20 release artifacts** contain no console implementation |
| Private-value scan of those artifacts, values withheld | Existing configured provider/admin secrets absent |
| `node scripts/key-console-smoke.cjs` | Passed: unlock/wrong password, masked reads, save/hot reload, password inputs, blur cleanup, lock/reload, no stored keys/token, mobile width, zero-generation probes, one mocked scene; zero page errors/external browser requests |
| `node scripts/browser-smoke.cjs` against static export | Passed for all three packages; 1080×1920 exports, consent and clear/cancellation checks; zero page errors |
| Existing real Cloudflare/fal credentials, no-generation checks | Both accepted; no chat or image-generation input submitted |

Selected real output (admin password/key values withheld):

```text
PASS: generated executable .command in fake Desktop; spaced repo path is quoted. Real Desktop untouched.
PASS: Desktop command starts API/web with empty .env; generation is off; second launch rejects occupied port.
PASS: Ctrl+C frees ports 8000/8081. No real .env, Desktop or provider calls used.
PASS: Terminal hangup frees ports 8000/8081. No real .env, Desktop or provider calls used.
118 passed, 1 skipped, 1 warning in 5.88s
119 passed, 1 warning in 10.74s
51 passed, 1 warning in 1.10s
PASS: 20 release artifacts contain no local console implementation.
text: PASS — Key accepted by the no-generation check. No story was generated.
image: PASS — Key accepted by the no-generation check. No story was generated.
```

PostgreSQL used a disposable local `pgserver`, deleted afterwards, with `LC_ALL=C`.
The warning is the existing Starlette/httpx TestClient deprecation. On this Mac,
browser checks used Chromium 130 via `PLAYWRIGHT_CHROMIUM_PATH`; the regular
static browser check used `WRECKADAY_WEB_ORIGIN=http://localhost:8082`.
Screenshot: ignored `work/browser/key-console-mobile.png`; gallery/result artifacts
remain under `work/browser/payback-*`.

## Real versus mocked; costs and remaining founder steps

The launcher, browser, file writes, authentication, settings reload, and key
authentication probes ran for real. API/unit/browser writes used temporary files;
the founder's `.env` and Desktop were never changed. No provider key value was
returned, logged or committed. The Terminal-only generated console password was
captured privately during automated startup tests and excluded from reported output.

The one-scene browser acceptance flow used explicit mock provider HTTP and a
fictional fixture photo. **Paid inference submitted: none. New inference charges:
$0.00.** Real key tests use Cloudflare's read-only model list and fal's empty,
invalid edit input; they do not establish image quality or sufficient credit.

Per the task's explicit instruction, the founder must run the Desktop installer
once and perform any first-launch Gatekeeper approval. The final acceptance of
generating a paid one-scene story with the founder's own permitted photo remains
manual. Before another live generation, carry any pre-ledger reservations forward
using the [budget guide](generation-accounting.md). Physical-device QA and store
release remain outside this local Mac task. Existing dev servers were stopped
with the founder's permission; all test servers on 8000/8081 were stopped afterwards.

## Reproduce

```sh
bash scripts/make-desktop-launcher.sh  # founder runs once
pnpm dev                            # or double-click Wreckaday.command
```

Copy this launch's password from Terminal, open **Setup**, unlock, then use
**Keys → Save → Test**. Saved settings apply without restarting. Use your own
adult photo and start **Flicker** deliberately for a one-scene live test. Close
Terminal or Ctrl+C to stop. Never paste keys or the console password into chat.
