# Merchant Self-Service C — First Value UX Review and URL Intake v2 Design

| | |
| --- | --- |
| Status | C1 functional and UX acceptance PASS/CLOSED; C3 design proposed, not implemented or live acceptance |
| Date | 2026-11-04 |
| Owner | Product / Merchant Engineering |
| Workstream | C1 CLOSED; C3 ACTIVE. A SEO/GEO remains observing; B Shopify marketplace remains HOLD. |
| Authority | [Merchant PLG Strategy](../strategy/merchant-plg-growth-v1.md), [Activation Event Contract](../merchant-activation-v1.md), [First Value Issue #359](https://github.com/franksunye/VisuTry/issues/359), [Draft PR #516](https://github.com/franksunye/VisuTry/pull/516) |

## 1. Revised C acceptance boundary

The C workstream is split into two independently accepted work items:

- **C1 — First Value function and UX: PASS / CLOSED.** C1.1 completed the task-first workspace for new merchants, existing Consumers opening their first workspace, and returning merchants with unfinished setup. The [acceptance report](merchant-c1-1-ux-acceptance-2026-11-04.md) records N/E/R Local Mock Chromium evidence, desktop/mobile screenshots, and the tested app SHA. No further C1/C1.2 work is planned.
- **C3 — External URL product intake: ACTIVE / NOT ACCEPTED.** This document remains a proposed product and technical design. The PR does not implement a new C3 importer, and no genuinely third-party product URL has passed the required positive-path verification. A public URL is an optional, permission-bounded intake aid, **not** guaranteed arbitrary-store crawling.

**Deferred, not a C launch gate:** orphan/unreferenced public catalog-photo cleanup. Preserve existing quota/security controls; do not delete blobs, promise cleanup automation, or block this UX/design review on it.

First Value remains: authenticated and authorized workspace → approved usable first Catalog item → private Store preview with a ready, nonempty frame set → A6. Publishing is a later explicit action. A local mock merchant is a product UX specimen, not a confirmed real merchant conversion. Real Auth0 registration and callback remain an independent launch gate before public merchant self-service is opened; C1 Mock acceptance does not satisfy that gate or authorize production release.

## 2. C1 — Three independently scored journeys

| Journey | Starting state | Primary experience | Completion proof |
| --- | --- | --- | --- |
| N — New merchant | Clean Local Mock identity, post-auth | Merchant workspace → optional website → first product → draft Store → private preview | One owned workspace and Catalog item persist; ready private preview; A6 once. Real Auth0 registration/callback is a separate launch gate and was not exercised by this Mock journey. |
| E — Existing VisuTry account | Signed-in consumer with **no** merchant membership | Same Merchant destination without forcing a second identity → workspace setup → first product → private preview | Consumer account and entitlements remain intact; creates merchant workspace with owner authorization |
| R — Returning merchant | Existing incomplete Merchant workspace, 0 A6 | Resume last valid Catalog / Store state; checklist identifies next incomplete action; reload and recovery | No duplicate workspace/product, stable merchant ID; actionable continuation; private preview A6 once |

Also retain negative gates: unauthenticated redirect/callback, cross-tenant 404/denial, double submit/idempotency, empty/invalid input, reload, failed source fallback, unready preview **does not** emit A6, and private preview never silently publishes.

### Source-code observations (historical design audit and disposition)

These observations informed the C1/C1.1 and C3 boundaries. The current C1 disposition is the accepted N/E/R report above; remaining URL-intake decisions belong to C3 and do not reopen C1.

1. **RESOLVED in C1:** Merchant sign-in now leads with the GUI path to the private preview; Agent setup is optional and later.
2. **RESOLVED in C1:** workspace progress is three steps: Workspace, first product, and private preview.
3. **C1.1 disposition:** the first-use workspace now foregrounds the task sequence and keeps daily operating tools secondary. The remaining detailed Catalog controls are accessible; further Catalog layout redesign is not an open C1/C1.1 gate.
4. **C3 design item:** a saved website can still suggest URL inspection. C3 must make beta/support boundaries and the manual fallback clear; third-party compatibility is unverified.
5. **RESOLVED in C1:** the first-product continuation targets the combined Store section or the standalone Store route as appropriate. Publishing remains separate from First Value.

### Evidence protocol

Use isolated Local PostgreSQL, existing mock identities and Playwright, not production creation. Screenshots at **1440px desktop and 390px mobile** (and a compact mobile pass if feasible). Record the user-visible sequence and action count for N/E/R, first actionable CTA, number of required fields, failed URL recovery, preview visibility, reload result, route/authorization/response status. Have an independent reviewer walk the UI without reading implementation docs.

The accepted C1.1 Local Mock evidence is recorded in the [C1.1 acceptance report](merchant-c1-1-ux-acceptance-2026-11-04.md). It establishes the scoped First Value function and UX acceptance, not a real Auth0 signup/callback result or a confirmed-real-merchant conversion. The proposed target of ≤5 minutes for a novice from post-login workspace to private preview remains an experiment hypothesis, **not** a measured baseline or release claim.

## 3. C3 — External URL intake: problem classification

Previous first-party VisuTry Demo URL imported successfully after the external image-host preview fix. External merchant targets returned **HTTP 403 / 429**; this is not a generic extractor success case. Existing progressive intake handles:

1. Shopify-themed site: opportunistic `/products.json?limit=250`;
2. JSON-LD Product and product OpenGraph on accessible HTML;
3. sitemap and bounded product-link traversal;
4. optional Cloudflare Browser Rendering for accessible JavaScript-driven pages;
5. terminal failure + CSV/Manual fallback for explicit denial, rate limit, unsafe URLs or forbidden redirects.

The current implementation deliberately treats 403/429 as terminal and never retries those requests through a paid rendering provider. Keep that safeguard. A JS renderer fixes missing client-rendered HTML **only when access is permitted**; it is not a way to defeat website controls.

**Platform-specific gap:** Shopify officially documents theme Ajax product JSON at `/{locale}/products/{handle}.js` and the token/access-scoped Storefront API, not a guarantee that any third-party `/products.json` store-wide enumeration will be available. `products.json` remains opportunistic; do not make it the basis for a “paste any store URL” promise.

Official references:
- https://shopify.dev/docs/api/ajax/reference/product
- https://shopify.dev/docs/api/ajax
- https://shopify.dev/docs/api/storefront/latest
- https://developers.cloudflare.com/browser-run/reference/robots-txt/

## 4. Proposed product contract — one usable product before whole-store crawling

**First Value (P0):**

1. Display choices as **Add one product** (recommended guaranteed product path), **Try a product URL** (beta/public only), and **Upload CSV**. A saved website is shown as an editable suggestion, not already imported data. Do not auto-fetch on signup.
2. When a merchant pastes a **specific public product URL**, inspect *only after a clear “Inspect” action*. Show name, image, source domain, product URL, optional variant/SKU/price, missing facts and image-readiness. Nothing is written before explicit review/approval.
3. If safely importable: merchant selects/approves a candidate → canonical Catalog write → first product CTA → private Store preview; status belongs to the owned merchant, and A6 requires an actually ready, nonempty private preview.
4. If blocked or incompatible: give one understandable reason and adjacent **Add manually** / **Upload CSV** actions, retaining the pasted source link and entered data. Never imply a product was saved or a site was “connected.”
5. A homepage/collection URL can be attempted within a bounded optional “Find products” beta flow; lack of discovery is normal and must never obstruct single-product activation.

**No promise:** all stores supported, unlimited catalog import, automatic SKU mapping, auto-publication, access to gated content or Shopify integration. Existing manual/CSV contracts remain authoritative and usable.

### User-visible result states

| State | Meaning | Primary next action |
| --- | --- | --- |
| FOUND_REVIEWABLE | 1+ candidates with canonical identity, name, image and source | Review and explicitly import |
| FOUND_INCOMPLETE | Some product details need merchant correction | Correct missing fields; optionally upload merchant-owned image |
| NOT_PRODUCT / EMPTY | Accessible page, no reliable product facts | Paste a specific product URL or add manually |
| ACCESS_DENIED / RATE_LIMITED | Site has rejected automated access | Stop; CSV/manual or later authorized integration |
| TIMEOUT / TEMPORARY_FAILURE | Source unavailable within safe request budget | User-triggered bounded retry, then manual/CSV |
| UNSAFE / REDIRECT_REJECTED | Private, reserved or cross-origin target; validation failed | Reject; request a different public URL |
| IMAGE_UNREADABLE | Candidate metadata parsed, image cannot load/decode in preview | Replace image or upload photo before import/preview |

Do not expose raw HTTP/technical codes in the primary UI; keep them in diagnostics with bounded logging and no full sensitive URL query strings.

## 5. Technical proposal — reuse one canonical intake pipeline

`SourceUrl → validated/pinned network request → platform-aware deterministic extraction → canonical candidate + provenance → readiness + dedupe → human approval → canonical Catalog write → Store draft/private preview`

- **P0 Product URL adapter:** For accessible HTTPS product pages, reuse JSON-LD Product/Offer and OG fallback. When Shopify theme is detected and a **product handle** is available, *evaluate* the documented locale-aware `/products/{handle}.js` theme Ajax endpoint as a narrowly scoped read-only fallback, respecting access restrictions and response limits. Do not assume `products.json` is standard or permanently public.
- **P1 Store URL discovery:** Existing bounded sitemap/link traversal is best effort. Never recursively crawl an entire foreign site or accept unbounded external links; honor public access restrictions. Browser render only when configured and when network response has not signaled explicit denial/rate limiting.
- **P2 Authorized source:** Future Shopify app/OAuth, permissioned merchant-owned export or a supplied product feed may enable reliable bulk import. This is **B Shopify HOLD** until independently approved and must not be smuggled into C.
- **Security invariants:** HTTP(S) only; reject credentials in URL, private/reserved/DNS-rebinding/metadata addresses, unsafe redirects and cross-origin browser-render navigation; cap response bytes, time, URL hops and candidate counts; no forwarded user cookies, external credentials or automated publication; tenant-scoped writes and dedupe. Preserve the current 3-second / 512-KiB / 2-redirect direct fetch budget unless performance evidence justifies a change.
- **Image integrity:** An accepted URL string is not enough: verify a decodable image in actual private preview; support explicit merchant-owned upload as fallback without implicitly treating an uploaded public Blob as product approval. Photo garbage collection is deferred and must be designed separately.
- **Telemetry:** Explicit, deduped `inspection_attempted/ready/empty/failed` by source type and broad error class (not raw merchant URLs); `import_approved/completed` and A6; source path and independently verified self-service/assistance classification. No changes to GA4/activation truth semantics without a separate gate.

### Implementation slices (not approved for release by this design)

1. **D0 — Product copy and state UX:** Correct auth/step copy, clear Product URL beta vs guaranteed Manual path, single-action fallback and novice-first review layout. Use existing Catalog/Store contracts.
2. **D1 — Narrow product-URL adapter:** Add documented Shopify per-product Ajax fallback where safe, keep generic structured-data parsing, explicit 403/429 stop, add error-state mapping. No OAuth, no broad crawling.
3. **D2 — Independent browser proof:** One approved genuinely external merchant **HTTPS product URL** without bypass attempts; inspect→review→approve→persist→decoded image/private preview, desktop/mobile, unknown-source rejection and tenant denial. Do not treat first-party Demo or fixture-only 200 as third-party proof.
4. **D3 — Commercial decision:** If D2 cannot pass without access the website will not grant, endorse Manual/CSV-first with product-URL beta; do not repeatedly seek unrelated domains. Decide whether authorized integration is worth B scope separately.

## 6. Acceptance and stop rules

**C1 function and C1.1 experience PASS / CLOSED:** N/E/R Local Mock journeys, desktop/mobile screenshots, recovery behavior, First Value completion and private-not-public preview were accepted on the tested app SHA recorded in the [C1.1 report](merchant-c1-1-ux-acceptance-2026-11-04.md). Real Auth0 registration/callback is a separate launch gate.

**C3 design: PROPOSED; C3 engineering: NOT VERIFIED.** C3 engineering acceptance requires an approved, genuinely third-party public HTTPS product URL, actual inspect → canonical approval/readback → decodable private Store preview, plus negative 403/429 fallback and no cross-tenant writes. No such external positive-path verification is complete. A 403/429 denial is a legitimate stop; it does not authorize access-control evasion.

**Current disposition:** C1 is CLOSED. C3 remains ACTIVE for design and genuine third-party URL verification. Orphan-photo cleanup is **DEFERRED, not a C3 acceptance gate**. PR #516 is entering formal review; this status does not authorize merging or deploying. Before any merge that could trigger a Production deployment, confirm the deployment path and explicitly settle the Auth0 launch gate and merchant self-service opening policy.
