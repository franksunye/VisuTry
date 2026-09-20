# Public HTML Release Pipeline v1

**Status:** Manual-only release control plane. This document and its workflow do not change the current production data plane.
**Last validated:** 2026-09-20

VisuTry keeps the hosting boundary explicit:

- Vercel is the canonical producer of Next HTML, RSC/Flight, `/_next/static/*`, application runtime, APIs, auth, payments, Face Analysis, Try-On, and AI runtime.
- Cloudflare is the public delivery/cache layer for the reviewed traffic Worker and its non-Next Static Assets. It may serve a cached final anonymous HTML response produced by Vercel for the exact reviewed Public HTML Offload allowlist.
- Cloudflare does not independently render, build, or produce a second Next.js frontend or client artifact graph.
- The current Cloudflare production contract remains 19 exact Worker Routes and seven exact Public HTML Offload routes.

## Current production state

Consumer Public HTML Offload is **PRODUCTION PASS**.

- Production main SHA: `5da5385552f52890f43b40ac629a0e7db75fa578`.
- Worker: `visutry-cf-production`; validated Worker version: `0b673843-dbdc-40f5-a4b1-2306c7eb6518`.
- The production Worker contract has 19 routes. The code-authoritative `PUBLIC_HTML_OFFLOAD_PURGE_URLS` allowlist has seven exact URLs; all seven were successfully purged.
- All seven URLs observed valid `MISS → HIT` behavior with HTTP 200, `x-visutry-edge-cache: HIT`, and `CF-Cache-Status: HIT` on cache hits.
- Browser smoke passed for all seven Public pages. Try-On, Face Analysis, and Dashboard remained healthy.
- No Vercel configuration, DNS, D1, or unrelated Cloudflare rule changes were made for this validation.

The seven-route inventory remains authoritative in `cloudflare-router/public-html-offload.ts`; this document intentionally does not duplicate it.

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

## Scope and roadmap

Release Engineering v1 is intentionally manual-only: `workflow_dispatch` verifies the current main SHA and Vercel Production deployment, determines whether a Cloudflare traffic-layer deploy is required, optionally deploys Cloudflare, verifies the live 19-route contract, purges the exact seven URLs, warms them to an eventual HIT, runs the existing Production Smoke, and publishes fail-closed release evidence.

V1 does not include automatic release triggers, Store/Campaign offload, additional locales, wildcard HTML caching, or dependency-aware invalidation.

The operating posture is to keep the 19-route / 7-HTML-route production data plane stable while observing Vercel and Cloudflare usage/resource changes. The near-term next step is to finish review and manually validate Release Engineering v1. Only later, when justified by evidence, should the team consider a verified Vercel Production trigger, Store/Campaign edge offload, additional locales, or more granular invalidation.
