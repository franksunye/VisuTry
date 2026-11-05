# C3 live product URL feasibility probe

**Status:** C3 HOLD — D1/D2 live app-to-Preview path not accepted
**Owner:** Merchant Engineering
**Last updated:** 2026-11-05

| | |
| --- | --- |
| Scope | Read-only public Shopify probes plus isolated GitHub Actions/PostgreSQL/Playwright acceptance attempts; no production writes |
| Related design | [Merchant Self-Service C URL Intake v2](https://github.com/franksunye/VisuTry/blob/codex/merchant-plg-c-first-value-7d-20261103/docs/product/merchant-self-service-c-ux-url-intake-v2.md) |

## Result

A narrow Shopify per-product path is technically feasible without raising VisuTry's 512 KiB source-response cap. Public product pages and their same-origin Shopify Ajax endpoints are readable through the configured cloud proxy, and this branch implements the product-scoped path. The actual application request from GitHub Actions, however, received `SOURCE_ACCESS_DENIED` for MOSCOT and three separate D2 products before it reached `.js`. No candidate was approved, persisted, read back, or shown in Private Preview. Proxy probes and unit tests do not pass C3; C3 remains HOLD.

## Live requests

Requests were anonymous, read-only HTTPS GETs through the environment's configured HTTP proxy. TLS verification stayed enabled. Each response was capped at 512 KiB; no cookies, retries, browser rendering, or access-control workarounds were used.

| Target | Observation | Interpretation |
| --- | --- | --- |
| `https://www.warbyparker.com/eyeglasses/hatcher` | HTTP 200, 175,010-byte HTML; page title and Open Graph title say `404 \| Warby Parker`; no Product JSON-LD | Soft 404. The HTTP status alone is not product evidence. |
| `https://www.warbyparker.com/eyeglasses/wilkie/black-matte-eclipse` | HTTP 200 HTML, response exceeded the 512 KiB cap | A current product page exists, but it cannot be consumed under the current direct-fetch size limit. It was not a denial. |
| `https://moscot.com/products/lemtosh` | HTTP 200 HTML, response exceeded the 512 KiB cap; response headers include `Powered-By: Shopify` and the captured prefix contains Shopify asset markers | This initial probe exposed a fetcher gap. The D1 implementation now carries the Shopify header hint through the size-limit error and can then request the product-scoped endpoint; the GitHub runner still denied the source page, so this is not app-side acceptance evidence. |
| `https://moscot.com/products/lemtosh.js` | HTTP 200, `text/javascript`, 202,877 bytes; valid JSON with `LEMTOSH`, vendor `MOSCOT`, product type `OPTICAL`, 111 variants, and 97 images | The documented, same-origin Shopify Ajax product endpoint is a viable bounded source for this specific product. It is a product endpoint, not a bulk product feed. |
| First image URL returned by that endpoint (`cdn.shopify.com`) | HTTP 200, `image/jpeg`, 99,562 bytes; verified as a decodable 2295 × 1725 JPEG | The source image is usable as an image asset. Private-preview rendering was not tested. |

The rows above are read-only probes through the Codex Cloud HTTP proxy; they do not represent the GitHub runner's application request. The earlier Warby Parker candidate was a stale path; the current listing URL was discovered from that merchant's public eyeglasses page. No access-denied or rate-limit response occurred in those initial cloud-proxy probes.

## D1 and D2 application-run evidence

The one-off GitHub Actions runs used the actual Merchant application, Chromium, and disposable PostgreSQL. A separate proxy preflight showed that the listed public product endpoints were readable from the Codex Cloud environment; that response was never passed into the app or written to Catalog. In each actual app journey, the original product-page fetch returned `SOURCE_ACCESS_DENIED`; the app stopped before requesting `.js`, building a candidate, or importing data.

| Case | Public proxy preflight | Actual GitHub Actions app journey |
| --- | --- | --- |
| MOSCOT `https://moscot.com/products/lemtosh` | Earlier D1 probe read the page metadata and public `.js`; no app-side pass was established. | [Run #41950223075](https://github.com/franksunye/VisuTry/actions/runs/41950223075): `SOURCE_ACCESS_DENIED`; no Catalog write or Preview. The Playwright UI offered Manual/CSV recovery. This remains the retained denied-access case; do not probe it again. |
| Tifosi `https://tifosioptics.com/products/moab-lite` | Page returned 200 with `Powered-By: Shopify`; its public `.js` returned one product with 8 variants. | [Run #41958919511](https://github.com/franksunye/VisuTry/actions/runs/41958919511): `SOURCE_ACCESS_DENIED` before `.js`. No product write or Preview. |
| Knockaround `https://knockaround.com/products/premiums` | Page returned 200 with the Shopify header; `.js` returned one product with 34 variants, 27 available. | [Run #41959574394](https://github.com/franksunye/VisuTry/actions/runs/41959574394): `SOURCE_ACCESS_DENIED` before `.js`. No product write or Preview. |
| goodr `https://goodr.com/products/hooked-on-onyx` | Page returned 200 with the Shopify header; `.js` returned one product with 2 variants, 1 available. One selected variant image returned 200 and showed rectangular sunglasses. | [Run #41960317661](https://github.com/franksunye/VisuTry/actions/runs/41960317661): `SOURCE_ACCESS_DENIED` before `.js`. No product write or Preview. |

All three D2 attempts passed the focused negative/unit suite (4 suites, 49 tests). The live browser assertion failed at the source-summary check with `platforms=[]`, `foundCount=0`, `fetchedPageCount=0`, `sourceIssues=["SOURCE_ACCESS_DENIED"]`. The test harness now performs the raw `.js` price comparison only after the app has produced a candidate, so a blocked source does not trigger a test-side retry. The final goodr run's report, screenshot, and error context are in its short-retention [evidence artifact](https://github.com/franksunye/VisuTry/actions/runs/41960317661).

## Initial mapper findings (addressed by D1)

The real Ajax payload was passed through the existing Shopify mapper and proposal normalizer locally, without an application request or database write:

- The Ajax endpoint returns one product object, while `extractCatalogProductsFromShopifyJson` expects an object containing a `products` array. Wrapping the live payload for a dry run produced 111 candidates, one for each color/size variant.
- All 111 candidates share the same canonical product URL. The proposal therefore marks one candidate import-ready and the other 110 as possible duplicates. A specific product URL must produce one reviewable product candidate, with a selected variant, instead of a store-sized variant list.
- The first available variant has a SKU, image, color and price, but no deterministic frame shape. It is import-ready after field review, not recommendation-ready; the merchant needs a clear way to complete missing frame facts.
- Shopify Ajax returns the variant price as an integer in minor units. Before D1, the generic `priceInMinorUnits` helper treated numeric values as major units and multiplied by 100; the live value `34000` became `3400000`. The D1 adapter now preserves those minor units, with regression coverage.
- The proposal normalizer still sets `writePerformed: false` and `requiresApproval: true`, as required.

## D1 single-product implementation

The independent C3 branch now contains a product-scoped Shopify adapter:

1. A Shopify URL matching `/products/{handle}` uses only the same-origin `/products/{handle}.js` endpoint. It produces one product candidate, retains the original product URL, and does not fetch the store-wide product or image lists for that candidate.
2. The 3-second, 512 KiB, and two-redirect request bounds remain. The source response carries only a Shopify platform hint when the HTML body exceeds its cap; the truncated HTML is never treated as product data.
3. The merchant must choose one available variant. Only that variant's selected image is rendered; the other Shopify image URLs are not fetched by the importer. Approval waits for image load and confirmation, currency selection, price confirmation, and a frame shape. Shopify integer prices remain unchanged in minor units; currencies with two minor digits are available for explicit confirmation.
4. Product names and generic tags do not supply a guessed shape on this path. A structured Shopify shape option can be used; when absent, the merchant must enter one.
5. 401/403, 429, HTTP 404, Shopify soft-404 pages, and malformed or incomplete Ajax data return explicit Manual/CSV recovery. Denial and throttling are terminal and do not invoke browser rendering.

Unit coverage exercises a 111-variant payload as one candidate, the review gates and currency reset behavior, preserved price units and URL, image selection, soft-404 handling, 403/429 fallback, and existing Catalog membership enforcement.

The Merchant RC GitHub Actions workflow has a manual `run_live_shopify_d2` input, defaulting to false and pinned to the single goodr URL above. Pull-request runs retain their local scenarios and make no third-party requests. The manual run reuses isolated PostgreSQL + Chromium, runs the 403/429, soft-404, malformed-price, and cross-tenant regression suites, then exercises the real app journey. The raw `.js` comparison happens only after the app produces a candidate; a blocked source does not trigger a test-harness retry. Screenshots, report, and error context are uploaded as a short-retention artifact.

The D2 acceptance remains open until a manual run completes successfully, including variant review, decoded selected image, approval, Catalog persistence/readback, tenant rejection, and private Store Preview. A public endpoint probe is feasibility evidence only.

## Limits

The GitHub runner did not complete the real-app source-fetch stage for MOSCOT, Tifosi, Knockaround, or goodr; each actual app response was `SOURCE_ACCESS_DENIED`. On those runs no product candidate reached merchant review, nothing was written to Catalog, and no Store draft or preview was created. The current goodr workflow and its diagnostics are committed to the independent C3 Draft PR, but C3 remains HOLD until a real application journey reaches and completes the required acceptance path. Do not retry MOSCOT or attempt a different proxy, user-agent disguise, browser-render fallback, or direct `.js` request after an app-side denial. Merchant-authorized Shopify integration remains a separate future P1 effort; it is outside D2.
