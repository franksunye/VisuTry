# Try-On Protected Media Boundary — Step 2A

Status: resolved in main @ 4703e0f99e86be1fde38df8f1b9c4cebf89ffccd; Vercel production validation passed

## Scope

Step 2A establishes application-owned authenticated media delivery before changing Try-On Blob storage access.

Included:
- Owner media routes for user/item/result images.
- Owner-facing detail, history, poll, synchronous submit, Compare recovery, Style Explorer recovery, and Dashboard serialization through protected media paths.
- Authenticated media images bypass Next.js Image Optimization so browser session credentials reach the media route.
- Legacy public Blob/provider URLs and legacy Gemini data URLs remain readable behind the media route.
- Client-visible Try-On metadata is allowlisted so internal storage/provider URLs do not cross the browser DTO boundary.
- Admin Try-On detail gets a separate admin-authenticated media path to avoid repeating the Face Analysis admin regression when storage becomes private.

Not included:
- No Try-On Blob writes have been changed from public to private.
- No historical media migration.
- No Share/public capability changes.
- No Cloudflare route, DNS, or Wrangler changes.

## Gate before Step 2B

- Latest Vercel Preview build passes.
- TypeScript gate passes.
- New owner/admin protected-media and DTO regression tests pass.
- Critical business regression and PostgreSQL contract gates pass.
- Any remaining full-unit failures are confirmed as pre-existing and unrelated to this media-boundary change.
- Browser-facing owner DTOs do not expose raw storage URLs or legacy image data URLs.
- Existing public/provider/data-url records remain compatible through the protected route.

## Resolved RCA and production closure

The incident root cause was a storage-boundary violation in the Face Analysis Top
Picks Consumer DTO. `serializeBatch()` passed the persisted
`TryOnTask.resultImageUrl` through unchanged. That value is a storage locator,
not a browser-safe media contract. When it identified a private Vercel Blob,
the browser requested the Blob directly and received HTTP 403. This was a
media-delivery defect; it did not require TryOnTask regeneration and was not a
credits or payment failure.

The canonical Consumer contract is now:

`/api/try-on/{taskId}/media/{kind}`

For completed results, `resultImageUrl` is always
`/api/try-on/{taskId}/media/result`. Consumer DTOs used by Top Picks creation,
idempotent/recovery reads, polling, history, and detail flows use this
application-owned URL. The Consumer media route enforces authentication and
ownership before reusing the shared media reader, which retains compatibility
with private Blob sources, legacy HTTP(S) sources, and data URLs. Protected
Top Picks images request this same-origin endpoint directly rather than through
Next.js Image Optimization. Public share/gallery output exposes only the
completed result endpoint; the existing Admin route and shared reader contract
remain separate and unchanged in authorization semantics.

The fix was merged to `main` at
`4703e0f99e86be1fde38df8f1b9c4cebf89ffccd`. Vercel production reached READY,
and authenticated production validation confirmed that recovered completed
slots loaded through the Consumer proxy, with no private Blob request and no
`/_next/image` request. Regression coverage also verifies private-Blob reads,
ownership/authentication, partial-batch recovery, legacy compatibility, and
actual browser image loading. Refresh/recovery did not create replacement
tasks or mutate credits/payment state.

Any Cloudflare Workers build or deployment failure is a separate
infrastructure follow-up and is not part of this Consumer media RCA. This fix
made no Cloudflare route, DNS, Wrangler, or Blob-visibility change.

## Separate 2026-09-06 Blob capacity incident

This incident must not be conflated with the Consumer DTO boundary defect
above. Later on 2026-09-06, authenticated Admin Try-On previews and Consumer
media delivery both failed because the Vercel Blob store had exhausted its
Hobby-plan usage allowance. The Vercel Storage UI explicitly reported that
access was suspended until the next cycle, and authorized application-owned
media requests failed downstream with `Vercel Blob: Failed to fetch blob: 403
Forbidden`, which the application returned as HTTP 502.

The incident timeline distinguishes capacity exhaustion from an application
credential defect:

- Production deployment `2f27e0fb11fdc5ca78d0a049a6f24a7798719dbd`, which
  added a speculative dedicated-token selection path, reached READY.
- After that deployment and before the plan upgrade, the same authenticated
  Admin media request still returned HTTP 502 and Blob returned HTTP 403.
- The account was upgraded from Hobby to Pro without changing Blob visibility
  or persisted task data.
- The same application-owned Admin media request then returned HTTP 200,
  `image/jpeg`, with a browser-decoded size of 900 by 1200 pixels.

Therefore the direct root cause of this later outage was exhausted provider
capacity, and the restoring action was the Vercel Pro upgrade. The dedicated
token selection change was not the incident fix and is reverted separately.
The canonical Consumer media boundary remains required and unchanged.

### Preventive controls

- Keep the production team on a plan that permits on-demand Blob usage; do not
  rely on a hard Hobby allowance for customer media delivery.
- Vercel Pro Spend Management is enabled with a USD 20 on-demand budget,
  notifications enabled, and automatic production pausing disabled. Vercel
  sends threshold notifications as the configured budget is approached.
- Review the team Usage dashboard and the private Blob store's Storage,
  Simple Operations, Advanced Operations, and Data Transfer during the regular
  operations review. Provider usage is the authoritative signal; an
  application database count is not a substitute for billing-cycle usage.
- Treat Blob HTTP 403 followed by application media HTTP 502 as a capacity or
  provider-access incident first. Check the Storage usage banner and billing
  state before changing credentials, regenerating tasks, changing visibility,
  or modifying credits/payment data.
