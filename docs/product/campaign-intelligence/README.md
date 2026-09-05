# Campaign Intelligence Documentation

**Status:** Active bounded product-analytics reference  
**Owner:** Product / Engineering / Growth  
**Last updated:** 2026-09-04  
**Scope:** Product-event semantics and GA4 operator configuration that remain useful after the Merchant Store/Campaign durable analytics model shipped.

## Authority boundary

The cross-cutting authority for VisuTry telemetry, analytics, data-plane ownership, attribution, exclusion semantics and schema governance is now:

- `docs/project/observability-and-analytics-contract.md`

Campaign Intelligence is **not** the product-wide observability architecture and GA4 is **not** the Merchant Store/Campaign business source of truth.

Current runtime authorities are:

- Consumer/product analytics event registry: `src/lib/analytics-events.ts`
- Consumer Traffic Ready evidence endpoint: `src/app/api/analytics/consumer-funnel/route.ts`
- Store/Campaign business facts: PostgreSQL `MerchantSession` / `MerchantEvent` / `MerchantIntent`
- Merchant distribution reporting: `src/modules/store/domain/merchant-distribution-report.ts` and `scripts/agent-distribution-report.ts`

## Current reading path

1. `docs/project/observability-and-analytics-contract.md` — first read; owns cross-cutting data-plane and governance decisions.
2. `event-taxonomy.md` — bounded semantic guide for the current web product analytics registry; code wins for exact implemented event names/fields.
3. `ga4-console-checklist.md` — bounded GA4 operator checklist; GA4 configuration only.
4. `archive/` — historical migration/audit/completion evidence; never current execution authority.

## Current product boundaries

Keep these journeys separate in reporting:

```text
Standalone Consumer
  acquisition → detector/analysis/advisor → try-on/compare → paid/product outcome

Merchant shopper
  source → Store/Campaign → decision actions → MerchantIntent

Merchant operator
  business acquisition/onboarding → workspace/catalog/publish/billing
```

The first and second journeys may reuse decision capabilities but they do **not** share a durable per-user session join today. Do not invent one in analytics.

## GA4 boundary

GA4 remains useful for aggregate acquisition, funnel and UX exploration. It is a consumer of product events, not the merchant business database.

Do not use GA4 alone to claim:

- Store/Campaign durable visitor or intent totals;
- merchant revenue or sales attribution;
- payment/credit truth;
- production/runtime reliability.

## Document lifecycle

The old Phase 1–3 migration/progress model is closed. Historical phase reports stay under `archive/` as evidence. Do not create new phase/completion documents for ordinary analytics changes.

When event semantics change:

1. change and test the runtime contract;
2. update `event-taxonomy.md` only for durable semantic changes;
3. update the cross-cutting Observability & Analytics Contract when data-plane, provenance, attribution, schema or source-of-truth boundaries change;
4. update the GA4 checklist only when operator configuration changes.
