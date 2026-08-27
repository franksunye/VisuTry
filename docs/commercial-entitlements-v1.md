# VisuTry Merchant Commercial Entitlements v1

The canonical plan contract lives in
`src/modules/store/domain/merchant-commercial-plans.ts`. This document records
the version and the rules that runtime, Merchant UX, Admin, and future billing
integrations must share.

## Plans

`FREE`, `LAUNCH`, `GROWTH`, `SCALE`, and `ENTERPRISE` are the normal plan
family. `FOUNDING_PILOT` is a separate fixed commercial offer: `$149 / 30
days`, up to 1,500 AI-assisted shoppers, 3,500 standard Try-On generations,
8–50 catalog frames, Recommendation + Try-On + Compare, and assisted setup
with weekly review. Pilot is not silently converted to Launch.

Every Merchant has one canonical Store in v1. Additional brands or Stores are
future separate Merchant workspaces; Store count is not a pricing dimension.

## AI Commerce Session meter

An AI Commerce Session starts when a shopper crosses into an AI-assisted
commerce journey in a Merchant Store or Campaign. Normal browsing, product
views, product clicks, and inquiry without an AI journey do not consume this
meter. Recommendation, multiple Try-On generations, Compare, and Intent in
one attributed `MerchantSession` count as one billable session.

Operational render and event metrics remain separate. The billing meter is the
`MerchantUsageLedger` row with kind `AI_COMMERCE_SESSION`; its dedupe key is
unique to the attributed `MerchantSession`. The session also records the
provider-independent `billableAICommerceSession` transition in the same
Serializable transaction. The transition is therefore idempotent across
refresh, retry, navigation, and repeated API calls.

Unused included sessions do not roll over. Paid periods use explicit
`entitlementEffectiveFrom` and `billingPeriodEnd` boundaries when available;
before Stripe, missing boundaries use an internally anchored monthly period.
Pilot periods are fixed 30-day periods.

## Graceful exhaustion and downgrade safety

When the AI Commerce Session allowance is exhausted, the Store stays live and
catalog browsing, product links, inquiry, and analytics remain available.
Generative Try-On returns a structured `AI_USAGE_LIMIT_REACHED` decision and
the shopper sees a generic availability message. Merchant UX explains the
usage state and next action without exposing payment internals.

Catalog additions are blocked at the plan limit; existing records are never
trimmed. DRAFT and ARCHIVED Campaigns do not consume active Campaign
allowance. If a future downgrade leaves too many ACTIVE Campaigns, existing
Campaigns remain stored and require merchant action; the system does not
silently select or delete one.

Merchant classification remains separate from plan and authorization.
`TEST`, `INTERNAL`, and `REFERENCE` activity can be used for runtime QA while
remaining excluded from commercial KPI reporting.

G4-A intentionally does not implement Stripe checkout, subscriptions,
webhooks, invoices, refunds, automatic overage charging, or Enterprise sales.
