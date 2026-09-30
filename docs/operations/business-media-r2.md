# Business Media Delivery — Cloudflare R2

**Status:** Implementation contract; live publication tracked in GitHub Issue #268  
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

## Verification gate

Website publication must not merge solely because the expected URLs are known.

Before release, Issue #268 must provide evidence that:

- the bucket and custom domain are active;
- both versioned objects return HTTP 200;
- content types are correct;
- PDF opens in a normal browser;
- MP4 playback and seeking work through the public custom domain;
- no unrelated DNS, SSL, Worker Route, cache-contract, or application-hosting setting changed.

After evidence passes, this document may be updated from implementation contract to production active.
