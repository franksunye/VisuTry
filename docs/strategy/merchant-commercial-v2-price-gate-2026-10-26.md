# Merchant Commercial v2 — Executive Financial & Market Decision Gate

**Status:** Internal planning stress test, **not approved pricing, not a sales commitment**.
**Owner:** Product / Commercial Finance.
**As of:** 2026-10-26. **Authority:** [P0 #452](https://github.com/franksunye/VisuTry/issues/452).
**Source of current live plans:** src/modules/merchant/domain/merchant-commercial-plans.ts and docs/strategy/merchant-pricing-packaging-unit-economics.md. These are not altered by this paper.

**2026-10-27 implementation update:** The standard merchant-period image
reservation meter and configurable Store/Campaign shopper limits (1/2/4,
default 2) have shipped. This fulfills the engineering direction but **does
not lift Pricing HOLD**: the candidate v2 recurring image quotas, changes to
public plan prices, and partner rates remain unapproved. Published recurring
plans retain their v1 session capacities and require an explicit positive
period-image allowance at merchant enrollment; Stripe recurring enrollment
currently does not populate that field. Reconcile this production contract
gap before activating a new paid recurring customer. See
`docs/commercial-entitlements-v1.md` for the public/contractual matrix.

## Lead decision in one minute

1. **Engineering GO:** Make Merchant provider AI exposure finite under a separately enrolled v2 contract and prove it under concurrency, while **grandfathering original Pilot (3,500 / approved 5,000 renders)** and all existing published/contractual terms. Measure actual sessions-to-renders distribution; no Merchant history exists yet to calibrate it.
2. **Pricing HOLD:** Do not publish $199/499/999 v2 caps or reduce current promises before merchant willingness-to-pay and competition evidence. Compare against *generative* VTO pricing as well as lower-cost 3D AR; never equate shoppers with generated images.
3. **Agency HOLD:** Favor a separate 10–15% referral payout or 20–25% resale discount on eligible subscription revenue, never both on the same revenue, and do not grant uncapped free renders. Contract, economics and Stripe implementation remain proposed.

## Metering distinction

- AI Commerce Session: one merchant shopper's eligible decision journey, even with many generated images.
- Successful Standard Generations: count per usable completed image; each image has potentially paid external compute.
- Pending reservations: additionally block dispatch against the budget until success or definitive no-output reconciliation, **not counted as successful/billable use**.

At full merchant entitlement usage, render cost dominates the worst-case; unlike Consumer $2.99/30-credit historical behavior, do not assume breakage or 10-image average for B2B.

## Pure financial scenario assumptions — not invoices

| Parameter | Planning input | Reality status |
| --- | --- | --- |
| Kie Nano Banana 2 Lite 1K | $0.020 per paid image attempt equivalent | Public signal https://kie.ai/nano-banana-2-lite — reconcile actual account invoices, refunds, file-transfer charges |
| Grsai nano-banana-fast | $0.00389 per output | Historical internal planning figure from pricing v8 doc (RMB 0.02725 at FX 7); **not a current account invoice** |
| Provider billable-attempt factor | 1.0 baseline, 1.2 stress | Illustrative; actual failed/ambiguous billing and safe fallback must be reconciled |
| Payment + billing | 3.6% of subscription + $0.30 | Modeling assumption, not guaranteed effective Stripe rate |
| Merchant service/support | Pilot $30; Launch $15; Growth $30; Scale $60 | Monthly allocated assumption, excludes material one-time onboarding and CAC |
| Channel | Direct 0%; referral 15%; reseller 25% | Alternative commission/discount scenarios, never stacked |
| Other infrastructure and per-merchant variable costs | $0 for isolated illustration | Omitted; contribution below is an **upper bound** until included |

**AI-only margin proxy = (subscription revenue − paid provider image costs) / revenue.** This is NOT accounting gross margin. **Post-channel contribution = revenue − provider cost − payment fee − service assumption − channel cost − other variable expenses.** Neither metric includes acquisition, tax, fixed overhead or unreconciled cost.

### Same-model, full-capacity 1K-output stress

| Offer | Price | Sessions | Standard images | Kie AI COGS (1.0x) | Kie AI-only margin proxy | Kie post-channel contribution margin (25% reseller) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Existing signed/offer Founding Pilot v8 | $149 / 30 days | 1,500 | 3,500 | $70 | 53.0% | **4.1%** |
| Founding Pilot approved one-time 5,000 exception | $149 / 30 days | 1,500 | 5,000 | $100 | 32.9% | **negative** |
| Internal-only candidate Launch v2 | $199 / month | 1,000 | 1,000 | $20 | 89.9% | 53.7% |
| Internal-only candidate Growth v2 | $499 / month | 3,500 | 3,500 | $70 | 86.0% | 51.3% |
| Internal-only candidate Scale v2 | $999 / month | 7,000 | 7,000 | $140 | 86.0% | 51.4% |

*Gross/margin rounding: product calculations use exact internal values; table rounded to 0.1 percentage point. Pilot 5,000 bonus should be time-boxed, not recurring. Existing recurring plans have null/unlimited image allowance today; candidate row limits are not live or approved.*

Under a 1.2x Kie paid-attempt factor, provider image costs become respectively $84/$120/$24/$84/$168 — before changing revenue. Customer invoice/attempt semantics must be verified. Blended cost for Kie fallback probability p at 1.0x is approximated by images × ((1−p)×$0.00389 + p×$0.020), before model/version and billable failure differences.

**What this does and does not establish:** Initial v2 candidate 25%-channel contribution around 51–54% is plausible *only with the stated usage limits and simplified cost stack*. It is not proof of 60–70% B2B gross margin or that those caps are attractive enough. Existing 3,500-render Pilot is compatible with lower Grsai costs but materially exposed to all-Kie failover and reseller economics; commitments remain honored and must be budgeted explicitly.

## Competition / first-value guardrail

Current official listings for comparable but nonidentical solutions:

- [Fittingbox Shopify](https://apps.shopify.com/glasses-virtual-try-on-by-fittingbox): AR/3D virtual try-on, tiers historically listed near $59/500, $99/1,500, $199/3,500 **users**. AR users are not generative renders.
- [Banuba eyewear](https://www.banuba.com/glasses-virtual-try-on): AR/3D try-on, public packages around $99/1,000, $299/3,500, $799/15,000 try-ons; verify exact offered unit and current checkout before a claim.
- [Prevyou](https://apps.shopify.com/prevyou): generative try-on at about $29/250 and $99/1,200 image credits; verify quality and included output capabilities.
- [Optify](https://optifyonline.com/pricing): optical commerce bundle around $149/month, including AR VTO plus workflow. Different functional footprint and unit.

**Sales hypothesis:** “Competitive eyewear try-on + personalized decision and measurable purchase intent” can justify value above commodity AR, if real Store/Campaign guest first-value, quality, completion and conversion are demonstrated. It is not proved merely by adding entitlements or showing a large Session count.

Before changing public tiers, collect actual Pilot merchants and observe: time to first shopper value, 0/1/2/3/4/5+ rendered outputs per AI Commerce Session, qualified merchant conversion, paid continuation, error/timeout handling, cost per usable render, and customer feedback comparing capacity/quality/price. Never substitute demo traffic or synthetic runs.

## Agency/partner rule

- Referral: merchant pays VisuTry; partner gets a bounded share of **net eligible subscription revenue** (initial modeling 10–15%). Avoid double commission with Shopify App fees.
- Reseller: partner invoices merchant only under explicitly approved reseller structure; discount scenario 20–25% to partner (not an additional referral payout). Tenant/merchant ownership, invoicing, VAT/fees and refunds must be specified.
- Usage/top-ups: proposed paid separately from subscription and excluded from automatic commissions until a separate SKU and financial gate, backed by hard provider-spend budget. Never accept arbitrary user-supplied credits or hidden free allowances.
- Merchant-of-record, payment liabilities and country/tax rules require legal/billing signoff; no agency sales contract is authorized by this planning paper.

## Release recommendation

**GO now:** [M0 contract](../product/specs/merchant-commercial-model-v2.md), model test harness, opt-in bounded ledger architecture, observable quota and normal Store/Campaign availability.

**HOLD:** published recurring quota/price revisions, any Legacy/Pilot changes, Stripe mutations, reseller terms, additional purchased provider calls, Production write/canary and rollout. These each need exact evidence and explicit Lead approval.

Reevaluate once real paid Pilots produce a distribution and a customer-value signal; if below competitive capacity, adjust packaging or split a lower-cost AR/static tier from high-fidelity generative rendering **only after product/quality research and explicit decision**, not as an unannounced underlying model swap.
