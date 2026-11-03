# Task for Codex: local test build, desktop icon, and in-app key console

Implementation and actual checks: [local launcher validation](../local-launcher-validation.md).
The numbered task below is retained as the original acceptance specification.

Founder: macOS (Darwin 21 / Monterey, Intel 2017 Mac), zsh, repo at
`/Users/bbb/wreckaday`. Branch from `feat/redesign-live-providers`.
Do the parts IN ORDER. Do not start part C until A and B work.
Read `CLAUDE.md` first. Hard rule 4 and 5 apply to everything here: provider keys
live only on the server side, never in the app bundle, never in `EXPO_PUBLIC_*`,
never in source control, never printed to logs.

---------------------------------------------------------------------------
## Part A — one script that starts everything: `scripts/dev-up.sh`

Goal: one command starts the API and the web app, then opens the browser.

### A1. Create `scripts/dev-up.sh` with exactly this behavior

1. `cd` to the repo root using the script's own location:
   `cd "$(dirname "$0")/.."`. Never hard-code `/Users/bbb`.
2. Check the tools exist and stop with a plain-English message if not:
   - `node` (version 24.x), `pnpm`, `uv`.
   - Message example: `Missing pnpm. Install with: npm i -g pnpm@11.25`.
3. If `node_modules` is missing, run `pnpm install --frozen-lockfile`.
4. If `.venv` is missing, run:
   `uv venv .venv --python 3.12` then
   `uv pip install --python .venv/bin/python -r services/api/requirements.lock`.
5. If `.env` is missing, copy `.env.example` to `.env`. If `.env` EXISTS, never
   overwrite it, never print it.
6. If port 8000 or 8081 is already in use, print which one and stop. Use
   `lsof -nP -iTCP:8000 -sTCP:LISTEN`. Do not kill other people's processes.
7. Start the API in the background, logging to `work/logs/api.log`:
   `PYTHONPATH=services/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log`
   Bind 127.0.0.1 ONLY. Never 0.0.0.0.
8. Wait until `curl -fsS http://127.0.0.1:8000/healthz` succeeds (max 30 s,
   check every 1 s). If it never succeeds, print the last 20 lines of the log
   and stop.
9. Start the web app in the background, logging to `work/logs/web.log`:
   `pnpm --filter mobile web` (serves http://localhost:8081).
10. Wait until `curl -fsS http://localhost:8081` succeeds (max 120 s; the first
    Metro bundle is slow on this Mac).
11. `open http://localhost:8081`.
12. Print a short status block:
    ```
    Wreckaday is running.
      App:  http://localhost:8081
      API:  http://127.0.0.1:8000   (live generation: on/off)
      Logs: work/logs/
    Close this window or press Ctrl+C to stop everything.
    ```
    Get "on/off" from `GET /v2/capabilities` → `generation_available`.
13. `trap` EXIT, INT and TERM: kill both background processes (their PIDs, not
    `pkill node`). Then `wait` so the window stays open while running.

Make `work/logs/` if missing. Confirm `work/` is gitignored; add it if not.
`chmod +x scripts/dev-up.sh`.

### A2. Add to root `package.json` scripts
`"dev": "bash scripts/dev-up.sh"`

### A3. Test A (do all, paste results in your report)
- Fresh run: `pnpm dev` → browser opens on the home page.
- Run it twice at once → second run stops with the "port in use" message.
- Ctrl+C → `lsof` shows nothing on 8000 and 8081 afterwards.
- With an empty `.env` → app still loads; compose screen says generation is
  not connected. That is correct, not a bug.

---------------------------------------------------------------------------
## Part B — clickable desktop icon

Goal: the founder double-clicks an icon on the Desktop and the app opens.

### B1. Create `scripts/make-desktop-launcher.sh`
It writes `~/Desktop/Wreckaday.command`:
```sh
#!/bin/zsh
cd "/ABSOLUTE/PATH/TO/REPO" && exec bash scripts/dev-up.sh
```
- Fill the absolute repo path at generation time (`$(cd "$(dirname "$0")/.." && pwd)`).
- `chmod +x ~/Desktop/Wreckaday.command`.
- Use `.command`, not an AppleScript `.app`: Terminal opens and shows the status
  and logs, and closing that window stops the servers. Simple and debuggable.
- Optional icon: if `apps/mobile/assets/icon.png` exists, set it as the file
  icon with `fileicon` ONLY if already installed; otherwise skip silently.
  Do not install new tools for this.
- Do NOT run this script yourself on the founder's machine as part of CI or tests;
  the founder runs it once: `bash scripts/make-desktop-launcher.sh`.

### B2. First-launch note for the founder (put it in the README section, part D)
macOS may say the file "cannot be opened". Fix: right-click the icon → Open →
Open. Only needed the first time.

---------------------------------------------------------------------------
## Part C — in-app key console (development only)

Goal: the founder can paste API keys into a screen in the app instead of
editing `.env` by hand.

### C0. Security rules — follow every one, no exceptions
1. Keys go from the app to the LOCAL API, which writes them to the repo-root
   `.env`. The app never stores keys: no AsyncStorage, no SecureStore, no
   localStorage, no React Query cache, no state that outlives the form.
2. The API NEVER sends a key back. Reads return only `{"set": true, "last4": "ab12"}`.
3. The endpoints exist ONLY when ALL are true, otherwise they return 404:
   - `WRECKDAY_ENVIRONMENT=development`
   - new setting `WRECKDAY_KEY_CONSOLE_ENABLED=true` (default false; dev-up.sh
     may set it in the process env, not in `.env`)
   - the request's client host is `127.0.0.1` or `::1`
4. Require a one-time admin token. On API startup, when the console is enabled,
   generate `secrets.token_urlsafe(24)`, keep it in memory only, and print ONE
   line to the terminal: `Key console token: <token>`. Do not write it to the
   log file (print to stderr before log redirection, or have dev-up.sh read it
   from a separate fifo — simplest: dev-up.sh generates the token, passes it as
   env `WRECKDAY_KEY_CONSOLE_TOKEN`, and prints it itself). Requests must send
   `Authorization: Bearer <token>`; compare with `hmac.compare_digest`.
5. Only allow-listed keys can be written (table below). Reject anything else.
   Validate: no newlines, no `=` at start, max 512 chars; endpoints must pass
   the existing `trusted_endpoint` validator; numbers must parse as Decimal ≥ 0.
6. Write `.env` safely: read lines, replace the matching `KEY=` line or append,
   keep every other line and comment byte-for-byte, write to a temp file in the
   same dir, `os.replace`, then `chmod 600`. Never log values.
7. After writing, reload settings (re-instantiate `GenerationSettings` and swap it
   into the service under its lock) so no restart is needed. If that is messy,
   return `{"restart_required": true}` and show it in the UI. Be honest either way.
8. Never add this to production builds. Hide the screen unless
   `GET /v2/dev/keys` returns 200.

### C1. Allow-listed settings for the console

| Field label in UI            | `.env` key                          | Secret? |
|------------------------------|-------------------------------------|---------|
| Text endpoint URL            | `WRECKDAY_TEXT_ENDPOINT`            | no      |
| Text API key                 | `WRECKDAY_TEXT_API_KEY`             | YES     |
| Text model ID                | `WRECKDAY_TEXT_MODEL`               | no      |
| Image provider (bfl/fal/image_edits) | `WRECKDAY_IMAGE_PROVIDER`   | no      |
| Image endpoint URL           | `WRECKDAY_IMAGE_ENDPOINT`           | no      |
| Image API key                | `WRECKDAY_IMAGE_API_KEY`            | YES     |
| Daily budget USD             | `WRECKDAY_DAILY_BUDGET_USD`         | no      |
| Text cost ceiling USD        | `WRECKDAY_TEXT_COST_CEILING_USD`    | no      |
| Image cost ceiling USD       | `WRECKDAY_IMAGE_COST_CEILING_USD`   | no      |
| Live generation on/off       | `WRECKDAY_LIVE_GENERATION_ENABLED`  | no      |

Non-secret values may be returned in full; secret values only as `set` + `last4`.

### C2. API (FastAPI, `services/api/app/dev_keys.py`, mounted from `main.py`)
- `GET  /v2/dev/keys` → current values (secrets masked) + `generation_available`.
- `PUT  /v2/dev/keys` body `{"values": {"WRECKDAY_TEXT_API_KEY": "...", ...}}`
  → writes, reloads, returns the same shape as GET.
- `POST /v2/dev/keys/test` body `{"target": "text" | "image"}` → a ZERO-COST
  check only:
  - text: `GET` the host's model list if it has one; if not, report "not testable
    without a paid call" — do NOT send a chat request.
  - image (fal): POST `{}` to the endpoint; HTTP 422 = key accepted, 401/403 =
    key rejected. (Verified 2026-11-02: an empty body returns 422 and costs nothing.)
  - Return `{"ok": bool, "message": "plain English"}`. Never echo provider bodies.
- `main.py` currently 404s unknown paths in its middleware (line ~38 allow-list);
  add the three paths there, still gated by C0 rule 3.
- CORS already allows localhost:8081; keep it that way.

### C3. App screen `apps/mobile/app/dev-keys.tsx`
- Use the existing `ui.tsx` components: `Page back`, `Step`, `Field`, `Button`,
  `Notice`, `ErrorText`, `Check`.
- First field: "Console token" (from the terminal). Kept in component state only.
- Secret inputs use `secureTextEntry`, start EMPTY, show "Saved ••••ab12" when set.
  Empty secret field on save = leave unchanged (do not send it).
- Buttons: "Save", "Test text key", "Test image key".
- Big `Notice`: "Development only. Keys are written to the .env file on this
  computer and never stored in the app."
- Entry point: a small "Keys" link in the `Page` header, rendered ONLY when
  `GET /v2/dev/keys` returned 200 (do the check once; failure = no link).
- Remove the `"/library" | "/settings"` type narrowing in `Nav` or extend it.

### C4. Tests (required before you say done)
`services/api/tests/test_dev_keys.py`, using FastAPI `TestClient` and a temp
`.env` path (make the path injectable; never touch the real `.env` in tests):
- console disabled → all three endpoints 404
- non-loopback client → 404
- missing / wrong token → 401
- GET never contains a secret value (assert the fixture key string is absent
  from the response text)
- PUT unknown key → 422; newline in value → 422; `http://` remote endpoint → 422
- PUT preserves unrelated lines and comments exactly; file mode is 600
- fal test: mock transport 422 → ok true; 401 → ok false; no chat call is made
Then run: `pnpm typecheck && pnpm lint && pnpm test` and
`cd services/api && ../../.venv/bin/python -m pytest -q`. Paste real output.

---------------------------------------------------------------------------
## Part D — where to get each key (put this in README as "Getting keys")

Copy this list into the README. Before publishing it, open each link and
confirm the menu names still match; dashboards change. Fix any that moved.

1. **Cloudflare Workers AI (text, Llama 3.3 70B) — current choice, free daily allowance**
   - Dashboard: https://dash.cloudflare.com → AI → Workers AI → "Use REST API".
   - Create an API token with the **Workers AI** permission (read + edit).
   - Copy the **Account ID** from the same page.
   - Endpoint: `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1/chat/completions`
   - Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
   - Note: the founder's current token is shared with Aether Forge and its free
     allowance. A separate token per project is cleaner.
2. **fal (images, FLUX.2 Klein 4B edit) — current choice, paid per image**
   - https://fal.ai/dashboard/keys → "Add key". Add billing credit first.
   - Provider `fal`, endpoint `https://fal.run/fal-ai/flux-2/klein/4b/edit`.
3. **Black Forest Labs (images, same model, official API) — alternative**
   - https://dashboard.bfl.ai → API keys. Provider `bfl`, endpoint
     `https://api.bfl.ai/v1/flux-2-klein-4b`.
4. **OpenRouter (text) — alternative**
   - https://openrouter.ai/settings/keys. Endpoint
     `https://openrouter.ai/api/v1/chat/completions`, model
     `meta-llama/llama-3.3-70b-instruct`. The old key from the Aether Forge shop
     is dead (401); a new one is needed if this is used.

Do NOT use FLUX.2 9B or dev weights (non-commercial). Do NOT add Anthropic,
OpenAI or Google keys to this app without an ADR and founder approval.

README section must also say, in this order:
1. Double-click `Wreckaday` on the Desktop (or run `pnpm dev`).
2. First time only: right-click → Open → Open.
3. To add keys: copy the "Key console token" line from the Terminal window,
   click "Keys" in the app header, paste the token, paste keys, Save, Test.
4. Spending limit: $2/day by default (`WRECKDAY_DAILY_BUDGET_USD`).
5. To stop: close the Terminal window.

---------------------------------------------------------------------------
## Done means
- Founder double-clicks the Desktop icon → browser opens → keys screen works →
  "Test image key" says the key is accepted → a 1-scene story generates.
- All tests pass and you pasted the output.
- You did NOT print, log, commit or return any key value anywhere.
- Gate report (per `CLAUDE.md`): files changed, commands run, real results,
  what is live vs not, any money spent, open risks.
