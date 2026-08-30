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

## Legacy enrollment boundary

Only a Merchant with a supported `planCode` is enrolled in the canonical
commercial domain. A row with no supported plan is represented as
`LEGACY_UNMIGRATED` / `Legacy · not enrolled`; it is not silently presented as
`FREE`. Legacy runtime behavior remains compatible with the existing product,
and this PR does not backfill or mutate existing production Merchants.

Enrollment is an explicit future transition: a billing or Admin-controlled
operation must write a supported `planCode`, the commercial contract version,
and the effective period together before canonical enforcement begins. G4-B
must call that transition from its Stripe-to-domain flow; Stripe is not queried
by runtime requests and no enrollment workflow is implemented in G4-A.

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

## G4-B billing boundary

G4-B adds Stripe as payment infrastructure only. The provider-independent
`Merchant.planCode`, `Merchant.commercialStatus`, pricing version, entitlement
version, and period boundaries remain the runtime source of truth. A successful
browser redirect never enrolls a Merchant; only a verified Stripe webhook may
perform enrollment.

Merchant billing uses an explicit server-side Price ID allowlist. Prices are
mapped by `STRIPE_MERCHANT_LAUNCH_MONTHLY_PRICE_ID`,
`STRIPE_MERCHANT_GROWTH_MONTHLY_PRICE_ID`,
`STRIPE_MERCHANT_SCALE_MONTHLY_PRICE_ID`, and
`STRIPE_FOUNDING_PILOT_PRICE_ID`. Client-supplied amounts and Price IDs are
never trusted. Each Merchant has one provider-specific billing identity, kept
separate from Consumer payments.

`MerchantBillingEvent` is the verified event ledger. In addition to provider
evidence, each newly recorded event stores the provider-independent `planCode`
when the signed Price/metadata has been validated. Founding Pilot repurchase
eligibility uses a `PROCESSED` Pilot receipt with `planCode=FOUNDING_PILOT`, not
the currently configured Stripe Pilot Price ID, so Pilot → paid plan changes
and Stripe Price rotation cannot erase the one-time offer history. For
pre-`planCode` legacy rows, the server also accepts only a receipt checkout
event whose stored `stripePriceId` is in the explicitly maintained
`STRIPE_FOUNDING_PILOT_PRICE_HISTORY` registry (plus the current Pilot Price
ID). This fallback is restricted to verified checkout receipts and never
classifies subscription or arbitrary checkout events as Pilot. The unique
provider event ID makes webhook retries no-ops; the account's event timestamp
prevents older Stripe events from overwriting newer state. Subscription
lifecycle changes are translated into the canonical commercial states, while a
paid Founding Pilot is a fixed 30-day period and never silently becomes Launch.

The additive `MerchantBillingEvent.planCode` migration does not guess at old
rows. Events created before this field existed remain unclassified when their
provider projection cannot prove the commercial plan; they require an explicit,
audited registry entry or backfill from verified receipt evidence before they
can serve as Pilot consumption evidence. Current canonical Pilot state remains
a compatibility guard during that transition. No billing history or production
Merchant is mutated by the migration itself.

Local and preview environments must use test Stripe credentials and
`STRIPE_MERCHANT_BILLING_MODE=test`. Production requires live credentials and
`STRIPE_MERCHANT_BILLING_MODE=live`. Missing or mismatched configuration fails
closed. No G4-B migration is run by local verification and this feature is not
production-ready until the additive migration, review, merge, deployment, and
bounded smoke are completed.

## G4-C commercial launch closure

The external offer is intentionally explicit. A new Merchant can use the real
Free plan, request or enter the fixed Founding Pilot when eligible, or choose a
paid recurring plan after enrollment. The Pilot is `$149 / 30 days`, has no
automatic renewal or silent conversion, and is not a discounted Launch
subscription. The Merchant Plan & Usage surface shows the current plan,
period, included capacity, remaining capacity, feature availability, and the
next action. A checkout return is only a processing state until a verified
webhook updates the canonical Merchant fields; the browser redirect never
grants entitlement.

An exhausted paid or Pilot AI Commerce Session allowance pauses paid
Generative Try-On only. The Store remains live, normal browsing and product
links remain available, and the shopper receives a generic availability
message. `NORMAL`, `NOTICE`, `WARNING`, and `LIMIT_REACHED` are shared domain
thresholds at `<70%`, `70–89%`, `90–99%`, and `100%+`; UI code must not define a
second percentage contract.

Commercial KPI reporting is a trust boundary: only `REAL` Merchants count.
MRR sums active Launch ($199), Growth ($499), and Scale ($999) recurring
plans. Founding Pilot receipts are one-time revenue and are never included in
MRR. TEST, INTERNAL, REFERENCE, POSSIBLE_EXTERNAL, and legacy/unmigrated rows
may exercise runtime behavior but cannot become commercial revenue evidence
without explicit provenance review. Classification is never authorization.

The Admin view exposes enrollment, plan/status, usage, Store status, masked
provider identity, and recent webhook outcomes without exposing raw payloads or
allowing manual plan mutation. `PROCESSED`, `IGNORED · out of order`,
duplicate delivery counts, and `REJECTED` reasons are operational evidence;
absence of a ledger row means no verified event has arrived. Billing routes and
webhooks remain Vercel-owned; Cloudflare is not a second billing state machine.

Webhook retry semantics are explicit. A `REJECTED` event with a transient
reason such as `SUBSCRIPTION_NOT_READY` may be reprocessed for the same Stripe
`event.id`; a `PROCESSED`, `IGNORED`, or terminally `REJECTED` event is a
duplicate no-op. Pilot revenue is receipt-based: only `PROCESSED` successful
Pilot Checkout events from `REAL` Merchants count, deduplicated by the Stripe
Checkout Session, so a later recurring-plan change cannot erase historical
Pilot revenue and Pilot revenue never becomes MRR.

## Billing state normalization and recovery

The Merchant Purchase Summary uses a normalized, server-resolved billing state;
it does not infer a valid subscription from `stripeSubscriptionId` or the
stored subscription status alone. The provider verification step is read-only,
tenant-scoped, uses the expected Stripe mode, confirms the Stripe Customer and
supported recurring Price, and applies a bounded provider read.

The canonical states are:

| State | Meaning | Purchase action |
| --- | --- | --- |
| `NO_SUBSCRIPTION` | No active-looking provider reference exists and the workspace may start billing | `CHECKOUT` |
| `VALID_SUBSCRIPTION` | Stripe object, mode, Customer, Price, and lifecycle are valid | `CURRENT` or `CHANGE_PLAN` |
| `PAYMENT_ATTENTION` | Payment, cancellation-at-period-end, or subscription action needs attention | `MANAGE_BILLING` |
| `BILLING_DISABLED` | The current billing policy does not permit writes in this environment/workspace | No live billing CTA |
| `SUBSCRIPTION_MISSING` | The database references a subscription that the expected provider cannot find | Recovery; never automatic Checkout |
| `SUBSCRIPTION_INVALID` | The provider object has the wrong mode, Customer, Price, or lifecycle | Recovery; never automatic Checkout |
| `PROVIDER_UNAVAILABLE` | The provider could not be reached or returned an unclassifiable transient error | Retry/recovery; never automatic Checkout |

`CHANGE_PLAN` failures never fall back to creating a new Checkout Session. A
missing, invalid, or ambiguous provider reference is a recovery state. Failed
write responses tell the Merchant that no charge was made and that the current
plan is unchanged; raw Stripe identifiers are not exposed.

Billing policy is separate from authorization and KPI classification. In
Production, `TEST` and `INTERNAL` workspaces have Live Billing disabled by
default. Local and Preview may use Stripe TEST for bounded QA, while `REAL`
workspaces follow the normal provider verification path. Classification does
not grant tenant access and does not by itself enroll a Merchant in a plan.

Production paid validation is deliberately a separate operator action. Use the
runbook at
`docs/operations/merchant-first-paid-production-validation.md` only after
approval. This G4-C code closure does not execute a real payment, deploy
production, mutate Merchant classification, or delete production data.
