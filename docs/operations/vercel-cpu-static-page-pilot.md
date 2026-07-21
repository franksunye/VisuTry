# Vercel CPU Static Page Pilot

## Scope

This pilot changes only the localized Refund Policy page:

- `src/app/[locale]/(main)/refund/page.tsx`

The page is explicitly configured for static rendering with:

```ts
export const dynamic = 'force-static'
```

## Out of scope

No changes are made to authentication, payments, credits, database access, image uploads, AI generation, try-on, compare, middleware, root layouts, or shared navigation.

## Preview verification

1. Confirm the Vercel preview build succeeds.
2. Confirm `/en/refund`, `/es/refund`, `/pt/refund`, and other supported locale variants return HTTP 200.
3. Confirm the page content, home link, header, and footer are unchanged.
4. Confirm the build output identifies the refund route as static rather than a runtime function.
5. Confirm no hydration, locale, or routing errors occur.

## Production follow-up

After merge, observe Vercel runtime logs and Fluid Active CPU for 48–72 hours before applying the same change to Privacy Policy and Terms of Service.

## Rollback

Revert the pilot commit if the preview build or any locale route fails.
