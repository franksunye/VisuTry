# Agent Instructions — VisuTry

**Status:** Active  
**Last reviewed:** 2026-07-22  
**Owner:** Engineering  

---

## Before You Start

Read these documents first, in order:

1. `docs/project/architecture.md` — Current technical reality (rendering strategy, session data flow, DB schema)
2. `docs/decisions/ADR-005-ssr-to-client-gate.md` — Why public pages use client-side gates instead of SSR
3. `docs/product/product-plan.md` — Product priorities and current direction
4. This document — Architectural rules and conventions

---

## Architectural Rules (Must Follow)

### 1. Rendering Strategy

- **All public pages must be SSG (●)**. Verify with `next build` output after changes.
- **`getServerSession()` is only allowed in `src/app/api/**` and `src/app/[locale]/admin/**`**. Never in root layout, locale layout, or any `(main)` page.
- New pages that need auth-aware UI must use the **client-side gate pattern** (see `StyleExplorerGate.tsx` as reference).
- `setRequestLocale(locale)` must be called in every layout and page that uses `next-intl/server` functions (`getTranslations`, `getMessages`).

### 2. Session Data Flow

- The JWT token is the **read source** for user data. Do not call `prisma.user.findUnique()` in pages — read from `session.user` instead.
- API routes that **write** user data update the DB directly, then the client calls `session.update()` to refresh the token.
- JWT callback syncs from DB: on login, on `trigger='update'` (rate-limited to 30s), and every 15 minutes.

### 3. Database (Neon)

- Do NOT call `prisma.$connect()` for warm-up. The Neon HTTP driver creates a new HTTP request per query; pre-connecting is a no-op.
- The `DATABASE_URL` uses the PgBouncer pooler. Prisma CLI (migrations) uses `DIRECT_URL`.
- Cold starts (500ms–few seconds) are handled via `connect_timeout` in the connection string, not by application-level warm-up.

### 4. Performance Monitoring

- `perfLogger` (`src/lib/performance-logger.ts`) is a singleton. In serverless concurrent execution, `end()` may not find `start()` — this is expected and silently skipped.
- Do not add new singleton-based state that assumes a single-request lifecycle.

---

## Current Project Priorities

1. **Stability**: Monitor Vercel logs after the SSG migration (ADR-005) to confirm timeout errors are resolved.
2. **Test coverage**: 3 pre-existing unit test failures (locale URL routing) need fixing. E2E tests for authenticated user flows (login → try-on → history) are not yet covered.
3. **UI/UX**: Evaluate the brief loading state for authenticated users on tool pages (gate pattern trade-off).
4. **Growth**: Blog content, SEO surfaces, and conversion optimization per `docs/product/product-plan.md`.

---

## Key File Locations

| Purpose | Path |
|---|---|
| Architecture (source of truth) | `docs/project/architecture.md` |
| Auth config (JWT callback, session callback) | `src/lib/auth.ts` |
| Prisma client (Neon adapter) | `src/lib/prisma.ts` |
| Root layout (SessionProvider, no getServerSession) | `src/app/layout.tsx` |
| Locale layout (setRequestLocale, i18n) | `src/app/[locale]/layout.tsx` |
| SEO helper | `src/lib/seo.ts` |
| Pricing config | `src/config/pricing.ts` |
| Try-on type config | `src/config/try-on-types.ts` |
| Performance logger | `src/lib/performance-logger.ts` |

---

## Testing

- **Unit tests**: `npm run test:unit` (Jest)
- **E2E tests**: `npx playwright test` (Playwright)
- **Build verification**: `npm run build` — check that public pages show ● (SSG), not ƒ (Dynamic)
- **Type checking**: `npx tsc --noEmit`

Always run `tsc --noEmit` and `npm run build` before committing changes to page components or auth configuration.
