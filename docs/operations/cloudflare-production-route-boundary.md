# PHASE B3.1 RESULT

**Result: PASS for bundle-drift diagnosis and the production boundary definition. Production migration: NO.**

This document is the route/capability boundary for a future hybrid deployment. It does not create production routes, change DNS, move providers, add dependencies, or change the database schema.

Evidence is taken from the current branch, the actual route/module graph, and real staging evidence recorded in:

- [`cloudflare-phase-b1-auth-read-parity.md`](./cloudflare-phase-b1-auth-read-parity.md)
- [`cloudflare-phase-b2-write-parity.md`](./cloudflare-phase-b2-write-parity.md)
- [`cloudflare-phase-b3-integration-audit.md`](./cloudflare-phase-b3-integration-audit.md)

The current architecture remains **Cloudflare + Vercel + Neon**. Cloudflare is the proven candidate for static/public traffic, selected direct-Neon reads, Auth0/JWT reads, merchant provisioning, and the narrow B2 MCP bearer/DRAFT slice. Vercel remains authoritative for the Prisma-heavy, Blob, AI, background, admin, and full MCP OAuth paths.

# BUNDLE DRIFT

## Measurements

All clean runs below used the same current git SHA, `b62e4f3b1fa63b175eabe2c89036fdcaa029a288`. The working-tree source affecting the bundle was unchanged from the B3 audit; the intervening commit adds documentation only.

| Measurement | gzip |
| --- | ---: |
| B2 supplied baseline | `2780.26 KiB` |
| B3 supplied fresh dry-run | `2807.47 KiB` |
| Supplied B3 − B2 | `+27.21 KiB` |
| Same-SHA clean run 1 | `2811.37 KiB` |
| Same-SHA clean run 2 | `2819.89 KiB` |
| Same-SHA clean run 3 | `2811.07 KiB` |
| Same-SHA clean-run range | `8.82 KiB` |
| Final validation dry-run after document update | `2814.92 KiB` |

Earlier same-source runs also observed `2805.90 KiB` through `2820.46 KiB`, a `14.56 KiB` range. The supplied B3 value of `2807.47 KiB` is inside the observed same-source build envelope.

## Conclusion

- **Deterministic application/module growth:** not demonstrated. The raw sizes of the measured shared artifacts did not grow.
- **OpenNext/Next build variation:** **confirmed**.
- **Standalone gzip randomness:** not the primary cause. Byte-identical MCP and Next chunk inputs produced identical gzip sizes.
- **Changed route graph:** not a new application route graph. Generated route/module manifest content and ordering changed between builds inside the shared handler.
- **Changed shared server function:** yes, as a generated artifact; its raw length stayed constant while generated metadata/manifest bytes changed.
- **MCP contribution:** no observed change across clean runs.
- **Root cause:** nondeterministic generated Next/OpenNext metadata in the shared server function and middleware, including a new Next `BuildId` and changing generated manifest/module ordering. The gzip delta is a consequence of those changed input bytes, not a newly added dependency or MCP route.

The additional `27.21 KiB` cannot therefore be attributed to a deterministic source-level feature. No low-risk optimization was made merely to chase this build noise.

# BUNDLE FORENSICS

The artifact sizes below are measured directly from `.open-next`. The gzip values are per-file diagnostics; they are not additive to Wrangler's total because OpenNext/Wrangler packages and compresses the complete Worker upload.

| Contributor | Raw size | gzip observations | Delta / finding |
| --- | ---: | ---: | --- |
| `.open-next/server-functions/default/handler.mjs` (shared OpenNext server) | `11,801,010` in all sampled runs | `2,368,401` / `2,389,893` / `2,381,307` bytes | Largest moving contributor; raw `0`, observed gzip span `21,492` bytes (`20.99 KiB`). Byte-level diff shows generated manifest/module ordering plus `BuildId` changes. |
| `.open-next/middleware/handler.mjs` | `990,567` in all sampled runs | `122,139` / `122,164` / `122,195` bytes | Raw `0`, observed gzip span `56` bytes in the clean three-run set. Its generated `BuildId` changes with the Next build. |
| `.open-next/server-functions/default/.next/server/app/api/mcp/route.js` | `491,060` | `131,877` in every sampled run | SHA/raw/gzip identical; delta `0`. MCP is large but did not cause the drift. |
| `.open-next/server-functions/default/.next/server/chunks/7899.js` (largest sampled Next chunk) | `896,891` | `230,333` in every sampled run | SHA/raw/gzip identical; delta `0`. |
| `.open-next/worker.js` (Cloudflare adapter/entrypoint) | `2,646` | `916` in every sampled run | SHA/raw/gzip identical; delta `0`. |
| Direct-Neon modules (`src/data/*-cloudflare.ts`, `src/modules/**/*-cloudflare.ts`) | bundled into the shared function; no independent emitted artifact | no separate changed file observed | No measured source/module growth. Their current Cloudflare aliases are part of the stable shared handler input. |

## Byte-level evidence

Two fresh handler/middleware outputs had identical raw lengths but different hashes. The first changed handler bytes were in the generated route/module manifest rather than the MCP route. The generated Next build IDs were different (`fgsLO6Ku0Xqr5nYgW5mrk` versus `Hbw8CrwCqpnXudFOdMITe`). Normalizing only the build ID still left manifest differences, confirming that generated ordering/content—not only the ID string—varies.

The stable MCP route, stable largest Next chunk, stable Worker entrypoint, and stable raw artifact lengths rule out a deterministic MCP or Cloudflare adapter expansion as the explanation for `+27.21 KiB`.

# ROUTE BOUNDARY

Classification is by capability, not merely by whether Next/OpenNext can emit a route. `CLOUDFLARE_READY` requires real staging evidence. A route that shares a URL family with both proven and unproven behavior is split into the narrow proven capability and the remaining capability.

## Route inventory

| Route/capability | Boundary | Evidence / reason |
| --- | --- | --- |
| Localized static marketing/content pages: `/en`, `/en/store`, `/en/blog`, `/en/face-shape-detector`, and equivalent generated locales | `CLOUDFLARE_READY` | Real staging 200 responses and successful 1,576-page Cloudflare builds. |
| `GET /api/health` | `CLOUDFLARE_READY` | Real staging smoke pass. |
| `GET /api/glasses/brands` | `CLOUDFLARE_READY` | Real staging public direct-Neon read pass. Other glasses endpoints are listed as not separately verified unless covered by the same staging evidence. |
| Auth0/JWT first-login callback, `/api/auth/session`, refresh/new-tab persistence, logout, and JWT role checks | `CLOUDFLARE_READY` for the tested JWT path | B1.1/B1.2 real staging Auth0 callback/session/refresh/logout evidence; Auth0 remains the identity provider. Database sessions and passwordless verification are not included. |
| Protected user reads: `/api/try-on/history`, `/api/face-analysis/history`, `/api/payment/history`, `/api/user/balance` | `CLOUDFLARE_READY` | Real authenticated staging reads and cross-user ownership filtering; direct Neon queries require `userId`. Payment history readiness does not include payment writes. |
| Merchant workspace read: `/en/merchant`, merchant profile/workspace reads, and tested own-tenant reads | `CLOUDFLARE_READY` | Real staging authenticated reads and own/cross-tenant B1.2 evidence. |
| `POST /api/merchant/workspaces` | `CLOUDFLARE_READY` | Real staging browser provisioning; direct-Neon Serializable transaction, owner membership, slug retry, and idempotent behavior. |
| Narrow stateless MCP bearer route `POST /api/mcp` | `CLOUDFLARE_READY` for the tested B2 slice | Real staging bearer/tool/rate-limit/tenant-isolation evidence. Includes credential/audit dependencies and Store/Campaign DRAFT tools listed below. |
| MCP Store DRAFT: `create_store`, `set_store_frames` | `CLOUDFLARE_READY` | Real B2 staging create, frame selection, idempotent retry, and rollback evidence. |
| MCP Campaign DRAFT: `create_campaign`, `update_campaign`, `set_campaign_frames` | `CLOUDFLARE_READY` | Real B2 staging create/update/frame selection, idempotent retry, tenant isolation, and rollback evidence. |
| MCP credential/rate-limit/audit writes required by the tested bearer path | `CLOUDFLARE_READY` | Real B2 staging evidence and direct-Neon transaction tests. |
| Stripe payment history read | `HYBRID` | Read is Cloudflare-proven; checkout, portal, webhook, refund, and fulfillment remain Vercel. |
| Public storefront/catalog routes beyond the specifically smoked pages, including dynamic merchant slugs | `NOT_YET_VERIFIED` | Build output is not sufficient; route/cache/Neon/asset behavior needs a route-level staging matrix. |
| Consumer try-on, face-analysis, Store-session, and comparison writes | `VERCEL_REQUIRED` for now | Full caller chains use Prisma, Blob, AI, quotas, task leases, or result persistence and are not Worker-proven. |
| Stripe checkout/portal/conversion/webhook/refund | `VERCEL_REQUIRED` | Current path uses Stripe plus Prisma transactions and raw-body fulfillment; no Worker runtime parity proof. |
| Uploads, private/public Blob access, Store assets, and cleanup | `VERCEL_REQUIRED` | Current implementation uses `@vercel/blob`, metadata, signed URLs, compensation, and retention. |
| AI submit/poll/result orchestration | `VERCEL_REQUIRED` | GrsAI/Gemini, image buffering, Blob persistence, task state, retries, quota and leases remain on the Vercel path. |
| `/api/cron/*` and scheduled work | `VERCEL_REQUIRED` | Five active Vercel cron schedules, Prisma-heavy work, provider calls, and Free 10 ms CPU constraint. |
| `/api/mcp/oauth/*`, DCR, OAuth persistence, CIMD and source intake | `VERCEL_REQUIRED` | Prisma OAuth tables and Node crypto/DNS/HTTPS/net paths are not Worker-proven. |
| `/api/agent/v1/merchant` full catalog/source-intake capability | `VERCEL_REQUIRED` | Narrow merchant bearer reads are proven elsewhere; full source intake remains Prisma/Node-network bound. |
| Admin pages and `/api/admin/*` | `VERCEL_REQUIRED` | Current admin paths remain Prisma/Blob-heavy; only the tested Cloudflare admin dashboard read is a narrow exception, not the admin surface as a whole. |
| Dynamic `/_next/image` optimization | `NOT_YET_VERIFIED` | Remote patterns and AVIF/WebP settings exist, but the OpenNext/Workers optimizer path was not separately smoked for the production host set. |
| Observability delivery through Axiom from a Worker | `NOT_YET_VERIFIED` | Console/Workers Logs are available, but Axiom SDK field/delivery/retention parity was not Worker-smoked. |

# CLOUDFLARE_READY

The production candidate set is limited to the following proven capabilities:

- Static localized pages and their static assets.
- Health and the specifically proven public glasses read.
- Auth0/JWT callback/session/refresh/logout behavior for the tested application path.
- User-scoped protected read APIs with direct Neon and ownership filtering.
- Merchant workspace/profile reads with membership checks requiring both `userId` and `merchantId`.
- Merchant provisioning through the existing application route.
- Narrow MCP bearer requests using stateless JSON transport.
- B2 Merchant Agent credential/rate-limit/audit boundaries.
- B2 Store DRAFT and Campaign DRAFT creation/update/frame-selection tools, including rollback and cross-tenant rejection.

This list does not imply that every route in a page's navigation is Cloudflare-ready. Unsupported actions must remain owned by Vercel.

# VERCEL_REQUIRED

Keep these capabilities on Vercel in the production boundary:

- Stripe checkout, subscription portal, conversion, webhook fulfillment, refunds, and payment writes.
- Vercel Blob upload, private/public access, signed redirects, result persistence, compensation, and cleanup.
- Consumer and Store AI orchestration: submit, poll, result persistence, task leases, quota settlement, and provider retries.
- Face-analysis and try-on writes that use Prisma/Blob/AI/task state.
- All five cron schedules and their Prisma/Resend/GrsAI/Blob work.
- Full MCP OAuth, DCR, token/authorization persistence, CIMD, and source-network intake.
- Full agent catalog/source intake and Node-specific SSRF/network hardening.
- Admin pages and admin API capabilities that depend on Prisma, Blob, imports, or broad mutation behavior.
- Any remaining consumer/store mutation not explicitly covered by the B2 DRAFT evidence.

Vercel is not a database boundary. These paths continue to use Neon as the relational source of truth through the existing Prisma path.

# HYBRID

Hybrid means the request boundary and execution backend may be different. No hybrid proxy or split routing is implemented by B3.1.

- **Public/static:** Cloudflare can serve static pages/assets and proven reads; unsupported dynamic actions can remain Vercel-owned.
- **Authenticated reads:** Cloudflare can terminate the proven Auth0/JWT request and direct-Neon read; unsupported mutations use Vercel with the same Auth0 identity and Neon source of truth.
- **Payment boundary:** A future edge boundary could accept/forward a Stripe webhook or request, while Vercel performs the Prisma/Neon fulfillment. Raw-body preservation and retries must be proven before use.
- **Object boundary:** A future Cloudflare route could authorize an upload and mint an exact signed URL; current upload and object execution remain Vercel Blob. R2 is not configured or selected.
- **AI boundary:** A future Cloudflare route could authenticate and enqueue/forward a bounded request; Vercel remains the execution/orchestration backend and the external AI provider remains unchanged.
- **MCP:** Narrow bearer/tools can be Cloudflare-owned; full OAuth/DCR/source intake remains Vercel-owned.
- **Observability:** Cloudflare Logs/Logpush and existing Axiom can coexist until field, privacy, retention, and delivery equivalence are proven.

# NOT_YET_VERIFIED

The following are explicit gates, not assumed failures or successes:

- Dynamic `/_next/image` optimization and all configured remote image hosts.
- Stripe SDK/Worker runtime, raw-body webhook verification, direct-Neon fulfillment, retries, subscriptions, and refunds.
- Full MCP OAuth/DCR, authorization-code/refresh-token persistence, CIMD, source intake, and Node networking equivalence.
- AI Worker orchestration, buffering, timeout ambiguity, retries, leases, result storage, quota settlement, and provider cost limits.
- Vercel Blob behavior from a Worker and any Blob-to-R2 migration.
- Background jobs, cron capacity, delayed work, idempotency, and provider retry behavior on Workers.
- Remaining consumer/store writes, dynamic public merchant routes, and broad admin routes.
- Axiom/Workers Logs parity and production-grade request/CPU/error metrics.
- Custom-domain routing, cookie/callback behavior across a future split host, and per-capability production routing.

# PRODUCTION REQUEST FLOWS

- **Public:** Browser → Cloudflare route layer/Worker → static asset or proven direct-Neon read → response. Unverified dynamic route → Vercel origin.
- **Authenticated:** Browser → Auth0 callback/session boundary → Cloudflare JWT/direct-Neon read for proven capabilities. Unsupported action → Vercel route using the same Auth0 identity and Neon source of truth.
- **Writes:** Browser or agent → explicit capability router → Cloudflare only for the proven merchant provisioning/B2 DRAFT owner; all other writes → Vercel. There must be one authoritative writer per capability.
- **Stripe:** Browser → Vercel payment route → Stripe → Vercel Prisma/Neon fulfillment. Stripe webhook → Vercel raw-body handler → idempotent Prisma/Neon transaction. A Cloudflare edge boundary is future-only.
- **Blob:** Browser → current Vercel upload route → Vercel Blob → Neon/Prisma metadata. Future option: Cloudflare authorizes an exact R2 PUT/GET URL, but this is not implemented or selected.
- **AI:** Browser → Vercel submit route → GrsAI/Gemini → current Blob result storage → Neon/Prisma task/quota state. Polling and retries remain Vercel-owned.
- **MCP:** Agent → Cloudflare `/api/mcp` narrow bearer/stateless JSON path → direct Neon B2 tools. OAuth/DCR/source-intake request → Vercel path.
- **Background:** Scheduler → Vercel cron → Prisma/Neon selection and leases → GrsAI/Blob/Resend → Neon tracking. No direct Free-plan Worker cron move is planned.

# MIGRATION STRATEGY

1. **Stage 1 — Cloudflare staging:** Continue workers.dev builds, real Auth0/browser tests, B2 MCP tests, bundle measurements, and rollback drills. No production secrets or DNS.
2. **Stage 2 — public-read production slice:** Put static/public pages and only individually smoked direct-Neon reads behind a controlled Cloudflare route owner. Keep a Vercel origin available.
3. **Stage 3 — authenticated-read slice:** Move the proven JWT/session and protected-read capability set, then verify cookies, ownership, tenant isolation, cache headers, and failure routing with production-like traffic.
4. **Stage 4 — proven write slice:** Move merchant provisioning and B2 Store/Campaign DRAFT writes one capability at a time. Keep a single writer and use idempotency/transaction evidence.
5. **Stage 5 — retain Vercel unsupported:** Keep Stripe, Blob, AI, cron, admin, full MCP OAuth, source intake, and unverified writes on Vercel.
6. **Stage 6 — optional additional integrations:** Reconsider each deferred capability only after a separate test-mode parity, cost, capacity, observability, and rollback gate.

The safest eventual routing mechanism is an explicit capability routing table in a controlled edge/reverse-proxy layer that maps exact paths or capability groups to either the Cloudflare Worker or the Vercel origin. The current architecture does **not** have that production routing layer; `wrangler.jsonc` is workers.dev staging only. Until such a layer is built and tested, use a separate staging/canary hostname and explicit route ownership rather than pretending that DNS can safely split individual Next routes.

# ROLLBACK

## Read paths

- Disable the Cloudflare path or remove its exact route match in the controlled router.
- Send reads back to the Vercel origin.
- Keep Neon unchanged; no database rollback is required for a read-only switch.
- Purge or bypass any Cloudflare cache for affected paths and verify auth/tenant headers before reopening traffic.

## Write paths

- Stop new traffic to the Cloudflare writer and wait for in-flight requests to finish or fail closed.
- Verify the shared Neon state and transaction/audit records, then switch the capability owner to Vercel.
- Use idempotency keys and the same request identity so a retry cannot create a second merchant/Experience/credential.
- Do not dual-write the same capability during migration. A feature flag/router version must select exactly one writer at a time.
- Roll back the Worker version and route mapping independently; do not perform a compensating database rollback unless a separate, reviewed data-repair procedure is required.

The B2 direct-Neon writes reduce split-brain risk because both runtimes can share Neon, but shared storage alone does not make concurrent writers safe. Ownership, idempotency, cache invalidation, and in-flight draining remain mandatory.

# COST STRATEGY

- **Cloudflare Free:** static/public assets, public pages, proven low-CPU direct-Neon reads, and the narrow MCP bearer slice only while request volume, 10 ms CPU, 3 MB compressed size, memory, subrequests, and error rates remain inside limits.
- **Vercel Hobby:** Prisma-heavy payment/admin paths, current Blob uploads/assets, AI/task orchestration, five cron schedules, full MCP OAuth/source intake, and all unverified writes.
- **Neon:** retain as the single relational source of truth; do not introduce D1 for this phase.
- **External services unchanged:** Auth0, Stripe, Gemini/GrsAI, Vercel Blob, Resend, Axiom/observability, analytics, and existing catalog/image sources.
- **Do not introduce yet:** R2, D1, KV, Queues, Workflows, Cloudflare Images, or a custom production domain solely to chase the `+27.21 KiB` build drift. Add one only when measured traffic/economics or a proven technical requirement justifies it.

The objective is infrastructure near `$0` while traffic is low, not 100% Cloudflare. Provider costs for Neon, AI, Blob, Stripe, Resend, and monitoring remain independent of the edge host.

# BUNDLE

- B2: `2780.26 KiB gzip`
- B3 supplied: `2807.47 KiB gzip`
- Current same-SHA clean observations: `2811.37`, `2819.89`, `2811.07 KiB gzip`
- Final validation dry-run: `2814.92 KiB gzip`
- Final validation headroom: `257.08 KiB` under `3072 KiB`; observed clean-run maximum headroom was `252.11 KiB`
- Warning threshold: `2900 KiB`; all observed runs remain below it.
- Free compatible: **YES**, with build variance monitored.
- Prisma runtime/WASM/query-engine artifacts: **ABSENT**.

# GIT

- Starting SHA for B3.1 work: `b62e4f3b1fa63b175eabe2c89036fdcaa029a288`
- Ending SHA: recorded after this document and index entry are committed
- Branch: `codex/cloudflare-phase-a-build-parity`
- Pushed: pending
- PR: none
- Merged: **NO**

No production deployment, DNS change, provider migration, schema migration, or merge is part of B3.1.
