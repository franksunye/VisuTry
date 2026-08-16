# PHASE B3 RESULT

**Result: PASS for the compatibility audit; production migration: NO.**

B3 is an evidence-based architecture audit, not a migration. No production deployment, DNS change, schema migration, Stripe call, Blob migration, AI provider call, or new dependency was made. The only new B3 artifacts are this document and its operations-index entry.

The audit uses the current branch and actual application imports/routes rather than package metadata alone. The current Cloudflare build remains a mixed runtime: the Phase A/B1/B2 direct-Neon boundary is proven, while several remaining paths still resolve to Prisma, Node-specific networking, Vercel Blob, or long-running Vercel cron behavior.

Current decision: keep Vercel as the production runtime for the Prisma-heavy and long-running paths; continue using Cloudflare as a future edge/static and narrowly-scoped direct-Neon candidate. Keep Neon, Auth0, Stripe, AI, Resend, and the current Blob service external until the gates below are proven.

Evidence sources include:

- [`wrangler.jsonc`](../../wrangler.jsonc), [`open-next.config.ts`](../../open-next.config.ts), and [`next.config.js`](../../next.config.js)
- [`package.json`](../../package.json), actual `src/app/api` routes, and the integration modules listed below
- B1/B2 staging evidence in [`cloudflare-phase-b1-auth-read-parity.md`](./cloudflare-phase-b1-auth-read-parity.md) and [`cloudflare-phase-b2-write-parity.md`](./cloudflare-phase-b2-write-parity.md)
- Current targeted test run: 15 suites / 111 tests passed
- Current `npm run build:cloudflare`: passed
- Current `npx wrangler deploy --dry-run --env staging`: passed, `2807.47 KiB` gzip

# RUNTIME DEPENDENCY GRAPH

The table is intentionally explicit about the runtime boundary. “Route gzip” is a wrapper estimate from the OpenNext default server-function output; it is **not additive** because routes share dependencies in the default Worker function.

| Capability | Actual entry and call chain | Prisma / Node / filesystem | Web APIs and external services | Secrets, background, binary | Estimated bundle / Workers result |
|---|---|---|---|---|---|
| Stripe checkout and billing | `POST /api/payment/create-session` → `src/lib/stripe.ts`; `POST /api/payment/create-portal-session` → Stripe subscription lookup/portal | Prisma `Payment` and optional `FaceAnalysisTask`; default `stripe` import uses the Node-oriented package entry unless a Worker condition is explicitly proven; no filesystem | `fetch` is inside the Stripe client path; Stripe Checkout, Billing Portal, Subscriptions | `STRIPE_SECRET_KEY`, price IDs, auth URL; synchronous external request plus DB write | Create-session wrapper ≈ `2.87 KiB` gzip; portal wrapper is shared. Full path is E/C until Worker SDK and direct-Neon transaction parity are proven |
| Stripe webhooks and refunds | `POST /api/payment/webhook`; `src/lib/payment-refund.ts` is injected and used by refund administration | Webhook performs Prisma transactions and user/payment updates; refund library requires a transaction-capable DB client | Raw `Request.text()`, `headers()`, Stripe signature verification, Stripe API | `STRIPE_WEBHOOK_SECRET`; Stripe retries non-2xx; no separate queue currently | Webhook wrapper ≈ `2.68 KiB` gzip; current full flow is E, not a proven Free boundary |
| Uploads and Blob | `POST /api/upload`; `face-analysis-service`, `tryon-service`, Store asset store, Store try-on submitter | Prisma persists task/asset metadata; `Buffer`/`File` are used; no filesystem | `formData`, `File`, `fetch`; Vercel Blob `put/get/del`, signed URLs, public URLs | `BLOB_READ_WRITE_TOKEN`, Blob store/access settings; cleanup and compensation are background-sensitive | Upload wrapper ≈ `4.09 KiB` gzip; full current path is C, with future R2 adapter possible |
| AI generation | Consumer submit/poll routes; Store try-on submitter; `grsai.ts`, `grsai-face-analysis.ts`, `gemini.ts` | Prisma task state and quota/usage settlement; `Buffer`/`File`; no filesystem | `fetch`, `AbortSignal.timeout`, data-URI buffering; Gemini SDK, GrsAI HTTP, Blob result persistence | Gemini/GrsAI keys, provider base URLs; async task polling, retries, leases, result persistence | Submit wrapper ≈ `3.55 KiB` gzip; full orchestration is C/E and unsuitable for direct Free execution without a thin adapter |
| MCP bearer runtime | `POST /api/mcp` → `WebStandardStreamableHTTPServerTransport` → `McpServer` tool registry → direct-Neon B2 providers | B2 aliases replace selected Prisma dependencies; route declares `runtime='nodejs'`; no filesystem | Web Standard Request/Response, JSON transport, HTTP bearer auth, Neon HTTP | Merchant credential, rate-limit and audit secrets/config; stateless request lifecycle | MCP route raw `491,060` bytes / gzip `131,877` bytes; bearer/tool path is B2-proven but consumes most of the shared bundle |
| MCP OAuth/DCR and source intake | OAuth routes → `merchant-oauth.ts`; CIMD/source intake → `merchant-cimd-network.ts` and `merchant-source-network.ts` | Prisma OAuth/client/token/authorization tables; `node:crypto`, `node:dns/promises`, `node:https`, `node:net` | Manual Node HTTP/DNS SSRF protections, JSON parsing, external client metadata/catalog fetch | `NEXTAUTH_SECRET`/auth secret; authorization-code and refresh-token persistence; no long-lived session, but multi-request state | Not separately Worker-tested; full MCP is E. Node compatibility does not prove identical DNS/HTTP/Prisma behavior |
| Agent execution | `/api/agent/v1/merchant`; MCP tools; `merchant-catalog-source-intake.ts` | Merchant bearer/profile path uses direct Neon; source intake uses Prisma and Node DNS/HTTPS pinning | HTTP fetch/HTML/JSON-LD parsing; external merchant catalog endpoints | Merchant credentials, rate limits, audit; potentially bounded request but external redirects/fetches | Small route wrapper; full agent/catalog execution is E pending Worker-safe source-network adapter |
| Cron/background tasks | Five Vercel cron routes in `vercel.json`; legacy combined pending-task route remains | Prisma-heavy cleanup, quota settlement, task fencing, email tracking; no filesystem | Fetch to GrsAI and Resend; sequential loops and batches | `CRON_SECRET`; daily schedules; idempotency, leases, stale claims, retry/blocked cleanup | Cleanup wrapper ≈ `9.54 KiB` gzip; direct Free Cron is D because of 10 ms CPU and unbounded work |
| Email and notifications | `src/lib/resend.ts` from auth and retention routes | Current callers also use Prisma for selection/tracking; no filesystem | Plain HTTP `fetch` to Resend JSON API | `RESEND_API_KEY`; current cron loops are background work | No meaningful standalone route contribution measured; HTTP adapter is C, caller chain is D/E |
| Image processing / `next/image` | Many `next/image` pages; `next.config.js` optimizer settings; client `face-landmark-client.ts` | No `sharp` dependency; browser MediaPipe uses WASM/model assets, not server filesystem | CDN/static assets, `ImageBitmap`, `HTMLImageElement`, canvas, remote image hosts | External jsDelivr/GCS model and Blob/Shopify/BigCommerce/etc. URLs; no Worker binary | MediaPipe is lazy client code and not part of server route estimate; dynamic `/_next/image` parity is E until smoke-tested |
| External API and webhook surface | Auth0 callback, Stripe webhook, GrsAI/Gemini, Resend, Blob, catalog source fetches, analytics | Varies by caller; direct-Neon is proven only for selected B1/B2 paths | Mostly Web Fetch; some Node network hardening remains | Provider-specific keys, callback URLs, CRON secret, analytics IDs | Request cost and provider billing dominate; classify C/E until each complete caller chain is tested |
| Observability and scheduled execution | `src/lib/logger.ts`, console output, Axiom ingest, Workers logs; Vercel cron schedules | Axiom SDK is not explicitly Worker-smoke-tested; no filesystem | Console, async Axiom HTTP client behavior, browser GA/GTM | `AXIOM_TOKEN`, org/dataset, GA/GTM IDs; fire-and-forget log delivery can drop events | Axiom installed package ≈ `1.2 MB`; current behavior C/E; Cloudflare logs are an available alternative |

Current environment facts:

- `wrangler.jsonc` uses OpenNext’s `.open-next/worker.js`, Static Assets binding `ASSETS`, `compatibility_date: 2026-08-15`, and `nodejs_compat`.
- `open-next.config.ts` declares no R2 binding.
- Cloudflare-only webpack aliases replace selected Prisma/auth/merchant modules with direct-Neon providers and a build-time Prisma stub. Remaining unaliased modules can still reach Prisma or Node-only code.
- The current Cloudflare build has no Prisma query compiler, `libquery_engine`, or Prisma WASM engine. The lightweight compatibility stub may still contain Prisma names and throws for unsupported operations.

# INTEGRATION MATRIX

Classification uses the requested A–E scale. A capability is not marked A merely because one narrow route works.

| Capability | Current | Workers Free | Adapter | Migration Needed | Decision |
|---|---|---|---|---|---|
| Stripe checkout/subscription/history/refund | Prisma + Stripe SDK | Partial; external HTTP is possible, current DB transaction path is not proven | Explicit Worker Stripe entry/HTTP test plus direct-Neon transaction repository | Yes for full payment parity | **E/C** — keep current production path external/Vercel |
| Stripe webhook | Raw-body/signature code exists; Prisma fulfillment | Signature boundary is compatible, fulfillment can exceed Free/runtime assumptions | Test-mode fixture, raw-body signature test, direct-Neon idempotent fulfillment | Yes | **E** — no production webhook move |
| Vercel Blob/upload | Public/private Blob, signed URLs, metadata and compensation | External HTTP is possible; current package/path not Worker-proven | Keep Blob or later R2 storage/access adapter | No immediate migration | **C** — keep Vercel Blob |
| R2 direct browser upload | Not configured | Technically compatible with presigned PUT and CORS | URL issuer, metadata, cleanup, access-mode adapter | Future migration only | **B/C** — feasible, not justified now |
| Gemini/GrsAI generation | Sync Gemini plus async GrsAI polling | External fetch is possible; image buffering and task orchestration are not Free-safe as-is | Thin external provider adapter plus bounded job runtime | Yes for full parity | **C/E** — keep providers external |
| MCP bearer/tool path | B2 direct-Neon and stateless JSON transport | Proven on staging; bundle pressure remains | Keep narrow route or separate Worker | Optional split | **B** for bearer path; **E** for full MCP |
| MCP OAuth/DCR/source intake | Prisma + Node crypto/DNS/HTTPS/net | Not proven; partial Node APIs and Prisma stub are blockers | Direct-Neon OAuth repository and Fetch-based SSRF-safe networking, or separate service | Yes | **E** — keep Vercel/separate service |
| Agent execution/catalog intake | Merchant bearer reads work; source intake remains Node/Prisma | Narrow reads work; full intake untested | Source-network and persistence adapter | Yes | **E** |
| Cron/background/scheduled jobs | Five Vercel cron triggers, long bounded/unbounded work | Free 10 ms CPU and five account triggers make direct transfer unsuitable | Scheduler + Queue/Workflow/paid Worker, or retain Vercel | Yes for a future move | **D** now |
| Email/notification | Resend HTTP API | HTTP-compatible | None for thin call; caller needs bounded job state | No provider migration | **C** |
| `next/image` optimization | Many usages/configured remote patterns; no `sharp` | Static assets are compatible; dynamic optimizer not proven | Route smoke or future image service | Not yet | **E** |
| Client MediaPipe | Browser WASM/model via CDN and GCS fallback | Browser-side, not Worker-side | None; keep external model delivery | No | **A/C** |
| Observability | Console + Axiom SDK + client analytics | Console/Workers Logs compatible; Axiom SDK untested | HTTP Axiom adapter or Cloudflare Logs/Logpush | Optional | **C/E** |
| External API/webhook surface | Auth0, Stripe, AI, Blob, Resend, catalogs, analytics | Mostly Fetch-compatible, provider-specific limits remain | Per-service secrets, timeout, retry and callback adapters | Only where full caller parity is needed | **C/E** |

# STRIPE

## Actual path

- Checkout: [`src/app/api/payment/create-session/route.ts`](../../src/app/api/payment/create-session/route.ts) authenticates the user, validates the product, calls [`src/lib/stripe.ts`](../../src/lib/stripe.ts), and creates a pending Prisma `Payment`. Face-analysis unlock may read `FaceAnalysisTask`.
- Subscription portal: [`src/app/api/payment/create-portal-session/route.ts`](../../src/app/api/payment/create-portal-session/route.ts) reads the current Stripe subscription ID from Prisma before calling Stripe.
- History: [`src/app/api/payment/history/route.ts`](../../src/app/api/payment/history/route.ts) is a protected direct-Neon read in the Cloudflare alias, but this does not make payment writes portable.
- Webhook: [`src/app/api/payment/webhook/route.ts`](../../src/app/api/payment/webhook/route.ts) reads the raw body with `request.text()`, obtains `stripe-signature`, verifies it through `stripe.webhooks.constructEvent`, then performs idempotent Prisma transactions for checkout, subscription, invoice, failure, and expiration events.
- Refund: [`src/lib/payment-refund.ts`](../../src/lib/payment-refund.ts) uses an injected Stripe refund client, lists existing refunds, creates with `idempotencyKey: visutry-refund-${paymentId}`, and updates payment/credits in a DB transaction.

The signature boundary is conceptually correct: Stripe requires the raw request body for verification, and the current webhook preserves it. The official Stripe guidance explicitly warns that parsing/manipulating the body causes verification failure: [Stripe webhook signature verification](https://docs.stripe.com/webhooks?lang=node).

## Workers assessment

The Stripe API is an external HTTPS service and does not need to be moved. The risk is the current application path:

1. `import Stripe from "stripe"` is not an explicit Worker-specific import in the application code.
2. The webhook route is declared as a Node runtime by the current Next/OpenNext behavior and performs Prisma transactions before returning.
3. Cloudflare’s `nodejs_compat` supports a subset of Node APIs and can inject polyfills that import successfully but throw when called; it is not proof that the default Stripe entry plus the whole Prisma caller chain works. See [Cloudflare Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).
4. Stripe retries non-2xx webhook deliveries. The current handler intentionally returns failure for fulfillment errors, which is useful for retry but increases the need for durable idempotent state and fast acknowledgment.

The installed `stripe` package is approximately `5.7 MB` on disk and its JavaScript source is approximately `430 KB`; the route wrapper itself is only about `2.68 KiB` gzip. The package-size number is not an additive Worker contribution. It is a warning that explicit Worker entry resolution and route-level measurement are required.

## Decision

Keep Stripe external and keep the current payment/webhook/refund runtime on Vercel until a later test-only adapter proves:

- checkout and portal requests through the selected Worker-compatible Stripe path;
- raw-body signature verification with valid and invalid fixtures;
- direct-Neon payment/user/task transaction parity;
- duplicate and out-of-order webhook delivery behavior;
- subscription created/updated/deleted and invoice failure handling;
- refund idempotency and credit-revocation rollback.

No Stripe production or test-provider API call was made during B3. Existing unit tests use mocks and passed.

# BLOB / UPLOAD

## Actual path

- [`src/app/api/upload/route.ts`](../../src/app/api/upload/route.ts) accepts one JPEG/PNG/WebP file up to 5 MB, parses multipart `formData`, and writes a public Vercel Blob object under a user-prefixed pathname. It returns the public URL; this route does not persist a separate DB metadata row.
- [`src/lib/face-analysis-service.ts`](../../src/lib/face-analysis-service.ts) writes the user photo to Blob, stores URL and `blobAccess/blobPathname` metadata in `FaceAnalysisTask`, and reads private objects through Blob `get` or public URLs.
- [`src/lib/blob/private-signed-url.ts`](../../src/lib/blob/private-signed-url.ts) issues exact-path, GET-only private grants with a 120-second maximum TTL and redirects with `private, no-store` headers.
- [`src/lib/tryon-service.ts`](../../src/lib/tryon-service.ts) uploads user/item inputs in parallel and uploads generated results; if provider result persistence fails, metadata retains the provider URL for fallback/diagnostics.
- [`src/modules/store/infrastructure/assets/vercel-blob-asset-store.ts`](../../src/modules/store/infrastructure/assets/vercel-blob-asset-store.ts) supports private/public policy, persists `StoreAsset` metadata through Prisma, deletes on compensation, and records orphan cleanup when deletion fails.
- [`src/modules/store/infrastructure/generation/submit-store-tryon-task.ts`](../../src/modules/store/infrastructure/generation/submit-store-tryon-task.ts) uploads inputs, attaches asset metadata to task rows, and compensates with delete/orphan records when downstream dispatch fails.

The actual request pattern is therefore more than “upload one file”: input upload, private/public access, signed redirect, provider-result fetch, result upload, DB metadata, compensation delete, and retention cleanup.

## R2 feasibility

Direct browser → R2 is technically feasible. Cloudflare documents presigned `GET`, `HEAD`, `PUT`, and `DELETE` URLs with one-object scope and one-second-to-seven-day expiry; browser use also needs bucket CORS. `POST` multipart form uploads are not supported by R2 presigned URLs. See [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

A future R2 design would be:

1. Worker authorizes the user/merchant and mints a short-lived, exact-key presigned PUT.
2. Browser uploads directly to R2, avoiding Worker body buffering and reducing CPU/memory pressure.
3. Worker or a completion endpoint persists object metadata and ownership in Neon.
4. Private reads use short-lived GET URLs; public reads use a controlled public/custom delivery path.
5. Retention and compensation delete only exact TEST/owned keys.

That design is an adapter and data/access migration, not a drop-in package replacement. It must preserve current public/private semantics, StoreAsset metadata, Blob provider URL fallbacks, orphan cleanup, retention, CORS, content-type restrictions, and signed URL expiry. No R2 binding is configured today.

## Decision

Keep Vercel Blob for current production and B3 staging. Classify the current integration as **C**: an external HTTP/object service that may be usable from Workers, but whose full path is not Worker-proven. R2 is a future **B/C** candidate only if direct browser upload and egress/storage economics materially improve the measured workload.

# AI

## Actual path

- [`src/lib/gemini.ts`](../../src/lib/gemini.ts) imports `@google/generative-ai`, fetches input images, buffers them to base64 data URIs, invokes `gemini-2.5-flash-image`, and returns generated inline image data plus metadata. Consumer premium try-on then uploads the result to Blob.
- [`src/lib/grsai.ts`](../../src/lib/grsai.ts) uses direct `fetch` to `/v1/draw/nano-banana` with base64 image URLs, `nano-banana-fast`, `1K`, and `webHook: "-1"` for polling. Submit timeout is bounded to 25–45 seconds; `/v1/draw/result` normalizes processing/succeeded/failed states.
- [`src/lib/grsai-face-analysis.ts`](../../src/lib/grsai-face-analysis.ts) uses a GrsAI-compatible chat endpoint, data URI images, timeout budgets, and transient 5xx/429 retry behavior without resubmitting an ambiguous timed-out task.
- Try-on submit/poll and Store task submit/poll persist external task IDs, leases/idempotency metadata, retry counts, status, usage/quota settlement, and result URLs in Neon/Prisma. Cron routes poll pending tasks in batches.

## Workers assessment

Workers can be a thin orchestration layer for external AI because the provider calls use Fetch. The current implementation is not a thin layer:

- synchronous Gemini uses image fetches, base64 buffers, and generated image buffers;
- GrsAI polling requires durable task state, stale-claim reconciliation, retry/fencing, and result persistence;
- Blob upload and Neon updates are part of completion, not optional side effects;
- provider calls can take tens of seconds in wall-clock time and can produce large request/response buffers;
- Free HTTP CPU is 10 ms even when network waiting is excluded, and the Free request/subrequest/memory budgets remain shared limits.

Direct browser/provider communication is not a safe default because current provider secrets must remain server-side and the app needs task ownership, quota, retention, and result persistence. A provider-issued delegated upload or callback could be evaluated later, but it is not present in the current contracts.

## Decision

Keep Gemini and GrsAI external. Classify AI as **C** for a future thin external-orchestrator boundary and **E** for full Cloudflare parity. Do not move AI inference to Workers AI merely because it is a Cloudflare product; model/output quality, prompt behavior, cost, and image semantics are application requirements not covered by this audit.

# MCP

## Proven narrow path

The current [`src/app/api/mcp/route.ts`](../../src/app/api/mcp/route.ts) uses `WebStandardStreamableHTTPServerTransport` with `sessionIdGenerator: undefined` and `enableJsonResponse: true`. It authenticates a merchant bearer token, applies merchant rate limiting, creates a fresh `McpServer`, connects the transport, and handles one request. This is stateless JSON request/response behavior; it does not require a long-lived session or WebSocket.

B2 staging proved the bearer/tool path for Merchant Agent credentials, rate limiting, Store/Campaign DRAFT operations, idempotency, rollback, and cross-tenant resource rejection. Those are meaningful Worker-compatible slices.

## Full runtime blockers

- The main route declares `runtime='nodejs'` and imports `@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js` plus the full tool registry.
- [`merchant-oauth.ts`](../../src/modules/merchant/application/merchant-oauth.ts) persists DCR clients, authorization requests, codes, access tokens, refresh tokens, authorization families, and revocations through Prisma transactions.
- OAuth/CIMD and catalog source intake use [`merchant-cimd-network.ts`](../../src/modules/merchant/application/merchant-cimd-network.ts) and [`merchant-source-network.ts`](../../src/modules/merchant/application/merchant-source-network.ts), which import `node:dns/promises`, `node:https`, and `node:net` to pin DNS and control redirects/response sizes for SSRF protection.
- OAuth routes are not covered by the B2 direct-Neon aliases. A Prisma build stub is not a runtime implementation.
- The MCP route wrapper is the largest measured route: approximately `491,060` raw bytes / `131,877` gzip bytes. The installed MCP package directory is about `12 MB`, with roughly `3.09 MB` of JavaScript source; installed size is only an estimate, not an additive bundle number.

Cloudflare’s current Node compatibility documentation lists DNS as partially supported and explains that polyfills may allow imports while throwing when unsupported methods are called. HTTP/HTTPS/net and crypto support do not remove the need to test this exact SSRF-safe implementation. See [Cloudflare Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).

## Decision

Keep the narrow stateless bearer path as a possible dedicated Worker surface, but classify the **full MCP runtime E** until OAuth/DCR, source intake, direct-Neon state, auth, rate limiting, and failure semantics are proven together. The preferred future architecture is either:

- a separate Worker for the stateless bearer/tool path plus a separately hosted OAuth/source-intake service; or
- keep full MCP on Vercel until a direct-Neon/Web Fetch adapter is complete.

Do not add another MCP dependency or split the current bundle during B3.

# BACKGROUND

## Current inventory

The Vercel schedule source is [`vercel.json`](../../vercel.json):

| Route | Schedule | Work and state |
|---|---|---|
| `/api/cron/retention-notifications` | Daily 09:00 | Prisma user selection; sequential Resend 3-day/24-hour sends; tracking updates |
| `/api/cron/cleanup-expired-tasks` | Daily 02:00 | Blob-first Consumer/Store task retention, bounded limit 100, blocked/orphan semantics, deletion emails and tracking |
| `/api/cron/cleanup-store-assets` | Daily 02:30 | StoreAsset and orphan Blob cleanup, bounded limit 100, retry/blocked behavior |
| `/api/cron/sync-pending-consumer-tasks` | Daily 03:15 | GrsAI polling, leases/stale claims, quota settlement, retry/idempotency, concurrency batches |
| `/api/cron/sync-pending-store-tasks` | Daily 03:45 | GrsAI polling, leases/stale claims, usage settlement, store result persistence, concurrency batches |

Each route authenticates `Authorization: Bearer ${CRON_SECRET}`. Vercel declares up to 300 seconds for the long jobs. The legacy combined `/api/cron/sync-pending-tasks` route remains in the source but is not one of the five active schedules.

## Cloudflare options

- Cron Triggers can schedule invocations, but Free allows five Cron Triggers per account and 10 ms CPU per Cron invocation. The five active schedules already consume the account trigger count and the jobs are not bounded to a 10 ms CPU slice.
- Queues can decouple scheduling from work, but the work still needs bounded consumers, durable idempotency, provider retry policy, and a plan for quota/Blob/Neon atomicity. Free Queues usage is limited and must be measured against all account workloads.
- Workflows provide sleeps/retries/stateful steps, but they do not make Prisma, Blob, AI buffers, or unbounded email loops compatible automatically. Free step/storage/request limits must be modeled, and the app has no Workflow implementation today.
- A paid Worker/Queue consumer or a retained Vercel job is the more realistic execution boundary for the current tasks.

## Decision

Direct transfer of the current cron functions to Workers Free is **D**. Keep Vercel cron/background execution. Consider a Cloudflare scheduler only after each job is split into bounded, independently idempotent units with explicit step/request budgets and external-state rollback semantics.

# DATABASE

Neon is already proven in B1/B2 through [`src/data/neon-cloudflare.ts`](../../src/data/neon-cloudflare.ts) and the direct-Neon repositories. It remains the relational source of truth for User, Account, Payment, TryOnTask, FaceAnalysisTask, merchant memberships, Experience/frames, OAuth, StoreAsset, orphan cleanup, audit, and usage state.

The current Cloudflare aliases cover selected reads and B2 merchant/Store/Campaign writes. They do not cover all Stripe, AI, cron, OAuth, admin, Blob metadata, or remaining task writes. Replacing Neon with D1 would require schema/data migration, SQL dialect/transaction review, operational cutover, and a new source-of-truth decision. It does not materially improve the current proven path enough to justify that risk.

**Decision: keep Neon. Do not introduce D1 in B3.** D1 remains an architecture option only for a future product boundary where its Free row/read/write limits and SQLite semantics demonstrably improve cost or latency.

# EXTERNAL SERVICES

| Service | Role | Current host/runtime | Workers compatibility | Required adapter | Bundle / request cost | Migration necessity | Recommended state |
|---|---|---|---|---|---|---|---|
| Neon PostgreSQL | Relational source of truth | Neon serverless HTTP from Workers and Prisma from Vercel | Proven for selected direct-Neon B1/B2 paths | More direct-Neon repositories for remaining writes | Neon plan/compute/storage; serverless client is shared | None shown by B3 | Keep Neon |
| Auth0 | OAuth identity and callback | Auth0 hosted login; NextAuth callback route | Proven for existing/new staging identities in B1/B1.2; callback URL must be environment-specific | Keep NextAuth/JWT boundary; no provider replacement | Auth0 plan/identity volume; tiny app-side path | No | Keep external |
| Stripe | Checkout, subscriptions, webhooks, refunds | Stripe HTTPS API and webhook delivery | External HTTP compatible; current Stripe/Prisma transaction path not full Worker-proven | Worker-compatible SDK/HTTP selection plus direct-Neon fulfillment | Stripe business/payment fees and provider API calls | No | Keep external; Vercel current payment runtime |
| Gemini | Premium image generation | Google Gemini API | Fetch/SDK path possible; current buffering/output path unproven on Free | Thin provider adapter, timeout, result contract | Provider generation cost and image transfer | No | Keep external |
| GrsAI | Async try-on and face-analysis generation | GrsAI HTTPS API | Fetch/poll path possible; external task/retry/result state required | Bounded orchestration/job adapter | Provider generation, polling, and result transfer cost | No | Keep external |
| Vercel Blob | Input/result/store object storage | Vercel Blob SDK and Blob URLs | HTTP/object semantics may work; full current package/access path not tested on Workers | Keep Blob or future R2 metadata/access adapter | Blob storage/operations/transfer plan unknown | No immediate need | Keep Blob |
| Resend | Welcome/retention/deletion email | Direct `https://api.resend.com/emails` fetch | Plain Fetch-compatible | None for thin call; bounded caller required | Email plan/volume unknown | No | Keep Resend external |
| Axiom | Server log ingestion | `@axiomhq/js` async ingest | SDK not explicitly Worker-smoke-tested; console/Workers Logs available | HTTP sink or platform Logpush if needed | Ingest/retention plan unknown; fire-and-forget can drop logs | Optional | Keep current until observability test |
| GA/GTM | Browser analytics | Google Tag Manager/Analytics scripts and browser events | Browser-only, not Worker bundle business logic | None beyond environment IDs and CSP review | External analytics plan/measurement unknown | No | Keep external |
| MCP/agent clients | Merchant agent connects to VisuTry MCP | External clients call `/api/mcp` and OAuth metadata endpoints | Stateless bearer path proven; full OAuth/DCR not proven | Separate bearer Worker or Vercel OAuth service | Request volume and tool/Neon calls unknown | No provider migration | Keep protocol; split runtime later if justified |
| Catalog/image sources | Shopify, BigCommerce, Unsplash, Google/GCS, jsDelivr, arbitrary merchant source URLs | Browser remote patterns, rewrites, or Node source-intake fetches | Browser/CDN paths compatible; SSRF-safe Node source fetch is not fully proven | Fetch-based source adapter with strict allow/redirect/size policy | Third-party bandwidth/API terms unknown | No | Keep external; constrain source intake |

The table distinguishes a service being reachable over HTTP from the complete application caller being portable. The latter also includes database transactions, secrets, retries, ownership, retention, and observability.

# IMAGE / NEXT.IMAGE

Actual usage is split into three paths:

1. **Static and remote page images:** many pages import `next/image`; configured remote patterns include Vercel Blob, placeholder, Google user images, Twitter, Unsplash, Shopify, and BigCommerce. Static assets can be served through OpenNext Static Assets/CDN.
2. **Dynamic Next image optimization:** `next.config.js` requests AVIF/WebP, device sizes, image sizes, and a one-hour minimum cache TTL. The exact `/_next/image` optimizer behavior under the current OpenNext/Workers output has not been separately smoke-tested for every remote host. This is therefore **E**, not an assumed migration failure or success.
3. **Client-side face landmarks:** [`src/lib/face-landmark-client.ts`](../../src/lib/face-landmark-client.ts) lazy-imports `@mediapipe/tasks-vision`, uses `ImageBitmap`/HTML image/canvas inputs, tries GPU then CPU, and loads WASM/model assets from `/mediapipe/wasm`/`/mediapipe/models` with jsDelivr/GCS fallbacks. This is browser execution; the 34 MB installed MediaPipe package is not a server Worker binary dependency in the measured route graph.

There is no `sharp` dependency and no server-side image transformation module in the current application. Cloudflare Image Transformations or R2 could be useful only after actual image request/retention/egress measurements show a material benefit. Do not add them for theoretical compatibility.

# EMAIL / OBSERVABILITY

`src/lib/resend.ts` makes a direct JSON `fetch` to Resend and has no Node-only mail SDK in the application path. It is **C** as a thin external service. The retention routes select users and update email tracking through Prisma; that caller chain remains Vercel/background-bound.

`src/lib/logger.ts` keeps an in-memory ring of 1,000 entries, writes production events to console, and asynchronously calls Axiom through `@axiomhq/js` when configured. Axiom delivery is deliberately non-blocking, so failed ingestion can lose logs while the business request succeeds. Cloudflare documents Workers Logs, real-time logs, Tail Workers, and Logpush as available platform surfaces: [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/). The current recommendation is to retain Axiom until a Worker smoke test proves field shape, privacy, delivery, and retention equivalence; use Cloudflare platform logs as an additional runtime safety net rather than silently assuming parity.

# COST MODEL

The following figures are current Cloudflare documentation facts as of this audit date. Links: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/), and [Workflows pricing](https://developers.cloudflare.com/workflows/reference/pricing/).

## KNOWN

| Component | Current known limit/price implication | Relevance to VisuTry |
|---|---|---|
| Workers Free | 100,000 inbound requests/day, 10 ms CPU/request, 128 MB memory, 50 subrequests/request, 3 MB compressed Worker size, five Cron Triggers/account | Current dynamic routes share the request/CPU budget; the current measured bundle is close to the limit; five active schedules would use all trigger slots |
| Workers Paid | $5/month minimum; 10 million requests/month and 30 million CPU-ms included, then published request/CPU overages; longer HTTP/Cron/Queue execution limits | Paid is a threshold option, not a reason to call Free-compatible code complete |
| Static Assets | Requests to static assets are free/unlimited under the Workers pricing model | Public/static delivery is the safest Cloudflare move |
| R2 Standard | 10 GB-month, 1M Class A, 10M Class B monthly free; then `$0.015/GB-month`, `$4.50/M` Class A, `$0.36/M` Class B; direct R2 egress is free | R2 could reduce object egress/storage coupling, but current Blob metadata/access behavior still needs migration work |
| D1 | Free includes 5M rows read/day, 100k rows written/day, 5 GB stored | Not relevant enough to justify moving the Neon relational source |
| Queues | Free plan has a daily operation allowance; each read/write/delete can consume operations by message size/operation rules | A future async boundary must count task, retry, and cleanup operations; current app has no Queue consumer |
| Workflows | Free includes shared request/CPU limits and 3,000 steps/day with included storage/steps under current billing timing | Could model retries/sleeps, but current jobs need refactoring before those limits are meaningful |
| Logs/observability | Cloudflare Workers Logs, real-time logs, Tail Workers, and Logpush are available as platform observability surfaces | Could reduce Axiom dependency, but retention/query/export requirements remain to be measured |

## ESTIMATED

- One dynamic browser/API request normally consumes one inbound Worker request; subrequests to Neon, Stripe, Resend, Blob, or AI are not the same as separate inbound Worker requests, but they still consume subrequest/latency/memory/CPU budgets and provider quotas.
- Static assets and CDN delivery can remain economically attractive on Free. Authenticated SSR, MCP, uploads, image buffers, and cron execution are the more important CPU/bundle/request risks.
- The first meaningful external bill is most likely to come from AI generation, Neon capacity, Blob/object storage, Axiom/Resend usage, or Stripe business/payment fees before Workers compute at early traffic. This is a hypothesis, not a measured forecast.
- R2 may be cheaper than Blob for high object volume or egress because its direct egress is free, but the app’s actual object size, retention, reads, signed access, and delete rate are not measured here.

## UNKNOWN

Actual traffic and request mix; average image size; AI provider pricing and generation volume; Neon plan and compute/storage usage; Vercel Blob usage/billing; Resend plan; Axiom ingest/retention; Stripe transaction fees; Cloudflare Image Transformations usage; cache hit rates; and the number of external provider retries.

**Cost conclusion:** do not promise that Workers Free is the first or largest bill. Instrument per-capability counts and provider spend before selecting R2/D1/Queues/Workflows or a paid Worker. Worker bundle size is a deployment gate, not itself a monthly usage bill.

# BUNDLE

| Measurement | Value |
|---|---:|
| B3 supplied baseline | `2780.26 KiB gzip` |
| Current fresh dry-run | `2807.47 KiB gzip` |
| Observed delta vs supplied baseline | `+27.21 KiB` |
| Workers Free hard limit | `3072 KiB` / documented 3 MB compressed limit |
| Current headroom | `264.53 KiB` |
| Warning threshold | `2900 KiB` |
| Dependencies added in B3 | `0` |

Route-wrapper measurements from the current OpenNext output:

| Route wrapper | Raw | Gzip | Interpretation |
|---|---:|---:|---|
| `/api/mcp` | `491,060` bytes | `131,877` bytes | Largest measured route; shared MCP SDK/tool registry |
| `/api/payment/create-session` | `6,771` bytes | `2,871` bytes | Stripe + auth/payment wrapper; shared dependency cost not additive |
| `/api/payment/webhook` | `8,514` bytes | `2,680` bytes | Signature/fulfillment wrapper; shared Prisma/Stripe cost not additive |
| `/api/upload` | `11,454` bytes | `4,087` bytes | Multipart/Vercel Blob wrapper |
| `/api/try-on/submit` | `10,662` bytes | `3,545` bytes | AI/Blob/task wrapper |
| `/api/cron/cleanup-expired-tasks` | `28,053` bytes | `9,537` bytes | Prisma/Blob/retention/email wrapper |

Installed package sizes are only risk indicators: MCP ≈ `12 MB`, Stripe ≈ `5.7 MB`, MediaPipe ≈ `34 MB`, Gemini SDK ≈ `612 KB`, Vercel Blob ≈ `880 KB`, Axiom ≈ `1.2 MB`, and Neon serverless ≈ `2.9 MB` on disk. No B3 dependency was added, and no direct additive contribution should be inferred from these install sizes.

The current fresh build has no Prisma query compiler, `libquery_engine`, or Prisma WASM engine. The current result is Free-compatible, but only `264.53 KiB` below the hard limit and `92.53 KiB` below the warning threshold; further large shared dependencies are not acceptable.

# ARCHITECTURE OPTIONS

## A: Keep Vercel production; Cloudflare as a future edge/runtime candidate

- **Implementation effort:** lowest; retain the working Prisma, Blob, AI, Stripe, cron, and OAuth paths.
- **Operational complexity:** lowest; one production runtime and a separately validated Cloudflare slice.
- **Monthly infrastructure cost:** keeps Vercel/provider costs; avoids premature R2/D1/Queue migration costs.
- **Free-plan longevity:** Cloudflare Free can serve static/public and proven narrow routes without carrying the full application.
- **Reliability:** highest for current behavior because no broad runtime boundary changes.
- **Vendor coupling:** remains coupled to Vercel/Neon/provider services, but that is already the current system.
- **Performance:** Cloudflare can still be used for static/public edge delivery and later thin routes.
- **Migration risk:** lowest.

**Recommended now.** This is the minimum architecture that preserves reliability while measurements continue.

## B: Workers Free + Neon + existing external services

- **Implementation effort:** moderate; requires more direct-Neon adapters, explicit external HTTP boundaries, bundle discipline, and bounded job design.
- **Operational complexity:** medium/high; two runtimes, separate observability, auth/session parity, and mixed ownership of retries.
- **Monthly infrastructure cost:** low Cloudflare compute cost at low traffic, but external Neon/AI/Blob/Stripe/Resend costs remain and Free limits are hard caps.
- **Free-plan longevity:** good for static, read-heavy, stateless paths; poor for AI buffers, cron, full MCP, and high dynamic traffic.
- **Reliability:** acceptable only after end-to-end capability gates; currently proven for B1/B2 slices, not full application parity.
- **Vendor coupling:** increases Cloudflare runtime coupling while retaining external services.
- **Performance:** potentially better edge latency for public/merchant API traffic; Neon location and external provider latency remain.
- **Migration risk:** medium; partial migration can create subtle runtime divergence.

**Future incremental target**, not a current production cutover.

## C: Cloudflare-heavy: Workers + R2 + D1/KV/Queues/Workflows/etc.

- **Implementation effort:** highest; requires relational data migration or a split source of truth, object access migration, queue/workflow refactoring, auth/payment/AI runtime redesign, and operational tooling.
- **Operational complexity:** highest; more Cloudflare products and state transitions to operate and reconcile.
- **Monthly infrastructure cost:** can benefit from R2 free egress and product free tiers, but overages and paid thresholds depend on real traffic; migration work is a material cost.
- **Free-plan longevity:** individual products have useful free tiers, but shared request/step/operation limits and the 3 MB Free Worker limit remain.
- **Reliability:** could improve for a deliberately redesigned system, but not for an unmodified Prisma/AI/cron application.
- **Vendor coupling:** highest.
- **Performance:** potentially excellent for edge-local static/object/state operations; Neon/provider latency still exists unless those are also moved.
- **Migration risk:** highest, especially for payments, historical task data, retention, and tenant isolation.

**Not justified by B3 evidence.** Do not choose this option merely because Cloudflare offers the products.

# MIGRATION BOUNDARY

## Move or keep eligible for Cloudflare

- Static assets, public pages, health/read-only routes, and proven direct-Neon B1/B2 read/write slices.
- Stateless merchant bearer MCP only after preserving the bundle budget and adding production-grade observability/rollback.
- Thin HTTP adapters to Auth0, Stripe, Resend, and AI only after route-specific test-mode and timeout/idempotency proof.

## Stay on Neon

- User/account identity mapping, payments, tasks, usage/quota, merchant memberships, Store/Campaign state, OAuth state, StoreAsset metadata, cleanup/orphan state, and audit records.
- Neon remains the relational source of truth; no D1 migration in B3.

## Stay external

- Auth0 identity provider, Stripe billing, Gemini/GrsAI inference, Resend email, analytics/GA/GTM, and Axiom or an equivalent observability sink.
- Vercel Blob remains the current object store until a measured R2 adapter is approved.

## Remain on Vercel for now

- Prisma-heavy Stripe checkout/webhook/refund and admin paths.
- Current Vercel Blob upload/asset/retention paths.
- AI orchestration and long-running GrsAI polling.
- Five cron/background jobs and full MCP OAuth/DCR/source intake.

## Do not migrate yet

R2, D1, KV, Queues, Workflows, Cloudflare Image Transformations, production DNS/custom domain, production Stripe/AI/Blob endpoints, or the Neon schema.

The boundary follows the rule: migrate only when Cloudflare materially improves cost, performance, reliability, or operational simplicity and the replacement has route-level evidence.

# B3 IMPLEMENTATION SEQUENCE

This is a proposed sequence, not work performed in B3:

1. **B3.1 — Measurement and observability gate:** keep the current bundle under `2900 KiB` preferred, add per-capability request/latency/error counters without adding a large SDK, and compare Workers Logs/Logpush with Axiom requirements.
2. **B3.2 — Object-storage decision:** create a test-only R2 bucket and direct browser PUT proof, if economics justify it; preserve current Blob in production until metadata, private/public access, cleanup, and rollback pass.
3. **B3.3 — AI execution architecture:** define a test-mode thin provider adapter, bounded task contract, lease/retry/fencing semantics, result-storage contract, and provider cost/latency measurements; do not call production AI.
4. **B3.4 — Stripe/webhook parity:** use mocked/test-mode events to prove Worker-compatible SDK/HTTP behavior, raw-body signatures, direct-Neon transaction/idempotency semantics, retries, subscriptions, refunds, and rollback.
5. **B3.5 — MCP runtime architecture:** keep bearer/tools separate from OAuth/DCR/source intake; either build a direct-Neon/Web Fetch adapter or retain full OAuth on Vercel; remeasure the shared bundle after every change.
6. **B3.6 — Background jobs:** split each cron job into bounded units, choose retained Vercel versus Queue/Workflow/paid Worker, and prove idempotency, retries, provider callbacks, cleanup, and observability.
7. **B3.7 — Staged soak and gate review:** run authenticated multi-tenant/browser regression, provider test-mode fixtures, rollback drills, capacity/cost measurement, and only then reconsider production traffic.

# PRODUCTION MIGRATION GATE

Production migration remains **NO** until all items below are PASS with current staging evidence:

- public/static route parity and cache/asset behavior;
- Auth0 callback, session refresh, logout, admin/non-admin, non-merchant, ownership, and tenant isolation parity;
- all required Neon-backed reads and writes, including transaction and rollback semantics;
- Stripe checkout, portal, subscription lifecycle, payment history, webhook raw-body/signature verification, duplicate/out-of-order retries, refunds, and credit/task fulfillment;
- uploads, private/public access, exact signed URLs, metadata, provider fallback, cleanup, retention, and rollback;
- AI sync and async generation, polling, callback/timeout ambiguity, retries, leases, result persistence, quota/usage settlement, retention, and provider cost limits;
- MCP bearer, OAuth/DCR, authorization-code and refresh-token flows, session/transport behavior, tool registry, rate limits, tenant boundaries, and source-network SSRF protections;
- cron/background jobs with bounded execution, idempotency, retry/fencing, delayed work, email delivery tracking, and webhook/AI retry behavior;
- observability for request, CPU, memory, provider latency, failed callbacks, dropped logs, and business fulfillment;
- documented rollback/version pinning and a tested return path to Vercel;
- current Worker bundle below the hard limit, preferably below `2900 KiB`, with no Prisma engine/WASM reintroduction;
- a Free-plan request/CPU/memory/cron/queue/workflow capacity model based on real traffic;
- an external-provider cost model covering Neon, AI, Blob/R2, Stripe, Resend, analytics, and monitoring;
- staged soak with no unresolved security, tenant-isolation, data-retention, or payment issues;
- explicit approval for DNS/custom-domain and production-secret changes.

# GIT

- Starting SHA: `7d887d2`
- Ending SHA: recorded after the B3 audit document is committed
- Branch: `codex/cloudflare-phase-a-build-parity`
- Pushed: pending
- PR: none
- Merged: **NO**

No production deployment or merge is part of B3.
