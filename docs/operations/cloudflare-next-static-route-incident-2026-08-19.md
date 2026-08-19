# VisuTry Production Incident — `/_next/static/*` Worker Route

**Date:** 2026-08-19  
**Status:** Resolved / Guardrail Active  
**Severity:** P0  
**Owner:** Product / Engineering

## Summary

A production Cloudflare Worker Route was attached for:

```text
www.visutry.com/_next/static/*
```

while application HTML such as `/en` was still served by Vercel.

Vercel HTML referenced Vercel-build Next.js chunks, but requests for those chunks were intercepted by the Cloudflare/OpenNext asset graph. The corresponding Vercel hashes were absent there, so Cloudflare returned 404 HTML responses for JavaScript chunk URLs. This caused `ChunkLoadError` and, for affected browser states, a client-side application failure/white screen.

## Confirmed Evidence

- `https://www.visutry.com/en` returned Vercel HTML (`x-vercel-cache=HIT`, `x-vercel-id` present).
- The current HTML referenced the affected chunk hashes.
- The same chunk paths under `https://www.visutry.com/_next/static/...` returned **404** from Cloudflare with:
  - `x-visutry-router-backend: cloudflare`
  - `x-visutry-router-layer: layer1-static-asset`
  - `content-type: text/html`
- The exact same chunk paths under `https://visutry.vercel.app/_next/static/...` returned **200** with immutable JavaScript caching.
- Incognito and hard reload could render the SSR page, but the missing chunk requests remained observable until the Worker Route was removed.

## Root Cause

Hybrid static-asset ownership mismatch:

```text
Vercel HTML build N
        ↓
references /_next/static chunks from build N
        ↓
www /_next/static/* intercepted by Cloudflare/OpenNext build M
        ↓
chunk hash from build N does not exist in build M
        ↓
404 → ChunkLoadError
```

The production route violated the intended B4.2D boundary. `/_next/static/*` had been deliberately parity-gated because Vercel and `CLOUDFLARE_BUILD=1` emit independent webpack graphs.

PR #115 / the OpenNext incremental-cache fix did **not** itself add this Worker Route, but the subsequent Cloudflare/OpenNext deployment refreshed the Cloudflare asset graph and exposed the unsafe route ownership mismatch.

## Recovery

The production hotfix was operational only:

```text
DELETE Worker Route:
www.visutry.com/_next/static/*
```

No application code, DNS, Vercel deployment, or OpenNext cache wiring was changed.

After deletion, `/_next/static/*` again follows the normal www/Vercel path, restoring HTML/chunk build consistency.

## Permanent Guardrail

### Required invariant

> **HTML owner == `/_next/static` asset owner.**

While any production HTML on `www.visutry.com` is Vercel-owned, this Worker Route is **forbidden**:

```text
www.visutry.com/_next/static/*
```

Do not reactivate it based only on same-commit source parity, successful Cloudflare build output, or local/static-asset availability.

It may only be reconsidered if production HTML ownership is migrated so that the HTML and every deployment-specific Next.js static chunk are served from the same build graph, with explicit production transition testing.

### Do not substitute

Do not fix this class of incident by:

- asking users to clear browser cache;
- globally disabling Cloudflare cache;
- changing React page code;
- routing all `/_next/static/*` to Cloudflare while Vercel still owns HTML;
- relying on a one-time hard reload as the architectural fix.

## Required Production Smoke Check

After any Cloudflare route or deployment change that touches the hybrid boundary:

1. Fetch `https://www.visutry.com/en`.
2. Extract several referenced `/_next/static/chunks/*.js` URLs.
3. Request those exact URLs through `www.visutry.com`.
4. Require HTTP 200 and JavaScript content type.
5. Fail the rollout if any referenced chunk returns 404 or a Cloudflare HTML response.
6. Confirm no production Worker Route exists for `www.visutry.com/_next/static/*` while Vercel owns HTML.

## Relationship to B4.2D

The canonical B4.2D production cutover document already defined the intended state as:

```text
/_next/static/* NOT ACTIVATED
unmatched → Vercel origin
```

This incident is therefore a **runtime configuration drift from the documented architecture**, not a change in the intended hybrid design.

See:

- `docs/operations/cloudflare-b4-2d-p0-production-cutover.md`
- `cloudflare-router/b4-production-routes.ts`
- `cloudflare-router/b4-production-routes.json`
