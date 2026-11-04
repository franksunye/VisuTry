# C3 live product URL feasibility probe

| | |
| --- | --- |
| Status | Preliminary feasibility signal; C3 engineering acceptance NOT VERIFIED |
| Date | 2026-11-04 |
| Scope | Read-only public HTTPS probes and local candidate-mapper dry run; no catalog writes |
| Related design | [Merchant Self-Service C URL Intake v2](https://github.com/franksunye/VisuTry/blob/codex/merchant-plg-c-first-value-7d-20261103/docs/product/merchant-self-service-c-ux-url-intake-v2.md) |

## Result

A narrow Shopify per-product path is technically feasible without raising VisuTry's 512 KiB source-response cap. The live MOSCOT product page was too large for the current HTML fetch budget, but its same-origin public Shopify Ajax product endpoint returned usable product data and its selected image decoded successfully. The current importer does not call that endpoint, and adapting it safely requires resolving the issues below. This probe did not inspect through the application UI, write or approve a Catalog item, or create a private Store preview; it does not pass C3.

## Live requests

Requests were anonymous, read-only HTTPS GETs through the environment's configured HTTP proxy. TLS verification stayed enabled. Each response was capped at 512 KiB; no cookies, retries, browser rendering, or access-control workarounds were used.

| Target | Observation | Interpretation |
| --- | --- | --- |
| `https://www.warbyparker.com/eyeglasses/hatcher` | HTTP 200, 175,010-byte HTML; page title and Open Graph title say `404 \| Warby Parker`; no Product JSON-LD | Soft 404. The HTTP status alone is not product evidence. |
| `https://www.warbyparker.com/eyeglasses/wilkie/black-matte-eclipse` | HTTP 200 HTML, response exceeded the 512 KiB cap | A current product page exists, but it cannot be consumed under the current direct-fetch size limit. It was not a denial. |
| `https://moscot.com/products/lemtosh` | HTTP 200 HTML, response exceeded the 512 KiB cap; response headers include `Powered-By: Shopify` and the captured prefix contains Shopify asset markers | Shopify can be identified from response metadata before accepting the oversized body. The current fetcher discards headers on its over-limit error, so the progressive importer cannot currently use this signal. |
| `https://moscot.com/products/lemtosh.js` | HTTP 200, `text/javascript`, 202,877 bytes; valid JSON with `LEMTOSH`, vendor `MOSCOT`, product type `OPTICAL`, 111 variants, and 97 images | The documented, same-origin Shopify Ajax product endpoint is a viable bounded source for this specific product. It is a product endpoint, not a bulk product feed. |
| First image URL returned by that endpoint (`cdn.shopify.com`) | HTTP 200, `image/jpeg`, 99,562 bytes; verified as a decodable 2295 × 1725 JPEG | The source image is usable as an image asset. Private-preview rendering was not tested. |

The earlier Warby Parker candidate was a stale path; the current listing URL was discovered from that merchant's public eyeglasses page. No access-denied or rate-limit response occurred in these probes, so this report makes no new claim about a live 403/429 target.

## Mapper findings

The real Ajax payload was passed through the existing Shopify mapper and proposal normalizer locally, without an application request or database write:

- The Ajax endpoint returns one product object, while `extractCatalogProductsFromShopifyJson` expects an object containing a `products` array. Wrapping the live payload for a dry run produced 111 candidates, one for each color/size variant.
- All 111 candidates share the same canonical product URL. The proposal therefore marks one candidate import-ready and the other 110 as possible duplicates. A specific product URL must produce one reviewable product candidate, with a selected variant, instead of a store-sized variant list.
- The first available variant has a SKU, image, color and price, but no deterministic frame shape. It is import-ready after field review, not recommendation-ready; the merchant needs a clear way to complete missing frame facts.
- Shopify Ajax returns the variant price as an integer in minor units. The existing `priceInMinorUnits` helper treats numeric values as major units and multiplies by 100; the live value `34000` becomes `3400000`. The Ajax adapter must preserve minor units or normalize them before using the existing mapper.
- The proposal normalizer still sets `writePerformed: false` and `requiresApproval: true`, as required.

## C3 implementation implications

1. Add a product-only Shopify Ajax adapter for a verified Shopify product page and its same-origin `/{locale?}/products/{handle}.js` endpoint. Do not use this flow for a collection or homepage and do not rely on public `/products.json` enumeration for the “paste one product” promise.
2. Preserve the existing 3-second, 512 KiB, and two-redirect request bounds. Carry only the minimum response metadata needed to recognize Shopify on an oversized HTTP 200 response; do not return a truncated page as an accepted product document.
3. Respect an explicit `?variant=` selection; otherwise choose one available default variant and show that choice for merchant review. Correct price units and leave unavailable currency/shape facts editable rather than guessing.
4. Treat 401/403 and 429 as terminal, with adjacent CSV/Manual fallback. Do not invoke Browser Rendering after explicit denial or throttling.
5. C3 still needs an isolated browser journey on a genuinely external product URL: inspect → review/edit → explicit approval → persisted readback → decodable image in private preview, plus 403/429 fallback and tenant-isolation checks.

## Limits

This was a feasibility probe only. It did not verify app-side outbound networking, Catalog writes, approval, reloading the saved record, tenant denial, or Store preview. The managed execution environment routes HTTP through its configured proxy; the current application fetcher opens pinned IP sockets directly, so the app-side live request was not attempted here. No repository application code was changed, and no C3 engineering acceptance is claimed.
