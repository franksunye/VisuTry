# C3 live product URL feasibility probe

| | |
| --- | --- |
| Status | D1 implementation locally verified; full real-browser acceptance NOT VERIFIED |
| Date | 2026-11-04 |
| Scope | Original read-only public HTTPS probes plus local D1 implementation and unit checks; no live Catalog writes |
| Related design | [Merchant Self-Service C URL Intake v2](https://github.com/franksunye/VisuTry/blob/codex/merchant-plg-c-first-value-7d-20261103/docs/product/merchant-self-service-c-ux-url-intake-v2.md) |

## Result

A narrow Shopify per-product path is technically feasible without raising VisuTry's 512 KiB source-response cap. The live MOSCOT product page was too large for the current HTML fetch budget, but its same-origin public Shopify Ajax product endpoint returned usable product data and its selected image decoded successfully. At the time of that probe, the importer did not call the endpoint. This branch now implements the product-scoped path and locally passes its focused checks, but the probe itself did not inspect through the application UI, write or approve a Catalog item, or create a private Store preview; it does not pass C3.

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

## D1 single-product implementation

The independent C3 branch now contains a product-scoped Shopify adapter:

1. A Shopify URL matching `/products/{handle}` uses only the same-origin `/products/{handle}.js` endpoint. It produces one product candidate, retains the original product URL, and does not fetch the store-wide product or image lists for that candidate.
2. The 3-second, 512 KiB, and two-redirect request bounds remain. The source response carries only a Shopify platform hint when the HTML body exceeds its cap; the truncated HTML is never treated as product data.
3. The merchant must choose one available variant. Only that variant's selected image is rendered; the other Shopify image URLs are not fetched by the importer. Approval waits for image load and confirmation, currency selection, price confirmation, and a frame shape. Shopify integer prices remain unchanged in minor units; currencies with two minor digits are available for explicit confirmation.
4. Product names and generic tags do not supply a guessed shape on this path. A structured Shopify shape option can be used; when absent, the merchant must enter one.
5. 401/403, 429, HTTP 404, Shopify soft-404 pages, and malformed or incomplete Ajax data return explicit Manual/CSV recovery. Denial and throttling are terminal and do not invoke browser rendering.

Unit coverage exercises a 111-variant payload as one candidate, the review gates and currency reset behavior, preserved price units and URL, image selection, soft-404 handling, 403/429 fallback, and existing Catalog membership enforcement.

The Merchant RC GitHub Actions workflow now has a manual `run_live_moscot_d1` input, defaulting to false. Pull request runs keep their normal local scenarios and do not contact MOSCOT. A manually selected run reuses the isolated PostgreSQL + Chromium setup, runs the 403/429, soft-404, malformed-price, and cross-tenant regression suites, then executes the MOSCOT URL → merchant review → explicit approval → Catalog persistence/readback → private Store Preview journey. It captures review and preview screenshots as short-retention workflow artifacts.

The required D1 acceptance remains open until that manual workflow completes successfully, including a decoded selected image. The existing live endpoint probe is feasibility evidence; it is not a substitute for the new app-side browser run.

## Limits

The initial evidence above remains a feasibility probe, not a D1 pass. In this execution environment the configured HTTP proxy could not be reached from the shell (`EPERM` on its TCP connection), no local PostgreSQL service or `DATABASE_URL` was available, and the Docker socket denied access to the non-root task user. Therefore the app-side MOSCOT request and persistence/private-preview browser journey have not run here. No C3 engineering acceptance is claimed; C3 remains HOLD until the complete real-browser acceptance is recorded.
