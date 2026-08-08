# Architecture

This doc explains the *why* behind the non-obvious decisions in this project —
written so you can defend them in an interview, not just recite what was
built. Each section: the decision, why it won, what it costs, and what the
alternative would have looked like.

## Why JWT over server-side sessions

**Decision:** stateless JWT access tokens (15 min) + longer-lived refresh
tokens (30 days), issued by `/auth/login` and `/auth/signup`, verified on
every request via a `Bearer` header.

**Why:** the backend (Render) and frontend (Vercel) are deployed on different
origins/platforms. Server-side sessions need a shared session store (Redis,
or sticky sessions + a DB-backed session table) that every backend instance
can read — that's real infrastructure for an app that, at this scale, doesn't
need it. JWTs are self-contained: any instance can verify a token with just
the shared secret, no shared state required. That also means the API is
horizontally scalable for free — add more Render instances and none of them
need to coordinate on session state.

**Trade-off:** you can't unilaterally revoke a single JWT before it expires
(no server-side "log this token out" without a blocklist). We mitigate this
by keeping access tokens short-lived (15 min) — a compromised access token
has a small blast radius. Revoking a refresh token would require a
denylist table, which this app doesn't have (acceptable for the current
scale; see "What I'd add for a bigger app" below).

**Alternative considered:** server-side sessions with an `httpOnly` cookie.
More secure against XSS (see next section) and trivially revocable, but
needs session storage infrastructure and same-site cookie handling across
the Vercel/Render origin split (`SameSite=None; Secure` + CORS
`credentials`). JWT was the simpler correct choice for this deployment
topology.

## Access + refresh token split — why two tokens, not one

A single long-lived token would mean either forcing re-login often (bad UX)
or accepting a large blast radius if it leaks (bad security). Splitting the
two lets each optimize for its own job:
- **Access token** (15 min): sent on every request, so it's the one most
  exposed to interception/XSS. Short lifetime caps the damage.
- **Refresh token** (30 days): sent rarely (only to `/auth/refresh`), so
  it's lower-exposure, and can afford to live longer so users aren't
  logged out constantly.

The frontend (`frontend/src/lib/api.ts`) implements the standard "silent
refresh" pattern: an Axios response interceptor catches `401`s, uses the
refresh token to get a new access token, retries the original request once,
and only forces logout if the refresh itself fails. Concurrent 401s share a
single in-flight refresh call (`refreshPromise`) so a page firing several
queries at once doesn't spam `/auth/refresh`.

## Where tokens live: localStorage, and the trade-off

**Decision:** both tokens are stored in `localStorage` (`frontend/src/lib/tokenStorage.ts`).

**Why:** the backend is a pure JSON API with no cookie/session support, and
this keeps the auth flow simple — no CSRF token dance, no cookie
domain/SameSite configuration across the Vercel/Render origin split.

**Trade-off — be ready to explain this one:** `localStorage` is readable by
any JavaScript running on the page, so it's vulnerable to token theft via
XSS. The hardened alternative is an `httpOnly` cookie for the refresh token
(invisible to JS, so an XSS payload can't read it) with the access token
kept only in memory (a JS variable, lost on refresh, re-fetched via the
cookie-backed refresh endpoint). That's the right call for an app handling
sensitive data at scale; it wasn't worth the added cookie/CORS/CSRF
complexity here, but you should be able to describe it if asked "how would
you make this more secure?"

## Why PostgreSQL over MongoDB

**Decision:** PostgreSQL via SQLAlchemy + Alembic.

**Why:** the data is inherently relational — every application *belongs to*
a user, and that ownership relationship is enforced on every single query
(`WHERE user_id = current_user.id`, plus the `ON DELETE CASCADE` FK). That's
exactly what a relational DB with foreign keys is for: the *database* — not
application code — guarantees an application can never exist without a
valid owner, and deleting a user cleanly deletes their applications with
zero extra code. A document store would either duplicate user info into
every application document or require application-level joins with no
referential guarantee.

Postgres's native `ENUM` type also gives free validation for `status`
(`Applied`/`Interview`/`Offer`/`Rejected`) at the DB layer — invalid values
are rejected before they're ever written, not just at the API layer.

**When Mongo would have won:** if the schema were genuinely
document-shaped — deeply nested, variable structure per record, no
meaningful joins (e.g. an activity/event log, or per-user arbitrary
key-value settings) — a document store avoids the impedance mismatch of
forcing that into rows and columns. That's not this app.

## Schema design highlights

Full rationale in [SCHEMA.md](SCHEMA.md); the two worth knowing cold:

- **App-generated UUID primary keys**, not auto-increment integers. IDs are
  available before `INSERT` (useful for the API layer), and they don't leak
  sequential counts (`/applications/1234` telling a competitor how many
  signups you have). Cost: slightly larger index size than a `BIGINT`.
- **`deadline` vs `follow_up_date` as separate columns**, not one generic
  "reminder date." They mean different things — `deadline` is set by the
  employer, `follow_up_date` is self-scheduled — and the reminders feature
  needs to query and display both independently.

## Why FastAPI

Async-native (matters if this grows to call external APIs — job board
scraping, email sending), Pydantic-based request/response validation gives
correctness *and* auto-generated OpenAPI docs (`/docs`) for free, and
dependency injection (`Depends(get_current_user)`, `Depends(get_db)`) keeps
auth/DB-session wiring out of every route body. Compared to Flask, you get
validation and docs without bolting on extra libraries; compared to
Django, there's no ORM/admin/templating machinery to opt out of for what's
purely an API.

## Password hashing: bcrypt via passlib

`passlib.CryptContext(schemes=["bcrypt"])` (`backend/app/core/security.py`).
Bcrypt is a deliberately slow, salted hash designed for passwords
specifically — unlike SHA-256/MD5 (fast, built for data integrity, trivially
brute-forced for passwords with commodity GPUs). Salting is automatic and
per-password, so two users with the same password get different hashes,
which defeats rainbow-table attacks. `bcrypt==4.0.1` is pinned deliberately:
newer `bcrypt` releases changed an internal attribute `passlib` 1.7.4
introspects, breaking hashing at import time — a real compatibility trap
worth knowing about if you ever bump this dependency.

## Testing strategy: SQLite in tests, Postgres in CI/prod

**Decision:** `pytest` runs against an in-memory SQLite DB
(`tests/conftest.py`); GitHub Actions CI additionally spins up a real
Postgres service container and runs `alembic upgrade head` against it before
running the same test suite.

**Why:** SQLite-in-memory makes the test suite fast and dependency-free —
no Docker/Postgres needed to run `pytest` locally. That only works because
the models use a custom cross-dialect `GUID` type
(`backend/app/models/types.py`) instead of Postgres's native `UUID` type
directly — a `TypeDecorator` that's a real `UUID` column on Postgres and a
`CHAR(32)` on SQLite. The generic SQLAlchemy `Enum` type does the same
automatically (native `ENUM` on Postgres, a `CHECK` constraint on SQLite).

**The gap this leaves, and how CI closes it:** SQLite doesn't validate
Postgres-specific DDL — an Alembic migration can be syntactically valid
Python and still be *wrong for Postgres* (this actually happened during
development: a migration tried to `CREATE TYPE` for the status enum twice —
once explicitly, once via SQLAlchemy's implicit `create_table` hook — which
SQLite's test setup, which doesn't use Alembic migrations at all, couldn't
have caught). Running `alembic upgrade head` against a real Postgres
container in CI is what actually caught it. **Lesson: a fast test double is
great for logic tests, but schema/migration correctness needs the real
database somewhere in the pipeline.**

## State management: TanStack Query + Context, not Redux

**Decision:** server data (applications, stats) goes through TanStack
Query; only auth state (`user`, `isAuthenticated`) lives in a
`React.Context`.

**Why:** almost everything this app displays *is* server state — it's
fetched, can go stale, and multiple components need the same data
(the applications list feeds the table, the board, *and* the dashboard
stats). TanStack Query gives caching, request de-duplication, background
refetch, and optimistic updates (used for the Kanban drag — the card moves
instantly, then rolls back only if the `PATCH` fails) without hand-rolling
any of that in a Redux store. Redux (or a global Context for server data)
would mean manually reproducing all of the above. Auth state isn't server
state in the same sense — it's small, changes rarely, and every part of the
app needs to read it synchronously (`ProtectedRoute`), so plain Context is
the right (and simplest) tool.

## Kanban: dnd-kit over react-beautiful-dnd

`react-beautiful-dnd` is in maintenance mode and doesn't officially support
React 18/19 concurrent features. `dnd-kit` is actively maintained,
tree-shakeable, and accessible (keyboard dragging support) — for a
column-based status board (not complex nested/virtualized lists), it's a
clean fit. The board (`components/kanban/KanbanBoard.tsx`) uses one
`useDroppable` per column and `useDraggable` per card; the status update on
drop is an optimistic mutation, matching the pattern used everywhere else
data changes in this app.

## Why Recharts, and how the chart colors were chosen

Recharts because it's declarative, composable React components (fits the
component model the rest of the app uses) rather than an imperative
canvas/D3 API to wire up by hand. Two charts, two different color rules,
deliberately:
- **Status breakdown** (bar chart): colors are the app's *status
  semantics*, not arbitrary series colors — Applied (neutral/info),
  Interview (in-progress), Offer (good), Rejected (critical) — reused
  consistently across the status badges, Kanban column accents, and this
  chart, so "green" means the same thing everywhere in the app.
- **Applications over time** (area chart): a single sequential hue (one
  metric, one series) — using a categorical palette here would imply
  multiple *kinds* of thing being compared, which isn't what a single count
  over time is.

## Deployment: Render (backend) + Vercel (frontend), not one platform

Splitting lets each service run on the platform best suited to it: Vercel's
CDN + build pipeline is purpose-built for static/SPA frontends (this repo's
`frontend/vercel.json` just adds an SPA rewrite so client-side routes survive
a refresh); Render runs a long-lived Python process with a managed Postgres
instance next to it. Running both on one platform (e.g. everything on
Render) was possible but would mean losing Vercel's frontend-specific
optimizations for no real benefit. The trade-off is cross-origin
requests (backend and frontend on different domains) — handled with an
explicit CORS allowlist (`CORS_ORIGINS` env var → `CORSMiddleware`), which
is a small, well-understood cost for the platform fit.

A real deployment quirk worth knowing: Render's default Python version
(3.14 as of this writing) has no prebuilt wheel for the pinned
`pydantic-core` version, which fails to build from source in Render's
read-only build sandbox (it tries to write to a Cargo registry cache and
can't). Fixed by pinning `PYTHON_VERSION` explicitly rather than relying on
the platform default — a reminder that "works in CI" and "works on the
deploy target" aren't the same claim until you've actually deployed.

## What I'd add for a bigger app

Being able to name the next increment (without necessarily having built it)
is exactly what an interviewer is listening for:
- A refresh-token denylist (or rotation with reuse detection) for real
  token revocation on logout/compromise.
- Rate limiting on `/auth/login` and `/auth/signup` (brute-force/credential-stuffing protection).
- Move refresh tokens to an `httpOnly` cookie once the frontend/backend
  share a domain (or a subdomain setup that makes `SameSite` cookies clean).
- Structured logging + error tracking (e.g. Sentry) — right now a 500 in
  production is only visible in Render's log stream.
- Database connection pooling tuned for serverless-style traffic if this
  moved to a platform that cold-starts per request.
