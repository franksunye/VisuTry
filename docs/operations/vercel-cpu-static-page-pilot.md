# Vercel CPU Static Page Pilot

## Scope

Phase 1 (first tier) static rendering uses explicit `force-static` on leaf pages that have no request-time session, database, Blob, or external API dependencies.

### Deployed routes

| Route pattern | File |
| --- | --- |
| `/{locale}/refund` | `src/app/[locale]/(main)/refund/page.tsx` |
| `/{locale}/privacy` | `src/app/[locale]/(main)/privacy/page.tsx` |
| `/{locale}/terms` | `src/app/[locale]/(main)/terms/page.tsx` |
| `/{locale}` (home) | `src/app/[locale]/(main)/page.tsx` |
| `/{locale}/face-shape-detector` | `src/app/[locale]/(main)/face-shape-detector/page.tsx` |
| `/{locale}/store` | `src/app/[locale]/(main)/store/page.tsx` |
| `/{locale}/blog/oliver-peoples-finley-vintage-review` | `src/app/[locale]/(main)/blog/oliver-peoples-finley-vintage-review/page.tsx` |

Each page uses:

```ts
export const dynamic = 'force-static'
```

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

## Production follow-up

After merge, observe Vercel runtime logs and Fluid Active CPU for 48–72 hours before expanding static rendering to additional blog articles or public product landing pages.

## Rollback

Revert the bounded commit for the affected page if the preview build fails or any locale route regresses.
