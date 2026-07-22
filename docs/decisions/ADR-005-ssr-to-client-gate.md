# ADR-005: Remove SSR getServerSession from All Public Pages — Adopt Client-Side Gate Pattern

**Status:** Accepted  
**Date:** 2026-07-22  
**Owner:** Engineering

---

## Context

VisuTry was experiencing repeated `DOMException [TimeoutError]` errors in Vercel production logs, affecting core pages: `/en/style-explorer`, `/en/try-on/glasses`, `/en/face-shape-detector`, `/en/dashboard/history`, and others. The errors originated from `undici` (Node.js fetch) timing out during server-side rendering.

### Root Cause

The root layout (`src/app/layout.tsx`) called `getServerSession(authOptions)` on every request. `getServerSession` internally reads `cookies()`, which is a Next.js dynamic API. When called in a layout, it forces **all child pages** into dynamic rendering (opting out of static generation), even if those pages had `export const dynamic = 'force-static'`.

This caused a chain of problems:

1. Every page request triggered a serverless function invocation
2. The JWT callback in `getServerSession` queried the database via the Neon HTTP driver (`prisma.user.findUnique`)
3. During Neon cold starts (compute scaled to zero), the HTTP query took 500ms–several seconds
4. Concurrent requests saturated the Neon HTTP endpoint, causing `undici TimeoutError`
5. Additional `getServerSession` calls in individual pages (`style-explorer`, `try-on/[type]`, `compare`, `face-analysis`, `pricing`, `dashboard`, `dashboard/history`, `payments`, `debug-images`) compounded the problem with redundant DB queries

Additional contributing factors:
- `setRequestLocale()` from `next-intl` was missing entirely, preventing static rendering even without the session issue
- `prisma.$connect()` warm-up was called on startup, which is a no-op for the Neon HTTP driver but generated error noise during cold starts
- JWT callback `trigger === 'update'` had no rate limiting — every client `session.update()` triggered a DB query
- `perfLogger` singleton had a race condition in serverless concurrent execution

### Failed Alternative: ISR with `revalidate`

Initially, `export const revalidate = 60` was tried on some pages. This did not help because `getServerSession` in the root layout still forced dynamic rendering — ISR cannot override the `cookies()` opt-out.

---

## Decision

Remove `getServerSession()` from the root layout and all public-facing pages. Adopt a **client-side gate pattern** for pages that need auth-aware UI.

### 1. Root Layout

`src/app/layout.tsx` no longer calls `getServerSession`. `SessionProvider` receives no server-side session prop — `next-auth` fetches the session on the client via `/api/auth/session` (standard `next-auth` behavior).

### 2. Client-Side Gate Pattern

Each page that previously branched on `session` now renders a static shell and delegates auth-aware rendering to a client component (`*Gate.tsx`):

- **Unauthenticated visitors** (majority of traffic): See the same landing/marketing content as before, now served as static HTML from CDN. No change in experience.
- **Authenticated users**: See a loading state (skeleton or landing) for 200–500ms while `useSession()` resolves, then the tool interface appears.
- **Header**: Shows a neutral placeholder during session loading to prevent LoginButton → UserMenu flash.

### 3. `getServerSession` Allowed Locations

- `src/app/api/**` — API route handlers (on-demand, not per-page-load)
- `src/app/[locale]/admin/**` — Admin pages (protected, low-traffic)

### 4. Supporting Changes

- Added `setRequestLocale()` to all layouts and pages using `next-intl/server` (next-intl requirement for static rendering)
- Removed `prisma.$connect()` warm-up (no-op for Neon HTTP driver)
- Added 30-second rate limiting to JWT `trigger === 'update'` syncs via `lastSyncTime` in token
- Fixed `perfLogger` race condition (silent skip instead of warning when start time is missing)
- Added `metadataBase` to `generateSEO()` to resolve relative OG image URLs

---

## Consequences

### Easier

- All public pages render as SSG (●), served from CDN with zero serverless CPU consumption
- No DB queries during page rendering — eliminates `undici TimeoutError` on public pages
- `force-static` now actually works (was previously overridden by root layout's `cookies()` access)
- Faster page loads for unauthenticated visitors (static HTML, no serverless cold start)
- Clear architectural rule: `getServerSession` only in API routes and admin pages

### Harder

- Authenticated users see a brief loading state on page refresh before the tool interface appears
- `useSession()` adds a client-side fetch to `/api/auth/session` on initial page load (cached by next-auth after first resolve)
- Dashboard and history pages require client-side data fetching (via existing API endpoints) instead of SSR — adds slight latency for authenticated users
- New gate components add a layer of indirection that developers must understand

### Required

- `setRequestLocale()` must be called in every new page/layout that uses `next-intl/server` functions
- New public pages must not use `getServerSession()` — use the gate pattern instead
- `next build` output should be checked to confirm new pages render as ● SSG

### Deferred

- `payments` and `debug-images` pages were also converted in a follow-up commit
- E2E tests for the authenticated user flow (login → tool interface) are not yet added
- `perfLogger` should eventually be refactored to use `AsyncLocalStorage` for request-scoped state

---

## Related Documents

- `docs/project/architecture.md` — Rendering Strategy and Session Data Flow sections
- `docs/operations/vercel-cpu-static-page-pilot.md` — Static page pilot phases
- `docs/project/vercel-cpu-governance-spec.md` — CPU governance spec
- Commits: `011381e`, `da21da7`, `f854cc6`, `ea87c5f`, `a3e1a77`, `48fbce9`
