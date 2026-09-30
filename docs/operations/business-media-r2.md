# Business Media Delivery — Cloudflare R2

**Status:** Production active; live publication verified in GitHub Issue #268  
**Owner:** Product / Engineering  
**Last reconciled:** 2026-09-30

## Decision

VisuTry Business marketing resources use a dedicated Cloudflare R2 origin behind a stable custom domain.

```text
media.visutry.com
        ↓
Cloudflare R2
        ↓
versioned public objects
```

This is a media-delivery layer only. It does not change the canonical application ownership boundary:

> Vercel remains the sole Next.js producer. Cloudflare R2 serves approved non-Next media objects.

The existing `assets.visutry.com` MediaPipe delivery path remains separate and must not be repurposed.

## v1 storage

Preferred bucket:

```text
visutry-business-media
```

Custom domain:

```text
media.visutry.com
```

Approved initial object keys:

```text
business/whitepapers/visutry-ai-eyewear-decision-experience-instore-retail-v1.3.pdf
business/demos/visutry-instore-retail-product-demo-v2.mp4
```

The object bytes must be the already-approved source assets. Publishing must not silently re-export, transcode, rewrite, or replace them.

## Metadata

Expected media types:

- PDF: `application/pdf`
- MP4: `video/mp4`

Versioned object keys may receive long-lived public cache headers. Do not introduce mutable unversioned aliases until an explicit invalidation/version policy exists.

## Website ownership

Canonical website metadata lives in:

```text
src/config/business-resources.ts
```

Pages and components must not independently hard-code alternate resource URLs.

The canonical public resource hub is:

```text
/en/business/resources
```

## Video delivery decision

The initial approved demo is small enough for direct R2 MP4 delivery. The website uses native video controls, no autoplay, and `preload="none"`.

This is not a permanent decision that all future videos belong on raw R2.

Re-evaluate Cloudflare Stream when the library develops one or more of these characteristics:

- materially longer or larger video;
- meaningful recurring playback volume;
- need for adaptive bitrate;
- multiple renditions / device optimization;
- signed playback or richer video analytics;
- a growing reusable video library.

The page IA and resource IDs must remain stable if the underlying video delivery provider changes.

## Production verification

Issue #268 verification passed on 2026-09-30.

- Bucket: `visutry-business-media` (Standard).
- Custom domain: `media.visutry.com` — Active.
- Public `r2.dev` development URL remains disabled.
- White paper object returns HTTP 200 as `application/pdf`; production object size is 18,718,045 bytes and opens as the approved 8-page Master document.
- Product demo returns HTTP 200 as `video/mp4`; production object size is 1,670,608 bytes.
- MP4 byte-range verification returns HTTP 206 and Chrome playback / seeking passed.
- Only the two versioned production object keys are retained.
- No unrelated `www`, Worker Route, NS, SSL, or other Cloudflare configuration was changed.

Future resource versions must use new versioned object keys rather than replacing the production history in place.
