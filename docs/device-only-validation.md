> Historical validation of the device-only revision. The founder subsequently
> requested provider APIs and a photo-plus-premise generation flow. See
> [ADR 0003](adr/0003-payback-reference-photo-generation.md) and
> [current validation](payback-validation.md).

# Device-only composer validation — 2026-11-02

## Current status

The founder's final direction in the supplied reference is implemented as a local
comeback-fiction composer. This supersedes the old server-based Gate 1 roadmap;
see [ADR 0002](adr/0002-device-only-comeback-composer.md). This is a development
preview, not a payment-enabled service or native-device release.

## Implemented

- `apps/mobile/app/index.tsx`: requested positioning and tagline, 18+ entry,
  Flicker $5.99 / Blaze $19.99 / Inferno $29.99 USD, 1/3/5-scene preview packages,
  explicit replacement confirmation and no payment-success simulation.
- `apps/mobile/src/composer-model.ts`, `composer.tsx`: memory-only session,
  package-specific sample captions, bounded text, immutable image/caption pairing,
  reorder, full draft reset. Prices are preview data, not purchase entitlements.
- `apps/mobile/app/compose.tsx`: private note, rights affirmation, local image
  import, editing, reordering, scene preview, labeled PNG export and session clear.
- `apps/mobile/src/local-images*`: browser-local blob URLs, native-local picker
  and dedicated temporary cache, byte/pixel limits, cache reset/startup cleanup.
- `apps/mobile/src/export-card*`: local canvas PNGs on web, local view capture and
  share sheet on native. Fixed fiction label and reveal; brief excluded.
- `apps/mobile/app/library.tsx`, `settings.tsx`: current-session view, actual
  retention/sharing limits, clear controls. No account or remote library.
- Former app routes redirect to local screens. Former API/session/share clients
  are removed; no content fetches are present in the active app source.
- `services/api/app/main.py`: health-only compatibility service. All other paths
  return 410 without consuming request bodies; no database/media/provider imports.
- `services/api/app/worker.py`: worker disabled, including its programmatic entry.
  Compose no longer provisions a database, worker or media volumes.
- `.github/workflows/checks.yml`: lint/type/tests, all-platform JS export, browser
  flow against a static export, API-retirement tests without Postgres. Remote CI
  has not been run or observed in this session.

## Checks actually run

| Check | Result |
| --- | --- |
| Expo-compatible dependency install and `pnpm install` | Passed; lockfile updated |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed for contracts and mobile |
| `pnpm test` | 13 historical contract tests + 7 composer tests passed |
| `pnpm --filter mobile exec expo install --check` | Dependencies up to date |
| `pnpm --filter mobile exec expo export --platform all --max-workers 1` | Web + iOS/Android Hermes bundles exported; no native binaries |
| Ruff check and format check for `services/api` | Passed |
| `.venv/bin/pytest -q services/api/tests` | 21 passed, one upstream Starlette/httpx deprecation warning |
| Browser flow against Metro | Passed for all 3 packages; no page errors, external HTTP requests, or HTTP writes |
| Browser flow against static production web export | Passed the same flow on port 8082, including direct route refresh |
| PNG outputs | All 1080×1920; inspected maximum-length caption output and mobile preview |
| `git diff --check` | Passed |

The initial root typecheck failure was fixed by declaring the shared TypeScript
compiler at the workspace root. The first API subprocess-import test assumed a
working directory; it now sets that directory explicitly and passes from either
repository root or API directory.

Current Playwright's Chromium download is unsupported on this host's macOS 12.
Installed Chromium 130 through Playwright 1.48.2 and ran the repository's current
Playwright driver with an explicit executable path. The first browser attempt
also hit a 30-second cold-bundle timeout while native exports were running;
verification was rerun after separating those tasks and allowing 120 seconds for
navigation. The completed all-platform export was then run with one worker.

## Browser reproduction

```sh
pnpm --filter mobile web
# In another terminal, on supported hosts:
pnpm exec playwright install chromium
node scripts/browser-smoke.cjs
```

On this macOS 12 machine, the successful browser command was:

```sh
PLAYWRIGHT_CHROMIUM_PATH='/Users/bbb/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium' node scripts/browser-smoke.cjs
```

The script verifies package counts, caption edits and image pairing after reorder,
local image import, preview, PNG dimensions, 390px overflow, explicit reset and
reload reset. It monitors HTTP requests/writes and page errors. Artifacts are in
ignored `work/browser`, including package screens, mobile previews, and PNG cards.
This demonstrates the exercised browser flow; it is not a universal network or
security audit and does not verify operating-system or third-party app behavior.

## Live versus unconnected

Working locally: package preview, memory-only drafting, manual caption editing,
authorized image import, scene reorder, preview and browser PNG downloads. Native
import/capture/share code is implemented and JS-bundled, not physically tested.

Unconnected: checkout, signed receipts, AI generation, anonymous delivery,
recipient pages, messaging services. No ad-funded features. No MP4 export in this
revision. Demo illustrations are labeled, and the note does not generate content.

## Costs, retention and limitations

Provider spend: $0. No payment, messages, account connections, deployment, cloud
provisioning or store submission performed. Changes are local and unpushed.

Drafts are held in memory. Browser blobs are revoked on clear; native app-owned
imports are cleared on reset and next startup. Unexpected termination may leave
native cache files until then. Original photos, downloaded files, recipient-held
copies and OS caches/backups cannot be erased by clearing this session. Historical
server databases/media are not automatically purged. No GDPR certification,
untraceability, violence-prevention benefit, actual willingness to pay, or store
acceptance is claimed.

Remaining work: physical iPhone/Android QA, native cache/capture/share validation,
real billing and entitlement design, and a decision/benchmark on local inference
if AI generation remains part of the paid promise. See the updated release checklist.
