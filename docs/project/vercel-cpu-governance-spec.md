# VisuTry Vercel CPU Governance Specification

**Status:** Active operating plan  
**Owner:** Engineering  
**Created:** 2026-07-21  
**Last updated:** 2026-07-22  
**Review cadence:** Weekly while Vercel Hobby CPU remains constrained; monthly after stabilization  
**Scope:** Runtime CPU governance for the current Next.js application on Vercel. This specification does not authorize a platform migration, database replacement, authentication rewrite, payment rewrite, or product behavior change.  
**Related source-of-truth documents:** `docs/project/architecture.md`, `docs/decisions/ADR-005-ssr-to-client-gate.md`, `docs/guides/development-guide.md`, `docs/product/product-plan.md`

---

## 1. Purpose

VisuTry is still in commercial validation, while the Vercel Hobby project has reached or exceeded the included Fluid Active CPU allowance. The goal of this work is therefore not broad performance refactoring. The goal is to reduce avoidable server-side CPU consumption without destabilizing authentication, payments, credits, AI generation, image handling, or user workflows.

This specification defines:

1. the CPU-governance facts currently verified in the codebase and Vercel runtime;
2. a route-by-route optimization method;
3. risk and expected benefit by change category;
4. required validation, rollout, observation, and rollback rules;
5. the order in which engineering should proceed.

The governing principle is:

> Make the smallest independently measurable change, deploy it, verify it, and only then move to the next route or category.

---

## 2. Current Verified Facts

This plan is based on current implementation evidence, not a generic Next.js optimization checklist.

### 2.1 Runtime and deployment facts

- The application uses Next.js 15 App Router, React 19, TypeScript, `next-intl` v4, NextAuth/Auth0, Prisma v7 with Neon PostgreSQL (`@prisma/adapter-neon` HTTP driver), Vercel Blob, Stripe, Gemini, MediaPipe, Resend, and related server-side dependencies.
- The application is deployed on Vercel and currently produces Node.js Lambda functions.
- Recent Vercel runtime logs show server-side invocations for public routes including:
  - `/` and `/en`;
  - `/en/try-on/glasses`;
  - `/en/face-analysis`;
  - `/en/style-explorer`;
  - `/en/face-shape-detector`;
  - `/en/try-on/glasses/compare`;
  - `/en/blog` and individual blog articles;
  - localized legal pages such as `/terms`, `/en/terms`, `/en/refund`, and `/es/privacy`.
- Runtime log counts prove that these routes entered runtime execution. They do **not** by themselves prove which route consumed the most CPU milliseconds. CPU attribution must therefore be treated as an empirical measurement problem.

### 2.2 Internationalization and layout facts

- `src/app/[locale]/layout.tsx` defines `generateStaticParams()` for all configured locales and calls `setRequestLocale()` for static rendering support.
- The locale layout loads translations with `getMessages()` and metadata translations with `getTranslations()`.
- `src/app/[locale]/(main)/layout.tsx` renders shared structured data, `Header`, and `Footer`.
- `Header` is a client component. It reads session state through `useSession()` and test-session state through `useTestSession()` in the browser. It shows a neutral placeholder while session is loading.
- **The root layout (`src/app/layout.tsx`) no longer calls `getServerSession()`.** This was removed in ADR-005 (2026-07-22). `SessionProvider` receives no server-side session — next-auth fetches it on the client. This was the root cause of all public pages being forced into dynamic rendering.

### 2.3 Static rendering — all public pages (deployed)

All public-facing pages now use explicit static rendering and render as SSG (●) in `next build` output. This includes pages that previously used `getServerSession()` — they now use the **client-side gate pattern** (see ADR-005).

**Phase 1 — Legal and content pages (force-static):**
- `/{locale}/refund`, `/{locale}/privacy`, `/{locale}/terms`
- `/{locale}` (home), `/{locale}/face-shape-detector`, `/{locale}/store`
- Blog articles and blog index (ISR), SEO guide pages (ISR)

**Phase 2 — Public tool pages (force-static + client gate):**
- `/{locale}/style-explorer` — `StyleExplorerGate`
- `/{locale}/try-on/[type]` — `TryOnGate`
- `/{locale}/try-on/glasses/compare` — `ComparePageClient`
- `/{locale}/face-analysis` — `FaceAnalysisGate`
- `/{locale}/pricing` — `PricingSection` uses `useSession()` internally

**Phase 3 — Protected pages (SSG + client gate with data fetching):**
- `/{locale}/dashboard` — `DashboardPageClient` (fetches `/api/user/balance` + `/api/try-on/history`)
- `/{locale}/dashboard/history` — `HistoryPageClient` (fetches `/api/try-on/history`)
- `/{locale}/payments` — `PaymentsPageClient` (fetches `/api/payment/history`)
- `/{locale}/debug-images` — `DebugImagesPageClient` (fetches `/api/try-on/history`)

**Only dynamic (ƒ) routes remaining:** `/admin/*` pages and `/api/*` route handlers.

**Key change:** Root layout session lookup was removed (ADR-005). `setRequestLocale()` was added to all layouts and pages using `next-intl/server` functions. `prisma.$connect()` warm-up was removed (no-op for Neon HTTP driver).

### 2.4 Critical product workflows that must remain protected

The current architecture contains high-value stateful workflows:

- Auth0/NextAuth login and session handling;
- Stripe Checkout and webhook processing;
- credits balance and entitlement updates;
- user image and frame upload;
- AI try-on job creation and result handling;
- frame comparison;
- server-side face analysis;
- dashboard history and payment records;
- persisted files in Vercel Blob;
- database access through Prisma and Neon PostgreSQL.

CPU work must not weaken correctness, idempotency, authorization, privacy, or auditability in these paths.

---

## 3. What Counts as CPU Governance

CPU governance is not limited to making pages static. It includes five distinct control surfaces:

1. **Avoid execution:** serve static output or cached output rather than invoke a function.
2. **Reduce invocation volume:** remove duplicate calls, excessive polling, crawler-triggered runtime work, and unnecessary API requests.
3. **Reduce work per invocation:** avoid repeated parsing, transformation, serialization, image conversion, and redundant database work.
4. **Move work to the correct execution layer:** browser, CDN, build step, queue, or external service instead of request-time server CPU.
5. **Protect expensive paths:** rate-limit, validate early, short-circuit unauthorized requests, and preserve idempotency.

A change must identify which of these mechanisms it uses and how the effect will be measured.

---

## 4. Mandatory Delivery Method

### 4.1 One bounded unit per pull request

Default unit of change:

- one page;
- one route family with identical implementation behavior;
- one API endpoint;
- one polling loop;
- one image-processing step;
- one cache boundary.

Do not combine unrelated CPU improvements in the same pull request.

### 4.2 Required evidence before change

Every CPU-governance pull request must record:

- target route or component;
- current rendering mode or runtime behavior;
- Vercel runtime invocation evidence where available;
- presence of `cookies()`, `headers()`, session access, database access, external API calls, file access, or request-dependent metadata;
- expected CPU mechanism: avoid execution, reduce calls, or reduce work per call;
- rollback method.

### 4.3 Required evidence after change

Every pull request must include:

- successful local or Vercel Preview build;
- build output or deployment evidence for rendering mode when applicable;
- route smoke tests;
- confirmation that content, URL, metadata, localization, navigation, and authorization behavior are unchanged unless explicitly approved;
- post-production observation window and metric.

### 4.4 Stop conditions

Stop and do not expand the change when any of the following occurs:

- a route expected to be static still builds as dynamic;
- a static directive causes build-time access to request data;
- localized routes fail or render the wrong locale;
- hydration errors appear;
- session-dependent UI changes incorrectly;
- a payment, credits, AI, upload, or history regression appears;
- CPU benefit cannot be observed and the next step would require broader architectural changes.

---

## 5. Change Categories: Risk, Benefit, and Required Approach

The benefit levels below are directional. Actual CPU savings must be verified in Vercel after deployment.

| Category | Current-code relevance | Typical change | Expected benefit | Risk | Required rollout |
| --- | --- | --- | --- | --- | --- |
| A. Pure legal/content leaf pages | Legal pages are static text but have appeared in runtime logs. Refund is the first pilot. | Add explicit static rendering where compatible. | Low to medium per page; cumulative benefit grows with crawlers and locale count. | Very low | One page at a time. |
| B. Blog index and article pages | Blog index and articles appear in runtime logs and are crawler-facing. | Pre-generate known locale/slug combinations; use static metadata and controlled revalidation. | Medium to high because content traffic and crawlers can repeatedly invoke runtime. | Low to medium | Start with one article, then one locale, then expand. |
| C. Public marketing/product pages | Home, detector, advisor, try-on, explorer, and compare landing routes appear in runtime logs. | Separate static shell from dynamic actions; avoid request-time work on initial render. | Potentially high. These are high-visibility routes. | Medium | Page-by-page audit; no behavior changes to actual tools. |
| D. Shared locale/layout behavior | Locale layout loads messages and metadata; main layout includes client-side header/footer. | Reduce message payload, isolate dynamic boundaries, or pre-generate locale output. | Medium across many pages. | Medium to high because one change affects the entire site. | Only after leaf-page pilots; dedicated regression suite. |
| E. Authentication/session requests | Header reads session client-side; protected areas and auth APIs remain stateful. | Reduce redundant session fetches or duplicate provider mounts; cache only safe client state. | Medium if session calls are frequent. | High because incorrect caching can expose or hide user state. | Measure first; do not static-cache personalized responses. |
| F. API polling and duplicate requests | Try-on architecture uses asynchronous status updates; polling can amplify invocations. | Backoff, stop polling on terminal state, deduplicate concurrent calls, suspend when tab is hidden. | High when jobs are active. | Medium because job UX and completion detection can regress. | Instrument first; change one polling client/endpoint pair. |
| G. Image upload and transformation | Uploads and persisted assets use Vercel Blob; image-heavy flows are central. | Direct upload, client-side validation/compression, avoid Base64 and repeated server transformations. | High where server currently handles image bytes or transformations. | Medium to high because privacy, format, quality, and failure handling matter. | Trace exact current path before any change; preserve object ownership and cleanup. |
| H. AI request preparation and response handling | Gemini-powered try-on and server-side analysis are critical. | Remove redundant image conversion, prompt construction, serialization, and repeated result processing. | Medium to high per paid/credit action. | High because output quality, credit accounting, retries, and idempotency are critical. | No change without task-level tests and credit reconciliation. |
| I. Database query and serialization work | Prisma/Neon backs users, credits, tasks, payments, and history. | Select only needed fields, remove duplicate queries, paginate, cache only public/reference data. | Medium; may be high on dashboards or polling endpoints. | High for transactional data. | Query-by-query; never cache balances, entitlements, or webhook decisions without explicit design. |
| J. Middleware, redirects, and bot traffic | Public localized and SEO routes attract crawlers. | Narrow matcher scope, avoid expensive middleware work, add safe bot/rate controls. | Medium across all traffic. | Medium to high because routing, locale, auth, and SEO can break globally. | Audit matcher and redirect matrix first; deploy separately. |
| K. Debug/admin/health endpoints | Architecture records debug and admin routes where enabled. | Disable production-only debug work, protect admin routes, make health checks minimal. | Low to medium; can remove waste and attack surface. | Low to medium | Inventory first; retain operational visibility. |
| L. Bundle/module initialization | Server bundle includes Prisma, AI, mail, Blob, Stripe, image, and other libraries. | Lazy-load route-specific dependencies and avoid importing heavy modules into shared server paths. | Medium, especially for cold starts and per-invocation initialization. | Medium because import changes can cause runtime-only failures. | Use server bundle analysis; one dependency boundary per PR. |

---

## 6. Execution Plan

### Phase 0 — Baseline and inventory

Before broad changes, create a living CPU worksheet under the issue or PR system with:

| Field | Required value |
| --- | --- |
| Route | Exact route or route pattern |
| Route type | Static content, public tool, authenticated page, API, webhook, cron |
| Runtime evidence | Invocation count, log sample, or Vercel route evidence |
| Dynamic dependencies | Request headers, cookies, session, DB, Blob, external API |
| User criticality | Low / medium / high |
| Proposed mechanism | Static, cache, dedupe, backoff, move client-side, query reduction |
| Risk | Low / medium / high |
| Verification | Build, tests, smoke checks, CPU observation |
| Status | Not audited / candidate / in progress / deployed / reverted |

Do not estimate route CPU solely from invocation count. Where Vercel cannot provide route-level CPU attribution, compare CPU growth rate before and after bounded deployments over similar traffic windows.

### Phase 1 — Pure legal pages

Order:

1. Refund — completed pilot.
2. Privacy — completed.
3. Terms — completed.
4. Home, Face Shape Detector, Store — completed.
5. One blog article pilot — completed (`oliver-peoples-finley-vintage-review`).

For each page:

1. confirm no request-dependent APIs, database calls, session reads, Blob calls, or external API calls;
2. add explicit static rendering only to that page;
3. confirm all supported localized routes build and return 200;
4. verify title, metadata, body, Header, Footer, language handling, and home link;
5. deploy and observe runtime logs and CPU trend;
6. revert the single commit if any regression occurs.

Expected result: legal-page requests should be served without normal request-time Node.js execution.

### Phase 2 — Blog pilot

Start with one stable article, not the entire blog system.

Required audit:

- source of article content;
- slug discovery;
- locale availability;
- `generateMetadata()` dependencies;
- related-article computation;
- image behavior;
- sitemap and canonical generation;
- `notFound()` behavior.

Pilot sequence:

1. one article in one locale;
2. all supported locales for that article;
3. a small article group;
4. blog article route family;
5. blog index last.

Do not force static rendering if articles are request-dependent or fetched from a mutable source without a defined revalidation policy.

### Phase 3 — Public product pages

Audit these separately:

- home;
- face-shape detector landing and tool boundary;
- face analysis landing and submission boundary;
- glasses try-on landing and generation boundary;
- Style Explorer;
- frame comparison landing and generation boundary;
- pricing.

For each route, split the analysis into:

1. content that can be generated at build time;
2. browser-only state and interaction;
3. server actions or APIs that must remain dynamic;
4. personalized elements;
5. analytics and experiment dependencies.

The target architecture is not necessarily a fully static route. A safe win may be a static initial page whose actual user action calls a protected dynamic API.

### Phase 4 — Invocation amplification

Once public-page rendering is controlled, measure APIs and clients for amplification:

- status polling frequency;
- polling after terminal job state;
- repeated session requests;
- duplicate submit clicks;
- retry loops without backoff;
- browser visibility behavior;
- multiple components fetching the same resource;
- crawlers reaching APIs or dynamic pages.

Required implementation standards:

- exponential or bounded backoff where suitable;
- stop on `COMPLETED`, `FAILED`, authorization failure, or unrecoverable validation error;
- prevent concurrent duplicate polling for the same task;
- suspend nonessential polling in hidden tabs;
- preserve a clear user-visible recovery action;
- preserve server-side idempotency.

### Phase 5 — Work per invocation

Only after invocation volume is understood, optimize expensive request paths:

- image parsing/conversion;
- AI preparation and response processing;
- Prisma queries and result shape;
- task-history pagination;
- server module initialization;
- email generation;
- structured-data generation where repeated unnecessarily.

These changes require route-specific benchmarks and tests. Do not perform speculative micro-optimizations in critical workflows.

### Phase 6 — Shared architecture

Changes to locale layout, root layout, shared providers, middleware, global routing, authentication providers, or storage architecture are last-stage CPU work because they have the largest blast radius.

A shared architecture change requires:

- a dedicated design note;
- full route matrix validation;
- authentication regression tests;
- payment and credit smoke tests;
- SEO/canonical/hreflang verification;
- rollback deployment identified in advance.

---

## 7. Route Classification Rules

### Class 1 — Safe static candidate

A route is a safe static candidate only when it has no request-time dependency on:

- cookies or request headers;
- authenticated user/session;
- current database state;
- private Blob access;
- Stripe state;
- current credits or entitlement;
- AI generation state;
- user-specific experiment assignment;
- mutable external data without a revalidation design.

Examples: stable legal copy and selected code-backed articles.

### Class 2 — Static shell with dynamic action

A route may render statically while preserving dynamic APIs for actions.

Examples:

- try-on landing UI with upload/submit APIs;
- detector information with browser-side MediaPipe execution;
- compare UI with protected generation endpoints.

The page must not embed private or current user data into static output.

### Class 3 — Dynamic and cache-sensitive

Examples:

- dashboard;
- payment history;
- credits balance;
- authenticated task history;
- personalized results;
- admin pages.

These routes require query and invocation optimization, not blanket static rendering.

### Class 4 — Transactional/critical endpoint

Examples:

- Stripe webhooks;
- credit deduction;
- task creation;
- payment reconciliation;
- entitlement updates.

Correctness always wins over CPU reduction. Static caching is prohibited unless an explicit transactional design proves safety.

---

## 8. Pull Request Template for CPU Work

Every CPU-governance PR should contain the following:

```md
## Target
- Route/component:
- Category:
- Current runtime evidence:

## Current dependencies
- Session/cookies/headers:
- Database:
- Blob/file access:
- External APIs:
- Localization/metadata:

## Change
- Exact bounded change:
- CPU mechanism:
- Expected benefit:
- Risk level:

## Safety boundary
- Explicitly unchanged workflows:

## Validation
- Build result:
- Rendering mode evidence:
- Test result:
- Preview routes checked:
- Localization/SEO checks:

## Production observation
- Observation window:
- Metric:
- Result:

## Rollback
- Commit/deployment to revert to:
```

---

## 9. Acceptance Criteria by Category

### Static page change

- unchanged URL and status code;
- unchanged visible content unless separately approved;
- correct locale;
- correct title, canonical, and alternate-language metadata;
- Header/Footer and links work;
- no hydration errors;
- build confirms static or intended revalidation mode;
- runtime invocation for ordinary page requests is removed or materially reduced.

### Polling change

- task completion is still detected;
- failed tasks stop correctly;
- terminal state stops polling;
- refresh/recovery remains available;
- no duplicate credit charge or duplicate task creation;
- request count per completed workflow is lower.

### Image-path change

- supported formats remain supported;
- orientation and image quality remain acceptable;
- ownership and authorization remain enforced;
- no public exposure of private assets;
- failure and cleanup behavior remain correct;
- server CPU or request body handling is measurably reduced.

### Database change

- query result is identical for required fields;
- authorization remains in place;
- transactions and idempotency remain correct;
- balances, payments, and task states reconcile;
- query count, rows, serialization size, or execution time improves.

### AI-path change

- output quality acceptance tests pass;
- prompts and model parameters are intentionally unchanged or versioned;
- credits are charged/refunded exactly once under success and failure;
- retries are bounded and idempotent;
- result persistence and history remain correct;
- CPU reduction is measured separately from external model latency.

---

## 10. Measurement Standard

Use three levels of measurement:

### Level 1 — Route execution evidence

- Vercel runtime logs by route;
- function invocation counts;
- build rendering mode;
- request counts from application telemetry.

### Level 2 — Workflow amplification

Measure per completed user workflow:

- number of page runtime invocations;
- number of API requests;
- number of polling requests;
- number of database queries where instrumentation exists;
- bytes uploaded/downloaded through the server path.

### Level 3 — Account-level outcome

Track:

- Fluid Active CPU consumption rate;
- serverless invocation trend;
- error rate;
- latency;
- conversion-critical workflow success rate.

Because traffic varies, compare equivalent windows where possible and avoid claiming savings from a single low-traffic day.

---

## 11. Prioritized Backlog

| Priority | Candidate | Category | Risk | Expected benefit | Status |
| --- | --- | --- | --- | --- | --- |
| P0 | Refund policy static rendering | A | Very low | Low per route | Deployed |
| P0 | Privacy policy static rendering | A | Very low | Low per route | Deployed |
| P0 | Terms static rendering | A | Very low | Low per route | Deployed |
| P0 | Home static rendering | C | Very low | Medium/high | Deployed |
| P0 | Face Shape Detector static rendering | C | Very low | Medium/high | Deployed |
| P0 | Store landing static rendering | C | Very low | Low/medium | Deployed |
| P1 | One stable blog article static pilot | B | Low | Medium | Deployed (oliver-peoples-finley-vintage-review) |
| P1 | Blog article route inventory | B | Low | Enables medium/high benefit | Deployed (all blog articles + index + tags) |
| P1 | Polling request count per try-on/compare task | F | Low measurement risk | Potentially high | Audit first |
| P1 | Session request duplication audit | E | Low measurement risk | Medium | Deployed (JWT update rate-limited to 30s, redundant prisma queries removed) |
| P2 | Face Shape Detector initial route rendering audit | C | Medium | Medium/high | Deployed (SSG, client-side MediaPipe) |
| P2 | Style Explorer initial route rendering audit | C | Medium | Medium/high | Deployed (SSG + StyleExplorerGate) |
| P2 | Try-on and Compare static-shell audit | C | Medium | High | Deployed (SSG + TryOnGate/ComparePageClient) |
| P2 | Pricing static rendering | C | Medium | Medium | Deployed (SSG, PricingSection uses useSession) |
| P2 | Dashboard and history client-side rendering | C/D | Medium | High | Deployed (SSG + client data fetching) |
| P2 | Payments client-side rendering | C/D | Medium | Medium | Deployed (SSG + PaymentsPageClient) |
| P2 | Root layout getServerSession removal | D/E | High | Critical | Deployed (ADR-005) |
| P2 | setRequestLocale addition | D | Low | High | Deployed (all layouts and pages) |
| P2 | prisma.$connect() warm-up removal | I | Very low | Low (noise reduction) | Deployed |
| P2 | Image upload path trace | G | Low measurement risk | Enables high benefit | Audit first |
| P3 | Prisma query inventory for polling/history | I | Medium | Medium | Partially done (redundant queries removed) |
| P3 | Middleware matcher and bot-path audit | J | Medium | Medium | Deployed (Phase 3 in static-page-pilot.md) |
| P3 | Server bundle dependency analysis | L | Medium | Medium | Not started |
| P4 | Shared locale/layout optimization | D | Medium/high | Medium across site | Deployed (setRequestLocale + root layout fix) |
| P4 | AI request-processing optimization | H | High | Medium/high | Deferred until instrumented |

---

## 12. Explicit Non-Goals

This specification does not authorize:

- migration from Vercel to Cloudflare;
- Neon PostgreSQL to D1 migration;
- replacement of Auth0, NextAuth, Stripe, Gemini, Resend, or Vercel Blob;
- redesign of product flows;
- weakening authentication or authorization;
- caching user balances, entitlements, payment decisions, or webhook responses without a separate approved design;
- changing AI prompts or output quality under the label of CPU optimization;
- combining CPU governance with unrelated feature work.

Infrastructure migration should be planned separately. The work in this document remains valuable even after migration because it reduces runtime cost and improves portability.

---

## 13. Decision Rule

Engineering should proceed to the next page or category only when the previous bounded change meets all of the following:

1. production behavior is correct;
2. no critical workflow is affected;
3. the route or workflow shows reduced runtime execution, request amplification, or work per invocation;
4. rollback remains simple;
5. the next change does not materially enlarge the blast radius without new evidence.

The intended pace is deliberately incremental. A one-page improvement is valid progress when it is safe, measurable, and repeatable.
