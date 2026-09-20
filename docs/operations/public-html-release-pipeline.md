# Public HTML Release Pipeline v1

**Status:** Manual-only release control plane. This document and its workflow do not change the current production data plane.

VisuTry keeps the hosting boundary explicit:

- Vercel is the canonical producer of Next HTML, RSC/Flight, `/_next/static/*`, application runtime, APIs, auth, payments, Face Analysis, Try-On, and AI runtime.
- Cloudflare is the public delivery/cache layer for the reviewed traffic Worker and its non-Next Static Assets.
- The current Cloudflare production contract remains 19 exact Worker Routes and seven exact Public HTML Offload routes.

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

`Vercel proof → Cloudflare artifact build/deploy → live 19-route verification → exact seven-file purge → warm/HIT verification → Production Smoke`.

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
