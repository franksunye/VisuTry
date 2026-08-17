# VisuTry Cloudflare B3.2 Capability Routing

**Status:** PASS — same-host staging routing, anonymous capability gates, and the mandatory same-browser authenticated replay all pass. No production DNS, domain, or deployment was changed.

## Staging entry point

`https://visutry-cf-staging.sunye.workers.dev`

The staging-only `cloudflare-router/app-host-worker.ts` is the public entry point. It invokes the generated OpenNext Worker in-process for Cloudflare-ready paths and forwards Vercel-required or unknown paths to the configured staging Vercel preview origin. Both backends therefore share one browser origin and cookie boundary. `wrangler.jsonc` has no production route or DNS binding.

Current staging Vercel origin: `https://visutry-3v81kow8o-sunye.vercel.app` (Preview deployment only). The staging Worker and Vercel Preview `NEXTAUTH_SECRET` values were synchronized as a staging configuration prerequisite; no secret value is recorded here.

The request bridge preserves method, path, query string, body, cookies, Authorization, application headers, response status, response headers, and streaming response bodies. It rewrites only the upstream `Host` transport header, uses manual redirects, and performs no automatic retry. The exact classifier is in `cloudflare-router/worker.ts`.

## Capability boundary

Cloudflare is allowlisted by path and method:

- `GET`/`HEAD` `/`, locale roots, locale `/store`, `/blog`, `/face-shape-detector`, `/auth/signin`, `/auth/error`, and `/en/merchant`.
- `GET`/`HEAD` `/_next/static/*` and `/favicon.ico`.
- `GET`/`HEAD` `/api/health`, `/api/glasses/brands`, try-on history, face-analysis history, payment history, user balance, and `/api/merchant/:merchantId/profile`.
- NextAuth/Auth0 CSRF, providers, session, sign-in, callback, refresh-token, and sign-out paths, with the Auth0 transaction POST kept on the same host.
- `POST /api/merchant/workspaces`.
- `POST /api/mcp` for the narrow B2 bearer capability boundary only.

Explicit Vercel-required prefixes include Stripe/payment except the exact proven payment-history read, Blob/upload, AI submission, try-on, Store sessions, cron, admin, MCP OAuth/DCR, and full merchant agent/source-intake paths. Unknown paths and unknown methods default to Vercel. Unknown writes therefore do not silently enter Cloudflare.

## Live staging evidence

Deployment: `45d4da7d-f34c-401b-a934-ecbc1ea998da`

| Request | Status | Backend / class | Evidence |
| --- | ---: | --- | --- |
| `GET /api/auth/csrf` | 200 | Cloudflare / `cf-ready` | NextAuth CSRF endpoint works on CF |
| `GET /api/auth/providers` | 200 | Cloudflare / `cf-ready` | Auth provider discovery works on CF |
| `GET /api/auth/session` | 200 | Cloudflare / `cf-ready` | Empty anonymous session, no Prisma failure |
| `GET /api/glasses/brands` | 200 | Cloudflare / `cf-ready` | Public read works on CF |
| `GET /api/try-on/history` | 401 | Cloudflare / `cf-ready` | Auth gate is enforced |
| `GET /api/face-analysis/history` | 401 | Cloudflare / `cf-ready` | Auth gate is enforced |
| `GET /api/payment/history` | 401 | Cloudflare / `cf-ready` | Auth gate is enforced |
| `GET /api/user/balance` | 401 | Cloudflare / `cf-ready` | Auth gate is enforced |
| `GET /api/merchant/:id/profile` | 401 | Cloudflare / `cf-ready` | Auth gate is enforced |
| `POST /api/merchant/workspaces` | 401 | Cloudflare / `cf-ready` | Auth gate is enforced |
| `POST /api/mcp` without bearer | 401 | Cloudflare / `cf-ready` | Narrow MCP route rejects anonymous access |
| `GET /_next/static/does-not-exist.js` | 404 | Cloudflare / `cf-ready` | Static allowlist is active |
| `POST /api/payment/webhook` | 400 | Vercel / `vercel-required` | Synthetic unsigned webhook reached Vercel; no payment attempted |
| `POST /api/face-analysis/submit` | 401 | Vercel / `vercel-required` | No AI submission without a session |
| `GET /api/admin/users` | 404 | Vercel / `vercel-required` | Admin prefix remains on Vercel |
| `GET /api/mcp/oauth/authorize?client_id=probe` | 400 | Vercel / `vercel-required` | MCP OAuth remains on Vercel |
| `GET /api/cron/cleanup` | 404 | Vercel / `vercel-required` | Cron prefix remains on Vercel |
| `POST /api/upload` | 401 | Vercel / `vercel-required` | Upload prefix remains on Vercel |
| `POST /api/unknown-write` | 404 | Vercel / `unknown-fallback` | Unknown write defaults to Vercel |

Same-browser authenticated replay used a newly registered staging-only test account (email masked in this document) and one staging test workspace `b32-staging-routing-test-20260817` (`merchantId=3f1d3aff-4dfa-4ff7-a0f8-fc12788a125c`). The browser stayed on `https://visutry-cf-staging.sunye.workers.dev` throughout the replay:

| Request | Status | Backend / class | Evidence |
| --- | ---: | --- | --- |
| `GET /api/auth/session` while signed in | 200 | Cloudflare / `cf-ready` | Session returned the test account identity |
| `GET /api/glasses/brands` while signed in | 200 | Cloudflare / `cf-ready` | Public CF read remained available |
| `GET /api/try-on/history` while signed in | 200 | Cloudflare / `cf-ready` | Authenticated CF protected read passed |
| `GET /api/merchant/:id/profile` while signed in | 200 | Cloudflare / `cf-ready` | Authenticated merchant read passed |
| `POST /api/face-analysis/submit` with empty `FormData` while signed in | 400 | Vercel / `vercel-required` | Auth/cookie forwarding passed; application rejected the intentionally empty body before any AI submission |
| `GET /api/auth/session` after UI logout | 200 | Cloudflare / `cf-ready` | Returned `{}` |
| `GET /api/try-on/history` after UI logout | 401 | Cloudflare / `cf-ready` | Protected CF read denied |
| `GET /api/merchant/:id/profile` after UI logout | 401 | Cloudflare / `cf-ready` | Tenant-protected merchant read denied |
| `POST /api/face-analysis/submit` with empty `FormData` after UI logout | 401 | Vercel / `vercel-required` | Protected Vercel-required path denied |

The router unit suite additionally proves query/body/cookie/Authorization/header preservation, static method boundaries, and a failed Cloudflare request returning 502 without a Vercel retry. Client-forged `x-user-id`, `x-merchant-id`, and `x-role` headers are not used as identity; the selected backend remains responsible for auth, authorization, tenant, CSRF, and webhook checks.

## Authentication gate

The anonymous gates pass, and the Auth0 sign-in transaction is classified on Cloudflare. The same-browser replay is proven with one staging-only account and without switching browser origin:

1. login;
2. authenticated Cloudflare read and merchant read;
3. authenticated Vercel fallback request;
4. logout;
5. post-logout denial on both relevant paths.

The replay covered login, authenticated Cloudflare read, authenticated merchant read, authenticated Vercel fallback, UI logout, and post-logout denial on both backends. No AI, payment, upload, or other billable write was performed.

## Writes, safety, and rollback

Only the proven merchant provisioning write and narrow B2 MCP boundary can enter Cloudflare. Payment, upload, AI, Store-session, admin, cron, OAuth/DCR, and other writes remain Vercel-required. There is one selected backend per request, no dual-write, and no CF-to-Vercel retry. Application-owned idempotency, transactions, audit, rate limits, CSRF, authz, tenant isolation, and webhook signatures remain authoritative; the router does not invent or replay idempotency keys.

Logs contain only path, backend, route class, status, latency, and sanitized error name. They do not log cookies, Authorization values, tokens, request bodies, or personal data. A route can be rolled back by removing its exact classifier entry or redeploying the prior staging Worker; no DNS change is required. Automatic failover is intentionally not part of rollback because replaying writes is unsafe.

## Performance and bundle

Representative same-host staging samples from the preceding staging replay deployment `c292c245-e279-45a6-891f-50181078af50` (the final deployment only rebuilt the CF-safe Prisma alias and retained the same route boundary):

| Request | Status | Bytes | Client time |
| --- | ---: | ---: | ---: |
| `GET /en` | 200 | 116,823 | 2.291 s |
| `GET /api/auth/session` | 200 | 2 | 1.746 s |
| `GET /api/glasses/brands` | 200 | 622 | 2.072 s |
| `GET /api/try-on/history` | 401 | 40 | 1.137 s |
| `POST /api/payment/webhook` | 400 | 43 | 1.362 s |
| `GET /api/unknown-capability` | 404 | 5,943 | 4.777 s |

| Measurement | Value |
| --- | ---: |
| B3.1 baseline | 2,814.92 KiB gzip |
| Current routed Worker | 2,781.46 KiB gzip |
| Delta vs baseline | -33.46 KiB |
| Free-plan limit | 3,072 KiB |
| Current headroom | 290.54 KiB |
| Preferred stop threshold | 2,900 KiB |
| Router budget | under 25 KiB incremental budget |

## Validation and production boundary

Recorded validation: `npm ci`, typecheck, lint (existing warnings only), critical tests (7 suites / 30 tests), router tests (5 / 5), `build:ci`, `build:cloudflare:next`, OpenNext Cloudflare bundle build, and Wrangler staging dry-run. The final staging matrix is recorded above. No production cutover, production DNS change, production route, or production deployment is authorized by B3.2.

## Git

Branch: `codex/cloudflare-phase-a-build-parity`. Commit: `4a49670` (`fix: finalize B3.2 staging routing validation`). No merge to `main` is part of this milestone.
