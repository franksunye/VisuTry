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
| SHADOW | No enforcement, no writes. Read-only metrics implementation and QA still pending; do not claim SHADOW evidence yet. |
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
- Remaining hard gates: operator reconciliation report, SHADOW/observability
  with sanitized Axiom data, enrollment/renewal lifecycle, approved contract
  cohorts, consumer fallback and private result access regression.
- Do not merge or deploy Draft M1b until the Lead approves the final exact SHA.
