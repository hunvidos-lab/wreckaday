# Authentication and request flow

## Gate 1 (implemented development fixture)

1. Public sample images are bundled with the Expo application. `/healthz`,
   `/readyz`, and template GETs need no token and incur no inference charges.
2. `/auth` calls `POST /v1/dev/session` selecting shared fixture Alex or Sam.
   `app/auth.py` derives a deterministic UUID subject; an atomic Postgres upsert
   creates the demo wallet and a single 30-credit grant.
3. The API issues an eight-hour HS256 JWT with fixed issuer/audience. The known
   development signing key comes from `WRECKDAY_SIGNING_SECRET` configuration.
   It is not a production credential. The entire service refuses non-development
   configuration. Set `WRECKDAY_DEV_AUTH=false` to disable fixture access.
4. `apps/mobile/src/session.tsx` keeps native tokens in Expo SecureStore. Web
   preview tokens are memory-only. Logout clears TanStack Query and native
   export cache. Tokens expire naturally; there is no refresh or server-side
   session revocation in this fixture. Draft form state survives navigation to
   sign-in in memory. Native disk draft persistence is not implemented.
5. `src/api.ts` attaches `Authorization: Bearer …`. FastAPI verifies signature,
   algorithm allowlist, expiry, issuer, audience and known fixture subject, then
   explicitly scopes every story/job read and mutation to its owner.
6. Generation locks the account and story, verifies funds, reserves three demo
   credits and transactionally inserts a durable job. Worker claims use
   `FOR UPDATE SKIP LOCKED`, leases and heartbeats. Completion captures once;
   failures/cancel/deletion release once. Credits never come from client claims.
7. Authorized story responses include five-minute signed media URLs. These are
   bearer capabilities and must be protected like tokens. Media is not mounted
   publicly. The download checks HMAC, expiry, current story and allowed asset
   name. Story deletion removes files and prevents use of old links.

No passwords, Supabase keys, paid provider credentials or store tokens are
collected in this build. No secret should appear in `EXPO_PUBLIC_*`: those values
are compiled into the app. Local DB password and JWT key are known demo defaults.

## Gate 3 target (not implemented)

Supabase email OTP/magic link with native deep links; SDK session refresh and
SecureStore persistence; FastAPI JWT validation against current Supabase JWKS;
strict issuer/audience/algorithm and object authorization; application DB writes
only through the API; restrictive RLS; private cloud storage and short-lived
links. Supabase service-role and inference credentials stay server-side. Account
deletion must revoke sessions, stop jobs and purge stored media before beta.

The fixture is for local development only; it must not handle real user data.
