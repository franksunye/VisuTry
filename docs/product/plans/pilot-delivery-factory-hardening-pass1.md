# Delivery Factory Hardening Pass 1

Status: implementation complete; Draft PR review pending
Scope: shared assisted-operations tooling only

## Objective

Reduce repeated mechanical operator work across the ello, Lowercase NYC, and AKILA reference deliveries without adding shopper capability, Admin features, a crawler, or brand-specific runtime code.

## Commands

```text
npm run pilot:preflight -- pilot/<merchant-slug>
npm run pilot:check-urls -- pilot/<merchant-slug>
npm run db:seed:pilot -- pilot/<merchant-slug> --dry-run
npm run pilot:verify -- pilot/<merchant-slug>
npm run pilot:route-smoke -- pilot/<merchant-slug>
npm run pilot:qa -- pilot/<merchant-slug> --production
```

`pilot:qa` without `--production` runs package preflight, URL health and shared deterministic tests only. The production form adds read-only dry-run, DB read-back and desktop/mobile route smoke. Hardening commands do not write production; the existing seed command remains the only explicit write path and still requires its production confirmation guard.

## Regression baseline

| Package | Catalog | Experiences | Preflight | URL health | Dry-run | DB verify | Route smoke |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| ello sunglasses | 12 | Store 12 / Campaign 10 + 6 | PASS | 12/12 product + 12/12 image | PASS | PASS | 6/6 |
| Lowercase NYC | 20 | Store 20 / Campaign 10 + 10 | PASS | 20/20 product + 20/20 image | PASS | PASS | 6/6 |
| AKILA | 18 | Store 18 / Campaign 9 + 9 | PASS | 18/18 product + 18/18 image | PASS | PASS | 6/6 |

Every package reports `referenceData=true` as an explicit Reference Pilot / Simulation warning. No real AI provider was called.

## Automated checks

- Hardening tests: 18 passed.
- Store module regression: 21 suites / 131 tests passed.
- Changed-file ESLint: passed.
- `prisma validate`: passed.
- Typecheck: passed.
- `build:ci`: passed with existing repository warnings only.

## Estimated Brand 4 impact

Conservative estimate: 12–18 operator hands-on minutes saved for a new Brand 4, depending on catalog size and route count. This estimate covers mechanical validation, URL/image checks, seed planning, DB read-back and route smoke. Research, catalog curation, enrichment judgment, and Campaign concept work remain human-owned.

## Remaining manual steps

- public-source research and fact verification;
- catalog selection and enrichment review;
- Campaign premise, copy and subset judgment;
- explicit human review of dry-run warnings before production seed;
- evidence interpretation and delivery accounting.

## Remaining reusable gaps

- Reference/Live session-event segmentation remains a separate Phase 2.1 product task; tooling only reports `referenceData=true`.
- Decimal dimensions remain a single-brand Lowercase gap and are intentionally not changed here.

## Scope guard

No Reference Brand 4 was started. No Campaign Builder, crawler, self-service onboarding, Shopify, CRM, analytics UI, decimal schema migration, recommendation change, or Try-On change is included.
