# Cloudflare Phase B1 — Auth and Protected-Read Parity

**Date:** 2026-08-16
**Result:** **PARTIAL**
**Branch:** `codex/cloudflare-phase-a-build-parity`

## Outcome

B1 adds a Prisma-free Cloudflare boundary for Auth and protected reads while keeping Neon/PostgreSQL and the existing Prisma path for Vercel. The isolated staging Worker is deployed and remains Workers Free-compatible. Anonymous authorization behavior is preserved.

The remaining acceptance blocker is external Auth0 configuration: a real OAuth callback cannot be verified until an authorized administrator adds the staging callback URL. No Auth0 production resource or callback list was changed by this work.

## Bundle

| Metric | Value |
| --- | ---: |
| Baseline gzip | `2,814.46 KiB` |
| Final deployed gzip | `2,751.15 KiB` |
| Delta | `-63.31 KiB` / `-2.25%` |
| Free compatible | **YES** — below `3,072 KiB` |
| Headroom | `320.85 KiB` |
| Preferred / ideal | `2,900 KiB` / `2,800 KiB` — both met |

The shared OpenNext default server function remains the largest contributor. The B1 additions are small direct-Neon Auth/read modules; the existing MCP route remains in the shared function and was not expanded. Worker/server-function string checks found no Prisma query compiler/WASM/runtime markers. Prisma names that remain are lightweight shared stub/error symbols, not the Prisma runtime client.

## Auth architecture and dependency boundary

- `next-auth@4.24.11`, Auth0 provider, with Twitter represented as an Auth0 connection.
- JWT sessions with a 30-day max age.
- `src/middleware.ts` uses `getToken()` for `/admin`; it performs no database lookup.
- Normal Vercel Auth remains in `src/lib/auth.ts` with `PrismaAdapter(prisma)`.
- Cloudflare aliases Auth to `src/lib/auth-cloudflare.ts`, which uses a read-only direct-Neon adapter and JWT callbacks.
- Cloudflare `requireAuth`/`requireAdmin` are in `src/lib/api-auth-cloudflare.ts`; fresh user/quota reads use direct Neon.
- Auth writes for new/unlinked users remain explicitly unsupported in B1: `User.create`, Account linking, and profile updates are deferred.

The full caller/model/query matrix is in [`cloudflare-phase-b1-auth-prisma-dependency-matrix.md`](./cloudflare-phase-b1-auth-prisma-dependency-matrix.md).

## Direct Neon repositories

New or Cloudflare-specific repositories:

- `src/data/auth-cloudflare.ts`: existing Auth0 account/user reads and read-only adapter boundary.
- `src/data/protected-reads-cloudflare.ts`: user-scoped try-on, face-analysis, and payment history reads.
- `src/data/user-balance-cloudflare.ts`: user quota/subscription read boundary.
- `src/modules/merchant/application/merchant-access-cloudflare.ts`: membership lookup by both `userId` and `merchantId`, with role checks.
- `src/modules/merchant/application/merchant-memberships-cloudflare.ts`: tenant-scoped workspace/member reads.
- `src/modules/merchant/application/get-merchant-profile-cloudflare.ts`: tenant-scoped merchant profile read.
- `src/modules/merchant/application/merchant-control-center-cloudflare.ts`: merchant workspace aggregates.
- `src/modules/merchant/application/merchant-agent-credentials-cloudflare.ts`: owner/admin credential reads; usage updates and mutations deferred.

All queries use tagged Neon SQL with bound parameters. No generic ORM abstraction, D1 binding, migration, or destructive database operation was added.

## Protected reads and isolation

Consumer routes now delegate through Cloudflare direct-Neon read modules while preserving the existing Vercel Prisma implementations:

- `GET /api/try-on/history`
- `GET /api/face-analysis/history`
- `GET /api/payment/history`
- `GET /api/user/balance`

The unit suite verifies user ownership/status filters and full user mapping. A read-only live Neon check verified the SQL shape against existing data without printing identifiers or personal data. Staging anonymous requests to all four routes return `401`.

Merchant reads preserve the two-key membership boundary and role checks. `/en/merchant` is protected and redirects anonymously; `/api/merchant/[merchantId]/profile` and `/api/agent/v1/merchant` deny anonymous requests. Merchant A/B authenticated end-to-end testing remains pending the Auth0 callback configuration; the direct membership test proves the query requires both user and merchant identifiers.

`/api/merchant/workspaces` is currently a POST-only provisioning/mutation route, so it is intentionally deferred rather than misreported as a workspace read endpoint. The authenticated workspace read is the `/en/merchant` page and its direct-Neon control-center path.

## Admin boundary

The existing boundary is retained: middleware and API checks require the JWT `role === 'ADMIN'`. Anonymous `/admin/dashboard` staging requests return `307` to `/api/auth/signin`. Non-admin and admin authenticated cases are not claimed until a real staging session exists; no Cloudflare-specific backdoor was introduced.

## Staging configuration and smoke matrix

Worker: `visutry-cf-staging`
URL: `https://visutry-cf-staging.sunye.workers.dev`
Version: `2d9a046c-b178-44c6-b197-44cb973982b0`
Production domain touched: **NO**

| Route | Result | Expected behavior |
| --- | --- | --- |
| `/en` | PASS — 200 | Public page |
| `/en/store` | PASS — 200 | Public page |
| `/en/blog` | PASS — 200 | Public page |
| `/en/face-shape-detector` | PASS — 200 | Public page |
| `/en/auth/signin` | PASS — 200 | Custom Auth0 sign-in UI |
| `/api/health` | PASS — 200 | Public health endpoint |
| `/api/glasses/brands` | PASS — 200 | Public Neon-backed read |
| `/api/auth/session` | PASS — 200 | Anonymous session response |
| `/api/auth/signin` | PASS — 302 | Redirects to `/auth/signin` |
| `/api/auth/signin/auth0` | PASS — 302 | Existing custom sign-in page; buttons call `signIn('auth0')` |
| `/admin/dashboard` | PASS — 307 | Redirects to `/api/auth/signin` |
| `/en/merchant` | PASS — 307 | Redirects to `/en/auth/signin` |
| `/api/merchant/nonexistent/profile` | PASS — 401 | Anonymous merchant denial |
| `/api/agent/v1/merchant` | PASS — 401 | Anonymous merchant denial |
| `/api/try-on/history` | PASS — 401 | Anonymous user-read denial |
| `/api/face-analysis/history` | PASS — 401 | Anonymous user-read denial |
| `/api/payment/history` | PASS — 401 | Anonymous user-read denial |
| `/api/user/balance` | PASS — 401 | Anonymous user-read denial |

Authenticated login, callback, session cookie refresh, logout, authenticated consumer reads, authenticated merchant reads, and authenticated admin role cases: **NOT VERIFIED** pending the manual Auth0 configuration below.

## Required manual staging action

Add this callback to the Auth0 application used by the staging Worker:

`https://visutry-cf-staging.sunye.workers.dev/api/auth/callback/auth0`

If required by the Auth0 tenant policy, also add the workers.dev origin to Allowed Logout URLs and Allowed Web Origins. This action is safe to perform alongside existing production entries but must be made by an authorized Auth0 administrator. Do not remove production callback URLs.

## Unsupported / deferred

- Auth writes for new/unlinked users and account linking.
- Stripe checkout, portal, webhook, and payment writes.
- Store/Campaign/merchant mutations.
- Vercel Blob, uploads, asset writes, and cleanup.
- AI generation and long-running task writes/polling parity.
- MCP runtime execution and OAuth execution; only import-leak safety was checked.
- Cron/background jobs.
- Full authenticated staging ownership/tenant-isolation smoke, pending OAuth callback setup.

## Validation

- `npm ci`: PASS.
- `npm run build:cloudflare`: PASS.
- `npx wrangler deploy --dry-run --env staging`: PASS; `2,751.15 KiB` gzip.
- `npm run preview:cloudflare`: PASS; local `/api/health`, `/api/auth/session`, and `/en` returned 200.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with pre-existing warnings.
- `npm run test:critical:ci`: PASS, 7 suites / 30 tests.
- `npx jest --runInBand tests/unit/data/cloudflare-protected-reads.test.ts`: PASS, 5 tests.
- `npm run build:ci`: PASS.
- Direct Neon read-only validation: PASS.
- Prisma WASM/query-compiler string checks: PASS — absent from Cloudflare outputs.

## B2 readiness

**NOT READY for full authenticated parity.** B2 can begin after the Auth0 administrator adds the staging callback and the team verifies one real existing linked user end to end: OAuth login, callback, JWT/session resolution, refresh/navigation, logout, one consumer protected read, one merchant tenant read, and admin/non-admin role boundaries. New-user Auth writes, mutation parity, Stripe, Blob, AI, cron, and MCP remain separate later scopes.

## Phase B1.1 — Authenticated staging verification (2026-08-16)

This section records the current staging verification and supersedes the earlier “pending callback” status above. It covers the existing linked Auth0 user only; it does not expand the write scope or touch production.

### Result

**PARTIAL.** Existing-user login, callback, session persistence, logout, protected consumer reads, merchant workspace reads, and the authenticated ADMIN dashboard pass. Non-admin denial, a second user for ownership isolation, and a second merchant tenant were not tested because no safe staging accounts were available.

### Auth0 and session

- Callback allow-list: verified with `https://visutry-cf-staging.sunye.workers.dev/api/auth/callback/auth0`; the completed flow returned to staging rather than localhost.
- Login: PASS for an existing linked Auth0 user through `auth.visutry.com`.
- Callback: PASS; no localhost callback after removing the compile-time `NEXTAUTH_URL` injection from `next.config.js`.
- Session: PASS; staging `/api/auth/session` returned `200` with an authenticated `ADMIN` role during an in-page runtime check.
- Refresh/navigation: PASS; `/en/merchant` survived reload and remained authenticated in a second same-browser tab.
- Logout: PASS; the account menu sign-out returned to `/en/auth/signin`.
- Protected route after logout: PASS; `/en/merchant` redirected to `/en/auth/signin` and did not render the merchant workspace.

Auth writes were **not invoked** by this existing linked-user flow: new-user creation, Account linking, and profile update remain deferred. No write failure was observed.

### Protected reads

Authenticated staging network capture returned `200` for:

- `/api/try-on/history`
- `/api/face-analysis/history`
- `/api/payment/history`
- `/api/user/balance`

User ownership isolation was not live-tested A/B because only one safe user account was available. The existing direct-Neon/unit evidence remains in `tests/unit/data/cloudflare-protected-reads.test.ts` and requires both user and merchant identifiers where applicable.

### Merchant and admin boundaries

- Merchant login/workspace: PASS for the authenticated merchant account.
- Store and campaign/experience reads: PASS in `/en/merchant`.
- Non-merchant denial: NOT TESTED; no safe non-merchant account was available.
- Cross-tenant isolation: NOT TESTED live; only one merchant tenant was available. The direct membership query still requires both `userId` and `merchantId`.
- Anonymous admin boundary: PASS; the prior staging smoke remains `307` to `/api/auth/signin`.
- Non-admin admin boundary: NOT TESTED; no safe non-admin account was available.
- Authenticated ADMIN dashboard: PASS after moving the dashboard aggregate read behind a direct-Neon Cloudflare repository; no Prisma call remains on that page in the Worker bundle.

### Bundle and staging deployment

| Check | Result |
| --- | --- |
| Baseline deployed gzip | `2,751.15 KiB` |
| Current deployed gzip | `2,760.12 KiB` |
| Delta | `+8.97 KiB` |
| Free-plan limit / headroom | `3,072 KiB` / `311.88 KiB` |
| Free compatible | **YES** |
| Prisma runtime/WASM/query compiler markers | **Absent** |
| Static `NEXTAUTH_URL` localhost injection | **Removed**; remaining localhost strings are deferred MCP/mock fallback literals |

Current staging deployment:

- Worker: `visutry-cf-staging`
- URL: `https://visutry-cf-staging.sunye.workers.dev`
- Version: `60e96200-2520-4dd6-898a-a0e8e8d3e87e`
- Production touched: **NO**

### Current validation

- `npm ci`: PASS.
- `npm run typecheck`: PASS after the preview build completed.
- `npm run build:cloudflare`: PASS; 1,576 static pages generated.
- `npx wrangler deploy --dry-run --env staging`: PASS; current gzip `2,760.12 KiB`.
- `npm run preview:cloudflare`: PASS for startup/build; local `/api/health` and `/en` returned `200`. Local anonymous `/api/auth/session` returned `500` because the preview process used the Cloudflare Prisma stub without staging Auth0/Neon runtime configuration; staging authenticated `/api/auth/session` returned `200`.
- Authenticated staging browser checks: PASS for the existing linked user, consumer reads, merchant reads, ADMIN dashboard, logout, and post-logout protection.
- Non-admin denial, cross-user ownership A/B, and cross-tenant A/B: NOT TESTED.

### B2 readiness

**NOT READY.** Before B2, obtain safe staging accounts for one non-admin/non-merchant user and a second merchant tenant, then verify the missing role and tenant boundaries. New-user creation, Account linking, and profile update writes must be implemented or explicitly accepted as unsupported before claiming full Auth parity. No broad write implementation was added in B1.1.

## Phase B1.2 — Test Identity & Isolation Verification (2026-08-16)

### Result

**PASS.** Two real Auth0 staging identities, non-admin authorization, initial non-merchant onboarding, two TEST merchant tenants, own-tenant workspace access, cross-tenant denial, cross-user ownership filtering, session switching, and logout passed.

### Test identities

- `TEST_USER_A`: masked project-owned alias `s***+cloudflare-b1-a@visutry.com`; application user exists, role `USER`, one merchant membership after provisioning.
- `TEST_USER_B`: masked project-owned alias `s***+cloudflare-b1-b@visutry.com`; application user exists, role `USER`, one merchant membership after provisioning.
- Auth0 signup: PASS for both through the normal staging Auth0 browser flow; no CAPTCHA, OTP, or inbox verification blocked the flow.
- Application user creation: PASS for both after the first-login Auth0 callback.
- Passwords, OAuth codes, cookies, and tokens are intentionally not recorded.

### Auth writes

The first new-user callback initially failed at the Cloudflare adapter boundary. The minimal direct-Neon implementation now covers only the Auth0/JWT first-login path:

- `createUser`: parameterized `User` insert/upsert preserving the email uniqueness boundary and timestamps.
- `updateUser`: parameterized profile-field update with `updatedAt` refresh.
- `linkAccount`: parameterized provider/account insert, idempotent on retry, and rejects account stealing across users.
- Database sessions, email verification tokens, and unrelated Auth writes remain deferred.
- Focused test: `npx jest --runInBand tests/unit/data/cloudflare-protected-reads.test.ts` — PASS, 7 tests.

### Non-admin and non-merchant boundaries

- Both users returned an authenticated staging session with role `USER`.
- Both users visiting `/admin/dashboard` were redirected to `/en?error=Forbidden`; no admin data rendered.
- Before provisioning, both users rendered the non-merchant onboarding state `Create your merchant workspace`.
- After logout, `/api/auth/session` returned `200` with no authenticated user for each session.
- Existing ADMIN login/dashboard behavior remains covered by the prior B1.1 authenticated regression; no admin role or production user was changed in this phase.

### Merchant tenants and tenant isolation

The supported `/api/merchant/workspaces` application flow was used from the browser with deterministic TEST names; no manual merchant rows were inserted. The route first exposed its deferred Prisma write dependency on Cloudflare, so it was switched to a single-purpose direct-Neon provisioning implementation using a Serializable transaction, bound SQL parameters, uniqueness-preserving slug retries, and idempotent first-membership behavior. No Store, Campaign, or published entity was created.

- `TEST_MERCHANT_A`: `Cloudflare B1 Test Merchant A`, slug `cloudflare-b1-test-merchant-a`, membership `OWNER` for TEST_USER_A.
- `TEST_MERCHANT_B`: `Cloudflare B1 Test Merchant B`, slug `cloudflare-b1-test-merchant-b`, membership `OWNER` for TEST_USER_B.
- User A → Merchant A workspace: PASS; page returned 200 and rendered the TEST workspace.
- User B → Merchant B workspace: PASS; page returned 200 and rendered the TEST workspace.
- User A → Merchant B workspace: PASS denial; page returned 404 and did not render Merchant B.
- User B → Merchant A workspace: PASS denial; page returned 404 and did not render Merchant A.
- The direct membership read continues to require both `userId` and `merchantId`.

### Ownership A/B

No safe, cheap, application-supported history fixture was available: the supported try-on and face-analysis creation paths require shopper image/upload and AI/task work. As the explicitly permitted fallback when supported provisioning was unavailable, two exact TEST-user rows were created with parameterized Neon SQL only:

- `cloudflare-b1-test-tryon-a`: synthetic `FAILED` `TryOnTask`, `CLOUDFLARE_B1_OWNERSHIP` metadata, owned by TEST_USER_A.
- `cloudflare-b1-test-tryon-b`: synthetic `FAILED` `TryOnTask`, `CLOUDFLARE_B1_OWNERSHIP` metadata, owned by TEST_USER_B.

The fixtures have placeholder `example.invalid` image URLs, no provider task ID, no Blob object, and no AI invocation.

- TEST_USER_A history API: `200`, total `1`, returns only task A; task B is filtered out.
- TEST_USER_B history API: `200`, total `1`, returns only task B; task A is filtered out.
- A→A: PASS; A→B: PASS, filtered out.
- B→B: PASS; B→A: PASS, filtered out.

### Bundle and staging

| Check | Result |
| --- | --- |
| Baseline deployed gzip | `2,760.12 KiB` |
| Final dry-run gzip | `2,757.26 KiB` |
| Delta | `-2.86 KiB` |
| Free-plan limit / headroom | `3,072 KiB` / `314.74 KiB` |
| Free compatible | **YES** |
| Prisma runtime/WASM/query-compiler markers | **Absent** |

- Worker: `visutry-cf-staging`
- URL: `https://visutry-cf-staging.sunye.workers.dev`
- Version: `7f7e0d3c-ba21-4a1a-9b32-7304e0eb6f13`
- Production DNS/domain touched: **NO**

### Test data retention

Keep the two TEST Auth0 users, two TEST merchant tenants, and two synthetic ownership tasks temporarily as the dedicated staging regression fixture set. They are clearly named/marked TEST and contain no Store, Campaign, customer, Stripe, Blob, or AI artifacts. Review and delete only these exact records later if the team no longer needs the B1 regression fixture.

### Validation

- `curl` staging `/api/health`, `/api/auth/providers`, `/api/auth/session`: PASS, 200 after deployment.
- Anonymous `/admin/dashboard`: PASS, 307 to Auth0 sign-in; anonymous `/en/merchant`: PASS, 307; anonymous known-test merchant profile: PASS, 401.
- Auth0 signup/callback/session for TEST_USER_A and TEST_USER_B: PASS.
- `npm run build:cloudflare`: PASS; 1,576 static pages generated.
- `npx wrangler deploy --dry-run --env staging`: PASS; 2,757.26 KiB gzip.
- Staging deploy: PASS; version `7f7e0d3c-ba21-4a1a-9b32-7304e0eb6f13`.
- `npm run typecheck`: PASS during the B1.2 implementation cycle.
- Full required CI command matrix is recorded after the final clean validation run below.

### B2 readiness

**READY for scoped B2 planning; NOT READY for full Cloudflare write parity.** B1.2 closes real Auth0 new-user provisioning, user ownership reads, and merchant tenant isolation. Broader mutation parity, Stripe, Blob, AI/task writes, cron, and MCP execution remain separate B2 work. No merge or production deployment was performed.

## Current-HEAD revalidation after B2 (2026-08-16)

The B1.2 identities and TEST fixtures were not recreated. The current branch already contains the scoped B2 write parity commits, so this check only revalidated the existing staging boundary and rebuilt the current Worker artifacts.

| Check | Current result |
| --- | --- |
| Anonymous `/api/auth/session` | `200` |
| Anonymous `/admin/dashboard` | `307` to sign-in |
| Anonymous `/en/merchant` | `307` to sign-in |
| Anonymous protected consumer reads | `401` for try-on, face-analysis, payment history, and balance |
| Anonymous merchant APIs | `401` |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS with existing warnings |
| `npm run test:critical:ci` | PASS — 7 suites / 30 tests |
| `npm run build:ci` | PASS |
| `npm run build:cloudflare` | PASS — 1,576 static pages |
| `npx wrangler deploy --dry-run --env staging` | PASS — `2,816.33 KiB` gzip |

The current dry-run is below the `3,072 KiB` Workers Free limit with `255.67 KiB` headroom. It is a post-B2 artifact measurement, not a replacement for the historical B1.2 `2,757.26 KiB` deployment snapshot. The current build still contains no Prisma query compiler/WASM runtime markers. No staging deploy, production DNS/domain, production database, Stripe, Blob, AI, or Auth0 configuration was changed during this revalidation.

## B1.2 fresh browser replay after current B2/B3 branch (2026-08-16)

The committed B1.2 fixture set above remains the authoritative two-user/two-tenant isolation evidence. A fresh replay was also attempted against the current staging Worker to verify that the first-login path still works after the later Cloudflare changes.

### Fresh artifact created during this replay

- Fresh Auth0 identity: `TEST_USER_A_REPLAY`, masked project-owned alias `s***+cloudflare-b1-a-20260816@visutry.com`; role observed as `USER`. Password and OAuth material are not recorded.
- Fresh merchant: `Cloudflare B1 Test Merchant A Replay`, created through the supported `/api/merchant/workspaces` browser flow; merchant ID `b8a61016-5811-41a2-b0a6-8252a1551563`.
- No Store, Campaign, customer, Stripe, Blob, AI, or ownership fixture was created for this replay.
- Retain this clearly marked TEST identity and merchant temporarily with the existing B1 regression fixture set; delete only these exact records later if the staging fixture set is retired.

### Fresh replay results

- Auth0 signup and first-login callback: **PASS**; the browser returned to staging `/en/merchant`.
- Authenticated role: **PASS**; the home page identified the replay account and `/admin/dashboard` redirected to `/en?error=Forbidden`.
- Initial non-merchant boundary: **PASS**; `/en/merchant` rendered `Create your merchant workspace` before provisioning.
- Merchant provisioning: **PASS**; the supported browser form returned the replay merchant workspace and selected the TEST merchant.
- Logout/session switching: **PARTIAL in this replay**. The sign-out action returned Cloudflare Error 1102 (`Worker exceeded resource limits`), and subsequent staging requests in the same browser also returned 1102. The previously committed B1.2 two-user replay still records logout and session switching as PASS; this fresh replay does not replace that evidence.
- Cross-user/cross-tenant A/B: **NOT rerun** with the fresh replay identity because the Worker became resource-limited before a second fresh login could be started. The committed B1.2 A/B evidence remains unchanged.

### Clean validation after the replay

| Command | Result |
| --- | --- |
| `npm ci` | PASS; existing npm audit reported 50 dependency findings, including 2 critical; no dependency changes committed |
| `npm run typecheck` | PASS after the build completed; a concurrent first attempt raced with `build:ci` while `.next/types` was being regenerated |
| `npm run lint` | PASS with existing warnings |
| `npm run test:critical:ci` | PASS — 7 suites / 30 tests |
| `npm run build:ci` | PASS — 1,576 static pages |
| `npm run build:cloudflare` | PASS — 1,576 static pages |
| `npx wrangler deploy --dry-run --env staging` | PASS — `2,808.59 KiB` gzip |

The current dry-run has `263.41 KiB` headroom under the `3,072 KiB` Workers Free hard limit. No Prisma query-engine, libquery, Prisma WASM, or wasm-bindgen runtime artifacts were present in the generated Worker bundle. No staging deployment, production DNS/domain, database mutation outside the explicitly created TEST identity/merchant, Stripe, Blob, AI, or Auth0 configuration change was made.
