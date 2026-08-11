# ello sunglasses — Delivery Log

Reference Pilot / Simulation. Times are Asia/Shanghai (CST). Synthetic/reference activity must not be read as live brand traffic.

| Milestone | Start | End | Hands-on minutes | Notes |
| --- | --- | --- | ---: | --- |
| Intake / public research | 2026-08-11 16:28 | 2026-08-11 16:34 | 6 | Confirmed six public petite-fit styles, public URLs, variant/price/image snapshot and size guide. |
| Catalog preparation | 2026-08-11 16:34 | 2026-08-11 16:39 | 5 | Prepared 12 variant rows, source notes, dimensions and enrichment review. |
| Configuration / generic importer | 2026-08-11 16:39 | 2026-08-11 16:46 | 7 | Added reusable CSV/config importer, default attribution and durable reference provenance; no ello-specific branch. |
| QA / route verification | 2026-08-11 16:46 | 2026-08-11 16:50 | 4 | Static/API/browser smoke, Admin insight provenance, Store unit contracts and Consumer route smoke passed. |
| Phase 1 Experience upgrade | 2026-08-11 18:45 | 2026-08-11 19:14 | 29 | Added generic Experience/ExperienceFrame schema, campaign route/context, multi-experience importer and experience analytics filter; no ello-specific product code. |

## Delivery accounting

- `research_minutes`: 22
- `catalog_capture_minutes`: 40
- `catalog_cleanup_minutes`: 5
- `enrichment_review_minutes`: 5
- `configuration_minutes`: 7
- `qa_minutes`: 4
- `fix_minutes`: 3 (generic dynamic route correction and test assertion)
- `total_hands_on_minutes`: 59
- `code_changes_count`: 2 reusable product capability change sets; merchant-specific code changes: 0
- `product_code_change`: yes — generic Pilot Delivery Kit importer, provenance/default attribution fields, dynamic Store route fix; no ello if/else/API/component
- `manual_exceptions`: public image URLs are referenced, not republished into repository assets; no shopper data committed
- `reusable_product_gaps`: generic CSV/config import and durable reference provenance were missing and added
- `merchant_specific_requests`: none
- `blockers`: no pilot blocker; full repo typecheck remains blocked by pre-existing visual SEO test typing error outside this change set
