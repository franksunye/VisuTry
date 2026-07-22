# Vercel CPU Static Page Pilot

## Scope

Static rendering uses explicit `force-static` on leaf pages that have no request-time session, database, Blob, or external API dependencies.

### Phase 1 — Deployed routes

| Route pattern | File |
| --- | --- |
| `/{locale}/refund` | `src/app/[locale]/(main)/refund/page.tsx` |
| `/{locale}/privacy` | `src/app/[locale]/(main)/privacy/page.tsx` |
| `/{locale}/terms` | `src/app/[locale]/(main)/terms/page.tsx` |
| `/{locale}` (home) | `src/app/[locale]/(main)/page.tsx` |
| `/{locale}/face-shape-detector` | `src/app/[locale]/(main)/face-shape-detector/page.tsx` |
| `/{locale}/store` | `src/app/[locale]/(main)/store/page.tsx` |
| `/{locale}/blog/oliver-peoples-finley-vintage-review` | `src/app/[locale]/(main)/blog/oliver-peoples-finley-vintage-review/page.tsx` |

### Phase 2 — Blog full static + ISR SEO pages

| Route pattern | File | Previous mode |
| --- | --- | --- |
| `/{locale}/blog` | `src/app/[locale]/(main)/blog/page.tsx` | `revalidate = 3600` (ISR) |
| `/{locale}/blog/tag/{tag}` | `src/app/[locale]/(main)/blog/tag/[tag]/page.tsx` | `revalidate = 3600` (ISR) |
| `/{locale}/blog/eyewear-trends-2026-glasses-sunglasses` | `src/app/[locale]/(main)/blog/eyewear-trends-2026-glasses-sunglasses/page.tsx` | dynamic |
| `/{locale}/blog/ai-face-analysis-for-glasses-guide` | `src/app/[locale]/(main)/blog/ai-face-analysis-for-glasses-guide/page.tsx` | dynamic |
| `/{locale}/blog/best-glasses-for-face-shapes-guide` | `src/app/[locale]/(main)/blog/best-glasses-for-face-shapes-guide/page.tsx` | dynamic |
| `/{locale}/blog/best-ai-virtual-glasses-tryon-tools-2025` | `src/app/[locale]/(main)/blog/best-ai-virtual-glasses-tryon-tools-2025/page.tsx` | dynamic |
| `/{locale}/blog/virtual-try-on-reduce-eyewear-returns` | `src/app/[locale]/(main)/blog/virtual-try-on-reduce-eyewear-returns/page.tsx` | dynamic |
| `/{locale}/blog/celebrity-glasses-style-guide-2025` | `src/app/[locale]/(main)/blog/celebrity-glasses-style-guide-2025/page.tsx` | dynamic |
| `/{locale}/blog/prescription-glasses-virtual-tryon-guide` | `src/app/[locale]/(main)/blog/prescription-glasses-virtual-tryon-guide/page.tsx` | dynamic |
| `/{locale}/blog/browline-clubmaster-glasses-complete-guide` | `src/app/[locale]/(main)/blog/browline-clubmaster-glasses-complete-guide/page.tsx` | dynamic |
| `/{locale}/blog/how-to-choose-glasses-for-your-face` | `src/app/[locale]/(main)/blog/how-to-choose-glasses-for-your-face/page.tsx` | dynamic |
| `/{locale}/blog/tom-ford-luxury-eyewear-guide-2025` | `src/app/[locale]/(main)/blog/tom-ford-luxury-eyewear-guide-2025/page.tsx` | dynamic |
| `/{locale}/blog/rayban-glasses-virtual-tryon-guide` | `src/app/[locale]/(main)/blog/rayban-glasses-virtual-tryon-guide/page.tsx` | dynamic |
| `/{locale}/blog/acetate-vs-plastic-eyeglass-frames-guide` | `src/app/[locale]/(main)/blog/acetate-vs-plastic-eyeglass-frames-guide/page.tsx` | dynamic |
| `/{locale}/blog/prescription-glasses-online-shopping-guide-2025` | `src/app/[locale]/(main)/blog/prescription-glasses-online-shopping-guide-2025/page.tsx` | dynamic |
| `/{locale}/blog/find-perfect-glasses-online-guide` | `src/app/[locale]/(main)/blog/find-perfect-glasses-online-guide/page.tsx` | dynamic |
| `/{locale}/sunglasses-for/{faceShape}` | `src/app/[locale]/(main)/sunglasses-for/[faceShape]/page.tsx` | `revalidate = 86400` (ISR) |
| `/{locale}/face-shapes/{faceShape}` | `src/app/[locale]/(main)/face-shapes/[faceShape]/page.tsx` | `revalidate = 86400` (ISR) |
| `/{locale}/hairstyles-for/{faceShape}` | `src/app/[locale]/(main)/hairstyles-for/[faceShape]/page.tsx` | `revalidate = 86400` (ISR) |
| `/{locale}/face-shapes/compare/{comparison}` | `src/app/[locale]/(main)/face-shapes/compare/[comparison]/page.tsx` | `revalidate = 86400` (ISR) |

Each page uses:

```ts
export const dynamic = 'force-static'
```

The blog tag page also has a new `generateStaticParams()` that enumerates all tags from the static blog post list, ensuring every tag route is pre-rendered at build time.

### Excluded from Phase 2 (not safe for force-static at that time)

The following pages were audited but intentionally excluded in Phase 2 because they had request-time dependencies. **Most were later converted in Phase 4 (ADR-005) using the client-side gate pattern:**

| Route pattern | File | Reason (Phase 2) | Status |
| --- | --- | --- | --- |
| `/{locale}/pricing` | `src/app/[locale]/(main)/pricing/page.tsx` | `getServerSession()` — displays personalized pricing | **Converted in Phase 4** (PricingSection uses `useSession`) |
| `/{locale}/style/{faceShape}` | `src/app/[locale]/(main)/style/[faceShape]/page.tsx` | Prisma DB call (`prisma.faceShape.findFirst`) + `dynamicParams = true` | Still dynamic |
| `/{locale}/try/{slug}` | `src/app/[locale]/(main)/try/[slug]/page.tsx` | Prisma DB call (`prisma.glassesFrame.findUnique`) | Still dynamic |
| `/{locale}/category/{category}` | `src/app/[locale]/(main)/category/[category]/page.tsx` | Prisma DB calls (2 queries) | Still dynamic |
| `/{locale}/brand/{brand}` | `src/app/[locale]/(main)/brand/[brand]/page.tsx` | Prisma DB call (`prisma.glassesFrame.findMany`) | Still dynamic |
| `/sitemap.xml` | `src/app/sitemap.ts` | Prisma DB calls (4 queries) — sitemap must reflect latest DB data | Still dynamic |

## Out of scope

No changes are made to authentication, payments, credits, database access, image uploads, AI generation, try-on, compare, or shared navigation **logic**. However, the rendering strategy for these pages has changed — see Phase 4 below.

**Root layout (`src/app/layout.tsx`) no longer resolves session for `SessionProvider`.** This was removed in ADR-005 (2026-07-22). The root layout now renders `SessionProvider` without a server-side session prop — next-auth fetches the session on the client. This was the critical change that allowed all public pages to render as SSG.

### Phase 4 — ADR-005: SSR to client-side gate (2026-07-22)

All remaining public pages that used `getServerSession()` were converted to the **client-side gate pattern**. See `docs/decisions/ADR-005-ssr-to-client-gate.md` for the full decision record.

| Route pattern | Gate component | Previous mode | Current mode |
| --- | --- | --- | --- |
| `/{locale}/style-explorer` | `StyleExplorerGate` | Dynamic (getServerSession) | SSG (●) |
| `/{locale}/try-on/[type]` | `TryOnGate` | Dynamic (getServerSession) | SSG (●) |
| `/{locale}/try-on/glasses/compare` | `ComparePageClient` | Dynamic (getServerSession) | SSG (●) |
| `/{locale}/face-analysis` | `FaceAnalysisGate` | Dynamic (getServerSession) | SSG (●) |
| `/{locale}/pricing` | `PricingSection` (uses `useSession`) | Dynamic (getServerSession) | SSG (●) |
| `/{locale}/dashboard` | `DashboardPageClient` | Dynamic (getServerSession + prisma) | SSG (●) |
| `/{locale}/dashboard/history` | `HistoryPageClient` | Dynamic (getServerSession + prisma) | SSG (●) |
| `/{locale}/payments` | `PaymentsPageClient` | Dynamic (getServerSession + prisma) | SSG (●) |
| `/{locale}/debug-images` | `DebugImagesPageClient` | Dynamic (getServerSession + prisma) | SSG (●) |

**Supporting changes in the same phase:**
- `setRequestLocale()` added to all layouts and pages using `next-intl/server` functions
- `prisma.$connect()` warm-up removed (no-op for Neon HTTP driver)
- JWT callback `trigger='update'` rate-limited to 30 seconds via `lastSyncTime` in token
- `perfLogger` race condition fixed (silent skip in serverless concurrent execution)
- `metadataBase` added to `generateSEO()` for OG image URL resolution
- Header component: loading placeholder added to prevent LoginButton → UserMenu flash

**Pages that remain excluded from SSG (still dynamic ƒ):**
- `/{locale}/style/{faceShape}` — Prisma DB call + `dynamicParams = true`
- `/{locale}/try/{slug}` — Prisma DB call
- `/{locale}/category/{category}` — Prisma DB calls
- `/{locale}/brand/{brand}` — Prisma DB call
- `/sitemap.xml` — Prisma DB calls (must reflect latest data)
- `/{locale}/admin/*` — Requires server-side auth
- `/api/*` — Route handlers (on-demand)

### Phase 3 — Middleware matcher narrowing

Previously the middleware matcher was extremely broad — it matched every page request (excluding only `api`, `_next`, `_vercel`, and paths with a dot). This meant that even fully static pages (blog, legal, SEO guides) still triggered an Edge Function invocation on every request, even though the middleware did nothing useful for paths that already had a locale prefix.

The matcher has been narrowed to three rules:

| Matcher rule | Purpose |
| --- | --- |
| `/` | Root path — needs locale detection redirect (e.g. `/` → `/en`) |
| `/admin/:path*` | Admin routes — needs JWT authentication |
| `((?!(?:en\|id\|ar\|ru\|de\|ja\|es\|pt\|fr)(?:/\|$)\|api\|_next\|_vercel\|admin\|.*\\..*).*)` | Routes without a locale prefix — needs locale detection redirect |

Routes with an existing locale prefix (e.g. `/en/blog`, `/es/face-shapes/oval`) no longer trigger middleware at all. This is safe because:

- Locale is resolved from the `[locale]` route segment parameter (`src/i18n/request.ts`), not from middleware.
- `generateStaticParams` in `src/app/[locale]/layout.tsx` enumerates all 9 locales at build time.
- Legacy non-locale paths are already handled by `next.config.js` `redirects()` (18 permanent redirects), which execute before middleware.

Admin debug `console.log` statements (including `JSON.stringify(token)`) were also removed from the admin auth branch.

## Preview verification

1. Confirm the Vercel preview build succeeds.
2. For each route above, confirm all supported locale variants return HTTP 200 (locales: `en`, `id`, `ar`, `ru`, `de`, `ja`, `es`, `pt`, `fr`).
3. Confirm visible content, header, footer, breadcrumbs, and internal links are unchanged.
4. Confirm build output identifies these routes as static (○) rather than dynamic (λ) where Next.js reports route mode.
5. Confirm no hydration, locale, or routing errors occur.
6. Smoke-check interactive client boundaries still work where present (face-shape detector upload, store lead form).
7. For blog tag pages, confirm each tag from `staticBlogPosts` resolves correctly across all locales.

## Production follow-up

After merge, observe Vercel runtime logs and Fluid Active CPU for 48–72 hours. The blog article and SEO route families are crawler-facing and high-traffic; static rendering should materially reduce runtime invocations from crawlers and organic visitors.

## Rollback

Revert the bounded commit for the affected page if the preview build fails or any locale route regresses.
