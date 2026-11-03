# Wreckaday — Payback, directed.

**They crossed you. Make them look twice.**

Hire Wreckaday. You give the spark. We give the flame.

An adult fictional-prank product: see photorealistic examples, upload your own
photo, design the premise, and let configured models plan and create the scenes.
Review the result, adjust captions if needed, and export labeled PNGs to share.

Examples appear before package pricing. Flicker $5.99 / Blaze $19.99 / Inferno
$29.99 USD are proposed one-time prices for 1 / 3 / 5 scenes. Checkout is not
connected. The uploader must be authorized to use the reference photo; the fiction label and
reveal stay on every export. Sharing uses the user's chosen messaging identity.

## Start with one command or a Desktop icon

Prerequisites: Node.js **24.x**, pnpm **11.25**, and [uv](https://docs.astral.sh/uv/getting-started/installation/).
The launcher installs missing project dependencies and Python 3.12, starts the API
and web app, opens your browser, and shows status. Existing `.env` settings are preserved.

Create the Desktop shortcut once (run this yourself):

```sh
bash scripts/make-desktop-launcher.sh
```

1. Double-click **Wreckaday** on the Desktop, or run `pnpm dev` in this repo.
2. First time only, if macOS blocks the `.command` file: right-click → **Open** → **Open**.
3. To add keys, copy the **Key console token** from the Terminal window. Click
   **Setup** in the app header and paste it to unlock. The link then becomes
   **Keys**. Paste your keys, set the endpoints/model and cost ceilings, **Save**,
   then **Test text key** and **Test image key**. Blank key fields keep saved keys;
   only the final four characters are shown. Saves take effect immediately.
4. Spending limit: **$2/day by default**, via `WRECKDAY_DAILY_BUDGET_USD`, with
   conservative reservations in the durable ledger. Existing explicit values are
   preserved. Enabling live generation permits paid story calls; the Test buttons
   do not submit inference. Keep ceilings aligned with your provider's current quote.
5. To stop, close the Terminal window or press **Ctrl+C**. Both servers stop.

The local development console is enabled by `pnpm dev` only, with a new password
for each launch; the password stays in Terminal/process memory, outside `.env` and
log files. API keys are saved to the server's `.env` with mode 600. They are never
returned in full or saved in app storage, and pasted values clear on save or when
leaving the form. The console is unavailable in release builds and to non-loopback
clients. A normal manual API launch keeps it disabled by default.

If ports 8000/8081 are occupied, the launcher explains which one and stops without
killing anything. Logs are in `work/logs/`. Moving this repo requires recreating
the Desktop command. Before the first ledger-backed restart of an older live API,
follow the [budget migration guide](docs/generation-accounting.md).

## Getting keys

Links opened and official setup guidance checked **2026-11-02**. Provider dashboards
require login, so private dashboard layouts could not be inspected directly;
the menu labels below follow their current public documentation.

1. **Cloudflare Workers AI — text, current choice.** Open the
   [Cloudflare dashboard](https://dash.cloudflare.com), select **AI → Workers AI**,
   then **Use REST API → Create a Workers AI API Token**. Review/create/copy the
   token and copy the **Account ID** on that page. A custom token needs both
   **Workers AI – Read** and **Workers AI – Edit**. Paste the token as Text API key;
   endpoint `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1/chat/completions`,
   model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
   [Official setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/).
   There is a daily free allocation shared at account level; a separate project
   token does not create another allowance. The existing token shares an account
   with Aether Forge; separate project tokens are easier to manage.
   [Pricing and allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/).
2. **fal — images, current choice, paid per image.** Open
   [API Keys](https://fal.ai/dashboard/keys), select your account/team, click
   **Create Key** (the handoff's older label was “Add key”), and copy it immediately.
   Start with the **API** permission preset and add billing credit before generating.
   Provider `fal`, endpoint `https://fal.run/fal-ai/flux-2/klein/4b/edit`.
   [Official key setup](https://fal.ai/docs/documentation/setting-up/authentication).
   The app's Test button submits only empty invalid input to this exact edit
   endpoint: 422 confirms the validation check; 401/403 rejects the key. It does
   not test image quality, credit balance or successful generation.
3. **Black Forest Labs — alternative image host.** Open the
   [dashboard](https://dashboard.bfl.ai), then [Get started](https://dashboard.bfl.ai/get-started)
   and **Create Key**, selecting the intended organization. Provider `bfl`, endpoint
   `https://api.bfl.ai/v1/flux-2-klein-4b`.
   [Official key instructions](https://github.com/black-forest-labs/skills/blob/master/skills/bfl-api/references/api-key-setup.md).
   The console reports this host as not testable without a paid call; it does not
   submit a generation just to validate the key.
4. **OpenRouter — alternative text host.** Open
   [Keys](https://openrouter.ai/settings/keys), which now redirects through login
   to the selected workspace's Keys page. Select the intended workspace and
   create/copy a project key. Endpoint `https://openrouter.ai/api/v1/chat/completions`,
   model `meta-llama/llama-3.3-70b-instruct`.
   [Official developer setup](https://openrouter.ai/developers),
   [workspace key organization](https://openrouter.ai/docs/guides/features/workspaces/overview).
   The earlier handoff reported a shared OpenRouter key returning 401; obtain a
   valid new project key for this alternative. The Test button reads key status,
   without submitting chat.

Use the commercially permitted **FLUX.2 Klein 4B** configuration, not the
non-commercial 9B/dev weight variants. Other providers need an ADR and founder
approval. Never paste API keys into chat, source code, or `EXPO_PUBLIC_*` variables.

## Run the preview

Node 24, pnpm 11.25; Python 3.12 for the optional generation API.

```sh
pnpm install --frozen-lockfile
pnpm --filter mobile web
# http://localhost:8081
```

The gallery and briefing flow work without credentials. Selecting a photo does
not upload it. There is no demo generation pretending to use the photo. If the
API/providers are unavailable, generation is visibly disabled.

Start the development API without accounts, Postgres, a worker or media storage:

```sh
# If not already installed:
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -r services/api/requirements.lock
PYTHONPATH=services/api .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Keep this development service on a trusted machine. It does not implement public
production authentication or purchase entitlements. Its budget ledger is durable,
but the service remains a development preview.

## Configure models in .env

Copy `.env.example` to `.env` only if you do not already have one. Preserve existing
settings. The server finds the repository-root `.env` even when started from
`services/api`. Restart the server after changing configuration.

- `WRECKDAY_TEXT_ENDPOINT`, `WRECKDAY_TEXT_API_KEY`, `WRECKDAY_TEXT_MODEL`: full
  chat-completions endpoint for a Llama-compatible model host. Default model ID
  is `meta-llama/Llama-3.3-70B-Instruct`; use the ID your host actually serves.
- `WRECKDAY_IMAGE_PROVIDER=bfl`, `WRECKDAY_IMAGE_ENDPOINT`,
  `WRECKDAY_IMAGE_API_KEY`: official FLUX.2 Klein 4B reference-image editing.
- Or `WRECKDAY_IMAGE_PROVIDER=image_edits`: your image-editing endpoint, model
  and key. It must accept the documented multipart edits contract and return
  base64 images. Qwen-Image-Edit is an evaluation candidate, not an assurance that
  every Qwen/ComfyUI/hosted API is wire-compatible. See the model investigation.
- Set explicit text/image cost ceilings and a positive session budget using your
  provider's current quote, plus `WRECKDAY_MAX_GENERATION_REQUESTS`. Text ceiling
  must cover both review and planning. Zero per-call provider cost is valid for
  a genuinely zero-fee local service; blank means unconfigured.
- Only then set `WRECKDAY_LIVE_GENERATION_ENABLED=true`. This authorizes the
  configured development server to make model calls when a user confirms and
  clicks generation. This change itself makes no paid request.

Only `EXPO_PUBLIC_API_URL` belongs in the Expo environment. **Never put provider
keys in an `EXPO_PUBLIC_` variable.** HTTPS is required for remote providers; HTTP
is allowed on loopback for local inference. The server controls model selection,
scene counts and limits. It does not retry failed provider submissions or silently
substitute a mock/image/model. There is no jailbreak/safety-bypass switch.

The conservative per-story reservation is `text ceiling + scenes × image ceiling`.
It remains reserved on failure because provider charges may already have occurred.
Daily reservations and hashed request IDs are durable in a separate content-free
ledger (default `work/generation-ledger.sqlite3`). Set `WRECKDAY_DAILY_BUDGET_USD`
for the UTC-day cap. Multiple processes must use the same ledger; production-style
shared reservations can use `WRECKDAY_BUDGET_DATABASE_URL=postgresql+psycopg://...`.
Session limits/request counts remain process-local. Unknown/failed charges keep
their reservations; observed overruns increase the hold. A ceiling is an operator
estimate, not a provider-enforced billing limit.

Both text requests record measured tokens. The configured Cloudflare Llama model
uses its published tariff; other models need explicit per-million-token rates.
fal request IDs/units are recorded and reconciled with request-filtered billing
events. `actual_cost_usd` is populated only when all calls have a known cost; its
basis is gross provider usage before account free allowances and tax, not a net
invoice. Missing usage or delayed/unauthorized billing remains `pending`, never
zero or the ceiling. See [cost ledger operations](docs/generation-accounting.md)
for migration, reconciliation and pricing sources. No paid call is retried.

Before restarting an existing live server with a new ledger, seed known earlier
reservations using that guide. Historical in-memory spend cannot be reconstructed
automatically. This change leaves the running server and local `.env` untouched.

## Photo and content processing

On explicit confirmation, the API receives the premise/reference photo in memory.
It decodes and limits the photo, strips EXIF/filename metadata, asks the text model
to review and plan, and supplies the same normalized reference to each image edit.
Only the premise goes to the text model; photo and scene prompts go to the image
provider. Provider hosts are disclosed in the generation screen. Their retention
policies apply. This revises the earlier device-only architecture, as requested.

The ledger stores reservation totals, hashed request IDs and whitelisted provider
usage/cost metadata; it never stores photos, premises, scene prompts or captions.
No story database, content logs, content files, public photo URLs, recipient page,
anonymous delivery, analytics, recipient tracking or background sending. Former
`/v1` routes remain retired. Text guardrails/review and provider-default safety are
implemented; independent image moderation and production privacy review remain
release prerequisites. No GDPR compliance or untraceability is claimed.

Drafts/results stay in app memory. Native imports use a dedicated temporary cache,
cleared on reset and next startup. Clearing cancels the app request and prevents
late results from restoring a discarded draft, but cannot stop provider work
already accepted or recall downloaded/shared files. Historical data from old
server builds is not automatically deleted.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter mobile exec expo install --check
pnpm --filter mobile exec expo export --platform all --max-workers 1
.venv/bin/ruff check services/api
.venv/bin/ruff format --check services/api
(cd services/api && ../../.venv/bin/pytest -q)
```

Browser integration, with Metro already running:

```sh
pnpm exec playwright install chromium
node scripts/browser-smoke.cjs
```

Browser generation responses and backend provider HTTP calls are explicitly mocked
in these tests; no live inference occurs. Tests cover examples-before-prices,
photo/consent gating, all scene counts, review/export, reset, unavailable providers,
late-result cancellation, API error/budget handling and reference-photo forwarding.
Artifacts are in ignored `work/browser`. For a production web-export check instead
of Metro, run `python3 scripts/serve-web.py` after export (supports route refresh).

Native dependencies are configured and JS-bundled. With the appropriate SDKs, run
`pnpm --filter mobile exec expo run:ios` or `expo run:android`. No physical-device
or signed binary verification has been completed. Use a trusted reachable API
address for native testing; do not expose this development API publicly.

## Evidence and decisions

- [Handoff follow-through and validation](docs/codex-follow-through.md)
- [Earlier payback validation](docs/payback-validation.md)
- [Provider/model investigation, including steerable fine-tunes](docs/model-evaluation.md)
- [ADR 0003: founder's updated direction](docs/adr/0003-payback-reference-photo-generation.md)
- [Image assets and final prompts](docs/assets/payback-image-prompts.md)

The new photorealistic examples were made with the built-in imagegen tool; they
illustrate art direction and are not BFL/Qwen benchmark outputs. The cartoon
product assets are removed. Original master/source files are preserved; ADR 0003
supersedes conflicting older architecture decisions. See Git history for the committed revision.
