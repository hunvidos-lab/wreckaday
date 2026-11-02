# ADR 0003 — Payback positioning, examples first, reference-photo generation

Accepted 2026-11-02 following the founder's correction: this is a revenge/prank
product with payback motivation, not a motivational comeback-card composer.

Show photorealistic examples before package pricing. Replace the manual card
creation entry point with own-photo selection, premise design, package scope,
explicit processor confirmation, automatic scene planning/reference-image editing,
and review/export. Retain the requested tagline and Flicker/Blaze/Inferno prices.
Remove cartoon imagery from the active product and do not substitute illustrative
marketing images for personalized generated results.

The founder now explicitly requests server `.env` APIs for text/image models.
This supersedes ADR 0002's strictly device-only generation boundary. The user must
see that their photo and premise go to the development server/configured providers
before generation. The server processes request-lifetime content in RAM, with no
story DB, photo files, image URLs issued to recipients or content logging. Provider
retention still applies and is not represented as zero retention or GDPR compliance.

Keep the legacy account/credit/story/media API and durable worker retired. Add an
opt-in development-only `/v2/capabilities` and `/v2/generate` service with Llama chat
and BFL or compatible image-edit adapters. Defaults fail closed without complete
configuration, explicit ceilings and a positive session budget. Bound calls and
polling; reserve a conservative cost ceiling before model calls, keep reservations
after failures, refuse repeated request IDs, and do not retry or silently substitute
models. Reservations are not actual invoiced spend. Limits reset on server restart;
this architecture must not be exposed publicly or used for production billing.

Expose only the public API base URL in Expo settings. All provider model keys live
in server environment fields. Uploaded images are decoded/limited and metadata is
stripped before forwarding. No arbitrary photo URL fetch is supported. Require
adult/self-photo/processor attestations, review premises, bound output schemas,
retain fiction labels/reveals, and do not lower provider safety settings. Independent
image moderation, real billing/authentication, distributed budgets and provider
quality benchmarking remain production prerequisites.

Investigate steerable fine-tunes using upstream evidence and quality criteria;
do not add jailbreak techniques to enable abuse. See `docs/model-evaluation.md`.
Nothing is pushed, deployed, purchased or sent to a recipient by this change.
