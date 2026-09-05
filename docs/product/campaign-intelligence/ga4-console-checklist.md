# GA4 Console Checklist

**Status:** Active bounded operator runbook  
**Owner:** Growth / Analytics  
**Last updated:** 2026-09-04  
**Authority:** `docs/project/observability-and-analytics-contract.md`  
**Runtime event registry:** `src/lib/analytics-events.ts`

## Purpose

Use this checklist only for GA4 console configuration and verification. GA4 is an aggregate product/acquisition analytics consumer; it is not the Store/Campaign business database and does not replace Axiom operational telemetry.

Do not change product code merely because a desired GA4 dimension/event is not visible in the console.

## 1. Before changing GA4

Verify in the authenticated GA4 property:

1. the active production web data stream / Measurement ID;
2. events observed in the last 7–14 days;
3. existing custom dimensions;
4. existing key events;
5. whether legacy dimensions/events still receive production traffic;
6. current consent/filter/internal-traffic rules.

Historical console state from August 2026 is evidence only; do not assume it still represents the current property.

## 2. Recommended logical reporting groups

Maintain one GA4 property for now and build logical views/explorations for:

- **Consumer Growth** — acquisition → Consumer decision flow → paid outcome.
- **Commerce Discovery** — acquisition/discovery paths into PUBLIC_INDEX Store/Campaign surfaces; durable shopper/action/intent totals remain PostgreSQL-backed.
- **Cross-product Discovery** — Search / AI / social / referral across VisuTry-owned acquisition surfaces and commerce surfaces.
- **Merchant Activation** — merchant prospect/onboarding/workspace funnel.

Do not create separate GA4 properties for 2B/2C without a separate privacy/ownership/scale decision.

## 3. Custom-dimension discipline

Register only bounded dimensions that answer a recurring analysis question and are actually observed in production.

Good candidates, when emitted and useful:

```text
surface
entry_point
journey_type
source_journey
destination
face_shape
frame_category
intent_type
lead_type
failure_reason
analytics_schema_version
```

Use caution before registering high-cardinality fields such as:

```text
merchant_id
store_id
campaign_id
consumer_funnel_id
session/event identifiers
landing_page / page_path when effectively unbounded
```

These fields may exist in events without being good GA4 custom dimensions.

Never register raw arrays, arbitrary URLs, raw errors, inference payloads, free text, secrets or PII as custom dimensions.

## 4. Key-event discipline

Mark only verified product/business outcomes that exist in production and are useful for decision-making.

Examples of legitimate candidates include:

```text
tryon_completed
comparison_completed
purchase_intent_clicked
lead_created
b2b_lead_created
merchant_first_store_published
merchant_billing_activated
merchant_first_intent
purchase
```

The exact enabled set should match current product priorities and observed event availability.

Do not mark as key events merely to complete a funnel:

```text
*_started
*_failed
journey_continued
internal/test/debug events
```

## 5. DebugView smoke

After a real instrumentation change or GA4 console change:

1. use a controlled QA/test session;
2. exercise only the relevant bounded flow;
3. confirm the canonical event name;
4. confirm expected bounded parameters;
5. confirm no PII/secrets/raw object payloads;
6. confirm no duplicate legacy + canonical event pair unless an intentional migration window exists;
7. confirm test evidence is not being interpreted as genuine distribution evidence.

Do not generate synthetic Agent traffic to make observation metrics non-zero.

## 6. Merchant commerce boundary

GA4 may show Store/Campaign acquisition and aggregate behavior, but merchant business truth comes from:

```text
MerchantSession
→ MerchantEvent
→ MerchantIntent
```

Use `npm run report:agent-distribution -- --json` for the current genuine distribution evidence contract.

Never use a GA4 dashboard alone to claim:

- durable Store/Campaign visitor totals;
- Product Click / Inquiry business truth;
- merchant sales/revenue attribution;
- Gate A genuine distribution PASS.

## 7. Current cleanup task

During the next authenticated GA4 console session:

- inventory existing custom dimensions/key events;
- classify each as `keep`, `legacy-remove`, or `needs-evidence`;
- prefer deleting obsolete console configuration over adding dimensions for old plans;
- verify current Consumer/Commerce/merchant-activation explorations can be built from observed events;
- record only the resulting durable configuration here.

No application change is authorized by this checklist alone.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-04 | Replaced the stale Phase-2 Campaign dashboard setup list with a bounded one-property GA4 operator checklist aligned to the current three-plane observability contract and durable merchant business model. |
