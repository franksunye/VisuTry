# VisuTry Cloudflare B3.2 Capability Routing

**Status:** PARTIAL — staging routing is deployed and the unauthenticated/fallback gates pass; the mandatory authenticated browser replay is blocked by the current Auth0 sign-in error. No production DNS, domain, or deployment was changed.

## ROUTER

The canonical staging entry point is:

`https://visutry-cf-staging.sunye.workers.dev`

`wrangler.jsonc` now uses `cloudflare-router/app-host-worker.ts` as a thin same-host routing wrapper around the generated OpenNext Worker. Same-host routing is deliberate: it preserves the existing staging Auth0 callback URL and lets the browser keep one cookie origin across Cloudflare and Vercel fallback requests. The wrapper calls the existing Worker in-process for Cloudflare-ready capabilities and uses `fetch()` for Vercel fallback.

The route classifier lives in `cloudflare-router/worker.ts`. A separately deployed `visutry-cf-staging-router` Service Binding harness was also smoke-tested during development, but it is not the browser entry point because a second workers.dev host would require a new Auth0 callback/cookie boundary.

The forwarding request preserves method, path, query string, body, cookies, Authorization, application headers, response status, response headers, and streaming response bodies. Only the upstream `Host` transport header is rewritten. No automatic retry is performed after a failed upstream request.

## CLOUDFLARE ROUTES

The allowlist is method-aware and intentionally narrow:

- `GET`/`HEAD` `/`, each supported locale root, `/store`, `/blog`, `/face-shape-detector`, `/auth/signin`, `/auth/error`, and `/en/merchant`.
- `GET`/`HEAD` `/api/health`, `/api/glasses/brands`, the four proven protected user reads, and `/api/merchant/:merchantId/profile`.
- Auth0/JWT session and first-login paths: the tested NextAuth providers/CSRF/session/sign-in entry, CSRF-protected Auth0 sign-in POST, callback, sign-out, and refresh operations.
- `POST /api/merchant/workspaces`.
- `POST /api/mcp` for the narrow B2 bearer/DRAFT capability boundary.

These entries follow the B3.1 route boundary and do not imply that every linked page or API under the same product area is Cloudflare-ready.

## VERCEL ROUTES

Explicit Vercel-required prefixes include Stripe/payment, Blob/upload, AI and try-on, Store sessions, cron, admin, MCP OAuth/DCR, and full merchant agent/source-intake paths. Examples include `/api/payment/*`, `/api/upload`, `/api/face-analysis/submit`, `/api/try-on/*`, `/api/store/sessions*`, `/api/cron/*`, `/api/admin/*`, `/api/mcp/oauth/*`, and `/api/agent/v1/merchant`.

The final staging smoke returned the expected Vercel signatures:

| Request | Status | Backend/class | Result |
| --- | ---: | --- | --- |
| `POST /api/payment/webhook` with an unsigned synthetic body | 400 | Vercel / `vercel-required` | Body reached the Stripe webhook handler; no payment was attempted |
| `POST /api/face-analysis/submit` without a session | 401 | Vercel / `vercel-required` | No AI submission |
| `GET /api/unknown-capability?b3=final` | 404 | Vercel / `unknown-fallback` | Unknown path did not execute Cloudflare |

## UNKNOWN DEFAULT

Unknown paths and unknown methods default to Vercel. Unknown writes therefore do not silently become Cloudflare writes. The router never retries Cloudflare requests against Vercel, which prevents duplicate writes and split-brain ownership.

## AUTH

Anonymous staging checks passed after the clean Cloudflare build:

| Request | Status |
| --- | ---: |
| `GET /api/auth/session` | 200, empty session |
| `GET /api/try-on/history` | 401 |
| `GET /api/user/balance` | 401 |
| `GET /api/merchant/:merchantId/profile` | 401 for an unauthenticated request |

The mandatory authenticated replay is **not complete** because the browser currently has no retained B1.2 authenticated session. The earlier GET-only probe of `/api/auth/signin/auth0` was not the OAuth transaction: NextAuth uses the CSRF-protected POST. After the POST allowlist fix, a real staging browser click reached Auth0, and a direct POST probe returned `200` with an authorization URL on `auth.visutry.com`; the router classified it `cloudflare` / `cf-ready`. No Auth0 settings were changed by B3.2. The authenticated callback, cross-backend request, logout, and post-logout denial still require one same-browser replay with an existing B1.2 account.

To close this gate, continue the current Auth0 page with an existing B1.2 account, then replay: login, Cloudflare authenticated read, Cloudflare merchant read, Vercel fallback authenticated request, logout, and post-logout denial in one browser session. No second login should be accepted as a pass.

## SECURITY

- The router does not trust client-provided `x-user-id`, `x-merchant-id`, `x-role`, or internal identity headers.
- Auth, membership, tenant, CSRF, and webhook-signature checks remain in the selected application backend.
- Router logs contain only path, backend, route class, status, and latency. Cookies, Authorization values, tokens, request bodies, and personal data are excluded.
- The router changes no production DNS, no `visutry.com` route, and no production environment.

## WRITES

Only the B3.1-proven merchant provisioning route and narrow B2 `POST /api/mcp` path may enter Cloudflare. Stripe, Blob, AI, Store-session, admin, cron, OAuth/DCR, and all other writes remain Vercel-required. There is one selected backend per request, no dual-write, no automatic retry, and no CF-to-Vercel retry after a failed Cloudflare write.

The B2 idempotency and transaction guarantees remain application-owned. The router itself does not invent an idempotency key or replay a body.

## PERFORMANCE

Final staging samples through the same-host router:

| Request | Status | Response bytes | Client time |
| --- | ---: | ---: | ---: |
| `GET /en` | 200 | 116,823 | 5.64 ms |
| `GET /api/health` | 200 | 119 | 1.65 ms |
| `GET /api/glasses/brands` | 200 | 622 | 1.81 ms |
| `POST /api/mcp` without bearer | 401 | 36 | 1.21 ms |
| `GET /api/unknown-capability?b3=final` | 404 | 5,943 | 1.52 ms |

The `x-visutry-router-backend`, `x-visutry-router-class`, and `x-visutry-router-latency-ms` response headers are staging diagnostics. They do not contain identity material.

## BUNDLE

| Measurement | Value |
| --- | ---: |
| B3.1 baseline | 2,814.92 KiB gzip |
| Final same-host routed Worker | 2,735.54 KiB gzip |
| Delta vs baseline | -79.38 KiB |
| Free-plan limit | 3,072 KiB |
| Final headroom | 336.46 KiB |
| Standalone router harness | 1.80 KiB gzip |
| Stop threshold | 2,900 KiB preferred / 25 KiB router budget |

The standalone router is far below the 25 KiB budget. The final application Worker is below both the Free-plan limit and the B3.1 preferred stop threshold.

## ROLLBACK

Rollback is staging-only and independent for the two layers:

1. Re-deploy the prior `visutry-cf-staging` Worker version or restore `main: ".open-next/worker.js"` in `wrangler.jsonc` to remove the same-host wrapper.
2. Keep the Vercel preview origin available; no DNS change is needed.
3. If a capability fails, remove only its exact classifier entry and send that capability to Vercel.
4. For writes, stop the Cloudflare owner, drain in-flight requests, verify Neon/audit state, and never dual-write during rollback.

No automatic failover is part of rollback because automatic replay is unsafe for writes.

## PRODUCTION

No production cutover occurred. `visutry.com` DNS was inspected only. The Vercel production deployment was not used as the fallback origin; staging fallback points to the READY preview deployment for the current commit.

## GIT

Required validation completed or recorded:

- `npm ci`: PASS; npm reported existing audit findings and deprecated transitive packages.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with existing warnings.
- `npm run test:critical:ci`: PASS, 7 suites / 30 tests.
- `npm run build:ci`: PASS after an equivalent `Buffer.isBuffer` type narrowing in the test mock.
- `npm run build:cloudflare`: PASS, 1,576 static pages.
- `wrangler deploy --dry-run --env staging`: PASS, final `2,735.54 KiB gzip`.
- Staging-only deployment: PASS, Worker `visutry-cf-staging`, version `76ef57c9-d606-41ed-9bd0-52b09f1b43c0`.

The milestone remains **PARTIAL** until the mandatory same-browser authenticated Cloudflare/Vercel/logout replay is completed. No merge or production deployment is authorized by this document.
