# Cloudflare Phase B1 Auth Prisma Dependency Matrix

Status: inventory completed before B1 runtime refactoring.

## Current architecture

| Concern | Current implementation | Cloudflare implication |
| --- | --- | --- |
| Library | `next-auth@4.24.11` | Keep the existing NextAuth request/session protocol. |
| Provider | Auth0 through `next-auth/providers/auth0`; Twitter is an Auth0 connection, not a separate NextAuth provider | A staging callback must be allow-listed in Auth0 before real login can be verified. |
| Session strategy | JWT, 30-day max age | Session resolution reads the signed JWT; it does not require the Prisma `Session` table. |
| Auth entrypoint | `src/app/api/auth/[...nextauth]/route.ts` → `src/lib/auth.ts` | Cloudflare must alias this dependency graph to a Prisma-free Auth0/JWT configuration. |
| Middleware | `src/middleware.ts` uses `getToken()` for `/admin` and next-intl for locale redirects | Admin middleware does not query the database; authorization is based on the JWT `role` claim. |
| API guard | `src/lib/api-auth.ts` uses `getServerSession(authOptions)` | Cloudflare guard must use the same cookie/JWT semantics and a direct Neon user lookup only for helpers that request a user record. |
| Vercel | `src/lib/auth.ts` uses `PrismaAdapter(prisma)` | Preserve unchanged for the normal build. |

## Auth-related Prisma dependencies

| Exact file | Caller / execution point | Models and query | Read/write | Anonymous required | After login | Admin / merchant relevance |
| --- | --- | --- | --- | --- | --- | --- |
| `src/lib/auth.ts` | `authOptions.adapter` during Auth0 OAuth callback | PrismaAdapter methods: `Account`, `User`, and, for database-session/email flows, `Session` and `VerificationToken` | Read and write | No | Existing linked Auth0 users require `Account` → `User` read; first-time/unlinked users require `User` create and `Account` link writes | All authenticated flows depend on the resulting user id |
| `src/lib/auth.ts` | `callbacks.jwt`, first login, missing token data, manual update, or 15-minute periodic refresh | `User.findUnique({ id: token.sub })`; selects identity, role, quota, premium, and subscription fields | Read | No | Yes; session callback itself uses token only | Role is used by admin middleware/API guards; quota fields are used by consumer reads |
| `src/lib/api-auth.ts` | `requireAuthWithUser()` | `User.findUnique({ id: session.user.id, select })` | Read | No | Yes, only for routes needing fresh user/quota data | Consumer protected reads and future writes |
| `src/lib/api-auth.ts` | `requireAdmin()` | No Prisma query; checks `session.user.role` | None | No | Yes | Admin authorization boundary |
| `src/middleware.ts` | `/admin/:path*` request | `getToken({ req, secret })` only | None | No | Yes | Admin unauthenticated redirect and JWT role gate |
| `src/modules/merchant/application/merchant-access.ts` | Merchant API/page guards | `MerchantMembership.findUnique({ userId_merchantId })` with role and timestamps | Read | No | Yes | Merchant tenant and role isolation |
| `src/modules/merchant/application/merchant-memberships.ts` | Merchant workspace page and membership APIs | `MerchantMembership.findMany()` joined to `Merchant` by selected fields | Read for `listMerchantsForUser` / `getMerchantForUser`; writes for create/remove | No | Yes | Merchant workspace identity and tenant selection |
| `src/modules/merchant/application/get-merchant-profile.ts` | Merchant profile GET | Merchant repository `findById()` | Read | No | Yes | Merchant-owned profile read |
| `src/modules/merchant/application/merchant-agent-credentials.ts` | Merchant credentials GET | Membership guard plus `MerchantAgentCredential.findMany()` | Read | No | Yes | Merchant owner/admin protected read; mutations deferred |
| `src/modules/merchant/application/merchant-oauth.ts` | Merchant OAuth authorization GET | Membership guard plus `MerchantOAuthAuthorization.findMany()` | Read | No | Yes | Merchant owner/admin protected read; MCP/OAuth execution deferred |
| `src/modules/merchant/application/merchant-onboarding.ts` | Merchant catalog read | Membership/agent scope plus `MerchantFrame.findMany()` | Read | No | Yes | Merchant catalog read; catalog mutations deferred |
| `src/app/api/try-on/history/route.ts` | Authenticated consumer history GET | `TryOnTask.findMany/count({ userId, optional status })` | Read | No | Yes | User ownership is the hard filter |
| `src/app/api/face-analysis/history/route.ts` | Authenticated face-analysis history GET | `FaceAnalysisTask.findMany/count({ userId })` | Read | No | Yes | User ownership is the hard filter |
| `src/app/api/payment/history/route.ts` | Authenticated payment history GET | `Payment.findMany/count({ userId, status IN COMPLETED/REFUNDED })` | Read | No | Yes | User ownership and subscription/payment visibility |
| `src/app/api/user/balance/route.ts` | Authenticated balance GET | `User.findUnique({ id })` with quota/subscription fields | Read | No | Yes | User-owned subscription state |
| `src/modules/store/application/get-experience-admin.ts` | Admin experience read | Merchant, Experience, MerchantFrame, MerchantSession/Event/Intent grouped reads | Read | No | Yes | Admin-only read; can remain deferred if not needed for B1 smoke |
| `src/modules/store/application/get-merchant-insights.ts` | Merchant/admin analytics read | Merchant, Experience, MerchantFrame, MerchantSession/Event/Intent reads | Read | No | Yes | Tenant-scoped merchant analytics; not required for first B1 cut |

## Auth writes that remain required for a complete sign-in implementation

The existing Prisma adapter performs writes when Auth0 returns a user who is not already linked:

- `User.create` for a new user.
- `Account.create` / link-account for the Auth0 provider account.
- Potential profile updates through `User.update` on later provider callbacks.

The current B1 Cloudflare path must not silently implement these writes. It will support reads for existing linked users first and fail explicitly for an unlinked/new-user sign-in until a later write phase is approved.

## Cloudflare B1 design boundary

- `src/lib/auth.ts` remains the Vercel/Prisma configuration.
- A Cloudflare-only Auth configuration uses NextAuth JWT/Auth0 protocol plus a read-only direct-Neon adapter.
- The adapter uses parameterized tagged SQL and exposes only the standard Auth0 account/user reads required for an existing linked user.
- `requireAuthWithUser`, consumer history/balance reads, and merchant membership/profile/catalog reads use small direct-Neon repositories.
- No D1, schema migration, production Auth0 configuration mutation, Stripe change, or write-path migration is included.

## Staging baseline before B1

| Request | Observed result |
| --- | --- |
| `/api/auth/session` | `500` — staging Auth secrets/configuration are not present |
| `/api/auth/signin` | `500` — same configuration blocker |
| `/api/auth/signin/auth0` | `500` — same configuration blocker |
| `/admin/dashboard` | `307` to `/api/auth/signin?callbackUrl=...` |
| `/api/merchant/nonexistent/profile` | `500` before direct protected-read boundary |
| `/api/merchant/workspaces` | `500` before direct protected-read boundary; POST is a deferred mutation |

The staging secret list currently contains only `DATABASE_URL`. The required manual Auth0 action for real staging login is to add:

`https://visutry-cf-staging.sunye.workers.dev/api/auth/callback/auth0`

to the Auth0 application's Allowed Callback URLs, plus the workers.dev origin to Allowed Logout URLs / Allowed Web Origins if required by the tenant's Auth0 application policy. This must be performed by an authorized Auth0 administrator; it is not changed by this branch.
