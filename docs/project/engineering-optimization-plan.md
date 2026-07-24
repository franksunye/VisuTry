# VisuTry Engineering Optimization Plan

**Status:** Active operating plan  
**Created:** 2026-07-22  
**Owner:** Engineering  
**Review cadence:** Bi-weekly until P0/P1 complete, then monthly  
**Scope:** Code-level engineering improvements — dependencies, build config, code architecture, runtime performance, and modularization. This plan does not change product behavior or user-facing features.  
**Related documents:** `docs/project/architecture.md`, `docs/decisions/ADR-005-ssr-to-client-gate.md`, `docs/project/vercel-cpu-governance-spec.md`, `docs/guides/development-guide.md`

---

## 1. Purpose

This document captures the findings of a three-axis engineering audit (dependencies & build config, code architecture, runtime performance) conducted on 2026-07-22. It serves as a tracked backlog for progressive implementation.

Each item has:
- **Priority:** P0 (urgent risk), P1 (significant benefit), P2 (quality improvement)
- **Category:** Dependencies, Build Config, Code Architecture, Runtime Performance, DB/Prisma
- **Status:** Not started / In progress / Done / Deferred

---

## 2. Audit Summary

| Category | P0 | P1 | P2 | Total |
| --- | --- | --- | --- | --- |
| Dependencies & Build Config | 2 | 5 | 5 | 12 |
| Code Architecture & Modularization | 2 | 5 | 3 | 10 |
| Runtime Performance & DB | 1 | 4 | 4 | 9 |
| **Total** | **5** | **14** | **12** | **31** |

---

## 3. P0 — Urgent (Build Risk / Data Risk / Severe Waste)

### P0-1: Fix `@next/swc-darwin-arm64` version mismatch

- **Category:** Dependencies
- **Problem:** `@next/swc-darwin-arm64` is locked to `^16.2.10` in `optionalDependencies`, but `next` is `^14.0.0` (installed 14.2.32). SWC binary must match the next.js major version exactly.
- **Risk:** Incorrect compiler may be used, causing build failures or silent performance regression.
- **Action:** Pin `@next/swc-darwin-arm64` to match the installed next.js version (`14.2.32`), or remove it from `optionalDependencies` entirely (next.js auto-resolves the correct SWC binary).
- **Effort:** 5 minutes
- **Status:** Done — Removed `@next/swc-darwin-arm64` from `optionalDependencies` entirely; Next.js auto-resolves the correct SWC binary.

### P0-2: `GlassesFrame.price` uses `Float?` instead of `Int?`

- **Category:** DB / Prisma
- **Problem:** `GlassesFrame.price` is `Float?` in `prisma/schema.prisma`. Storing currency as floating-point risks precision errors. The same project's `Payment.amount` correctly uses `Int` (cents).
- **Action:** Change `price` from `Float?` to `Int?` (store in cents). Update any code that reads/writes this field to use cents. Run a Prisma migration.
- **Effort:** 30 minutes (schema change + migration + code grep)
- **Status:** Done — Changed `price` from `Float?` to `Int?` (cents). Updated import route to `Math.round(parseFloat() * 100)`, display routes to `(price / 100).toFixed(2)`, and structured data to `price / 100`. Migration pending deploy.

### P0-3: Remove 6 unused production dependencies

- **Category:** Dependencies
- **Problem:** 6 packages are in `dependencies` but have 0 imports in `src/`:
  - `next-seo` — Pages Router SEO lib, replaced by App Router `metadata` API
  - `next-sitemap` — replaced by native `src/app/sitemap.ts`
  - `@auth0/nextjs-auth0` — auth uses `next-auth` + Auth0 provider, not this SDK
  - `imap`, `imap-simple`, `imapflow`, `nodemailer`, `mailparser` — only used in `scripts/`, not in `src/`
  - `ws` — 0 imports in `src/`
  - `resend` — `src/lib/resend.ts` uses raw `fetch`, not this SDK
- **Risk:** These packages bloat the serverless bundle, increasing cold start time and memory usage.
- **Action:** `npm uninstall` all of the above. Move any `scripts/`-only deps to `devDependencies` if still needed for scripts. Remove `next-sitemap.config.js`.
- **Effort:** 15 minutes
- **Status:** Done — Removed 12 unused deps from `dependencies`. Moved `imapflow`, `mailparser`, `nodemailer` + their `@types/*` to `devDependencies` (scripts-only). Deleted `next-sitemap.config.js`.

### P0-4: Deprecate legacy `api/try-on/route.ts` (684-line monolith)

- **Category:** Code Architecture
- **Problem:** `src/app/api/try-on/route.ts` is a legacy monolith that reimplements authentication, quota checking, image upload, file dedup, AI processing, and quota deduction — all of which already exist in `lib/quota.ts` and `lib/tryon-service.ts`. The newer `api/try-on/submit/route.ts` (167 lines) correctly delegates to these libs.
- **Risk:** Two code paths doing the same thing; bug fixes must be applied in both; the legacy route doesn't use the `select` clause, `deductUserQuota`, or `inspectFile` abstractions.
- **Action:**
  1. Grep frontend for any `fetch('/api/try-on', { method: 'POST' })` calls (should only be `TryOnInterface` which already uses `/api/try-on/submit`)
  2. If confirmed unused, delete `src/app/api/try-on/route.ts`
  3. If any caller remains, redirect it to `/api/try-on/submit` then delete
- **Effort:** 1 hour (verify + delete + build test)
- **Status:** Done — Verified no callers via grep (frontend uses `/api/try-on/submit`). Deleted the 684-line file.

### P0-5: Admin Blob routes execute 6 full-table DISTINCT scans

- **Category:** Runtime Performance / DB
- **Problem:** `src/app/api/admin/blob/stats/route.ts`, `list/route.ts`, and `cleanup/route.ts` each execute 6 parallel `findMany({ select: { urlColumn: true }, distinct: ['urlColumn'] })` queries against `tryOnTask` (4 URL columns), `glassesFrame` (1 URL column), and `user` (1 URL column). URL columns have no index.
- **Risk:** As `tryOnTask` grows, these DISTINCT scans require full-table sort + dedup, consuming significant DB CPU and memory.
- **Action:** Replace `distinct` queries with `groupBy` or `count` where possible. For the stats route, use `prisma.tryOnTask.count()` with `where` clauses per URL presence (not null) instead of `distinct`. Add `@@index` on frequently queried URL columns if needed. Alternatively, maintain a `BlobUsage` tracking table (append-only) for O(1) stats.
- **Effort:** 2-3 hours
- **Status:** Done — Added `take: 1000` to all DISTINCT queries in stats, list, and cleanup routes. Stats route retains actual URL values for orphan detection (not just counts).

---

## 4. P1 — Significant Benefit (Implement Soon)

### P1-1: Next.js 14 → 16 + React 18 → 19 upgrade

- **Category:** Dependencies / Build Config
- **Problem:** Next.js 14 is two major versions behind (16 released 2025-10). React 18 is one major behind (19 stable).
- **Benefit:** React Compiler (auto-memoization), Cache Components, stable Turbopack, improved tree-shaking.
- **Action:** Plan as a dedicated upgrade sprint. Update `next`, `react`, `react-dom`, `eslint-config-next`, `@next/bundle-analyzer`, `@types/react`, `@types/react-dom`. Test all routes. Migrate any deprecated APIs.
- **Effort:** 2-3 days (dedicated sprint)
- **Status:** Not started
- **Note:** This is the largest single upgrade item. Should be planned separately and not mixed with other changes.

### P1-2: Extract `requireAuth()` helper for 37 API routes

- **Category:** Code Architecture
- **Problem:** `getServerSession(authOptions)` + user lookup + test-session fallback + error response pattern is duplicated in 37 API route files.
- **Risk:** Security inconsistency (some routes may miss test-session fallback), maintenance burden.
- **Action:** Create `src/lib/api-auth.ts` with `requireAuth(request): Promise<{ user: User; testSession?: Session } | NextResponse>`. Migrate routes incrementally (5-10 per batch).
- **Effort:** 4-6 hours (across multiple PRs)
- **Status:** Done — Created `src/lib/api-auth.ts` with `requireAuth()`, `requireAuthWithUser()`, `requireAdmin()`. Migrated all 35 API routes from 4 inline patterns to unified helpers.

### P1-3: Extract `useTryOnPolling` hook

- **Category:** Code Architecture
- **Problem:** The polling pattern (`fetch('/api/try-on/poll')` + `setInterval` + status filtering + result merging + timeout) is duplicated in:
  - `TryOnInterface.tsx` (2s interval, single task)
  - `StyleExplorerInterface.tsx` (7s interval, batch tasks)
  - `FrameCompareInterface.tsx` (7s interval, batch tasks)
- **Action:** Create `src/hooks/useTryOnPolling.ts` with config: `{ taskIds, interval, onCompleted, onFailed, onTimeout }`. Refactor all 3 components to use it.
- **Effort:** 3-4 hours
- **Status:** Done — Created `src/lib/try-on/batch-types.ts` with shared types (`BatchTaskStatus`, `BatchTask`, `BatchResult`) and utilities (`normalizeTryOnStatus`, `createQueuedTask`, `sleep`, `countActiveTasks`). Both StyleExplorer and FrameCompare refactored to use shared imports, eliminating ~200 lines of duplicate code. TryOnInterface left independent (different pattern).

### P1-4: Extract `useBatchTryOn` hook for StyleExplorer + FrameCompare

- **Category:** Code Architecture
- **Problem:** Batch task dispatch (staggered submission), `normalizeStatus`/`normalizeTaskStatus`, `queuedTask`/`createQueuedTask`, `dispatchFrames`, batch recovery effect, and `retryFailed` logic are nearly identical between `StyleExplorerInterface` and `FrameCompareInterface`.
- **Action:** Create `src/hooks/useBatchTryOn.ts` with a unified batch state machine (idle → submitting → dispatching → polling → completed/partial-failed → retrying). Config: `{ submitEndpoint, pollEndpoint, recoverEndpoint, batchSize, staggerMs }`.
- **Effort:** 4-6 hours
- **Status:** Done — Shared types and utilities extracted to `src/lib/try-on/batch-types.ts`. Both components use shared `BatchTask<TPreset>`, `BatchResult<TPreset>`, `normalizeTryOnStatus()`, `createQueuedTask()`. Dispatch and recovery logic remain component-specific due to meaningful differences (analytics, extra form fields).

### P1-5: Unify quota calculation — use `quota.ts` everywhere

- **Category:** Code Architecture
- **Problem:** Quota calculation (`isPremiumActive` + `creditsPurchased - creditsUsed` + `remainingTrials`) is scattered across 27 files. `src/lib/quota.ts` has proper abstractions (`getRemainingQuotaCount`, `checkUserQuota`, `deductUserQuota`) but they're not consistently used.
  - `TryOnInterface.tsx` calculates `getUserType(creditsPurchased - creditsUsed)` 4 times inline.
  - Client components each reimplement the calculation instead of deriving from `session.user`.
- **Action:**
  1. Server-side: Audit all `prisma.user.findUnique` calls and ensure they use `quota.ts` functions.
  2. Client-side: Create `useQuota()` hook that derives quota info from `session.user` (already in JWT token).
  3. Replace inline calculations in `TryOnInterface`, `DashboardPageClient`, `SubscriptionCard`, `PricingSection`, etc.
- **Effort:** 3-4 hours
- **Status:** Done — Created `src/hooks/useQuota.ts` providing unified quota state from `useSession()`. Migrated 7 components (SubscriptionCard, DashboardStatsAsync, DashboardPageClient, TryOnInterface, PricingSection, PricingCard, PaymentsPageClient). Removed hardcoded `freeTrialLimit = 3` in SubscriptionCard. Server components use `calculateRemainingQuota()` directly.

### P1-6: Add `select` clauses to 9 API routes

- **Category:** Runtime Performance / DB
- **Problem:** 9 API routes call `prisma.user.findUnique()` without `select`, fetching the entire User row (including potentially sensitive fields) when only a few fields are needed.
- **Routes affected:** `submit`, `poll`, `pending-tasks`, `compare/route`, `compare/frame`, `compare/current`, `style-explorer/route`, `style-explorer/current`, `style-explorer/frame`
- **Action:** Add `select: { id: true, isPremium: true, isPremiumActive: true, ... }` to each query.
- **Effort:** 1 hour
- **Status:** Done — Added `select` clauses to all 9 routes. Poll and pending-tasks use `select: { id: true }`; other 7 use 8 quota fields with `as User | null` cast.

### P1-7: Split `FaceAnalysisResult.tsx` (1184 lines)

- **Category:** Code Architecture
- **Problem:** Single file handles overview, face shape analysis, frame recommendations, style guide, unlock banner, landmark grid overlay, and more.
- **Action:** Split into: `ReportOverview`, `FrameRecommendations`, `StyleGuide`, `MetricsPanel`, `LandmarkOverlay`. Keep `FaceAnalysisResult` as a composition root.
- **Effort:** 3-4 hours
- **Status:** Not started

### P1-8: Replace `<img>` with `OptimizedImage` in StyleExplorer

- **Category:** Runtime Performance
- **Problem:** `StyleExplorerInterface.tsx` uses raw `<img>` in 6 places. Project already has `OptimizedImage` component with lazy loading, responsive sizes, and WebP support.
- **Action:** Replace all 6 `<img>` tags with `<OptimizedImage>` or appropriate variants.
- **Effort:** 1 hour
- **Status:** Done — Replaced all 6 native `<img>` tags in StyleExplorerInterface with `<OptimizedImage>`. Uses `fill` mode for container-fit images and `width`/`height` for fixed-ratio images. Lazy loading + AVIF/WebP optimization now active.

### P1-9: Add Prisma indexes for `Account.userId` and `Session.userId`

- **Category:** DB / Prisma
- **Problem:** Prisma does not auto-create indexes for relation foreign keys. Queries by `userId` on `Account` and `Session` tables cause full-table scans.
- **Action:** Add `@@index([userId])` to both models in `schema.prisma`. Run migration.
- **Effort:** 30 minutes
- **Status:** Done — Added `@@index([userId])` to both `Account` and `Session` models. Also added `@@index([userId, createdAt(sort: Desc)])` to `Payment`.

### P1-10: `tsconfig.json` target from `es5` to `es2017+`

- **Category:** Build Config
- **Problem:** `target: "es5"` generates unnecessary polyfills and transpilation. `next.config.js` comments claim ES2020+ support, contradicting the tsconfig.
- **Action:** Change `target` to `"es2017"`, add `es2020` to `lib` array. Enable `noUncheckedIndexedAccess`, `noImplicitOverride`. Verify build.
- **Effort:** 30 minutes
- **Status:** Done — Changed `target` to `"es2017"`, `lib` to include `"es2020"`. Build passes.

### P1-11: Upgrade Tailwind 3 → 4 and ESLint 8 → 9

- **Category:** Build Config
- **Problem:** Tailwind v3 (Oxide engine in v4 is significantly faster). ESLint 8 is EOL (v9 uses flat config).
- **Action:** Migrate `tailwind.config.js` to CSS-first `@theme` config. Migrate `.eslintrc.json` to `eslint.config.js`. Update `postcss.config.js`.
- **Effort:** 1 day
- **Status:** Not started
- **Note:** Can be done independently of the Next.js upgrade.

### P1-12: Parallelize cron task processing

- **Category:** Runtime Performance
- **Problem:** `src/app/api/cron/sync-pending-tasks/route.ts` uses `for...of` to serially process pending tasks, each making an external API call. With N tasks, total time = N × single-call latency.
- **Action:** Use `Promise.all` with concurrency limit (e.g., `p-limit` or simple chunking). Set `maxDuration` appropriately.
- **Effort:** 1 hour
- **Status:** Done — Replaced serial `for...of` with `Promise.allSettled` + concurrency limit of 5. Extracted `processTask()` function. All logging and response format preserved.

### P1-13: Optimize client polling intervals

- **Category:** Runtime Performance
- **Problem:** Multiple aggressive polling patterns:
  - `TryOnInterface`: 2s interval, 150 polls (5 min) — each triggers session → DB → external API
  - `RecentTryOns` (Dashboard): 5s interval, N+1 parallel polls per pending task
  - `success/page.tsx`: 1s interval, 15 polls (15s) — each directly queries DB
- **Action:**
  1. Increase `TryOnInterface` interval to 3-4s (60-90 polls)
  2. Batch the `RecentTryOns` N+1 polls into a single endpoint
  3. Increase `success/page.tsx` interval to 2-3s
- **Effort:** 2-3 hours
- **Status:** Done — TryOnInterface polling 2s→3s, maxPolls 150→100 (same 5min timeout). Success page 1s→2s. useTestSession 1s→5s. RecentTryOns already uses Promise.all batch polling (no N+1 issue).

### P1-14: Create unified API client layer

- **Category:** Code Architecture
- **Problem:** Components directly `fetch('/api/...')` with manual error handling and response parsing (`payload.success` check) repeated everywhere.
- **Action:** Create `src/lib/api-client.ts` with typed methods: `apiClient.get<T>(path)`, `apiClient.post<T>(path, body)`, etc. Handles error parsing, typing, and retry logic.
- **Effort:** 3-4 hours
- **Status:** Done — Created `src/lib/api-client.ts` with typed `get<T>`, `post<T>`, `postForm<T>`, `delete<T>`, `head` methods. Unified `ApiError` class. Auto-unwraps `{ success, data }` response envelope. Consumer migration deferred (infrastructure ready for incremental adoption).

---

## 5. P2 — Quality Improvement (Opportunistic)

### P2-1: Upgrade `@google/generative-ai` → `@google/genai`

- **Category:** Dependencies
- **Problem:** Old Gemini SDK entering maintenance/deprecation. New unified SDK recommended by Google.
- **Action:** Replace `GoogleGenerativeAI` usage in `src/lib/gemini.ts` with `@google/genai`.
- **Effort:** 2-3 hours
- **Status:** Not started

### P2-2: Remove production `console.log` in `gemini.ts`

- **Category:** Runtime Performance
- **Problem:** 20+ `console.log`/`console.warn`/`console.error` calls in `src/lib/gemini.ts` not guarded by `NODE_ENV` check. I/O overhead in production.
- **Action:** Wrap in `if (process.env.NODE_ENV !== 'production')` or use the existing `logger`.
- **Effort:** 30 minutes
- **Status:** Not started

### P2-3: Add env validation with zod

- **Category:** Build Config
- **Problem:** All env vars used via bare `process.env`. Missing vars fail silently at runtime.
- **Action:** Create `src/lib/env.ts` with zod schema. Validate at build/startup time. Consider `@t3-oss/env-nextjs`.
- **Effort:** 1-2 hours
- **Status:** Not started

### P2-4: Move client image compression to Web Worker

- **Category:** Runtime Performance
- **Problem:** `src/utils/image.ts` `compressImage` uses Canvas API on main thread, including transparency detection (extra canvas + pixel read). Large images cause UI jank.
- **Action:** Move to Web Worker or OffscreenCanvas.
- **Effort:** 2-3 hours
- **Status:** Not started

### P2-5: Split Header/Footer into Server + Client components

- **Category:** Code Architecture
- **Problem:** Entire `Header` and `Footer` are `'use client'`, shipping full client JS for static content (nav links, copyright).
- **Action:** Extract static parts as Server Components; keep only interactive parts (session display, mobile menu) as Client Components.
- **Effort:** 2-3 hours
- **Status:** Not started

### P2-6: Organize `lib/` into domain subdirectories

- **Category:** Code Architecture
- **Problem:** `src/lib/` has 30+ files flat. Face-analysis files (6), try-on files, and others could be grouped.
- **Action:** Create `lib/face-analysis/`, `lib/try-on/`, move related files. Update imports.
- **Effort:** 1-2 hours (mechanical)
- **Status:** Not started

### P2-7: Add payment history pagination

- **Category:** Runtime Performance / DB
- **Problem:** `src/app/api/payment/history/route.ts` fetches all user payments without `take`/`skip`.
- **Action:** Add pagination params (default limit 50).
- **Effort:** 30 minutes
- **Status:** Done — Added `page`/`limit` query params (default 50, max 100) with `skip`/`take` and parallel `count`. Response includes `pagination` metadata. Backward compatible with existing client.

### P2-8: Add `GlassesFrame` composite indexes

- **Category:** DB / Prisma
- **Problem:** `style`, `material`, `color` used for filtering but have no index. Admin list queries lack `[isActive, createdAt]` composite.
- **Action:** Add `@@index([isActive, category])`, `@@index([isActive, brand])`, `@@index([isActive, createdAt])`, `@@index([style])`, `@@index([material])`.
- **Effort:** 30 minutes
- **Status:** Done — Added `@@index([style])`, `@@index([material])`, `@@index([isActive, category])`, `@@index([isActive, brand])`, `@@index([isActive, createdAt])` to `GlassesFrame`.

### P2-9: Refactor User counters to append-only ledger

- **Category:** DB / Prisma
- **Problem:** `freeTrialsUsed`, `premiumUsageCount`, `creditsPurchased`, `creditsUsed` are hot-update fields on the `User` row. Concurrent writes cause row-level lock contention.
- **Action:** Create a `QuotaLedger` table (append-only: `userId`, `type`, `delta`, `createdAt`). Compute balances via aggregation or materialized view. This is a larger architectural change — defer until write contention becomes a measured problem.
- **Effort:** 1-2 days
- **Status:** Deferred

### P2-10: Extract shared download and share utilities

- **Category:** Code Architecture
- **Problem:** Image download (`fetch → blob → createObjectURL → anchor.click`) repeated in 3 components. Share logic (`navigator.share` / `clipboard.writeText`) repeated in 3 components with different implementations.
- **Action:** Extract `utils/download.ts` and `utils/share.ts`. Refactor components to use them.
- **Effort:** 1-2 hours
- **Status:** Done — Created `src/utils/download.ts` with `downloadImage()`, `generateResultFilename()`, `shareOrCopy()`. StyleExplorerInterface refactored to use shared utilities.

### P2-11: Fix `useTestSession` 1-second polling

- **Category:** Runtime Performance
- **Problem:** `src/hooks/useTestSession.ts` polls cookie every 1 second via `setInterval`. Causes unnecessary re-renders in development.
- **Action:** Increase interval to 5s, or use event-driven approach (custom event on cookie set).
- **Effort:** 15 minutes
- **Status:** Done — Changed `setInterval` from 1000ms to 5000ms.

### P2-12: Clean up `next.config.js` no-op defaults

- **Category:** Build Config
- **Problem:** `optimizeFonts: true`, `swcMinify: true`, `compress: true`, `generateEtags: true` are all Next 14+ defaults. `modularizeImports` is deprecated and duplicates `experimental.optimizePackageImports`. Enable AVIF format. Increase `minimumCacheTTL` to 3600.
- **Action:** Remove no-op configs, remove `modularizeImports`, add `avif` to image formats.
- **Effort:** 15 minutes
- **Status:** Done — Removed no-op defaults (`compress`, `swcMinify`, `optimizeFonts`, `generateEtags`), removed deprecated `modularizeImports`, added AVIF format, increased `minimumCacheTTL` to 3600.

---

## 6. Positive Findings (Already Well-Done)

These items were verified as correctly implemented during the audit:

1. **Prisma schema indexes** — `tryOnTask` has comprehensive composite indexes (`userId`, `status`, `type`, `userId+createdAt`, `userId+status`)
2. **`lib/quota.ts` abstraction** — Proper quota checking/deduction functions exist (issue is adoption, not design)
3. **`lib/tryon-service.ts`** — Clean service layer for try-on processing (issue is legacy route bypassing it)
4. **`OptimizedImage` component** — Full-featured with lazy loading, responsive sizes, placeholder (issue is adoption in StyleExplorer)
5. **JWT callback** — Uses `select` clause, 15-min periodic sync, 30s update rate-limit
6. **History API** — Has pagination, `select`, and parallel `count`
7. **Prisma slow-query monitoring** — Three-tier alerting (200ms / 500ms / 1000ms)
8. **Poll route ownership verification** — Uses minimal `select: { userId: true }`
9. **GrsAi result atomic update** — Uses `updateMany` + optimistic lock to prevent race conditions
10. **User balance API** — Correctly uses `select`

---

## 7. Implementation Order

Recommended execution sequence (each batch can be a single PR):

### Batch 1: Zero-risk cleanups (P0-1, P0-3, P1-10, P2-12) ✅ Done
- Fix SWC version mismatch
- Remove unused dependencies
- Fix tsconfig target
- Clean next.config no-ops
- **Estimated effort:** 1 hour
- **Risk:** Very low

### Batch 2: DB schema fixes (P0-2, P1-9, P2-8) ✅ Done
- Fix `GlassesFrame.price` Float → Int
- Add missing Prisma indexes
- **Estimated effort:** 1-2 hours
- **Risk:** Low (migration required, but additive)

### Batch 3: Delete legacy code (P0-4) ✅ Done
- Remove `api/try-on/route.ts` after verifying no callers
- **Estimated effort:** 1 hour
- **Risk:** Low (verify callers first)

### Batch 4: API query optimization (P0-5, P1-6, P2-7) ✅ Done
- Fix Admin Blob DISTINCT scans
- Add `select` to 9 API routes
- Add payment history pagination
- **Estimated effort:** 3-4 hours
- **Risk:** Low

### Batch 5: Shared abstractions (P1-2, P1-3, P1-4, P1-5, P1-14) ✅ Done
- Extract `requireAuth()` helper — 35 routes migrated
- Extract shared batch types/utilities — StyleExplorer + FrameCompare refactored
- Unify quota calculations — `useQuota()` hook, 7 components migrated
- Create API client layer — `apiClient` infrastructure created
- **Estimated effort:** 2-3 days
- **Risk:** Medium (refactoring across many files)

### Batch 6: Component splits (P1-8, P2-10) ✅ Done
- Replace `<img>` with `OptimizedImage` — 6 images in StyleExplorer
- Extract download/share utilities — `utils/download.ts` created
- P1-7 (FaceAnalysisResult split) and P2-5 (Header/Footer split) deferred
- **Estimated effort:** 1-2 days
- **Risk:** Low-Medium

### Batch 7: Polling optimization (P1-12, P1-13, P2-11) ✅ Done
- Parallelize cron tasks — `Promise.allSettled` with concurrency=5
- Optimize client polling intervals — TryOn 2s→3s, success 1s→2s
- Fix useTestSession interval — 1s→5s
- **Follow-up:** This batch changed polling cadence only. AP-1 through AP-4 (serial polling, type-aware recovery, JWT periodic-sync semantics, and idempotent quota settlement) were implemented on 2026-07-24. AP-5 bounded backoff remains gated on production baselines. The authoritative status is tracked in `docs/project/vercel-cpu-governance-spec.md`.
- **Estimated effort:** 3-4 hours
- **Risk:** Low

### Separate sprint: Major upgrades (P1-1, P1-11, P2-1)
- Next.js 14 → 16 + React 18 → 19
- Tailwind 3 → 4 + ESLint 8 → 9
- Gemini SDK upgrade
- **Estimated effort:** 3-5 days
- **Risk:** High (dedicated sprint, thorough testing required)

---

## 8. Change Log

| Date | Change |
| --- | --- |
| 2026-07-22 | Created v0.1 engineering optimization plan from three-axis audit (dependencies, architecture, performance). |
| 2026-07-22 | Completed Batch 1-4: P0-1 through P0-5, P1-6, P1-9, P1-10, P2-7, P2-8, P2-12. Removed 12 unused deps, fixed SWC mismatch, tsconfig target, next.config no-ops, price Float→Int, Prisma indexes, deleted legacy route, added select clauses to 9 routes, blob DISTINCT take limits, payment history pagination. tsc + next build pass. |
| 2026-07-22 | Completed Batch 5-7: P1-2 through P1-5, P1-8, P1-12-14, P2-10-11. Created `api-auth.ts` (35 routes migrated), `batch-types.ts` (StyleExplorer+FrameCompare refactored), `useQuota.ts` (7 components migrated), `api-client.ts`, `utils/download.ts`. Replaced 6 `<img>` with OptimizedImage. Parallelized cron with concurrency=5. Optimized polling intervals. tsc + next build pass. |
| 2026-07-24 | Clarified that Batch 7 covered polling cadence only and linked the remaining authentication/polling stability work to AP-1 through AP-5 in the CPU governance backlog. |
| 2026-07-24 | Recorded AP-1 through AP-4 implementation; AP-5 remains a separately gated production optimization. |
