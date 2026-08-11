# Lowercase NYC Delivery Log

This is a VisuTry Reference Pilot / Simulation built from publicly available Lowercase NYC catalog information. It is not a customer, authorized pilot, or claim of merchant performance.

Snapshot date: 2026-08-11  
Merchant slug: `lowercase-nyc`  
Branch: `codex/delivery-factory-lowercase`

## Time accounting

Times are operator hands-on time, excluding network waits and routine command latency.

| Activity | Minutes | Notes |
| --- | ---: | --- |
| research_minutes | 3 | Official Lowercase homepage, collections, product JSON and product-page facts reviewed. |
| catalog_capture_minutes | 2 | Selected 20 variant-backed rows and primary image URLs. |
| catalog_cleanup_minutes | 1 | Excluded Gift Card and unavailable Milo variants; normalized product types and identity. |
| enrichment_review_minutes | 1 | Shape, relative width class and recommendation tags reviewed. |
| merchant_configuration_minutes | 1 | Merchant config and reference policy. |
| experience_setup_minutes | 1 | Store, Find Your Frame and Sunglasses Edit configs. |
| Store setup | 1 | 20-frame `default` Store selection. |
| Campaign 1 setup | 1 | 10-frame `find-your-frame` subset. |
| Campaign 2 setup | 1 | 10-frame `sunglasses-edit` subset. |
| qa_minutes | 2 | Importer, source health, production DB/API, desktop/mobile and deterministic mock flow. |
| fix_minutes | 1 | Preserved exact decimal dimensions after integer importer validation exposed a reusable gap. |
| total_hands_on_minutes | 15 | Measured operator time through production publish and QA; network wait excluded where practical. |

## Delivery outcome

- Catalog target: 20 reviewed rows; 10 optical and 10 sunglasses.
- Experiences: 1 Store + 2 Campaigns.
- Code changes: 0 so far.
- Product-code branches: 0.
- Manual SQL: 0.
- Real AI generation: 0.
- Production publish: completed with the existing merchant-agnostic importer; no application code deployment was required for the data-only rollout.

## Manual exceptions

1. Four official product pages expose half-millimeter lens or bridge dimensions. The current importer accepts only integer dimensions. Values were not rounded or fabricated; typed fields are blank and exact values remain in `source_notes` and the review record.
2. Current product JSON exposes variant availability but not a normalized inventory contract. Selected variants were marked `ACTIVE` only when the public variant was currently available at snapshot time.

## Reusable product gaps

- **Catalog dimension precision:** the shared Delivery Kit should support decimal millimeter values or a lossless source-dimension field. This is a repeated catalog-normalization concern, not Lowercase-specific logic.
- **Reference/live segmentation:** session/event-level segmentation remains the documented Phase 2.1 defer; this package uses the existing durable reference marker and source conventions.

## Operator work vs automation candidates

- Operator work: selecting representative variants, reviewing primary image quality, classifying normalized shape and relative width class.
- Automation candidate after repeated brands: public URL/image health check and structured dimension extraction.
- Not justified here: generic crawler or Lowercase-specific parser.

## Production identifiers

- Merchant: `cmsor0lvi00006wi81kr12rkw`
- Store Experience: `cmsor128k000m6wi8uwrobdzm`
- Find Your Frame: `cmsor10da000l6wi8kp01ujgr`
- Sunglasses Edit: `cmsor143x000n6wi8k95tcrb9`
