# ADR-011: Vercel Is the Sole Next Frontend Owner

**Status:** Accepted  
**Date:** 2026-08-19  
**Owner:** Product / Engineering

## Context

VisuTry operates a hybrid Vercel + Cloudflare architecture. During the 2026-08-19 production incident, Vercel and `CLOUDFLARE_BUILD=1` + OpenNext were proven to emit independent Next.js client artifact graphs while sharing the public `/_next/static/*` namespace.

This caused production `ChunkLoadError` failures: HTML produced by one build referenced client chunks that did not exist in the other build's asset set. Production evidence also showed Cloudflare-owned HTML could reference CF-only chunks while the public `/_next/static/*` path resolved to Vercel.

The failure mode is structural, not a cache-only issue. Same Git commit does not guarantee the same client graph across independent builds.

## Decision

Vercel is the sole production owner and producer of the Next.js frontend:

- Next HTML
- RSC / Flight responses
- the browser client artifact graph
- `/_next/static/*`
- Next runtime redirects and sitemap output

Cloudflare remains the traffic-scale edge layer and may own only explicitly approved non-Next capabilities, currently including:

- non-Next public static assets;
- control files;
- approved lightweight public APIs and direct-Neon reads;
- DNS / proxy / CDN / WAF / traffic shaping.

The shared `/_next/static/*` namespace must have exactly one producer.

`www.visutry.com/_next/static/*` is forbidden as a production Cloudflare Worker Route while this ADR is active. Cloudflare must not serve production Next HTML/RSC/client assets unless the entire Next frontend is migrated as one self-consistent build/runtime and this ADR is superseded.

## Consequences

Positive:

- Eliminates the dual Next client-graph failure class by construction.
- Keeps Cloudflare available for high-volume, low-compute traffic without requiring it to render Next HTML.
- Makes production ownership explicit and testable.
- Simplifies rollback and deployment skew reasoning.

Tradeoffs:

- Public Next HTML still originates from Vercel unless separately cached at the Cloudflare proxy/CDN layer.
- OpenNext remains useful for staging/full-migration research but is not part of the production Next frontend critical path.
- A future full Cloudflare frontend migration must be atomic at the Next frontend ownership boundary rather than route-by-route across independent builds.

## Enforcement

- `cloudflare-router/b4-production-public-slice.ts`: `B4_NEXT_FRONTEND_OWNER = 'vercel'`; HTML/RSC/Next assets classify as Vercel-required.
- `cloudflare-router/app-host-worker.ts`: `forceVercelForNextFrontend()` defense-in-depth guard.
- `cloudflare-router/b4-production-routes.ts`: production generator emits only approved non-Next routes and hard-blocks `/_next/*`.
- `scripts/production-smoke.mjs`: verifies Vercel ownership and fails on referenced Next asset 404s.

## Related Documents

- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/operations/cloudflare-next-static-route-incident-2026-08-19.md`
- `docs/operations/README.md`
- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`
- `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`

## Supersession Rule

This ADR may only be superseded by a decision that moves the **entire** production Next frontend ownership boundary to another runtime as one self-consistent build/runtime. A route-level experiment or same-commit parity result is insufficient.
