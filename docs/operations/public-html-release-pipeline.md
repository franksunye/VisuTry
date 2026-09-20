# Public HTML Release Pipeline v1

**Status:** Manual-only release control plane for the live Consumer and Store/Campaign public-edge contracts.
**Last validated:** 2026-09-20

VisuTry keeps the hosting boundary explicit:

- Vercel is the canonical producer of Next HTML, RSC/Flight, `/_next/static/*`, application runtime, APIs, auth, payments, Face Analysis, Try-On, and AI runtime.
- Cloudflare is the public delivery/cache layer for the reviewed traffic Worker and its non-Next Static Assets. It may serve a cached final anonymous HTML response produced by Vercel for the exact reviewed Public HTML Offload allowlist.
- Cloudflare does not independently render, build, or produce a second Next.js frontend or client artifact graph.
- Cloudflare may deliver final anonymous HTML produced by Vercel for the separately reviewed Consumer and bounded EN Store/Campaign contracts. This does not transfer Next.js producer ownership to Cloudflare.

## Current production state — 2026-09-20

Consumer Public HTML Offload is **PRODUCTION PASS**.

- Production deployment identity and active Worker version are verified by the release control plane; exact route inventory remains code-authoritative.
- The code-authoritative `PUBLIC_HTML_OFFLOAD_PURGE_URLS` allowlist has seven exact Consumer URLs; all seven were successfully purged.
- All seven URLs observed valid `MISS → HIT` behavior with HTTP 200, `x-visutry-edge-cache: HIT`, and `CF-Cache-Status: HIT` on cache hits.
- Browser smoke passed for all seven Public pages. Try-On, Face Analysis, and Dashboard remained healthy.
- No Vercel configuration, DNS, D1, or unrelated Cloudflare rule changes were made for this validation.

Store/Campaign Public Edge is also **PRODUCTION PASS** for the bounded EN
`/store/*` and `/c/*` public families. The exact live Worker route inventory is
owned by the repository code/generated manifest and is intentionally not
duplicated here.

- Anonymous eligible final HTML may be served from Cloudflare after being produced by Vercel.
- Attribution query variants such as UTM and click identifiers share the canonical HTML cache object; unsafe, personalized, authenticated, RSC, and prefetch requests bypass to Vercel.
- Freshness is write-driven through deterministic per-document Cache-Tag invalidation.
- The public-to-interactive boundary is intentional: passive page load does not create a Store Session; the explicit privacy/interaction boundary creates it, and UTM attribution reaches the canonical MerchantSession path.
- The production proof included cache `HIT → write → MISS/DYNAMIC → refreshed HIT → restore → MISS/DYNAMIC → original HIT`, with no manual Cloudflare purge and no production residue.
- The public HTML and interactive flows remained healthy; no image upload, AI, quota, or payment side effect was part of the proof.

The seven-route inventory remains authoritative in `cloudflare-router/public-html-offload.ts`; this document intentionally does not duplicate it.

## Store/Campaign public HTML v1

The implementation adds `www.visutry.com/en/store/*` and `www.visutry.com/en/c/*` as two bounded Worker invocation routes. The Worker classifier is stricter than the Cloudflare wildcard: only exact semantic detail shapes with valid slugs can enter the shared anonymous HTML cache. Roots, malformed/extra segments, non-EN locales, RSC/Flight, cookies/authorization, preview/personalized requests, and unknown query parameters fail open to Vercel.

The Store/Campaign query contract is deliberately allowlisted. `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `ttclid`, `msclkid`, `source`, `medium`, `surface`, `campaign`, and the bounded client-only `merchantContinuation` context are ignored in the HTML cache key because they do not change server-rendered discovery HTML. The browser URL is preserved. Unknown parameters remain a Vercel bypass, and the existing Consumer routes retain their separate exact no-query contract.

Vercel remains the sole Next.js producer. Cloudflare only caches final 200 anonymous HTML fetched from Vercel. The existing seven Consumer purge URLs and release warm-up contract remain unchanged. Store/Campaign freshness is write-driven through deterministic per-document `Cache-Tag` values and the server-only purge client using `CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN` and `CLOUDFLARE_ZONE_ID`; safe attribution query variants therefore share one canonical cache object without relying on purge-by-URL for Worker custom Cache API keys. Purges are processed in batches of at most 100 and never truncate the derived set.

Successful public-discovery writes invalidate Next tags/paths first and then purge the exact affected Store/Campaign document tags. Merchant and catalog writes pass the before/after public-admission membership so publish, unpublish, deactivation, removal, and slug changes purge both old and new tags. Purge failure is logged with resource type, batch counts, and partial-failure state; it does not falsely roll back a committed database write, and writes never warm the edge.

Asset audit completed 2026-09-20 against valid production HTML samples `/en/store/ello-sunglasses`, `/en/c/ello-sunglasses/petite-fit`, and `/en/c/visutry-demo/everyday-fit`: HTTP 200 responses contained stable public asset URLs and no observed `X-Amz-*`, `signature`, `token`, `expires`, `/signed/`, or `/private/` markers. The runtime `PRIVATE_SIGNED` policy is not made public by this branch. This is a bounded sample gate, not a storage-policy change; any future production sample containing an expiring signed asset URL blocks expansion of the Store/Campaign edge contract. `/_next/image` and `/_next/static/*` remain Vercel-owned.

## Normal release

1. Vercel creates the Production deployment.
2. The release workflow independently verifies the deployment ID, project ID, team ID, `target=production`, `readyState=READY`, expected Git SHA, and `www.visutry.com` alias through the Vercel API.
3. The target SHA must equal the current fetched `origin/main` SHA. Dispatch inputs are not proof.
4. The workflow purges the seven exact Public HTML URLs, warms them with anonymous HTML requests, and requires an eventual `x-visutry-edge-cache: HIT` for every URL.
5. The existing `scripts/production-smoke.mjs` verifies Vercel ownership of Next HTML, RSC/Flight, and `/_next/static`, plus protected application guards.

## Cloudflare-affecting release

The workflow classifies the first-parent change set of the target main commit. A Cloudflare deploy is required when the change touches:

- `cloudflare-router/**`
- `wrangler.production-traffic-layer.jsonc`
- `scripts/prepare-cloudflare-assets.mjs`
- `public/**` (the current asset preparation stages all of `public/`)
- `package.json` or `package-lock.json` (the Worker build/deploy dependency surface)

When required, the order is:

`Vercel proof → Cloudflare artifact build/deploy → live route verification (derived contract) → exact seven-file Consumer purge → warm/HIT verification → Production Smoke`.

Ordinary application page copy, React components, APIs, Merchant logic, and database changes do not require a Cloudflare Worker deploy because Vercel remains their producer. If the changed-file comparison cannot be established, the classifier fails closed and requires a deploy. Manual `force` remains available for an explicit conservative deploy; there is no skip mode.

## Workflow and credentials

`.github/workflows/public-html-release.yml` is intentionally `workflow_dispatch` only. It has no push, schedule, or automatic `repository_dispatch` trigger. It uses `contents: read` and a non-canceling production concurrency group.

Existing contracts reused:

- `VERCEL_PROJECT_ID` and `VERCEL_TEAM_ID` repository Variables
- `VERCEL_D1_DEPLOYMENT_READ_TOKEN` repository Secret for read-only Vercel proof
- `CLOUDFLARE_ZONE_ID` repository Variable
- `CLOUDFLARE_D1_CACHE_PURGE_TOKEN` repository Secret for exact URL cache purge

Activation prerequisite for the optional Worker deployment and live route read is a separate least-privilege repository Secret:

`CLOUDFLARE_PUBLIC_HTML_WORKER_DEPLOY_TOKEN`

It must be scoped to this zone/account for Worker deployment and Worker Route read/verification. It is deliberately separate from the cache-purge token. No credential is created or exposed by this PR.

## Rollback

- Roll back application code through Vercel.
- Roll back the traffic Worker separately through the Cloudflare Worker version mechanism.
- After either rollback, purge and warm the same seven exact Public HTML URLs.
- Never restore a second Next.js build graph in Cloudflare or broaden the Worker route set.

The D1 cache invalidation workflow remains in place. It is a separate governance path for the existing D1 rule and is not silently replaced by this release pipeline.

## Scope and roadmap

Release Engineering v1 is intentionally manual-only: `workflow_dispatch` verifies the current main SHA and Vercel Production deployment, determines whether a Cloudflare traffic-layer deploy is required, optionally deploys Cloudflare, verifies the live derived route contract, purges the exact seven Consumer URLs, warms them to an eventual HIT, runs the existing Production Smoke, and publishes fail-closed release evidence. Store/Campaign URLs are not added to that deploy-time seven-URL release purge list; their freshness is mutation-driven.

The current release workflow's seven-URL purge/warm contract does not include Store/Campaign offload. The reviewed Store/Campaign branch uses write-driven exact invalidation instead. Neither path adds automatic release triggers, additional locales, wildcard HTML caching, or dependency-aware invalidation.

The operating posture is to keep the current Consumer and bounded EN Store/Campaign data planes stable while observing resource usage, cache correctness, freshness, and interactive attribution. Additional locales, wildcard HTML caching, and broader edge ownership remain out of scope.
