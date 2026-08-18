# Try-On Protected Media Boundary — Step 2A

Status: validation rerun after runtime-neutral media test refactor

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
