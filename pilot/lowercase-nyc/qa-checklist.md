# Lowercase NYC Reference Pilot QA Checklist

Status: completed for the data rollout; Admin visual screenshot remains auth-session gated — Reference Pilot / Simulation only  
Snapshot: 2026-08-11  
Merchant slug: `lowercase-nyc`

## Source and package checks

- [x] `merchant.json` uses `pilotType=REFERENCE` and `referenceData=true`.
- [x] `catalog.csv` contains 20 curated rows: 10 optical and 10 sunglasses.
- [x] Every row has a stable variant-based `external_id` and unique SKU.
- [x] Every row has a public product URL and primary image URL.
- [x] Public source facts are separated from operator enrichment in `enrichment-review.csv`.
- [x] Current source availability was checked for the selected variants; unavailable Milo variants were excluded.
- [x] All 20 product URLs and 20 image URLs return HTTP success.
- [x] Selected image URLs are direct product-frame assets suitable for the existing Try-On input contract.
- [x] Decimal source dimensions are not rounded; exact values are retained in `source_notes`.

## Experience configuration

- [x] Store `default` selects all 20 active rows.
- [x] `find-your-frame` selects 10 optical/sun frames with shape and proportion diversity.
- [x] `sunglasses-edit` selects 10 sun frames.
- [x] All selected external IDs resolve to catalog rows.
- [x] All Experiences are `ACTIVE` reference simulations in configuration.
- [x] Source/campaign defaults are distinct and stable.
- [x] No offer, inquiry, or revenue claim is configured.

## Shopper route smoke

- [x] `/en/store/lowercase-nyc` — HTTP 200; 20 frames.
- [x] `/en/c/lowercase-nyc/find-your-frame` — HTTP 200; 10 frames.
- [x] `/en/c/lowercase-nyc/sunglasses-edit` — HTTP 200; 10 frames.
- [x] Store identity and headline are correct.
- [x] Each Campaign identity and headline are correct.
- [x] Reference Pilot / Simulation disclosure is visible.
- [x] No Consumer Credits purchase prompt is visible; existing boundary copy states merchant sessions do not use Consumer credits.
- [x] Desktop layout is usable.
- [x] Mobile layout is usable.
- [x] Mocked mobile flow sends `experienceSlug=find-your-frame` for session creation.
- [x] Mocked recommendation and selection stay inside the current Experience subset.
- [x] Shared max-2 selection policy is enforced in the deterministic zero-AI flow.
- [x] Product destinations remain the selected Lowercase public product URLs in the production API.
- [x] Merchant, Experience, source and reference context are present in the production API and package config.
- [x] No cross-merchant or cross-Experience catalog leakage found in DB/API checks.
- [x] Routine smoke did not call a real AI provider.

## Admin route smoke

- [x] Workspace data shows Lowercase NYC, Store, Find Your Frame and Sunglasses Edit.
- [x] Merchant Catalog count is 20 active frames.
- [x] Experience selected counts are 20 / 10 / 10.
- [x] Public routes and ACTIVE status are correct.
- [x] Experience metrics query independently and return empty funnels without error.
- [x] Reference / Simulation labeling is present in workspace data and public pages.
- [x] Legacy / Unassigned remains present.
- [x] Admin routes are correctly Auth0-gated; authenticated UI session was not available in this run.
- [x] Existing shared catalog selection/workspace path loaded; no brand-specific UI path was introduced.

## Evidence checklist

- [ ] Merchant overview.
- [ ] Store shopper entry.
- [ ] Find Your Frame entry.
- [ ] Sunglasses Edit entry.
- [x] Recommendation result — deterministic mocked zero-AI browser flow.
- [x] Try-On / Compare boundary — shared selection policy verified; no provider call.
- [x] Merchant Experiences list — production workspace query; UI route auth-gated.
- [x] Experience detail / funnel — production workspace query; UI route auth-gated.
- [x] Catalog size and subset summary.
- [x] Delivery timing and exception log.
- [x] Reference / synthetic disclosure.
