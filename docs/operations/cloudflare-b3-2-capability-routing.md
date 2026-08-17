# VisuTry Cloudflare B3.2 Capability Routing

**Status:** PARTIAL — same-host staging routing and anonymous capability gates pass. The mandatory same-browser authenticated replay (login, authenticated CF read, authenticated Vercel fallback, logout, and post-logout denial) is still outstanding because the current browser has no retained B1.2 session. No production DNS, domain, or deployment was changed.

## Staging entry point

`https://visutry-cf-staging.sunye.workers.dev`

The staging-only `cloudflare-router/app-host-worker.ts` is the public entry point. It invokes the generated OpenNext Worker in-process for Cloudflare-ready paths and forwards Vercel-required or unknown paths to the configured staging Vercel preview origin. Both backends therefore share one browser origin and cookie boundary. `wrangler.jsonc` has no production route or DNS binding.

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

Deployment: `cd98d7c3-512a-4f06-a864-7dc2d03d11d0`

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

The router unit suite additionally proves query/body/cookie/Authorization/header preservation, static method boundaries, and a failed Cloudflare request returning 502 without a Vercel retry. Client-forged `x-user-id`, `x-merchant-id`, and `x-role` headers are not used as identity; the selected backend remains responsible for auth, authorization, tenant, CSRF, and webhook checks.

## Authentication gate

The anonymous gates pass, and the Auth0 sign-in transaction is classified on Cloudflare. The required same-browser replay is not yet proven. It must use one existing B1.2 test account in the staging browser and cover, without a second login:

1. login;
2. authenticated Cloudflare read and merchant read;
3. authenticated Vercel fallback request;
4. logout;
5. post-logout denial on both relevant paths.

Until that replay is captured, this milestone remains PARTIAL.

## Writes, safety, and rollback

Only the proven merchant provisioning write and narrow B2 MCP boundary can enter Cloudflare. Payment, upload, AI, Store-session, admin, cron, OAuth/DCR, and other writes remain Vercel-required. There is one selected backend per request, no dual-write, and no CF-to-Vercel retry. Application-owned idempotency, transactions, audit, rate limits, CSRF, authz, tenant isolation, and webhook signatures remain authoritative; the router does not invent or replay idempotency keys.

Logs contain only path, backend, route class, status, latency, and sanitized error name. They do not log cookies, Authorization values, tokens, request bodies, or personal data. A route can be rolled back by removing its exact classifier entry or redeploying the prior staging Worker; no DNS change is required. Automatic failover is intentionally not part of rollback because replaying writes is unsafe.

## Performance and bundle

Representative same-host staging samples from deployment `cd98d7c3-512a-4f06-a864-7dc2d03d11d0`:

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
| Current routed Worker | 2,780.42 KiB gzip |
| Delta vs baseline | -34.50 KiB |
| Free-plan limit | 3,072 KiB |
| Current headroom | 291.58 KiB |
| Preferred stop threshold | 2,900 KiB |
| Router budget | under 25 KiB incremental budget |

## Validation and production boundary

Recorded validation: `npm ci`, typecheck, lint (existing warnings only), critical tests (7 suites / 30 tests), router tests (5 / 5), `build:ci`, `build:cloudflare`, and Wrangler staging dry-run. The final staging matrix is recorded above. No production cutover, production DNS change, production route, or production deployment is authorized by B3.2.

## Git

Branch: `codex/cloudflare-phase-a-build-parity`. Commit: `3b2d25c` (`feat: complete B3.2 Cloudflare capability routing`). Push is the next handoff step; no merge to `main` is part of this milestone.
