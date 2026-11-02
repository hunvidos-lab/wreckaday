# ADR 0007: Local launcher and authenticated key console

Date: 2026-11-02. Status: accepted for local development only.

## Decision

Implement the founder's four-part task with a Bash launcher, a `.command` Desktop
shortcut and an authenticated loopback-only development console. Each server runs
in its own process group so Ctrl+C, Terminal SIGHUP or launcher exit stops its
descendants. The Desktop generator has an isolated output directory option for
tests; the real Desktop is left for the founder's one-time installation.

The launcher generates a fresh admin password, prints it once to Terminal and
passes it only to the API process. API logs do not contain it. A manually enabled
API without an injected token generates one only when stderr is an interactive
terminal; redirected startup without a token fails closed. This is a launch-lifetime
password, reused for that session's authenticated requests, not a token consumed
by the first request. Restarting the launcher invalidates it.

Access requires development mode, an explicit console flag, a numeric loopback
client and a loopback Host. Origins must also be approved local origins. The
additional Host check blocks DNS-rebinding access. All methods return 404 when
gated off and 401 without the password. No query/URL token is supported.

The task asks both to hide Keys until an authenticated GET returns 200 and to click
Keys before entering the token. Resolve that bootstrap conflict with **Setup**:
an unauthenticated 401 reveals only an unlock form, and only a successful GET
reveals the **Keys** header link and management fields. No saved values are
disclosed by the discovery request. Production exports replace the form/runtime
with empty Metro modules; hiding a route alone still included unreachable module
factories, which artifact inspection caught.

Only the ten requested settings can be updated. Validate before writing, retain
unrelated lines byte-for-byte, quote values safely, forbid control characters and
dotenv interpolation, then fsync a same-directory temporary file, atomically
replace `.env`, and set mode 600. Errors never echo submitted values. Swap validated
settings into the existing service under its lock, preserving its reservations,
request IDs and ledger; reject changes while generation is active. An injectable
`WRECKDAY_ENV_FILE` supports isolated test installations without reading real keys.

Provider keys exist only in the local form during entry/transit. Save and route
blur clear them; Expo Router retains screens, so unmount-only cleanup is
insufficient. The session context holds the admin password only, with no browser
storage or query cache. Blank secret values leave the saved key unchanged. Short
malformed keys are never revealed in full by last-four masking.

## Checks and limits

No-generation key probes are deliberately narrow: Cloudflare model search GET,
OpenRouter key-status GET, and `{}` POST to exactly fal's Klein 4B edit endpoint.
That model requires generation input; 422 is the handoff's documented validation
signal. Arbitrary hosts/models and BFL report not testable without a paid call.
Redirects, chat submissions, retries and echoed provider bodies are forbidden.
A key check does not establish balances, supported schema or image quality.

Default daily reservation cap is $2; new `.env.example` session allowance is $14,
with live generation off and explicit ceilings still required. Existing `.env`
is never overwritten by the launcher. Daily zero is a valid stop-all cap; an
explicit blank keeps the existing optional-cap semantics. These remain operator
limits, not customer billing or provider-side spending locks.

The API still has no production authentication and must remain bound to loopback.
The console is not intended for phones, LAN access, public deployment or stores.
Public provider docs were checked; private authenticated menu layouts were not
claimed as observed. See README for the checked links and current labels.
