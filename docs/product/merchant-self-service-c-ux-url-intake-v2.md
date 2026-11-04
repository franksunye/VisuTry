# Merchant Self-Service C — First Value UX Review and URL Intake v2 Design

**Status:** PROPOSED — design/review only; not implemented or live acceptance  
**Date:** 2026-11-04  
**Owner:** Product / Merchant Engineering  
**Workstream:** C, direct self-service activation. A SEO/GEO remains observing; B Shopify marketplace remains HOLD.  
**Authority:** [Merchant PLG Strategy](../strategy/merchant-plg-growth-v1.md), [Activation Event Contract](../merchant-activation-v1.md), [First Value Issue #359](https://github.com/franksunye/VisuTry/issues/359), [Draft PR #516](https://github.com/franksunye/VisuTry/pull/516).

## 1. Revised C acceptance boundary

Only two independent work items are active:

- **C1 — First Value UX:** Verify and improve the *experience* for a genuinely new merchant account, an existing VisuTry consumer account opening its first merchant workspace, and a returning merchant with an unfinished workspace. Function correctness has extensive accepted local PostgreSQL/Chromium evidence; reuse it rather than rebuilding the product.
- **C3 — External URL product intake:** Resolve the feature promise and adapter design. A public URL is an optional, permission-bounded intake aid, **not** guaranteed arbitrary-store crawling.

**Deferred, not a C launch gate:** orphan/unreferenced public catalog-photo cleanup. Preserve existing quota/security controls; do not delete blobs, promise cleanup automation, or block this UX/design review on it.

First Value remains: authenticated and authorized workspace → approved usable first Catalog item → private Store preview with a ready, nonempty frame set → A6. Publishing is a later explicit action. A local mock merchant is a product UX specimen, not a confirmed real merchant conversion.

## 2. C1 — Three independently scored journeys

| Journey | Starting state | Primary experience | Completion proof |
| --- | --- | --- | --- |
| N — New merchant | Unregistered identity from Business/Start Free | Merchant-specific signup → workspace name and optional website → first product → draft Store → private preview | Auth callback returns to Merchant; one owned workspace and Catalog item persist; decoded private preview; A6 once |
| E — Existing VisuTry account | Signed-in consumer with **no** merchant membership | Same Merchant destination without forcing a second identity → workspace setup → first product → private preview | Consumer account and entitlements remain intact; creates merchant workspace with owner authorization |
| R — Returning merchant | Existing incomplete Merchant workspace, 0 A6 | Resume last valid Catalog / Store state; checklist identifies next incomplete action; reload and recovery | No duplicate workspace/product, stable merchant ID; actionable continuation; private preview A6 once |

Also retain negative gates: unauthenticated redirect/callback, cross-tenant 404/denial, double submit/idempotency, empty/invalid input, reload, failed source fallback, unready preview **does not** emit A6, and private preview never silently publishes.

### Source-code observations (not an executed novice UX study)

1. **P1 — Auth promise contradicts the direct UI flow.** `auth/signin/page.tsx` tells Merchants to create an Agent Key and paste the Key + Skill into ChatGPT/Claude as the next step. For the direct SMB funnel, the actual next step is GUI Workspace → Catalog → private preview. **Proposed copy:** “Create your store workspace, add one eyewear product, and preview your Store privately. Connect an AI agent later if you want.” Keep Agent Key under Integrations/advanced.
2. **P1 — Step count is misleading.** `MerchantWorkspaceOnboarding.tsx` says “Merchant setup · 1 of 1,” although First Value needs product and Store steps. **Proposed:** “Step 1 of 3 · Your workspace”; subsequent steps are “Add one product” and “Private preview.” This is a lightweight progress indicator, not a second checklist model.
3. **P1 — First product page is information-dense.** `MerchantCatalogSelfService.tsx` leads with technical details and displays five catalog-capacity metrics at the review stage, even for a single first product. **Proposed:** first-product mode shows one primary task, product photo upload alongside URL, review details collapsed by default, and one next action to Store. Keep current rich Catalog controls for subsequent catalog management. Do not delete readiness, approval, or quota enforcement.
4. **P2 — URL defaults can mislead.** A saved website preselects URL inspection even though external import is not reliably supported. Make “Try a public product link (beta)” explicit; allow one-click “Add one product manually” without losing the suggested URL.
5. **P2 — Success continuation should be singular.** Preserve the existing “Create your Store” CTA and ensure it lands on the correct combined `#store` or standalone scoped route; avoid presenting publishing as First Value.

### Evidence protocol

Use isolated Local PostgreSQL, existing mock identities and Playwright, not production creation. Screenshots at **1440px desktop and 390px mobile** (and a compact mobile pass if feasible). Record the user-visible sequence and action count for N/E/R, first actionable CTA, number of required fields, failed URL recovery, preview visibility, reload result, route/authorization/response status. Have an independent reviewer walk the UI without reading implementation docs.

The existing local evidence in #359/#414 supports functional correctness. The current Draft #516 G3 executes the private-preview gate in Chromium, **but not** a real Auth0 registration or a fresh independent human usability walkthrough. Do not label that as UX-optimal. A proposed target of ≤5 minutes for a novice from post-login workspace to private preview is an experiment hypothesis, **not** a measured baseline or release claim.

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

**C1 experience PASS:** N/E/R run on an exact code SHA using clean, isolated identities; screenshots and click/recovery observations reviewed; no confusing Agent Key dependency, misleading step count or dead navigation; no unearned A6/auto-publish; function and privacy contracts remain green. **Current state: design audit completed; fresh comparative browser UX review pending.**

**C3 design PASS:** PO agrees on bounded product-URL beta/Manual default and failure taxonomy; security authority unchanged. **C3 engineering PASS additionally requires** an approved external domain, actual inspect → canonical approval/readback → decodable private Store preview plus negative 403/429 fallback and no cross-tenant writes. A 403/429 denial is a legitimate stop; it does not authorize access-control evasion.

**Current disposition:** C remains PARTIAL for independent experience review and URL design/positive compatibility. Orphan-photo cleanup is **DEFERRED, not an immediate C blocking gate**. PR #516 stays Draft; no production release or data writes without a separate Lead decision.
