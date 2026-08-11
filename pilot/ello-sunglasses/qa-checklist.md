# ello sunglasses — Reference Pilot QA

Status: passed for the low-cost route/API/browser gate on 2026-08-11. Provider-backed Try-On generation was intentionally not invoked; existing Store Try-On/Compare contract tests were used instead.

## Disclosure and scope

- [x] Merchant config uses `pilotType=REFERENCE` and `referenceData=true`.
- [x] Shopper and Admin surfaces label this as `Reference Pilot · Simulation`.
- [x] No synthetic shopper activity is seeded by the import command.
- [x] No consumer credits, Consumer user, Campaign Builder, Shopify integration, or second Try-On pipeline is introduced.

## Static catalog checks

- [x] 12 active CSV rows across six public ello styles; within the 8–20 target.
- [x] Stable merchant-scoped SKU and public Shopify variant ID per row.
- [x] Product URL and variant image URL are present for every row.
- [x] Public price, currency, variant, availability snapshot, dimensions, materials and lens facts are recorded in `catalog.csv` / evidence.
- [x] Source facts and operator enrichment are separated in `enrichment-review.csv`.
- [x] `frameWidthMm`, `lensWidthMm`, `bridgeWidthMm`, `templeLengthMm` are persisted through the generic MerchantFrame contract.
- [x] No catalog row makes a guaranteed-fit, medical, prescription, PD or physical-fit percentage claim.

## Route and shopper flow

- [x] `GET /en/store/ello-sunglasses` returns the Store shell (HTTP 200 after hydration; no 404).
- [x] `GET /en/c/ello-sunglasses/petite-fit` resolves the shared Store shopper shell with campaign context.
- [x] Delivery Kit contains one active default STORE and two active reference CAMPAIGN configs; campaign subsets reuse MerchantFrame identities.
- [x] Public merchant API returns ello identity and 12 active frames only.
- [x] Desktop/mobile entry shell shows disclosure before privacy/session flow.
- [x] Recommendation API is merchant-scoped and returned 6 rows with petite-fit metadata/reasons.
- [x] Existing Store Try-On/Compare contract tests pass without invoking a real provider.
- [x] At least two-result Compare gate is covered by the existing Store Compare application/unit path.
- [x] Product click resolved the canonical ello product destination from server-side MerchantFrame.
- [x] Product-click intent persisted with merchant, session, frame and reference event marker.
- [x] Explicit UTM/source/campaign and merchant default source/campaign both persist through session/page-view event.
- [x] Consumer Credits Pack prompt is absent from Store flow; Store usage policy remains separate.

## Desktop/mobile and privacy

- [x] Desktop smoke on the pilot route: HTTP 200, label visible, no horizontal overflow.
- [x] Mobile viewport smoke on the pilot route: HTTP 200, label visible, no horizontal overflow.
- [x] Raw shopper photo is not present in merchant insight payloads (`includesShopperImage=false`).
- [x] Reference/simulation label is visible in the shopper header and Admin insight DTO (`REFERENCE`, `referenceData=true`).
- [x] Failed-render/usage isolation is covered by the existing Store Try-On and ADR-007 regression tests.

## Controlled cost policy

- [x] Static route/API smoke and catalog checks do not call a real AI provider.
- [x] No real Try-On render was invoked for this delivery; existing mock/contract tests were preferred to avoid unnecessary AI cost.

## Evidence links

- Public source snapshot: `evidence/public-source-snapshot.md`
- Browser/static evidence: add files here only when captured; do not commit shopper face data.
