# Framed EWE Delivery Log

Reference Pilot / Simulation only. Framed EWE is modeled as one retailer Merchant with a multi-brand catalog. This is not a customer implementation, authorized collaboration, live campaign, or claim of merchant performance.

Snapshot date: 2026-08-12
Branch: `codex/delivery-factory-framed-ewe`
Baseline: `70b14d023280cc7f6d64957973601c3f199f4dd6` (main after Article One merge)

## Delivery accounting

Times below are operator estimates recorded after each gate. Network waits are excluded.

| Activity | Minutes | Notes |
| --- | ---: | --- |
| research_minutes | 15 | Official homepage, About, collections, product JSON and 20 selected product records. |
| catalog_capture_minutes | 8 | 20 distinct publicly available rows across five product brands. |
| catalog_cleanup_minutes | 12 | Canonical retailer URLs, internal keys, source notes and safe integer dimensions. |
| enrichment_review_minutes | 8 | Shape, relative width and discovery tags kept separate from source facts. |
| merchant_configuration_minutes | 2 | Merchant identity and shared Reference policy. |
| experience_setup_minutes | 3 | One Store plus Find Your Frames and Sunglasses Edit. |
| preflight_minutes | 1 | Existing Delivery Factory preflight. |
| url_health_minutes | 1 | Existing product/image URL check. |
| dry_run_review_minutes | 1 | Existing importer seed-plan dry run. |
| post_publish_verify_minutes | 1 | Production read-back through existing verification. |
| route_smoke_minutes | 5 | Desktop/mobile Store and Campaign smoke plus session attribution. |
| admin_verify_minutes | 3 | Existing Experience workspace data contract. |
| qa_minutes | 15 | Shared tests, typecheck, build and critical E2E. |
| fix_minutes | 5 | CSV delimiter correction and evidence updates; no product/runtime fix. |
| total_hands_on_minutes | 81 | Sum of operator time estimate; network waits excluded and no benchmark claim. |

## Scope and exceptions

- Code changes: `0` product/runtime changes; package-only.
- Brand-specific runtime changes: `0`.
- Manual SQL: `0`.
- Real AI provider calls: `0`.
- Synthetic/reference traffic: no generated traffic is seeded; six lightweight reference sessions were created only to verify anonymous session attribution, with no AI generation.
- Exceptions/blockers: historical `prisma migrate status` blank schema-engine error; direct migration-table evidence is complete. Anonymous Admin browser requests correctly redirect to Auth0; no authenticated Admin browser session was available for pixel-level assertions. Full unit retains one unrelated pre-existing Auth0 issuer assertion failure (`auth0.com` expected vs `https://auth.visutry.com` configured); no Auth0 code was changed.
- Reusable gaps: session/event-level Reference vs Live segmentation, decimal dimensions, typed lens/technical feature facts, and any recurring image-host compatibility issue are backlog candidates only.
- Hardening saved: the existing preflight, URL health, dry-run, verify and route-smoke path was reused; no new hardening code was needed.

## Five-brand retrospective

| Reference brand | Archetype | Catalog | Experiences | Campaigns | Runtime code | Manual SQL | Delivery note |
| --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| ello sunglasses | fit/problem-led DTC | 12 | 3 | 2 | shared core | 0 | first Reference Pilot |
| Lowercase NYC | premium independent optical/product-led | 20 | 3 | 2 | shared core | 0 | decimal dimension gap retained as data note |
| AKILA | fashion/style/collection-led | 18 | 3 | 2 | shared core | 0 | no brand-specific runtime |
| Article One | active/technical, function-led | 18 | 3 | 2 | one shared CDN allowlist entry | 0 | generic image-host hardening |
| Framed EWE | multi-brand retailer | 20 | 3 | 2 | expected shared core only | 0 | tests merchant boundary versus product-brand metadata |

After this package's successful production publish, the Factory checkpoint is:

**REFERENCE BASELINE COMPLETE** — five Reference Brands and ten Campaign Experiences are represented, excluding Stores.

## Checkpoint and verdict

- Reference Campaign checkpoint: target 5 Brands / 10–15 Campaigns; Framed EWE adds two campaigns and reaches ten.
- Factory verdict: **FACTORY PASS** — package, production, routes, Admin data contract and shopper boundary checks passed.
- Maturity verdict: **FACTORY REPEATABLE** — this delivery used the existing importer and Hardening lifecycle with zero merchant-specific runtime code. Authenticated Admin pixel verification is an environment limitation, not a factory gap.

## Prioritized backlog only

| Priority | Gap | Why it matters | This delivery |
| --- | --- | --- | --- |
| P0 | Session/event-level Reference vs Live segmentation | Prevents synthetic/reference traffic from being mixed with live merchant traffic. | Defer; no implementation. |
| P1 | Decimal dimensions and typed lens/technical features | Preserves richer eyewear facts for future catalog quality without free-text loss. | Defer; source notes only. |
| P2 | Image-host compatibility if another recurring host appears; multi-brand presentation only if a real shared-core gap is proven | Keeps future imports low-touch without brand forks. | No speculative change. |

No Brand 6, crawler, onboarding, commerce integration, Campaign Builder, CRM, analytics expansion, schema expansion, recommender, Try-On flow or retailer-specific UI is in scope.
