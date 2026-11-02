# Handoff to Codex — changes made by Claude Code on 2026-11-02

Follow-through: [Codex implementation and validation](codex-follow-through.md).
The sections below preserve the original handoff snapshot; see that report for current status.

Branch: `feat/redesign-live-providers` (pushed, one squashed commit on `origin/main`).
The unsquashed history is in the founder's local branch `feat/modern-redesign`.
Read `WRECKDAY_MASTER_SPEC.md` and `CLAUDE.md` as before; they still govern.

## 1. Your workflow change was held back — restore it

Your commit `00d38e6` changed `.github/workflows/checks.yml`. GitHub refused the push
because the founder's token lacks the `workflow` scope, so this branch keeps
`checks.yml` exactly as it is on `main`. CI on this branch therefore runs the OLD
workflow and may fail for reasons unrelated to the code.

Do: once the founder has a token with `workflow` scope, recover the file with
`git show 00d38e6:.github/workflows/checks.yml` (or from `feat/modern-redesign`)
and push it as its own commit. Everything else from `00d38e6` and `a9973ef` IS on
the branch.

## 2. Mobile redesign (UI only)

- `apps/mobile/src/ui.tsx`: new tokens (`color` gained `raised`, `lineStrong`,
  `faint`, `acidSoft`, `acidLine`, `scrim`; new `radius`), pill buttons with
  pressed state, header moved outside the `ScrollView` (stays put).
- New components: `Step` (numbered card, `active` highlight), `Chip` (selectable
  pill), `Check` (accessible checkbox row, replaces `Switch`), `Notice`. `Field`
  shows a character counter. `Button` accepts `style`.
- `app/index.tsx`, `app/compose.tsx`, `src/scenario-examples.tsx` use them.
  `app/_layout.tsx` background matches the new `color.bg`.
- Unchanged on purpose: all logic, all compliance/AI-fiction/consent copy, and the
  exported 9:16 card stays square-cornered (rounded corners would come out
  transparent in the `react-native-view-shot` PNG).
- Not done: `settings.tsx` and `library.tsx` only inherit the tokens; no native
  device QA. Verified with typecheck, lint, prettier and web screenshots at 390 px.

## 3. Server: daily budget

- `generation_config.py`: `daily_budget_usd: Decimal | None` (env
  `WRECKDAY_DAILY_BUDGET_USD`, blank = off).
- `generation.py`: `GenerationService(..., today=...)` injectable clock;
  `reserve()` resets `day_reserved` when the UTC date changes and raises
  `DAILY_BUDGET_REACHED` (429) before any provider call. Session budget and
  request cap still apply and are still lifetime-of-process.
- Test: `test_daily_budget_blocks_then_resets_next_utc_day`.

## 4. Server: fal image provider

- `image_provider` now accepts `"fal"`; `configured` requires an image key for every
  provider except `image_edits`.
- `edit()` fal branch: `Authorization: Key <key>`, JSON body with `prompt`,
  `image_urls: [data URI]`, `image_size` 1024×1536, `sync_mode: true`. It accepts
  only an inline `data:image/...;base64` result, enforces `MAX_IMAGE_BYTES`, and
  rejects remote URLs.
- Tests: `test_fal_edit_sends_inline_photo_and_decodes_inline_result`,
  `test_fal_edit_rejects_remote_result_url`. See ADR 0004.
- `.env.example` documents the fal option and the daily budget.

## 5. Local `.env` (not in git)

Live generation is ON in the founder's local `.env`:
text = Llama 3.3 70B on Cloudflare Workers AI, image = Klein 4B on fal, keys taken
from the Aether Forge shop at the founder's request. Caps: $2.00/day, $14 session,
10 requests, ceilings $0.01 text / $0.05 per image. Never print or commit these
keys. One live 1-scene test succeeded (11.5 s, ceiling $0.06).

## 6. Open work, in priority order

1. **Captions**: the live test returned a stage direction, not a joke ("Sitting
   confidently at the head of a polished wooden table, you gaze out…"). Tighten
   the planning prompt and/or `Plan` schema bounds so captions are short and punchy.
2. **Actual cost**: `actual_cost_usd` is still `None`. Spec rule 7 requires
   measured spend per story. fal and Workers AI both report usage; record it.
3. **Persistent daily counter**: the daily budget resets when the server restarts.
   Fine for dev; production needs it in Postgres.
4. **Structured output on Workers AI**: it worked once with `json_schema`; add a
   clear error if a model ignores `response_format`.
5. Restore `checks.yml` (section 1), then native-device QA of the redesign.

## Verify

```bash
pnpm typecheck && pnpm lint && pnpm test
cd services/api && ../../.venv/bin/python -m pytest -q   # 41 passed
```
