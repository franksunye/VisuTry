# Merchant AI Period Budget — M1b OFF / SHADOW / ENFORCE and rollback

Status: INTERNAL ENGINEERING DRAFT. No existing Merchant v1, Pilot, Demo,
Consumer plan, Stripe SKU, or published price changes are authorized.

## Commercial boundary

- Merchant AI Commerce Sessions are counted separately from completed usable
  Merchant-sponsored AI Try-On generations.
- The billing-period render reservation is separate from the rolling 24h
  shopper first-value MerchantSponsoredUsage allowance (consumed at provider
  acceptance). Never migrate or reinterpret existing rows.
- A Merchant render is chargeable against its own purchased period only when
  RENDER_SUCCESS settles after a persisted, accessible result. Provider attempts
  and provider bills are separate financial cost observations; failure does not
  imply zero supplier cost.
- Existing contract v1, Founding Pilot, legacy, Demo and Consumer continuation
  keep historical entitlement semantics. In particular, M1b does not change
  the 3,500-image Pilot commitment or choose any v2 quota or agency pricing.

## Activation mode (server only)

Environment variable: VISUTRY_MERCHANT_AI_BUDGET_MODE

| Value | Behavior |
| --- | --- |
| Unset / OFF / unknown | Default. Legacy path, zero v2 reservation activity. |
| SHADOW | Existing Store tasks behave as OFF; a **read-only** assessment of explicitly versioned v2 capacity is emitted after a claim (Axiom-approved existing fields). No v2 reservation row is written and no v2 limit is enforced. Observation errors never fail a shopper request. |
| ENFORCE | Store/Campaign merchant-paid paths atomically admit only explicitly versioned v2 Merchant contracts; legacy contracts bypass unchanged. |

A qualifying v2 row must have ALL of:
entitlementVersion=v2, pricingVersion prefixed v2-, eligible LAUNCH/GROWTH/SCALE,
eligible commercial status, finite positive standardRenderAllowance and valid,
active entitlementEffectiveFrom/billingPeriodEnd. An invalid/incomplete v2 marker
is DENIED rather than silently processed as a legacy unlimited contract.
Consumer continuation deliberately skips the Merchant render budget.

Do not set ENFORCE in production unless all these are proven and the Lead
approves a named cohort, exact deployed SHA and migration completion.
No existing or part-used period may be enrolled retroactively. Re-enrollment
after manual rollback requires reconciliation of outstanding reservations.

## Runtime/rollback

1. Persist a v2 RESERVED row, bind it to one Store TryOnTask, and record
   RENDER_ATTEMPT in one SERIALIZABLE transaction with a PostgreSQL
   transaction-scoped merchant-period advisory lock. Pending + settled use
   capacity; replays reuse the original task and never dispatch again.
2. Provider submission goes through the existing Grsai/Kie Store adapter.
   Acceptance never consumes the paid render entitlement. Kie submission
   UNKNOWN stays PROCESSING/held and must never create a second task.
3. Persist usable result privately. RENDER_SUCCESS and RESERVED→SETTLED
   occur in the same transaction, exactly once, for the original pinned period.
4. Definitive failed/no-sent task: RESERVED→RELEASED. Ambiguous provider
   acceptance, timeouts, uploads in flight and missing proof: retain RESERVED
   until manual/provider reconciliation. Never blindly expire a hold.
5. Operator rollback: set mode OFF, leave schema, task IDs, reservations and
   success ledger intact. NEVER truncate reservation rows or dispatch/retry
   unresolved provider tasks to free quota. Audit unresolved holds before
   re-enabling an eligible cohort.
6. User-facing refusal occurs only when an approved v2 Merchant exhausts
   renders. Browsing, deterministic recommendations and existing pages stay up.

## Verification and release gate

- Quality Gate disposable PostgreSQL: concurrent final-slot (one winner),
  idempotent transaction, once-only RENDER_SUCCESS settlement, definitive
  release, ambiguous hold, cross-tenant, and legacy contract behavior.
- Mock-only tests; no real provider procurement, uploads, or Stripe writes.
- Merchant Executed RC Foundation browser evidence, exact-SHA GitHub CI and
  real Store/Campaign/Compare workflow QA must all pass before merge.
- M1b PostgreSQL regression explicitly checks that a COMPLETED task missing a
  persisted result is **not** settled; an eventual result on the original task
  can settle exactly once. SHADOW never creates v2 reservation rows or denies
  the shopper despite v2 capacity exhaustion.
- Remaining release gates: fully executed ENFORCE v2 Store/Campaign/Compare
  browser path with local seeded v2 contract, supplier failure/UNKNOWN
  reconciliation proof, approved contract cohorts, Consumer fallback and
  private result access regression. These cannot be inferred from an ordinary
  mocked Store UI test.
- Do not merge or deploy Draft M1b until the Lead approves the final exact SHA.

## Read-only operator reconciliation (no automatic release)

Run the following **SELECT only** against an approved read-only DB connection,
scoped by merchant ID. Never export photos or task metadata to telemetry.
The result is an audit queue, **not** permission to re-submit a provider task.

```sql
SELECT r."merchantId", r."periodStart", r."periodEnd", r.status,
       count(*) AS render_slots
FROM "MerchantAiRenderReservation" r
WHERE r."merchantId" = :merchant_id
GROUP BY r."merchantId", r."periodStart", r."periodEnd", r.status
ORDER BY r."periodStart" DESC, r.status;
```

For outstanding reservations, inspect **only task state and status**:

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

Any `UNKNOWN`, unresolved accepted task, inconsistent settled ledger, or
unbound hold is **operator HOLD**. Never infer a provider refund or final
failure from elapsed wall-clock time. Reconcile using original task/provider ID,
not a new image generation call. Contract renewals must retain original period
membership, including reservations that settle after the renewal boundary.

## Safe deployment order

1. Apply additive migration; confirm prior plan IDs and billing remain unchanged.
2. Deploy with `VISUTRY_MERCHANT_AI_BUDGET_MODE=OFF`.
3. Optionally use `SHADOW` on a local approved v2-only fixture to inspect
   sanitized `resultStatus`, `planCode`, `remaining`, `merchantId` and
   `taskId`. Do not treat ordinary Store `RENDER_ATTEMPT` as a v2 hold.
4. Only after explicit approval of a named future v2 cohort and an exact
   deployment SHA consider `ENFORCE`; never enroll historical partially
   consumed contract periods. Roll back to OFF without deleting reservations.
