# ADR 0004 — fal and Workers AI as development providers, daily budget

Accepted 2026-11-02 at the founder's request ("take keys from aetherforge shop",
"$2 per day for wreckday").

No BFL key was available, so images use the same FLUX.2 Klein 4B model (Apache
2.0, commercial use allowed) through fal's `fal-ai/flux-2/klein/4b/edit` endpoint.
A new `image_provider="fal"` adapter sends the reference photo as a data URI and
requires `sync_mode` so the result also returns inline; any remote result URL is
rejected, so no third-party result host is fetched. BFL and `image_edits` remain.

Text uses Llama 3.3 70B (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) on Cloudflare
Workers AI's OpenAI-compatible endpoint with the Aether Forge account's key. It
shares that account's free daily allowance with Aether Forge's game. The shop's
OpenRouter key was rejected (401).

`WRECKDAY_DAILY_BUDGET_USD` adds a cap per UTC day on top of the session budget.
Like the session budget it is in memory and resets on restart; it is a development
guard, not production billing. Reservations still use per-request ceilings, not
measured provider cost.
