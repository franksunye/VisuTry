# Merchant AI Usage — Standard Production Contract

**Status:** Merchant standard functionality deployed to Production (2026-10-27;
standard release `4719942cdf9aacc64cde4f02c5dd8f6f786d9509`, followed by
Campaign responsive fix `59a9299807addf54b470ecea798d04bec7d239c6`).
**Owner:** Merchant Engineering / Product.
This is an upgrade of the Merchant product, **not** an opt-in feature flag or
a shadow migration. No production paid-merchant usage distribution is inferred
from local/mock validation.

**Commercial activation closure (2026-10-27, pending release verification):**
The Lead confirmed fully self-service Launch/Growth/Scale subscriptions with
the unchanged $199/$499/$999 prices and 1,000/5,000/10,000 AI Commerce Session
limits, plus **1,000/3,500/7,000 standard images** per monthly billing period.
The enrollment transaction now provisions both merchant-period allowances when
Stripe confirms subscription activation. Founding Pilot retains the agreed
3,500 / explicitly granted 5,000 image exception. Only Enterprise and assisted
add-on arrangements need a custom contract; do not present standard recurring
image limits as `HOLD` or requiring manual activation. This code change is
not evidence of a new Production deployment until the release gate passes.

## Product behavior

- Every Merchant with an eligible **active** LAUNCH, GROWTH, SCALE, ENTERPRISE
  or FOUNDING_PILOT commercial plan automatically uses its purchased monthly /
  pilot-period standard-render allowance.
- Every public Store and Campaign exposes `Try-Ons per shopper session` with
  **1 / 2 / 4** options (default **2**), saved per Experience.
- Count **RESERVED + SETTLED** slots under the original merchant-period
  PostgreSQL transaction/advisory lock. Every real image generation occupies a
  slot until conclusively released or settled. Reusing a request ID never
  dispatches another provider generation.
- A SUCCESS is settled only after the image is durably stored. A conclusive
  provider failure releases the slot. UNKNOWN/timeout/ambiguous dispatch
  **holds** the same task/slot; never dispatch a replacement to free capacity.
- Once a session limit is reached, stop only additional generation. Preserve
  completed images, comparison, recommendation and Merchant product CTAs.
- Merchant Plan & Usage reads the real period reservation ledger and reports
  successful, held and available images; normal AI Commerce Session counting
  remains independent. Never show invented zeroes as business performance.

## Plan entitlement, not feature flags

- No `VISUTRY_MERCHANT_AI_BUDGET_MODE`, `SHADOW`, `ENFORCE`, eligibility
  cohort lists, or `entitlementVersion`/`pricingVersion` gate.
- A Merchant without an active valid paid/pilot entitlement must not receive
  unmetered paid images. Free provides browsing and recommendation but no
  generative Try-On. Demo without an enrolled paid plan uses its separately
  bounded demonstration entitlement, **not** an imagined real subscription.
- The existing Consumer-paid continuation, its credit accounting, and
  MerchantSponsoredUsage first-value budgets are separate business products.
  These are not a version switch and must not be silently merged into the
  paid Merchant monthly ledger.
- Version labels retained on historical reservation records are audit metadata
  only; they never decide whether the monthly allowance applies.

## Release safety

1. Integrate the full stacked Merchant code on one exact SHA.
2. Verify the canonical baseline and deploy the **additive** PostgreSQL
   migrations for Merchant period reservations and Experience session limits
   with the repository's authorized, direct-connection migration procedure.
   They are schema migrations, not commercial activation switches.
3. Verify local PG16 last-slot concurrency, tenant isolation, same-key
   idempotency, result-before-settlement, definitive release, UNKNOWN hold,
   old/new period allocation and per-session 1/2/4. Verify Chromium Merchant
   Store/Campaign edit-save-reload with genuine local Store APIs, plus Consumer
   revenue-critical browser and full regression CI.
4. Deploy a production build only after CI and explicit production migration
   checks; verify Vercel READY + alias, public guest landing, Consumer paths,
   authorized Merchant admin reads and the intended commercial-plan behavior.
5. There are no public paid Merchants to migrate to a separate v2 cohort;
   do not create fake paid accounts, send provider spend or activate real paid
   contracts just to manufacture verification evidence. Fail closed on missing
   required plan allowance, missing billing period, or inconsistent task state.
6. Verify the full **Stripe paid event → Merchant entitlement write → live
   PostgreSQL period reservation → Store Try-On acceptance** contract. Cover
   replayed webhooks, same-plan renewal with contract overrides, plan upgrade,
   Founding Pilot bonus, and failed/no-output releases. The first Stripe event
   must populate both `standardRenderAllowance` and `commerceSessionAllowance`.
   A successful Stripe subscription record alone is not a Try-On-ready proof.

## Read-only operations reconciliation

Before enabling paid self-service conversion, check for any pre-existing paid
Merchant whose subscription claims activation but whose render meter cannot
admit a single image. This must be read-only; verify each exception against
Stripe/contract records before an audited repair, never bulk-assume entitlement:

```sql
SELECT id, "planCode", "commercialStatus", "standardRenderAllowance",
       "commerceSessionAllowance", "entitlementEffectiveFrom", "billingPeriodEnd"
FROM "Merchant"
WHERE "planCode" IN ('LAUNCH', 'GROWTH', 'SCALE', 'FOUNDING_PILOT', 'ENTERPRISE')
  AND "commercialStatus" IN ('PAID_ACTIVE', 'PILOT_ACTIVE', 'CANCEL_AT_PERIOD_END')
  AND (
    "standardRenderAllowance" IS NULL OR "standardRenderAllowance" <= 0
    OR "entitlementEffectiveFrom" IS NULL OR "billingPeriodEnd" IS NULL
  );
```

```sql
SELECT r."merchantId", r."periodStart", r."periodEnd", r.status,
       count(*) AS render_slots
FROM "MerchantAiRenderReservation" r
WHERE r."merchantId" = :merchant_id
GROUP BY r."merchantId", r."periodStart", r."periodEnd", r.status
ORDER BY r."periodStart" DESC, r.status;
```

```sql
SELECT r.id AS reservation_id, r."tryOnTaskId" AS task_id,
       r."periodStart", r."periodEnd", r."reservedAt",
       t.status AS task_status, t."quotaSettledAt" IS NOT NULL AS usage_settled,
       t."resultImageUrl" IS NOT NULL AS has_persisted_result
FROM "MerchantAiRenderReservation" r
LEFT JOIN "TryOnTask" t ON t.id = r."tryOnTaskId"
WHERE r."merchantId" = :merchant_id AND r.status = 'RESERVED'
ORDER BY r."reservedAt" ASC LIMIT 100;
```

Do not automatically release `UNKNOWN` tasks or assume failed provider API
responses imply zero supplier cost. Retain the task and reconcile by the
original provider task ID.
