# Wreckaday — Payback, directed.

**They crossed you. Make them look twice.**

Hire Wreckaday. You give the spark. We give the flame.

An adult fictional-prank product: see photorealistic examples, upload your own
photo, design the premise, and let configured models plan and create the scenes.
Review the result, adjust captions if needed, and export labeled PNGs to share.

Examples appear before package pricing. Flicker $5.99 / Blaze $19.99 / Inferno
$29.99 USD are proposed one-time prices for 1 / 3 / 5 scenes. Checkout is not
connected. The reference photo belongs to the uploader; the fiction label and
reveal stay on every export. Sharing uses the user's chosen messaging identity.

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
production authentication, purchase entitlements or durable distributed budgets.

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
Actual cost is returned as unknown, not equated to the reservation. Limits and
request-ID records are in memory and reset on restart; this is development cost
control, not production billing. Restarting/multiple processes must not be used
to enforce a real global spending cap.

## Photo and content processing

On explicit confirmation, the API receives the premise/reference photo in memory.
It decodes and limits the photo, strips EXIF/filename metadata, asks the text model
to review and plan, and supplies the same normalized reference to each image edit.
Only the premise goes to the text model; photo and scene prompts go to the image
provider. Provider hosts are disclosed in the generation screen. Their retention
policies apply. This revises the earlier device-only architecture, as requested.

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

- [Current validation](docs/payback-validation.md)
- [Provider/model investigation, including steerable fine-tunes](docs/model-evaluation.md)
- [ADR 0003: founder's updated direction](docs/adr/0003-payback-reference-photo-generation.md)
- [Image assets and final prompts](docs/assets/payback-image-prompts.md)

The new photorealistic examples were made with the built-in imagegen tool; they
illustrate art direction and are not BFL/Qwen benchmark outputs. The cartoon
product assets are removed. Original master/source files are preserved; ADR 0003
supersedes conflicting older architecture decisions. See Git history for the committed revision.
