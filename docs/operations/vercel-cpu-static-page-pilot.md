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

### Excluded from Phase 2 (not safe for force-static)

The following ISR pages were audited but intentionally excluded because they have request-time dependencies:

| Route pattern | File | Reason |
| --- | --- | --- |
| `/{locale}/pricing` | `src/app/[locale]/(main)/pricing/page.tsx` | `getServerSession()` — displays personalized pricing based on user session |
| `/{locale}/style/{faceShape}` | `src/app/[locale]/(main)/style/[faceShape]/page.tsx` | Prisma DB call (`prisma.faceShape.findFirst`) + `dynamicParams = true` |
| `/{locale}/try/{slug}` | `src/app/[locale]/(main)/try/[slug]/page.tsx` | Prisma DB call (`prisma.glassesFrame.findUnique`) |
| `/{locale}/category/{category}` | `src/app/[locale]/(main)/category/[category]/page.tsx` | Prisma DB calls (2 queries) |
| `/{locale}/brand/{brand}` | `src/app/[locale]/(main)/brand/[brand]/page.tsx` | Prisma DB call (`prisma.glassesFrame.findMany`) |
| `/sitemap.xml` | `src/app/sitemap.ts` | Prisma DB calls (4 queries) — sitemap must reflect latest DB data |

## Out of scope

No changes are made to authentication, payments, credits, database access, image uploads, AI generation, try-on, compare, middleware, root layouts, or shared navigation.

Note: `src/app/layout.tsx` still resolves session for `SessionProvider`. Leaf-page static rendering reduces page-segment work and improves CDN cacheability; it does not remove root-layout session lookup. Shared layout optimization remains a later phase.

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
