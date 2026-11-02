# ADR 0002 — Device-only paid-package comeback composer

Accepted 2026-11-02, following the founder's supplied conversation and instruction
that Wreckaday must match its final direction.

## Product decision

Position Wreckaday around “Found out they were cheating?” and “Hire Wreckaday.
You give the spark. We give the flame.” Offer Flicker $5.99, Blaze $19.99, and
Inferno $29.99 USD as proposed one-time packages, with 1, 3, and 5 scenes. Higher
packages increase creative scope and absurdity. No discovery-app partnership,
infidelity verification, protective outcome, or reduced-escalation claim is made.

The final instruction in the supplied conversation requires content to remain on
the creator's device, with no server-side generation or hosted recipient page.
This supersedes the earlier server library, cloud inference and anonymous-delivery
approach in the master specification and previous Gate 1 implementation.

## Architecture

Use a memory-only React context/reducer for briefs, captions and image references.
Use platform-local file import, local card rendering, and PNG export. The brief is
a private note and is excluded from output. No user-text logging, analytics,
recipient collection, content fetch, or persistent draft store is introduced.
Native imports are copied to one dedicated cache directory, cleared on reset and
startup; browser blob URLs are revoked on reset. Native export captures are
released after the share sheet returns.

Retire the content API with a body-unread HTTP 410 middleware and a health-only
service. Retire the worker so it cannot claim queued jobs. Remove database and
media volumes from current Compose configuration. Do not delete historical local
data or Docker volumes automatically. Historical domain/provider/render modules
remain inactive; their existence is not a production feature.

Use the existing artwork as explicitly identified demo art; users may import
images they are authorized to use. Every exported scene has a non-editable fiction
label and reveal. Payments and delivery are unconnected; package selection is a
free preview, not a simulated successful financial transaction.

## Consequences

No anonymous delivery, cloud AI generation or server MP4 rendering is available
in this revision. True future generation must run locally to preserve this content
boundary, or the founder must explicitly change that boundary. Real purchases
will need verified store receipts and appropriate billing records, separate from
creative content; this revision stores neither.

No promise is made about GDPR compliance, untraceability, retroactive deletion,
remote recall, OS caches/backups or recipient-held copies. No real accounts are
connected and no payment, message, deployment or store submission is performed.
