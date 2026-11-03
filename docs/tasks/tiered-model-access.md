# Task for Codex: model choice per tier (Flicker / Blaze / Inferno)

Read first: `CLAUDE.md` (hard rule 1 was rewritten), `docs/adr/0006-tiered-model-access-and-content-floor.md`.
Branch from `feat/redesign-live-providers`. Do the steps IN ORDER.

## What already exists — do NOT redo or weaken
- `FLOOR_PATTERN`, `STANDARD_PATTERN`, `check_text(text, package_id)`,
  `review_prompt(package_id)`, `plan_prompt(package_id)` in
  `services/api/app/generation.py`, with tests in `tests/test_generation.py`.
- The content floor applies to ALL tiers. Never add a code path, flag, env var or
  tier that skips `check_text` or the review step. If a test about the floor fails,
  fix your code, never the test.

## Step 1 — model registry (server)
Create `services/api/app/model_registry.py`:
- A list of `ModelOption` (Pydantic): `id`, `label`, `kind` ("text" | "image"),
  `provider` ("bfl" | "fal" | "image_edits" | "openai_chat"), `endpoint`,
  `model`, `min_tier` ("flicker" | "blaze" | "inferno"), `licence`,
  `commercial_use: bool`, `edits_reference_photo: bool`, `speed` (text such as
  "~10 s/scene"), `limits` (one plain sentence), `cost_ceiling_usd`.
- Load it from a JSON file `services/api/model_registry.json` (not from the app).
  Keys stay in `.env`, referenced by name (e.g. `"key_env": "WRECKDAY_IMAGE_API_KEY"`).
- On load, REJECT any entry with `commercial_use: false`. Add a test.
- Start with exactly two entries, both what runs today:
  - text: Llama 3.3 70B on Workers AI, `min_tier: flicker`
  - image: FLUX.2 Klein 4B edit on fal, `min_tier: flicker`
  Do not invent more models. New models need an evaluation entry in
  `docs/model-evaluation.md` and founder approval first (they cost money).

## Step 2 — capabilities endpoint
Extend `GET /v2/capabilities` with `models`: list of
`{id, label, kind, min_tier, edits_reference_photo, speed, limits}`.
Never include endpoints, key names or keys.

## Step 3 — request and enforcement
- Add optional `image_model_id` to `GenerateInput`. Missing = the tier default.
- Server check: the chosen model's `min_tier` must be ≤ the request's tier
  (order flicker < blaze < inferno). Otherwise 403 `MODEL_NOT_IN_TIER`.
- IMPORTANT: today the tier is just `package_id` from the client because checkout
  is not connected. Put the tier lookup in ONE function, `entitled_tier(request)`,
  that currently returns `package_id` and has a `# TODO(entitlements)` comment
  pointing to ADR 0006. When purchases exist, only that function changes.
- The REVIEW and PLANNING text calls always use the fixed default text model,
  never a user-chosen one. Test this explicitly (assert the model in the chat
  request body).
- Cost reservation uses the chosen model's `cost_ceiling_usd`; keep Codex's
  ledger and budget code from ADR 0005 working. Test it.

## Step 4 — app picker
In `apps/mobile/app/compose.tsx`, step 3 ("SET THE SCALE"), under the package
chips, add "Image model" using `Chip` from `src/ui.tsx`:
- Show only models with `min_tier` ≤ selected package. Show higher-tier models
  greyed out with "Inferno" / "Blaze" label, not hidden.
- Under the selected model: `speed` and `limits` text in `styles.small`.
- Changing the package resets the model to that package's default.
- If `/v2/capabilities` has no `models`, show nothing (old server).

## Step 5 — tests and report
Run and paste real output:
`pnpm typecheck && pnpm lint && pnpm test` and
`cd services/api && ../../.venv/bin/python -m pytest -q`.
Gate report per `CLAUDE.md`. State plainly: entitlements are NOT real yet.

## Do not
- Do not add any model whose licence forbids commercial use (no FLUX dev, no FLUX.2 9B).
- Do not call paid APIs in tests. Use `httpx.MockTransport`.
- Do not let the client send endpoints, keys or prompts for review.
- Do not describe any model as "no guardrails" or "uncensored" in UI or docs; use
  "minimally filtered" only for models evaluated as such.
