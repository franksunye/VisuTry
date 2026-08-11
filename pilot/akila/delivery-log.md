# AKILA Delivery Log

This is a VisuTry Reference Pilot / Simulation built from publicly available AKILA catalog information. It is not a customer, authorized pilot, live campaign, or claim of merchant performance.

Snapshot date: 2026-08-11
Branch: `codex/delivery-factory-akila`
Baseline: `4e90ac36f369cc6bd4e9d9f84a1e21aa69697e63` (main after Lowercase merge)

## Time accounting

Times are operator hands-on time, excluding network waits and routine command latency.

| Activity | Minutes | Notes |
| --- | ---: | --- |
| research_minutes | 12 | Official AKILA homepage, current collection, product JSON, product pages, dimensions, images, variants and availability reviewed. |
| catalog_capture_minutes | 8 | Selected 18 variant-backed rows and canonical product/image URLs. |
| catalog_cleanup_minutes | 5 | Excluded unavailable variants and ambiguous/closeout items; normalized product types and source notes. |
| enrichment_review_minutes | 5 | Reviewed shape, relative width class and style tags; kept enrichment separate from facts. |
| merchant_configuration_minutes | 1 | Merchant identity, reference policy and supported theme token. |
| experience_setup_minutes | 2 | Store, Statement Frames and Current Edit configs. |
| Store setup | 1 | 18-frame `default` Store selection. |
| Campaign 1 setup | 1 | 9-frame `statement-frames` subset. |
| Campaign 2 setup | 1 | 9-frame `current-edit` subset. |
| qa_minutes | 7 | Importer/source health, production seed and read-back, desktop/mobile public routes, anonymous sessions, Admin workspace, shared tests, typecheck and build. |
| fix_minutes | 1 | Corrected review-source URL normalization and field consistency; no product-code change. |
| total_hands_on_minutes | 44 | Measured operator time through production publish and QA; network wait and routine command latency excluded where practical. |

## Delivery outcome

- Catalog target: 18 reviewed active rows; current SS26-oriented sunglasses and optical frames.
- Experiences: 1 Store + 2 Campaigns.
- Code changes: 0.
- Product-code branches: 0.
- Manual SQL: 0 planned.
- Real AI generation: 0.

## Manual exceptions

- Production migration status has a pre-existing operational caveat: the CLI cannot produce a clean status because a historical face-analysis migration has a rolled-back attempt and later successful attempt. Required Experience migrations were read as applied; no migration was changed or run by this delivery.
- Nomos optical material is intentionally blank because the official reviewed page did not state it.

## Reusable product gaps

- Reference/live segmentation remains the documented Phase 2.1 defer; this package uses the existing reference marker and source conventions.
- Decimal dimensions did not occur in the selected AKILA rows; no importer change is included in this delivery.

## Production identifiers

Merchant: `cmsos85wx0000goi856lvrqq4`
Store Experience: `cmsos8cua000lgoi8g01w1iow`
Statement Frames: `cmsos8bt1000kgoi8rdk51y71`
Current Edit: `cmsos8asj000lgoi86q7p2y3k`

## Three-brand retrospective

| Brand | Archetype | Catalog | Experiences | Hands-on | Code changes | Manual exceptions | Publish |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| ello sunglasses | fit/problem-led DTC | 12 | 3 | 59 min | 2 reusable capability sets; 0 brand-specific | public image URLs referenced; no shopper data | existing importer + production seed |
| Lowercase NYC | premium independent optical/product-led | 20 | 3 | 15 min | 0 | 4 half-millimeter source dimensions retained losslessly outside typed integer fields | existing importer + production seed |
| AKILA | fashion/style/collection-led | 18 | 3 | 44 min | 0 | Nomos optical material left blank; pre-existing migration-status caveat recorded | existing importer + production seed |

### Factory classification

- Stable capability: shared Merchant identity, curated catalog CSV, Experience subsets, reference provenance, Store/Campaign routes, scoped session attribution, shared recommendation/Try-On/Compare/Intent paths, production-safe importer, and Admin Experience analytics all reused across three brands.
- Repeated operator work: public-source selection, variant/image health checks, normalization review, visual style-tag review, Experience subset design, and desktop/mobile production smoke.
- Repeated reusable gap: session/event-level Reference vs Live segmentation remains a cross-pilot deferred requirement; no new implementation is included here. Decimal dimensions appeared in Lowercase only and did not recur in AKILA.
- Brand-specific variation: fit-led copy/selection for ello, product-led optical/sunglasses mix for Lowercase, and style/collection-led subsets for AKILA. These remain data/configuration differences, not runtime forks.

## Factory verdict

**FACTORY PASS** — AKILA completed through public catalog research, normalization, Experience configuration, existing importer, production publish, and shared QA with zero brand-specific runtime code. The evidence supports proceeding to a future Reference Brand 4 when separately requested; Reference Brand 4 is not started by this delivery.
