# Article One Delivery Log

This is a VisuTry Reference Pilot / Simulation built from publicly available Article One catalog information. It is not a customer, authorized pilot, live campaign, or claim of merchant performance.

Snapshot date: 2026-08-11
Branch: `codex/delivery-factory-article-one`
Baseline: `23b142b8a58907e72a5d46dedfaf8b15d729c341` (main after Delivery Factory Hardening Pass 1 merge)

## Time accounting

Times are operator hands-on estimates measured during this delivery, excluding network waits and routine command latency.

| Activity | Minutes | Notes |
| --- | ---: | --- |
| research_minutes | 17 | Official homepage, sunglasses/optical collections, sitemap and 18 product pages reviewed. |
| catalog_capture_minutes | 8 | Selected 18 distinct active product rows and canonical product/image URLs. |
| catalog_cleanup_minutes | 6 | Normalized dimensions, product type, internal keys and source notes; left unstated materials blank. |
| enrichment_review_minutes | 5 | Reviewed shape, relative width class and visual tags; kept enrichment separate from source facts. |
| merchant_configuration_minutes | 2 | Merchant identity, reference policy and shared theme token. |
| experience_setup_minutes | 3 | Store, Active Eyewear and Find Your Fit configs. |
| Store setup | 1 | 18-frame Store selection. |
| Campaign 1 setup | 1 | 9-frame Active Eyewear subset. |
| Campaign 2 setup | 1 | 9-frame Find Your Fit subset. |
| preflight_minutes | 1 | Hardening preflight. |
| url_health_minutes | 1 | Product and image URL checks. |
| dry_run_review_minutes | 1 | Seed plan review. |
| post_publish_verify_minutes | 1 | Production read-back. |
| route_smoke_minutes | 4 | Desktop/mobile route smoke plus shared image-host diagnosis. |
| qa_minutes | 8 | Shared Store/Experience/Admin tests, critical E2E, typecheck and build. |
| fix_minutes | 4 | Added one generic BigCommerce CDN image allowlist entry; no brand-specific runtime logic. |
| total_hands_on_minutes | 64 | Sum above; network wait excluded. |

## Hardening effectiveness

Measured Hardening 1 mechanical steps:

- `preflight_minutes`: 1
- `url_health_minutes`: 1
- `dry_run_review_minutes`: 1
- `post_publish_verify_minutes`: 1
- `route_smoke_minutes`: 4
- Total with tooling: 8 minutes

The equivalent first-time manual checklist was estimated at 38 operator minutes from the actual same inputs: manually checking package invariants (6), product/image URLs (8), constructing the seed plan (6), reading back all rows and ExperienceFrame selections (6), and checking six desktop/mobile routes (12). Therefore `hardening_minutes_saved = 30` minutes for this delivery. This is an operator estimate, not a benchmark claim.

## Delivery accounting

- Catalog target: 18 reviewed active sunglasses; no optical rows were invented because the official optical collection exposed no active product links in the snapshot.
- Experiences: 1 Store + 2 Campaigns.
- Code changes: 1 shared configuration change; 0 brand-specific runtime changes.
- Manual SQL: 0.
- Manual exceptions: pre-existing `prisma migrate status` schema-engine blank error; production migration rows directly verified. Four initial route-smoke 400s were fixed by the generic BigCommerce CDN allowlist.
- Reusable product gaps: lens features are retained in `source_notes`; the shared catalog schema has no typed lens-feature field.

## Production identifiers

- Merchant: `cmsotuyga0000xzi8ed15j0sk`
- Store Experience: verified by slug `default`, 18 frames
- Active Eyewear: verified by slug `active-eyewear`, 9 frames
- Find Your Fit: verified by slug `find-your-fit`, 9 frames

## Four-brand retrospective

| Brand | Archetype | Catalog | Experiences | Hands-on | Code changes | Manual SQL | Manual exceptions | Publish | Hardening tooling |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| ello sunglasses | fit/problem-led DTC | 12 | 3 | 59 min | 2 reusable capability sets; 0 brand-specific | 0 | public image URLs; no shopper data | existing importer + production seed | predated Hardening 1 |
| Lowercase NYC | premium independent optical/product-led | 20 | 3 | 15 min | 0 | 0 | decimal dimensions retained outside typed integer fields | existing importer + production seed | full path |
| AKILA | fashion/style/collection-led | 18 | 3 | 44 min | 0 | 0 | blank unstated optical material; migration CLI caveat | existing importer + production seed | full path |
| Article One | performance/active/technical, function-led | 18 | 3 | 64 min | 1 shared image allowlist; 0 brand-specific | 0 | no active optical links in snapshot; migration CLI caveat; generic CDN allowlist needed | existing importer + production seed | full path; 30 min saved |

## Factory classification

- Stable capability: shared Merchant identity, curated catalog CSV, Experience subsets, reference provenance, Store/Campaign routes, scoped session attribution, shared recommendation/Try-On/Compare/Intent paths, production-safe importer, Admin Experience analytics and Hardening lifecycle all reused.
- Repeated operator work: public-source selection, product-page capture, source/enrichment review, subset design and desktop/mobile smoke.
- Automation solved by Hardening 1: preflight, URL health, dry-run plan, production read-back and standard route smoke.
- Remaining repeated reusable gaps: typed lens-feature facts and session/event-level Reference vs Live segmentation remain cross-pilot product gaps; no schema or analytics expansion is included.
- Brand-specific variation: fit-led ello, product-led Lowercase, style-led AKILA and active/technical Article One. These remain data/configuration differences, not runtime forks.

## Factory verdict

Pending final post-deploy route smoke and reviewer checks.

## Factory maturity verdict

Pending final post-deploy verification. The current evidence supports `FACTORY REPEATABLE` if the final image allowlist deployment and route smoke pass.
