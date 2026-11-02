# ADR 0006 — Tiered model access and a fixed content floor

Accepted 2026-11-02. The founder agreed the floor bullets below and asked for
broader generation freedom in Inferno. This changes a core product goal and
updates hard rule 1 in `CLAUDE.md`.

## Tiers

| Tier | Price | Scenes | Model access | Creative scope |
|------|-------|--------|--------------|----------------|
| Flicker | $5.99 | 1 | One default model | Standard |
| Blaze | $19.99 | 3 | Selection of higher-quality models | Standard |
| Inferno | $29.99 | 5 | Full selection, incl. evaluated minimally filtered open-weight models | Expanded |

Model choice is explicit, with capabilities, limits, speed and image-editing
support shown. Access is enforced server-side from verified purchase entitlements,
never by a hidden client selector. "Minimally filtered" describes a model's
built-in behaviour; it is not a promise of "no guardrails".

## Content floor (every tier, enforced by Wreckaday, not by the chosen model)

- No minors or anyone who looks under 18.
- No nudity or sexual content of a real face.
- No real person other than the uploader.
- No realistic fabricated evidence of crime, emergencies, arrests or infidelity.
- No real threats, doxxing, blackmail or self-harm.

Inferno additionally allows crude, savage or profane humor, dark satire,
cartoonish comic violence, outrageous luxury and bragging, sharper revenge
premises and non-explicit adult themes. Flicker/Blaze keep the standard scope.

Enforcement lives outside the user-selected model: the keyword floor
(`FLOOR_PATTERN`), the review prompt and the planning prompt
(`services/api/app/generation.py`) run with the fixed default text model.
A user-selected model must never review its own output. An independent image
moderation check is still required before launch.

## Constraints

- Commercial-use licences only (hard rule 3): no FLUX dev / FLUX.2 9B or other
  non-commercial weights on any tier. Each new model needs an evaluation entry
  in `docs/model-evaluation.md`.
- Remote hosting is allowed per ADR 0003; on-device-only (ADR 0002) is superseded.
- Store review: the expanded scope must stay within App Store / Play policies;
  re-check before submission.

## Status

Implemented now: per-package floor and Inferno scope in keyword checks and
prompts, with tests. Not implemented: model selection, entitlement checks,
image moderation. Until checkout and entitlements exist, the Inferno scope is
reachable by selecting the package in the development preview.
