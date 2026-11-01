# WRECKDAY — Master Product, Engineering, and Release Specification

**Status:** Implementation handoff v1.0  
**Date:** 2026-11-01  
**Owner:** Founder (product, finances, final approvals) + Claude Code (engineering and testing)  
**Platforms:** iOS App Store and Google Play  
**Working name:** WRECKDAY; do not buy a domain, publish listings, or use a permanent bundle identifier before name/trademark clearance.  
**Core principle:** Deliver a shippable, economically measurable mobile AI dark-comedy story creator, not an unrestricted impersonation or deceptive-message system.

> **Instruction for Claude Code:** This document is the primary source of requirements. Read it, inspect the existing environment, assess technical feasibility, and implement working software milestone by milestone. Challenge dubious assumptions, record changes as ADRs, and avoid interrupting the founder for choices you can responsibly make. Section 25 controls your autonomy.

---

## 1. Mission and strategic constraints

### 1.1 What we are building

WRECKDAY turns a user-chosen adult dark-comedy premise into a short sequence of photorealistic fictional images and punchy captions, with escalation and a clear comic reveal. It will run as an installable native-feeling React Native application on Android and iPhone. Users browse scenario templates, optionally put **themselves** in the scene, create and edit a coherent 3–5-frame story, export a 9:16 MP4 or still images, and share using the operating system's native share sheet into WhatsApp, Telegram, Signal, Instagram, TikTok, etc. Sharing is **initiated by the user**, not automated.

Audience: adults who enjoy sophisticated cringe, outrageous relationship comedy, petty revenge fantasy, class satire, social embarrassment, and impossible consequences. Tone: stylish, provocative, intelligent, a little cruel **to fictional characters or consenting participants**, never childish, preachy, or sanitised into generic animal memes.

The '100% realism' slider means *photographic aesthetics and physical consistency*, **not** an option to hide AI provenance or present serious fabricated claims as true. The generator may depict realistic-looking staged comedy. It must not be used to frame real people with false claims of cheating, criminal conduct, abuse, serious injury, explosions, emergency events, or humiliating sexual content.

### 1.2 Business constraints

- Development team: founder + Claude Code. No contractor or hired engineering team is assumed.
- Primary variable spending: AI image inference; primary development subscription: Claude Code via Claude Pro/Max. Track other costs separately.
- No continuously running GPU initially. Hosted pay-per-image service for live inference; design adapters to switch to self-hosted commercially licensed models later.
- No unnecessary microservices, Redis, Kubernetes, elaborate event buses, web3/token systems, social network feed, adtech, or growth tracking SDKs in v1.
- Privacy and app-store compliance are product requirements, not optional post-launch work.
- Fail-safe degraded mode: app can demonstrate every screen with fixture images and a mock inference provider when API keys are absent.
- Launch target: one excellent end-to-end experience on both stores; expand content breadth after measured QA and retention.

### 1.3 Explicit out-of-scope features for v1

- Direct ingestion of WhatsApp/Signal/Telegram chat history; reading private messages; address book sync; impersonating contacts; sending messages without user approval.
- Public feed, follower graph, recipient accounts, private messaging, comment threads, livestreaming, public image hosting, group harassment features.
- Real-person deepfakes without affirmative participation and permission.
- Simulated serious emergency alerts, fake crime/police evidence, fabricated news logos, fake financial documents, blackmail tools, forged chat screenshots.
- AI video generation, real-time voice impersonation, face swap toolkits, trained identity LoRAs, ad personalization.
- Unlimited plans with unbounded inference costs.

### 1.4 Success definition

A real user on real iOS/Android hardware can open the app, browse a scenario, create a photorealistic three-frame dark-comedy story featuring a fictional cast or their own authorized image, preview each coherent image, edit captions, export an MP4, and share via at least one installed messaging app, without a developer manually intervening. Billing, reporting, deletion, failures, cost metering, and store obligations must work too.

---

## 2. Product principles, creative DNA, brand

### 2.1 Working brand

Name: **WRECKDAY**; subtitle: **AI Chaos Stories**; tagline: **Make bad decisions. Generate worse consequences.** Final name, logo, domains, and bundle IDs require marketplace/trademark screening. Do not purchase on behalf of founder.

Visual style: premium dark editorial comedy: near-black backgrounds, off-white typography, one high-contrast accent (burnt red or acid-lime, A/B by design prototypes), high-quality candid photo storytelling; no cartoonish children's-app tropes. Use accessibility-conscious contrast, text scaling and touch sizes. No gore or pornographic store creatives.

### 2.2 Story formula

1. **Hook:** plausible adult setup or suspiciously bad choice.
2. **Escalation:** a believable scene reveals an embarrassing complication.
3. **Twist:** situation becomes gloriously impossible, satirical, or self-defeating.
4. **Reveal:** explicit fictional/AI prank payoff, preferably the funniest line of all.

Default output: 3 still frames at vertical 9:16, three editable captions, optional reveal end card with clear WRECKDAY/AI identification, compiled to 8–16-second MP4 with simple camera pans and caption animations. User may also share individual branded stills. Every frame carries an unobtrusive but legible 'AI FICTION • WRECKDAY' mark; the reveal is not the only marker. Do not offer payment to remove AI identification.

### 2.3 Content categories

1. **Bad Romance:** fictional partner surprises, impractical whirlwind relationships, staged rivalries.
2. **Seven Deadly Sins:** greed, vanity, envy, lust, pride, sloth, wrath as comic motivations.
3. **Property & Money:** luxury-object disasters, ludicrous home renovations, excess.
4. **Family Politics:** favoritism, overbearing parents, inheritance satire with fully fictional cast.
5. **Office Warfare:** a megalomaniac fictional boss, office promotion absurdity, coworker status competition.
6. **Disaster Theater:** physically harmless slapstick, staged messes, high-budget spectacle without injury, panic, plausible real crashes or actual explosions.

### 2.4 Seed templates (ship 12, not 100)

Every template includes: stable slug, 3 beat outlines, 3 reference prompts, default character roster, art direction, caption skeleton, permitted customizations, risk tags, reveal, and store-safe sample preview. Start with:

1. `seven-foot-fiancee`: glamorous absurdly tall fictional fiancée; custom ceiling conversion; romantic comedy reveal.
2. `better-replacement`: fictional family's outrageously successful replacement child takes over every room.
3. `supercar-living-room`: a luxury car is transported into the living room; building crew turns it into a sofa.
4. `exes-convention`: fictional exes stage a satirical convention celebrating bad dates; not identifiable real people.
5. `wedding-sponsor`: wedding becomes a giant product-placement operation with fake brand names.
6. `billionaire-backyard`: a tiny backyard becomes a ridiculously elaborate private resort.
7. `office-king`: imaginary boss commissions throne and declares cubicles royal provinces.
8. `inheritance-dog`: fictional wealthy family's dog inherits the estate, requires a yacht and chauffeur.
9. `second-fiance-twins`: rom-com mix-up involving fictional twins and two wedding planners.
10. `printer-promotion`: office printer is promoted over employees and gets an executive assistant.
11. `roommate-mars`: roommate turns a rented apartment into an absurd fake space mission.
12. `terrible-bachelor-party`: fictional staged celebrity reality-show shoot spoofs the protagonist's dating decisions.

Do not create scenarios that rely on believing that an identifiable nonparticipant cheated, died, was injured, was arrested, was accused of a crime, lost money, or suffered an emergency. Make the *humor* vicious, the *factual claims* fictional/staged.

### 2.5 Tone controls

- `satire_intensity`: 0–100. Controls the degree of ridicule, plot escalation, and adult awkwardness. It does not override prohibited content types.
- `visual_style`: `candid_phone` (default), `cinematic_editorial`, `paparazzi_parody` (without impersonating real outlets).
- `photo_realism`: 0–100. Controls realistic textures, lens, lighting, anatomy and continuity, not deception permission.
- `story_length`: 3 v1; 5 reserved behind feature flag.
- `cast_mode`: fictional, self+fictional; other adults only through future opt-in consent flow.

---

## 3. Target users and jobs to be done

Primary persona: adult friend-group comedian who wants an instantly shareable, cinematic, personal in-joke without prompt engineering. Secondary persona: short-form social content creator producing original comedic stories. Third: self-deprecating user roasting their own life and bad choices.

Jobs: generate an idea when uninspired; consistently render three shots; make own portrait fit the story; add captions and edit them; deliver crisp shareable story; laugh without explaining technology; never risk account takeover, private-chat exposure, actual panic, defamation, or surprise charges.

Non-goal: maximizing how long a victim incorrectly believes a life-changing incident is real. Optimize for setup, comic payoff, share rate, completion rate, and user-reported enjoyment instead.

---

## 4. End-to-end UX

### 4.1 First session

1. Splash/brand; skip intro; 18+ attestation, terms/privacy link. Do not claim age is verified by checkbox; follow relevant regional requirements if stricter verification applies.
2. Landing with **Try a sample story** (no account) and scenario browse. Pre-rendered licensed demo images; no costly live inference anonymously.
3. Template detail: preview thumbnail, title, risk-safe one-line premise, typical output length; primary **Make Mine**.
4. Story Builder fields: scenario; fictional character names; one optional uploaded **self** portrait with an affirmative rights/consent statement; setting; comic intensity; visual realism; two sentence optional details; privacy disclosure before uploaded photo reaches external inference service.
5. Authentication only when starting a real paid/free first generation. Use email OTP/magic link via Supabase Auth; implement deep-link round trip and in-app logout. Avoid social sign-in for v1.
6. Generation confirmation: expected credit spend, disclosure and policy link; no hidden auto-charges.
7. Generation screen: sequential frames/progress/status, leave/reopen app, retry errors; live poll or SSE fallback. Status must persist server-side.
8. Story editor: show image sequence, captions with length preview, modify punctuation/layout, reorder frame thumbnails, regenerate one frame with known cost and previews.
9. Reveal editor: required final AI reveal end card, user-selectable phrasing.
10. Export: 1080x1920 MP4; PNG/JPEG stills; correct MIME, filename, sharing filename, preview, save to device via permission-based OS picker; native share sheet.
11. Library: list saved/generated stories, export again, remove story and image assets, view AI/personalization disclosure.
12. Settings: credits, billing restore, terms/privacy, support email, report generated content, delete account, unsubscribe (if subscription introduced), analytics consent, about.

### 4.2 Exact screens/routes

`/(public)/welcome`, `/(public)/examples`, `/templates`, `/templates/[slug]`, `/auth`, `/create/[slug]`, `/jobs/[jobId]`, `/stories/[id]/edit`, `/stories/[id]/preview`, `/library`, `/wallet`, `/settings`, `/settings/privacy`, `/settings/delete-account`, `/report`, `/legal/terms`, `/legal/privacy`.

Safe-area support, Android system bar, iOS back gestures, keyboard handling, permission fallbacks, screen-reader labels, dynamic font scaling, reduced motion, offline/low-signal states, loading skeletons, no nested blocking spinners. `story/create/export` must be reachable in <=4 major interactions after template selection, excluding auth/confirmation.

### 4.3 Empty, error and recovery states

- No templates / timeout: cached fixtures and retry.
- No permission for photos: user can proceed with fictional cast.
- Generation queue slow: persistent job and background-app safe resume.
- Unsafe or unsupported input: explain category and offer a safe edit, no credit debit.
- Provider down or timeout: deterministic error, retry or refund holds; no duplicate charges.
- Only some frames generated: preserve usable frames; resume failed frames if permitted; show option to cancel and refund incomplete attempt.
- Share destination not installed: system share sheet and local file save.
- Offline after generation: show cached thumbnails and queued export unavailable reason.
- Auth expired: signed-in user can reauthenticate without losing draft.
- Device low storage/export canceled: show retry; don't debit additional credits.

---

## 5. Mobile stack and project standards

Use modern, supported **Expo/React Native + TypeScript**, Expo Router, TanStack Query, React Hook Form, Zod, and a minimal accessible component library or plain custom primitives. Do not pin exact dependency versions from this document: install newest mutually compatible **stable** Expo stack and test with required iOS/Android build targets. Use a **development build** for native modules, not assume Expo Go supports every capability.

- Package manager: `pnpm` with workspace lockfile.
- Formatter/linter: Prettier + ESLint; strict TypeScript; no unchecked `any` in shared contracts.
- State: server state via TanStack Query; local UI state via React hooks/context until complexity warrants Zustand.
- Routing: Expo Router.
- Camera/photo: OS photo picker/document picker with minimal permissions, not all-photos blanket access.
- Share: `expo-sharing` where supported, with correctly addressed local file URIs and MIME; validate platforms via physical devices.
- Animation: native-friendly light transitions; avoid heavy effects on budget Android phones.
- Network: retries only for safe idempotent operations; auth refresh handled without looping.
- App config: app name, bundle IDs, associated domains/deep links, privacy descriptions and EAS `development`, `preview`, `production` profiles.
- Bundle ID and applicationId: use placeholders in repository configuration until founder explicitly approves a final brand/domain.

**Release compatibility as of 2026-11-01:** Apple currently requires Xcode 26+ and an iOS 26+ SDK for App Store uploads; Google Play requires new mobile apps/updates to target Android 16/API 36+ since 2026-08-31. Claude must verify these again before building production. Select matching Expo SDK/EAS images, test on both platforms, and record exact build versions in `docs/release-compatibility.md`.

---

## 6. Backend and infrastructure

### 6.1 Default architecture

- **FastAPI Python 3.x**, Pydantic v2, SQLAlchemy 2.x, Alembic migrations, httpx for outbound calls, typed service layers.
- **Managed Supabase** for Postgres, Auth, and private object storage in the first deployed environment. The founder supplies credentials; use secrets manager/env vars. Local development can run Postgres and object storage mocks/MinIO with fixture authentication; never permit development-auth bypass in production.
- No direct client writes into application DB tables. Mobile authenticates via Supabase; FastAPI validates user JWTs against current JWKS and owns business authorization. Supabase RLS should deny unauthorized direct access where appropriate.
- **Durable Postgres-based generation job queue** initially: transactional enqueue, `FOR UPDATE SKIP LOCKED`, lease/heartbeat, `attempt_count`, recover stalled leases; separate worker process. Do not introduce Redis/Celery absent measured need. Record ADR if another durable queue is materially better.
- AI text writer adapter `StoryWriter` (mock and hosted open-weight model); image adapter `ImageGenerator` (mock, BFL hosted FLUX.2 Klein 4B, later self-hosted). No provider credentials in app binary.
- Story rendering worker with Pillow/FFmpeg, embedded permitted open-license fonts, text outline, transition templates, scalable image transformations, temp-file cleanup.
- Private storage with signed URL access; access controlled by the API and short-lived signed URLs. Separate uploads, raw render frames, final exports, thumbnails.
- Observability: structured JSON logs with correlation IDs, basic metrics for generation errors, costs, queue time, output quality feedback, export failures; do not log raw faces or private prompts by default.
- One staging and one production environment. Local everything-mock mode.

### 6.2 Provider comparison / deployment decision

Claude should write an ADR choosing an API host (e.g. Render/Fly/Railway) based on current cost, reliable Python worker support, private networking, and deployment experience. No premature provider lock-in, no buying paid plan without founder approval. Avoid using personal accounts or unrelated production resources without approval.

### 6.3 Suggested monorepo

```text
wreckday/
├── apps/mobile/                 # Expo React Native app
│   ├── app/                     # Expo Router screens
│   ├── src/components/
│   ├── src/features/            # templates, builder, jobs, editor, share, wallet
│   ├── src/lib/                 # api/auth, config, errors
│   └── assets/
├── services/api/
│   ├── app/api/v1/
│   ├── app/core/                # config, auth, db, errors, logging
│   ├── app/models/
│   ├── app/schemas/
│   ├── app/services/
│   ├── app/repositories/
│   ├── migrations/
│   └── tests/
├── services/worker/
│   ├── ai/                      # story writer, image providers, prompts
│   ├── pipeline/                # steps and consistency
│   ├── render/                  # static frames and mp4
│   └── tests/
├── packages/contracts/         # generated JSON Schemas + TS types
├── infrastructure/             # docker, deploy, secret templates, storage
├── docs/                       # ADRs, API, privacy, safety, cost, releases
├── scripts/                    # smoke test and fixture generation
├── .github/workflows/
├── CLAUDE.md
├── .env.example
└── README.md
```

Keep provider adapters behind interfaces and avoid cross-importing FastAPI application code into workers in ways that cause circular dependencies. Use shared Python domain package if justified, not microservices for each module.

---

## 7. Data model: required entities, invariants, indexes

Prefer PostgreSQL UUID primary keys, UTC `timestamptz`, `created_at`/`updated_at`, lowercase enum strings with migrations. Define Alembic migrations and test downgrade safety where feasible.

| Table | Fields and invariants |
| --- | --- |
| `profiles` | `user_id PK` (Supabase auth subject), age_attested_at, status, display_handle nullable, created_at, deleted_at |
| `scenario_templates` | id, slug unique, category, display_title, configuration JSONB versioned, risk_level, enabled, ordering, preview_assets |
| `characters` | id, owner_user_id, type (`fictional`,`self`,`opt_in` future), public label, encrypted_reference_key nullable, `consent_id` nullable, created_at, expires_at |
| `consent_records` | id, target_subject_id nullable, uploader_user_id, scope, version, evidence reference if applicable, granted_at, revoked_at; design for future, v1 only `self` uploads |
| `drafts` | id, owner_user_id, scenario_template_id, user_settings JSONB, normalized_input JSONB, status, updated_at |
| `stories` | id, owner_user_id, template slug/version, title, status, moderation state, `is_saved`, cover_asset_id, created_at, completed_at |
| `story_frames` | id, story_id FK, `sequence_index`, beat_type, prompt/version, caption, `asset_id`, model metadata JSONB, render_state, UNIQUE(story_id, sequence_index) |
| `generation_jobs` | id, story_id, owner_user_id, state (`queued`,`planning`,`generating`,`rendering`,`completed`,`failed`,`canceled`), progress, attempt_count, lease_owner, lease_expires_at, error_code, provider, cost estimate/actual, idempotency_key UNIQUE per user, created_at |
| `generation_attempts` | id, job_id, sequence_index, provider_job_id, model, token/image charges, started_at, ended_at, outcome, failure_reason |
| `assets` | id, owner_user_id, kind (`upload`,`frame`,`thumbnail`,`export`), storage_key UNIQUE, MIME, bytes, image_dimensions, sha256, retention_state, expires_at, created_at |
| `credit_accounts` | user_id PK, available_balance, reserved_balance, updated_at |
| `credit_ledger` | id, user_id, unique business_event_key, signed delta, event_type (`grant`,`reserve`,`capture`,`release`,`refund`,`adjustment`,`purchase`), job_id nullable, purchase_id nullable, created_at; immutable ledger entries |
| `purchases` | id, user_id, store (`apple`,`google`), product_id, transaction_id UNIQUE, receipt/reference, status, granted_at, revoked_at |
| `reports` | id, reporter_id, content_owner_id nullable, story_id nullable, reason, description, status, triaged_at, created_at |
| `moderation_events` | id, story_id/job_id, stage (`pre`,`post`,`report`), decision, reason_tags, model/policy version, created_at; metadata only by default |
| `account_deletion_jobs` | id, user_id, request_source, state, requested_at, completed_at, retention_exceptions JSONB |
| `audit_events` | id, subject, action, actor, timestamp, minimal metadata; no raw private image payloads |

Indexes: story owner + creation date; job state/lease; frame uniqueness; asset owner + expiration; report status; purchase unique external transaction id; ledger business event idempotency. Define row ownership authorization for **every** API read/write, not only on list endpoints.

Accounting invariants: available+reserved amounts never negative; one provider completion produces at most one capture; canceled/failed job releases outstanding reservation; duplicates of webhooks/retries cannot duplicate grants. Use a ledger reconciliation test.

Deletion invariants: deletion request invalidates sessions, stops queued jobs, removes source uploads, rendered files and DB rows per documented retention, revokes references, and marks any lawfully retained financial/security records with minimized data and retention reasons.

---

## 8. API contracts and jobs

Prefix `/v1`. Authentication via bearer JWT except public read-only templates/health/demo.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/healthz`, `/readyz` | liveness/readiness, no secrets |
| GET | `/v1/templates` | pageable enabled templates, versioned presets |
| GET | `/v1/templates/{slug}` | template settings and sample previews |
| POST | `/v1/uploads/presign` | authenticated, constrained MIME/size/key creation |
| POST | `/v1/uploads/complete` | validate uploaded object and ownership |
| POST | `/v1/drafts` | save/update/create draft, input validation |
| POST | `/v1/stories` | persist user input and create story |
| POST | `/v1/stories/{id}/generate` | reserve credits atomically, enqueue job (idempotency key required) |
| GET | `/v1/jobs/{id}` | job state, progress, redacted errors, next step |
| GET | `/v1/stories/{id}` | story metadata, frames, short-lived asset URLs |
| PATCH | `/v1/stories/{id}/frames/{n}` | update caption or ordering with optimistic concurrency |
| POST | `/v1/stories/{id}/frames/{n}/regenerate` | independent frame job and cost reservation |
| POST | `/v1/stories/{id}/export` | start or return cached MP4/image bundle export |
| GET | `/v1/exports/{id}` | signed download URL/processing state |
| GET | `/v1/stories` | user's own library only |
| DELETE | `/v1/stories/{id}` | cascade to media deletion queue |
| GET | `/v1/wallet` | authoritative available/reserved credits |
| POST | `/v1/billing/webhook` | provider verified signature + idempotent entitlement update |
| POST | `/v1/reports` | report generated content without leaving app |
| GET | `/v1/me` | own profile |
| DELETE | `/v1/me` | authenticated account deletion request |
| POST | `/v1/account-deletion/request` | secure external web deletion path |

Response standard: JSON object with `data`, optional `meta`, `request_id`; errors with stable `code`, human message, `retryable` bool, and `request_id`; use consistent HTTP status codes. Pagination cursor-based or limit/offset (choose one; document). Never send internal prompts, provider credentials, storage root paths, personal data of other users or moderation heuristics to clients.

### 8.1 Generation payload example

```json
{
  "template_slug": "seven-foot-fiancee",
  "cast": [{"type": "self", "character_id": "optional-uuid"}, {"type": "fictional", "label": "Alex's fiancée"}],
  "setting": "an ordinary city apartment",
  "photo_realism": 100,
  "satire_intensity": 85,
  "visual_style": "candid_phone",
  "frame_count": 3,
  "custom_details": "the ceiling is too low",
  "language": "en"
}
```

Generate response: HTTP 202 `{ "data": { "story_id": "uuid", "job_id": "uuid", "state": "queued", "credits_reserved": 3 } }`. Actual example IDs in tests must be valid UUIDs. `POST /generate` requires `Idempotency-Key` request header. `GET /jobs/{id}` returns state, progress, safe error code, frame count complete, and time created; do not promise estimated time without measurements.

### 8.2 Job state machine

`created -> queued -> planning -> generating -> rendering -> completed` or `failed|canceled`. Allowed retry transitions are explicit; job worker lease expiry leads to `queued` retry with bounded attempts. Jobs must not silently disappear, double render, double spend, or leak assets. Use transactional outbox pattern if worker dispatch correctness requires it; a DB-job table can avoid separate outbox at MVP scale.

Worker pipeline:
1. claim valid queued job and heartbeat.
2. reauthorize account/credits/deletion state.
3. validate inputs & permissions, moderate prompts.
4. story writer returns schema-valid plot frames and captions.
5. store canonical character, continuity and scene descriptors.
6. generate each frame, preserving references/consistent lighting, wardrobe and scene; check output.
7. render watermarked stills + reveal card; export optional MP4 on demand or asynchronously.
8. save metering/outputs and commit credit capture once; notify mobile through poll.
9. on terminal failure release reserved credits and record safe error + provider costs.

Use generation result hashes and idempotent storage paths so a restarted worker can safely resume. Cancellation should be best-effort; after an external provider accepts a paid job, budget handling must acknowledge that sunk cost without charging users for failures.

---

## 9. AI text generation and story schema

Use a swappable `StoryWriter` interface. First mock provider outputs deterministic, tasteful, funny seed stories. Production text model default: a commercially usable **Qwen3-8B** deployment through a hosted compatible API if pricing and model terms check out; Claude must verify model license, cost, JSON structured output behavior and current alternatives. Do not assume a Claude Max subscription includes unrelated production API inference.

The model writes **only scenario structure/caption drafts/visual prompts**, never final user billing logic or moderation approval. Use Pydantic schema validation, length bounds, repair at most once, and deterministic template fallback if malformed. Keep genre-specific prompt versions in source control. Do not train on user uploads or conversations.

Canonical story output:

```json
{
  "template_slug": "seven-foot-fiancee",
  "title": "She's Moving In",
  "content_label": "AI FICTION",
  "cast": [{"cast_id": "A", "label": "self", "appearance": "reference photo"},
           {"cast_id": "B", "label": "fictional adult", "appearance": "very tall woman in black coat"}],
  "continuity": {"location": "same city apartment", "wardrobe": "unchanged across frames", "tone": "candid romantic comedy"},
  "frames": [
    {"index": 0, "beat": "hook", "caption": "Meet my girlfriend.", "visual_prompt": "..."},
    {"index": 1, "beat": "escalation", "caption": "She's moving in tomorrow.", "visual_prompt": "..."},
    {"index": 2, "beat": "twist", "caption": "We may need a taller apartment.", "visual_prompt": "..."}
  ],
  "reveal": "My dating life is AI fiction. The ceiling problem is real only in WRECKDAY."
}
```

Character appearance should be provided to the image model as *authorized reference* and public descriptions. Don't write sensitive physical inferences about uploaded people. The text model may produce alternative harmless premises when inputs conflict with policy.

### 9.1 Prompt safety and output protection

Treat user text, uploaded metadata, captions, and provider text as untrusted. Block prompt injection attempts to override policies, fetch secrets, route outgoing requests, or embed fake system instructions. Never allow the story model to execute tools. Validate all generated data before rendering. Put explicit thresholds on scene count, text length, characters, and text artifacts.

---

## 10. Image generation, identity consistency and quality

### 10.1 Model strategy

- Initial production image provider: official **FLUX.2 [klein] 4B** hosted API, commercially permitted; BFL's published base price starts at **$0.014 / image** (check resolution/additional reference charges at runtime).
- Future image provider: self-hosted Apache-2.0 FLUX.2 [klein] 4B via Diffusers or documented BFL code; benchmark GPU VRAM, throughput, concurrency, cold starts and total cost before changing.
- Do **not** silently select Klein 9B or FLUX.2 dev for self-hosted commercial deployment; those weights have different licensing conditions.
- If another model or provider is demonstrably better at overall quality/cost/licensing, Claude may propose substitution through an ADR with evaluation data.

### 10.2 Image generation frame plan

Frame 1 establishes the look of cast and location. Make a consistent character/scene bible: human descriptions, clothing, location geometry, time of day, lighting, lens and camera vibe, scene progression. Reuse actual allowed image references to preserve wardrobe/face/environment when using subsequent frame edits. Prefer single or multi-reference image editing over only reusing a text prompt. Keep an acceptable original generation as immutable parent asset, regenerate child frames independently. Seeds are helpful but NOT sufficient for identity consistency.

Prompt assembly order: system art-direction specification; fictional story beat; stable character/setting descriptors; authorized photo reference controls; camera realism instructions; unobjectionable composition restrictions; aspect ratio. Do not render captions as generation model text: put them on top with a deterministic compositor for correct spelling and accessibility.

Image QA rubric (1–5 manual + optional machine assistance): face consistency, wardrobe consistency, location consistency, prompt adherence, physical realism, legible framing, comedic impact, and policy compliance. Use at least 30 scenarios/variations for model benchmarking and 10 instances of the hero story. Evaluate equivalent *actual* effective cost including rerolls/ref fees, not base image price alone.

### 10.3 Uploads

- v1 permits self-image upload after direct explanation that it will be sent to the chosen image provider, and users affirm they own/are authorized to use it.
- Fictional character references generated by the app need no real-person likeness rights.
- Other real people: **not supported in v1**. Future version uses their affirmative, revocable opt-in, with precise permitted scope and retention.
- Image mime allowlist JPEG/PNG/HEIC where supported; inspect actual file signature, decode safely, enforce byte and pixel caps, strip EXIF/geolocation, reject corrupted/animated/oversized bombs, scan if suitable, convert server-side.
- Never scrape contact photos or social media profiles without separate authorization.

---

## 11. Output media rendering and sharing

Use deterministic rendering pipeline:
- 9:16 master `1080x1920` where supported; avoid distorting underlying image by using safe crop and alternate fill where needed.
- JPEG or PNG story cards with text overlays; captions never blend into photos; word wrapping, contrast gradients, safe areas for Instagram/TikTok UI; support emoji/font fallback and long names.
- Add visible discrete `AI FICTION • WRECKDAY` marker per generated frame, plus unmistakeable final reveal card. Add content credentials/C2PA if feasible and correctly verified; do not claim universal preservation after third-party re-encoding.
- FFmpeg export: `h264`, `yuv420p`, AAC only if audio track present, MP4 faststart, variable duration 3 x 2.5–3.5 seconds plus reveal 1.5–2.5 seconds; validate using ffprobe. Use licensed/original sounds only; default audio-free export.
- Final MP4 and stills only accessible by owner via signed URLs; local cache purged on logout or after TTL.
- Share API: Android chooser + iOS share sheet; user chooses app and recipient, no background send, no automated followup. Test WhatsApp, Telegram, Signal where installed but never promise privileged chat integrations.
- After sharing app may show **Share another** / **Make a comeback** with no harassment-targeting analytics. Don't track recipient phone numbers.

---

## 12. Security, consent, privacy, moderation and abuse response

### 12.1 Permitted / denied content

**Permitted:** self-roasts, staged adult romantic misunderstandings, fictional relationship melodrama, fictional workplace envy, absurd wealth, cartoonish outcomes depicted with photorealistic photography, harmless property-related comedy, fictional adult characters, opt-in participants in future.

**Disallowed:** real-person nonconsensual intimate content, sexualized minors, fabricated serious injury/death/emergency/explosion events likely to provoke panic, fake evidence of a named person's infidelity/crime/abuse, blackmail, extortion, harassment campaigns, doxxing, threatening messages, impersonation of police/medical/financial authorities, forged authentic chat screenshots or official news reports, automated deceitful messages, hateful targeting, targeted humiliation of nonconsenting people. Adult-only thematic satire does not permit pornographic imagery under store policies.

Use explicit content handling rules and hard denials for serious scenarios; offer creative redirections (e.g. an absurd cake explosion rather than an alleged car bombing). Founder and Claude cannot quietly remove these to bypass policy, especially under “open-source model” arguments.

### 12.2 Moderation control points

1. Before generation: template risk classification, text prompt classifier/rules, upload right check; reject prohibited categories.
2. After generation: review generated frames against policy; automatically quarantine uncertain results and allow reporting.
3. User reporting: in-app report offensive or abusive output; create moderation ticket; record response status; privacy-preserving triage.
4. Abuse detection: rate limits per user/device/payment, repeated denied content attempts, patterns; temporary block generation where necessary.
5. Prompt-injection security: never treat messages as developer instructions; no outbound tools available to content model.

A public feed or user-to-user features are intentionally absent in v1. If introduced later, user-blocking, report/takedown, impersonation complaints, child safety controls, and faster moderation procedures must be added before release.

### 12.3 Privacy by default

- No contact or full-chat permission in MVP. Never read or parse background messaging histories.
- Gather only account email, age-attestation, selected story settings, explicitly uploaded images, billing metadata, security essentials.
- GDPR-style data minimization and purpose limitation; consent withdrawal options when appropriate.
- Separate analytics consent where law requires; use minimal first-party aggregated events. No personally identifying recipient tracking.
- Default raw upload deletion 24 hours after job terminal state unless user explicitly saved a reusable self-character (feature can be disabled initially).
- Unsaved generated story assets expire after 30 days by default; saved assets retained until user deletes or account closes, subject to explicit policy. This is a **proposed policy**; configure and explain it consistently.
- Production media must use encrypted private storage and TLS; short-lived signed URLs; encryption of sensitive DB fields; avoid debug image dumps.
- Implement access/deletion requests, export user data, account deletion in-app and public web request path; cascade storage purge and documented narrow legal retention exceptions.
- Any processor/region transfer and EU compliance measures require a real privacy-policy review before launch.

### 12.4 Threat model

Threats: brute-force login, stolen JWTs, malicious file uploads, EXIF leakage, SSRF via external image URLs, large image decompression bombs, prompt injection, user-ID enumeration, signed URL leakage, duplicate store purchases, abuse of free generations, billing race conditions, stolen/reuploaded photographs, support/admin access abuse, provider outages, malware, sudden API-cost spikes, accidental logging of sensitive data, compromised service keys.

Controls: secure token verification, rate limits, MIME and pixel validation, object permission checks, no arbitrary URL fetch, short-lived secrets, idempotency, cost caps, provider timeouts, isolated worker, audit trails without payloads, data deletion tests, backups and restore drills, least-privilege DB credentials, CI secret scanning, dependencies updated and pinned via lockfile, security review before release.

---

## 13. Payments and unit economics

### 13.1 Product economics

For a **three-image** FLUX.2 Klein 4B story, base image model API fees start at `3 × $0.014 = $0.042` before reference-image surcharges, rerolls, LLM tokens, orchestration, failed attempts, storage, bandwidth, processing, tax, and store fees. Do not use $0.042 as guaranteed delivered-story cost.

Instrument per job: `image_api_cost`, `text_api_cost`, `image_retry_count`, `render_cpu_seconds`, `job_duration_ms`, `media_bytes`, `failure_reason`, `credits_charged`, gross margin. Calculate trailing actual cost per completed exported story at P50/P95; forecast cost at 100/1,000/10,000 monthly stories.

Cloud GPU break-even calculation: self-hosted monthly GPU+operations / effective capacity compared with actual per-image API cost including retries and idle time. Benchmark before purchase.

### 13.2 Launch pricing proposal

- **Free:** browse all demos, one real first story credit grant only after account verification and anti-abuse guardrails. Avoid unlimited free image inference.
- **Credit pack Small:** proposed €4.99, enough for several three-frame stories. Define exact credit count after measured costs and taxes.
- **Credit pack Large:** proposed €9.99, better unit price. No infinite access. Subscription defer until retention is proven.
- One 3-frame story: **3 credits**; single frame reroll: **1 credit**; export or caption edit free. Failed/rejected generation: restore reservation. Keep store catalogue as server-configured entitlements to change pricing without breaking historical grants.

Use Apple In-App Purchase and Google Play Billing for in-app digital credits. RevenueCat is an optional integration for cross-platform receipt handling; evaluate current pricing; direct store integrations are viable if Claude can implement robustly. **All grants and removals are server-authoritative and validated by store receipt/webhook signatures.** Refund/revocation handling required. Do not ask for Apple/Google account credentials in chat. No fake purchase mode in production.

### 13.3 Budget plan

Fixed: Claude Code Pro/Max subscription chosen by founder (published Max 5x $100/month, Max 20x $200/month subject to taxes/current plan), Apple developer membership currently $99/year, Google Play one-time fee currently $25. Variable: image API, text API, database, storage and app services; set infrastructure budget alerts and a hard app-level inference daily cap during beta. Document actual vendor quotes before paid sign-up.

Set starting *engineering limits*: max 3 completed images per requested story; max two automatic provider retries per frame; default one live job per account; daily global provider spend ceiling configurable; no speculative generating of extra frames. Don't silently charge new paid providers.

---

## 14. Analytics and learning

Implement privacy-minimal first-party events with random account ID, no prompt/body/face/recipient identities:
- `template_viewed`, `story_started`, `generation_requested`, `generation_completed`, `generation_failed`, `frame_regenerated`, `export_completed`, `share_sheet_opened`, `purchase_completed`, `report_submitted`, `account_deleted`.

Primary product metrics: successful story completion %, time to first finished story, image consistency satisfaction, export rate, share-sheet-open rate, second story generated within 7 days, paid conversion, generation gross margin, abuse report rate and confirmed policy violation rate. No claim that a share sheet open means recipient received or watched a message. Set opt-in for any analytics requiring consent. Maintain 30-day rolling dashboard in admin or SQL view; no need for a complex BI frontend.

---

## 15. Test requirements (do not waive)

### 15.1 Automated unit/contract tests

- Zod and Pydantic schema roundtrip and version drift detection.
- Input limits, scenario configs, comic intensity, caption formatting, watermark always present.
- Positive/negative prompt moderation fixtures for allowed adult satire vs denied real-world harm.
- Authorization: unauthorized and cross-user access to every object 403/404.
- Job states, lease recovery, idempotency key, duplicate requests, cancellation, partial frame failures.
- Credit concurrency: two parallel jobs cannot overspend; exactly-once capture, refunds, webhook replay.
- Asset validation: wrong MIME, polyglot/zip bomb, oversized image, EXIF removal.
- Storage deletion: raw images, exports and signed URLs no longer valid after deletion.
- Provider mock offline, 429, timeout, 500, malformed response, moderation rejection.
- Video export: ffprobe validates dimensions, codec, duration, audio policy.

### 15.2 Integration and e2e

- API integration against test Postgres and storage with no paid inference required.
- Mobile e2e with Maestro or suitable current framework: onboard -> sample -> create -> authorize -> mock generate -> edit caption -> export -> OS share sheet -> delete. Test offline/reopen.
- At least one iPhone model and two Android devices/emulators incl. medium-range hardware.
- Real API smoke: ten 3-frame stories, including self-photo with user-authorized tester assets; record outputs and paid cost.
- Mandatory manual QA of real outputs: multi-frame identity continuity, safe content, no bizarre hands/face artifacts beyond acceptance threshold, editable captions and reveal, image labeling.
- Store purchases sandbox success, cancellation, refund, restore, subscription not applicable unless introduced.
- Account deletion web flow works without reinstalling app.
- Full check of notices and consents across iOS/Android.

### 15.3 Performance and reliability targets (engineering goals, measure reality)

- 99% of request/reply endpoints meet defined healthy-latency SLO under small beta concurrency.
- Job completion >= 95% excluding moderation/user cancellation in pilot; do not conceal provider outages.
- Story generation target P50 <= 90s and P95 <= 180s under measured pilot conditions, revisited after benchmark; no guaranteed customer time until measured.
- App crash-free sessions target >= 99.5% beta.
- Zero cross-user media leaks; zero double credit charges; deletion propagation tested.

Provide a reproducible test report, screenshots, demo video and issue list after every release candidate. No test should use paid production inference by default.

---

## 16. CI/CD, build and release infrastructure

- Git repository private initially, protect main branch where feasible, commits per milestone, PR/branch for substantive architecture changes, changelog.
- GitHub Actions (or equivalent) on pull requests: `pnpm install --frozen-lockfile`, TS lint/typecheck, frontend tests; Python `ruff`, `mypy` where feasible, `pytest`, migrations checks; contract build; check no credentials.
- Deploy staging automatically only after tests pass; production deployment requires founder acknowledgement.
- Dockerfiles for API and workers, health checks, no root user where possible, immutable versions. Secrets in deployment manager, `.env.example` with dummy fields, no secret values in git.
- Separate staging/prod Supabase projects/buckets/auth keys; never reuse production access tokens in E2E tests.
- Expo EAS profiles `development`, `preview`, `production` with correct build credentials; validate iOS SDK and Android target API requirements at each release.
- `release-checklist.md` includes store listing screenshots, privacy policy, terms, support page, age ratings, data safety/privacy disclosures, demo account, content review explanation, app-generated media label, in-app report, deletion web route, IAP products configured, actual receipts tested.
- Deploy rollback plan: previous stable mobile bundle + previous API/worker image; avoid irreversible migrations; have DB backups, retention schedule, and migration smoke tests.

---

## 17. App Store and Play Store compliance checklist

**Apple:** current App Review Guidelines 1.1 (objectionable/misleading/prank functionality), 1.2 (UGC and AI-generated content), 3.1.1 (IAP), 5.1.1 and 5.1.2 (privacy/permissions/data sharing) are most relevant. In particular, Apple's guidelines explicitly reject anonymous prank calls/SMS and false/trick functions. WRECKDAY must not behave like a prank call/SMS sender. Apple App Store upload toolchain currently requires Xcode 26 or later with iOS 26 SDK or later. Follow store's current age-rating questionnaire, don't promise fixed rating without completing it.

**Google Play:** AI-generated content must comply with developer policies and include **in-app reporting** of offensive content. New standard mobile app uploads from 2026-08-31 target Android 16/API 36+. Personal new developer accounts may be subject to 12 opted-in testers for 14 continuous days prior to requesting production access. App account creation requires both app and external web deletion pathways. Complete Data Safety accurately and ensure official policy disclosures match actual SDK/data behavior.

**EU:** GDPR data processing, privacy policy, deletion rights, data processing agreements/transfers, and AI Act Article 50 transparency for AI-generated/manipulated content need assessment for intended EU distribution. Keep visible AI content identification; legal obligations and implementation timing require current review at release. No assumption that 18+ avoids content or privacy rules.

**Store submission material:** clean fictional marketing screenshots; accurate feature descriptions; no references to invented major news events as genuine; developer website, privacy policy and support email; demo account or preview mode giving reviewers meaningful access; moderation/reports reachable; store-specific notes explaining scenes are staged/AI-labeled, not fake emergency notifications.

**Review contingency:** if rejected for prank/deceptive behavior, disable affected features and submit factual clarification or an appeal. Do not use hidden alternate builds, remote toggle deception, or attempt to evade reviewer controls.

---

## 18. Admin and operations

Minimal authenticated admin web/dashboard (can be CLI first): job queue/state, model provider errors, prompt policy version, reports pending triage, report decisions, global spend cap, API usage, provider switching feature flag, credit ledger reconciliation, asset deletion job status. Founder must not see users' private uploaded images in routine analytics. Document access controls, retention, and incident procedure.

Operational runbooks:
- AI provider down -> switch mock in staging, pause new paid jobs in production, alert founder, refund holds.
- Unexpected cost spike -> stop new generations globally with friendly message, preserve paid credit balances.
- Leaked key -> rotate + revoke + inspect logs and storage accesses.
- User image/takedown complaint -> verify claim, temporarily quarantine media, delete or restore, document handling.
- Payment mismatch -> pause grants, reconcile signed receipts and ledger.
- Data deletion failure -> retry until complete, record legal exception and notify as applicable.
- Store policy update -> review requirements, release compliant update.

---

## 19. Release gates and milestones

Use milestones with hard exit criteria rather than a fixed 12-week promise. Claude should complete one gate with verifiable results before starting the next; parallelize only safe independent work.

### Gate 0 — Environment, risk and requirements (no paid accounts needed)

- Inspect OS, Node, pnpm, Python, Git, Android/iOS toolchain and existing folders; do not overwrite existing work.
- Verify current licensing, SDK/store constraints, vendor pricing and availability; record ADRs.
- Create brand/trademark screening checklist; choose placeholder bundle IDs.
- Create repo, initial README, CLAUDE.md, core folder layout, `.env.example`, CI skeleton, documentation links.
- Show exact commands that run locally; all work committed.

**Exit:** repo builds, quality scripts execute, no secrets committed, no guessed credentials.

### Gate 1 — Mock vertical slice

- Scenario templates, Expo screens, local auth fixture/dev mode, FastAPI API, test DB and storage, durable job queue, fixture images, captions, edit/reorder, FFmpeg render, local share sheet.
- First complete template: `seven-foot-fiancee` with 3 frames and a reveal.
- Report true simulator/device status honestly.

**Exit:** a full story is made/edited/exported with **zero live inference spend**, API + mobile tests pass.

### Gate 2 — Real inference

- Implement hosted Qwen-compatible writer and FLUX.2 Klein 4B image adapter; real reference image handling; safe moderation.
- Ten-story benchmark and comparison; manual visual quality scorecard; provider-error recovery, cost logging.
- Add ability to regenerate one frame.

**Exit:** 10 real story generations logged with accurate costs, acceptable visual consistency, and no unbounded retry loops.

### Gate 3 — Beta productionization

- Supabase Auth, private storage, profiles, actual auth flows, export manager, saved library, legal pages, full reporting, deletion, retention tasks, security hardening, opt-in self-photo upload.
- CI checks, monitoring, Sentry optional, load tests, backup/restore.

**Exit:** end-to-end physical-device beta; account deletion removes files; cross-user access tests pass.

### Gate 4 — Payments and store readiness

- IAP via store products, purchase ledger and restore, refund handling, anti-abuse limits.
- Audit exact Android/iOS current toolchain and store disclosures; create screenshots, icon, listings, review notes, privacy policy.
- Closed testing and TestFlight, issue resolution.

**Exit:** sandbox purchase and refund flows pass; all store checklist items satisfied; founder approves paid/store actions.

### Gate 5 — Controlled launch

- Submit review on both stores; handle reviewer feedback; initially cap new registrations and compute spend; monitor reports, error rates and cost.
- Ship 12 templates after 3 hero scenarios pass quality tests.

**Exit:** both stores available (subject to approval); app can produce, export, purchase and delete without manual development intervention.

### Gate 6 — Post-launch iteration, not initial release

- Improve image identity consistency, add safe comeback story chain, opt-in multi-person casting, richer cinematic transitions, multilingual captions, Telegram Mini App, optional subscriptions, self-hosted inference only after break-even.

---

## 20. Definition of done per engineering task

A task is **DONE** only when: code is implemented; relevant unit/integration tests exist and pass; lint/typecheck pass; required migrations applied/tested; production behavior avoids mock fallbacks; expected errors recover; new permission/data fields documented; no exposed secret; feature visible from real UI; screenshots/logs or demo proof attached in report; no outstanding critical regression; README updated when setup changes.

A code scaffold, stub API endpoint, TODO, static image masquerading as AI output, screenshot-only prototype, or theoretical deployment plan is **NOT DONE**. If blocked, label it `BLOCKED`, explain exact prerequisite and provide a verified alternative workstream rather than claiming completion.

---

## 21. Development workflow and founder communication

At each gate, Claude reports:

```text
MILESTONE:
IMPLEMENTED (file paths/commits):
WHAT RUNS:
TESTS EXECUTED / RESULTS:
REAL VS MOCK FEATURES:
COSTS INCURRED / EXPECTED:
OPEN RISKS:
QUESTIONS NEEDING FOUNDER ACTION (only genuine blockers):
NEXT IMPLEMENTATION SLICE:
```

Never claim to have tested an iOS device, production payment, GPU endpoint, real account or app-store upload if not actually tested. Never invent tool output. If tool access is missing, provide commands and clear next steps for the founder.

---

## 22. Decisions Claude can make vs must escalate

**Claude decides without asking:** filenames, precise library versions after compatibility check, form layout, error-handling approach, test framework, auth wiring within agreed platform, DB indexing, provider adapter code, minor microcopy, visual component library, local tooling, quality enhancements with low/no cost. Document meaningful choices.

**Claude proposes with a 1-page ADR, then proceeds with the conservative safe default if founder unavailable:** replacing Postgres queue with Redis, choosing cloud host, switching equivalent text model, choosing RevenueCat vs direct billing, replacing CI tool, altering UX flow without changing the premise, moving a milestone, reducing lower-priority scope.

**Claude requires explicit founder approval before doing:** buying subscriptions or cloud resources, deploying to real production, purchasing a domain, choosing a permanent brand/bundle ID, submitting apps, changing payment prices, launching marketing to real users, importing private communications, processing non-self real-person likeness, connecting or deleting production resources, legal representations, sending emails/messages on founder's behalf, spending above approved cap, expanding to a content type materially blocked by store policy.

**Non-negotiable:** No bypassing app-store policies, payment requirements, or real-person consent even if a model would technically comply with a prompt. Explain alternatives.

---

## 23. Claude's mandated constructive pushback protocol

The founder wants rigorous technical disagreement, not obedient confirmation. Challenge proposals by reference to measurable outcomes, not taste. When an assumption is weak:

1. State **what is wrong or uncertain** in one concise sentence.
2. Show evidence: measured benchmark, updated documentation, math, security failure mode, or product risk.
3. Offer a better option with its tradeoffs and cost.
4. Classify `BLOCKER`, `HIGH-RISK`, `OPTIMIZATION`, or `PREFERENCE`.
5. If not a blocker and no money/user-data/legal risk, choose the sensible default, record an ADR, and keep implementing.
6. Do not ask long question lists or re-open settled scope without new evidence.

Specific decisions Claude **should** challenge if warranted: whether Qwen3-8B or another model has better cost/format reliability; whether FLUX Klein 4B delivers adequate photo consistency; whether Postgres queue is reliable enough at load; whether Supabase and separate FastAPI add useful complexity; whether 3 frames can be generated within economic limits; whether a name is legally viable; whether simulated scandal concepts violate app policies; whether credits/billing are worth deferring until after beta; which actual minimal Android/iOS SDK target is compatible.

If a requirement is impossible with approved APIs (for example, auto-reading WhatsApp conversations), reject the implementation claim and offer supported native share alternatives. This is expected, not a failure.

---

## 24. Source-of-truth official references (verify at time of action)

**Apple:**
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Upcoming SDK/build requirements: https://developer.apple.com/news/upcoming-requirements/
- Developer Program enrollment: https://developer.apple.com/help/account/membership/program-enrollment

**Google:**
- Generative AI content policy: https://support.google.com/googleplay/android-developer/answer/13985936?hl=en
- Target API requirements: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- Personal account testing: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en

**AI / infra:**
- FLUX 2 model implementations and licenses: https://github.com/black-forest-labs/flux2
- BFL commercial license breakdown: https://help.bfl.ai/articles/9272590838-self-serve-dev-license-overview-pricing
- FLUX model info and pricing: https://help.bfl.ai/articles/7655484417-what-flux-models-are-available
- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Claude plan and Claude Code: https://support.claude.com/en/articles/11049762-choose-a-claude-plan
- EU AI Act Article 50: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50

External requirements can change; current web check was performed for this v1.0 spec dated 2026-11-01. This document is an engineering/product plan, not a substitute for legal advice or approval from a store reviewer.

---

## 25. EXACT FIRST COMMAND TO CLAUDE CODE

Read `CLAUDE.md` and `WRECKDAY_MASTER_SPEC.md` fully. We are founder + Claude Code and are building WRECKDAY as a production-quality iOS/Android app. Implement Gate 0 and then Gate 1 end-to-end rather than writing a plan. Inspect this machine first; don't overwrite existing files. Establish a running Expo/React Native frontend, FastAPI backend, test Postgres and storage environment, seed scenario templates, a deterministic mock three-frame generator, story editing, a working FFmpeg export, and native sharing. Add tests and CI. Verify everything you can actually run. You may criticize and replace weak technical decisions with evidence and ADRs, and you must call out false assumptions. Do not interrupt me with routine choices; ask only for genuine external blockers (credentials, spending, brand/legal/production approvals). After each gate, report exact files changed, tests executed and results, and how to launch the working application. Keep coding until the gate's exit criteria pass or a concrete blocker is proven.

---

**End of master specification.**
