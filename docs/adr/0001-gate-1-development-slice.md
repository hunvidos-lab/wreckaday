# ADR 0001 — Isolated development slice, shared Python domain

Accepted, 2026-11-01.

The upstream repository contained only a title README. Start with one functional
hero scenario, `seven-foot-fiancee`, using Postgres 17, SQLAlchemy and a separate
worker process. Keep shared models and worker code in the API Python package to
avoid circular imports and packaging overhead. `services/worker` documents the
entry point; no Redis or new paid services.

The development preview uses one pre-rendered AI-fiction editorial sample image,
repeated for all three frames. The creator interface identifies it as a mock fixture; exported stills do not carry a label. The repeat means this preview does not
demonstrate scene progression or live-provider quality. The original procedural
illustrations were replaced during the visual refresh.

Dev accounts Alex and Sam are shared, non-private testing fixtures. Tokens are
HS256 JWTs with an eight-hour expiry, fixed audience and issuer. The known default
key is development configuration, never a production secret. Configuration refuses
any non-development environment. Production needs Supabase JWKS validation,
verified email sign-in, rate limiting, account deletion and private cloud storage.
A production bypass must not be created by weakening this guard.

Credits are pretend credits. Ledger amounts represent changes to total funds:
grant +30, reserve 0 (available -> reserved), capture -3, release 0. A unique
business-event key prevents repeated settlement. All balances are server-owned.

Store media in a local private directory without a static file mount. Five-minute
HMAC links are bearer capabilities: anyone holding a link can use it until expiry.
They are issued only after ownership checks; deletion immediately makes them
unusable. TLS, encrypted managed storage, processor disclosures and retention jobs
remain release prerequisites. This build must not be publicly hosted.

Bundle identifiers use reserved `invalid.example` placeholders. The existing
GitHub repository is public; this work does not change its visibility. No brand
clearance, legal compliance, physical-device QA, cloud deployment, or store
approval is claimed.

## Founder direction update — still images and separate reveal

The founder explicitly changed the earlier spec: the initial shared image has no
AI-fiction label, and the reveal is sent separately by the creator. This overrides
the original watermark and video-export requirements. New PNG stills omit
watermarks and fixture labels; the creator interface remains clear about mock
generation. The app no longer offers video sharing. Pre-existing mock exports
are withheld until re-rendered with the current image format. Real inference,
likeness consent, privacy safeguards, review of distribution rules, and photo
personalization remain unimplemented.
