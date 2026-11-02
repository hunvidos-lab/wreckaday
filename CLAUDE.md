# Claude Code engineering rules — WRECKDAY

## Read first

Treat `WRECKDAY_MASTER_SPEC.md` as the source of truth. It contains the feature scope, UX, architecture, data model, endpoints, pipeline, security controls, finance model, tests, release gates, and your autonomy/pushback rules. Do not implement from vague memory when this file is available.

## Mission

Build a real Expo/React Native iOS/Android app that turns a permitted adult dark-comedy scenario into a coherent three-frame AI fiction story, editable captions, a reveal, a shareable MP4, and media saved in a private account library. First make the **mock** pipeline work end-to-end, then add real inference, auth, payments, moderation, and store readiness.

## Autonomy and challenge

You are empowered to challenge any implementation decision. Use evidence, alternatives, cost and risk. Add meaningful `docs/adr/NNNN-title.md` documents for substitutions. Work through minor decisions independently; do not stop to ask for folder names, coding style, naming variables, or other routine choices.

Ask founder before spending money, using new paid credentials, creating permanent brand/bundle IDs, touching production data, deploying publicly, changing core product goals, claiming legal compliance, connecting external accounts, or submitting to a store.

## Hard rules

1. Fixed content floor on EVERY tier (ADR 0006): no minors or anyone who looks under 18; no nudity or sexual content of a real face; no real person other than the uploader; no realistic fabricated evidence of crime, emergencies, arrests or infidelity; no real threats, doxxing, blackmail or self-harm. Above the floor, Inferno allows crude/profane humor, dark satire, cartoonish comic violence, outrageous excess, sharp revenge premises and non-explicit adult themes. All exported media clearly identifies AI fiction.
2. No auto-sending WhatsApp/Signal/Telegram messages or reading private chats or contact lists. Native share sheet is the v1 integration.
3. Commercial image model must have commercial rights. FLUX.2 Klein 4B Apache 2.0 is initial default; not 9B or dev open weights under non-commercial terms.
4. Mock generation works without credentials. Real inference runs only from server-side secret env vars. Never claim mock data is a real provider result.
5. No secrets in source control, no unbounded retry cost, no direct public media buckets, no client-authoritative credit balances.
6. Complete one tested, functional vertical slice at a time; no empty placeholder routes, fake "done" statuses or unsupported claims.
7. Always measure provider spend per generated story and ensure credits are held/refunded correctly.
8. Preserve founder's existing files; inspect before scaffolding.

## Default tools

Use current compatible stable Expo+TypeScript, Expo Router, TanStack Query, FastAPI, Pydantic v2, Postgres/SQLAlchemy/Alembic, managed Supabase Auth+Storage in deployed environments, durable Postgres job queue, Python Pillow/FFmpeg renderer, Open-weight model provider adapters, Expo EAS, GitHub Actions. You may propose measured alternatives via ADR.

## Mandatory gate report

After each gate, list implemented features and file paths, commands run, actual test results, live vs mock state, cloud charges, unresolved risk, and how to reproduce the demo.

## Start now

1. Inspect toolchain and repository.
2. Verify any technical assumptions likely to invalidate the build.
3. Create initial repo and build Gate 0.
4. Continue directly through Gate 1 mock vertical slice and tests.
5. Pause only at genuine blockers or approval-required paid/external actions.
