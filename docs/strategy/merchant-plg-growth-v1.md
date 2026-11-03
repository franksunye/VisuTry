# Merchant Self-Service Growth Strategy — PLG v1

**Status:** Active strategic direction; experiments and channel launches remain gated
**Decision date:** 2026-11-03
**Owner:** Product / Growth / Merchant Engineering
**Scope:** Merchant SMB acquisition and self-service activation. Consumer remains an independent product.
**Parent:** [Commercial Strategy](commercial-strategy.md)
**Evidence / execution:** [Merchant PLG Baseline & Three Work Packages](merchant-plg-baseline-2026-11-03.md)

## Decision

VisuTry scales the SMB Merchant business through **two repeatable acquisition channels and one shared self-service activation engine**:

1. **First-party Merchant SEO/GEO:** A qualified eyewear retailer discovers VisuTry's *merchant-facing* content, evaluates real product proof, and starts without a sales call.
2. **Marketplace acquisition:** An eyewear merchant discovers VisuTry inside a commerce app ecosystem, initially investigated through **Shopify App Store**, and installs into the same underlying Merchant product.
3. **Self-service product-led activation:** Either channel leads to a usable catalog and a **private Store preview** with minimal human sales or engineering involvement. Merchant publishing, shopper usage, conversion evidence, and subscription are follow-on milestones.

**This is a directional decision, not evidence that either channel has demand or positive CAC/LTV.** Research and technical feasibility are authorized; public Shopify release, billing changes, and production merchant writes are not implied.

## Positioning and boundaries

Company positioning remains:

> VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.

- **Consumer:** independent Discovery → Decision product, with its own acquisition, features, monetization, and SEO plan.
- **Merchant:** Discovery → Decision → Intent, grounded in Catalog, Store, Campaigns, Analytics, and observable shopper decisions.
- A Merchant Store or Campaign's discoverability in Google/AI answers is **merchant-delivered product value**, distinct from SEO that acquires *new merchants* to VisuTry. Track them as separate funnels.
- Merchant Store/Campaign remain **guest-first** for shoppers. Do not force VisuTry Consumer accounts to browse a merchant's storefront.
- No guaranteed AI-search placement, organic ranking, incremental revenue, conversion uplift, or unlaunched Shopify integration in public claims.
- Assisted enterprise/pilot work may exist as an exception, but **outbound sales, customized demos, and Founder-led Pilot are not P0 SMB growth channels**.

## Growth system: one product, two entrances

| Funnel stage | Direct SEO/GEO | Shopify ecosystem | Shared authority |
| --- | --- | --- | --- |
| Discovery | Merchant query → Business/solution content | Shopify App Store search/category/listing | Channel-specific acquisition evidence (GSC/GA4 or App Store/Shopify) |
| Qualified entry | Merchant signup | Merchant-authorized app install/OAuth | Channel attribution; merchant identity |
| First item | Manual add; optionally approved import | Authorized Shopify product selection/import | Canonical catalog/readiness contract |
| **First Value (A6)** | Private Store preview | Private Store preview | Durable Merchant activation evidence |
| Launch | Explicit Store publish | Explicit theme app-block/embed enable + Store activation | No unauthorized automatic publication |
| Shopper value | Guest try-on/compare and merchant actions | Guest try-on/compare in Shopify storefront | Commerce events, observed intent; never fabricated revenue |
| Monetization | Approved direct Merchant billing | Shopify-compliant App Store billing where required | Shared entitlements and channel-specific billing adapter |

A merchant must not have to understand internal concepts (Factory, Handoff, AI Commerce Session accounting) before seeing First Value. One default guided path must always work, with advanced configuration deferred.

## Self-service product contract

1. **Value before setup complexity:** Landing → account/workspace → first usable eyewear product → private Store preview. Manual one-item entry is a reliable fallback even before integrations.
2. **Channel-neutral core:** Identity and consent are entry adapters; Product, Store, Campaign, sessions, quotas and entitlements must not fork per channel.
3. **Merchant controls:** The merchant explicitly approves public publication, theme placement, and billable usage. Draft/private preview cannot be silently exposed.
4. **Measured truth:** Use `MerchantActivationEvent` for the activation cohort; GA4/GSC or Shopify analytics for acquisition; Axiom for faults. Do not make a pageview or trial signup equivalent to an activated merchant.
5. **No-human default:** Setup explanations, validation and error recovery belong inside the product. Human support is exception handling, never a required first-use step.
6. **Sustainable economics:** Model rendering/session costs, infrastructure, marketplace processing/revenue share, refunds and support load before a plan is launched.
7. **Real product proof:** Reference experiences, screenshots and statistics must remain labeled as demo/reference when not from independent merchants.

## North Star and diagnostic scorecard

**Proposed Merchant North Star:** `real self-service merchants reaching A6 private Store preview within 7 days of qualifying workspace creation`, segmented by `acquisition_channel`.

The 7-day window is an **experimental target**, not a currently measured SLA. The underlying event contract is [Merchant Activation v1](../merchant-activation-v1.md).

| Metric | Definition | Authority | Baseline |
| --- | --- | --- | --- |
| Qualified merchant visits | Non-bot Business/merchant-intent entrances, not total Consumer visits | GA4 + GSC; landing/query split | To measure |
| App Store qualified listing traffic | Shopify App Store listing views / install starts where provided | Shopify Partner/App Store reports | Not applicable before listing |
| Activation A0→A6 | Eligible real self-service workspaces reaching private preview within cohort window | Postgres `MerchantActivationEvent` + classification | To measure; do not infer from mock users |
| Time to First Value | A0→A6 duration (distribution, not only first-item time) | Postgres durable event timeline | To calculate |
| Unassisted First Value | Activated merchants with no human setup intervention / eligible activated merchants | Support/intervention tagging + activation events | Instrumentation gap |
| A6→A7 and A7→A9 | Preview→publish, publish→first real shopper | Postgres durable events | To measure |
| Merchant paid retention / unit margin | Paid active cohort and contribution after compute/fees/support | Merchant billing + usage + cost ledger | To establish separately by channel |

No numerical improvement promise is adopted until these baselines and attribution coverage are verified. All `TEST/INTERNAL/REFERENCE/AUTOMATION/SUSPICIOUS/UNKNOWN` cohorts remain excluded.

## Three execution stages

### Stage 1 — Evidence and baseline (P0, start now)

- **A: Merchant SEO/GEO opportunity.** Research query intent, direct competitors, existing Business landing/conversion, indexation and first-party GSC/GA4. Create a *small prioritized set* of useful pages, not a large programmatic page factory.
- **B: Shopify opportunity and feasibility.** Identify competing Shopify apps, eyewear merchant needs, App Store discovery channels and policy. Design the minimum install-to-value path and cost assumptions; capture Go/No-Go conditions.
- **C: Self-service activation audit.** Compare current code/contracts with the actual merchant journey; establish A0/A3/A6/A7/A9 funnel and identify blockers, help dependencies and channel consistency gaps.

Deliverables: dated evidence record, current-vs-target gap matrix, opportunity score, bounded Stage 2 scope. **No marketing or integration claims before release.**

### Stage 2 — Bounded product and acquisition experiments (conditional)

- Ship 1–2 independently valuable, verifiable Business content/SEO improvements with real product screenshots and clear self-service CTA.
- Remove the most costly measured activation friction, preserving catalog, tenant isolation, quota, billing, and preview/publish gates.
- Build a **Shopify adapter prototype in isolated dev/test** only if Stage 1 demand + feasibility justify it. No App Store submission or unauthorized production merchant install.

Acceptance: production-safe rollout, controlled E2E (including guest and merchant), acquisition/activation events reconcile, and no regression to Consumer or merchant live commerce.

### Stage 3 — Channel launch and scale (separate approval gates)

- Expand evidence-backed SEO/GEO topics only when qualified traffic and activation improve.
- If Shopify proves viable: Partner/App requirements, OAuth, product sync/webhooks, theme extension, billing, support/uninstall, compliance, App Store review and listing analytics; owner approves launch.
- Optimize fully unassisted onboarding, recovery, pricing clarity and renewal from **real merchants and economics**, not only signups.

## Explicit non-goals for this cycle

- Founder-led outbound, lead-list campaigns, custom demos, manual onboarding as the main funnel.
- Publishing a Shopify public app before validation.
- New AI models, Consumer paywall redesign, or Consumer SEO backlog re-scoping.
- Auto-importing/altering merchant products without authorization, auto-publishing Store/theme, or changing Stripe production prices.
- Treating test traffic or reference Stores as real merchant traction.

## Decision register

| Date | Decision | Reopen only when |
| --- | --- | --- |
| 2026-11-03 | Direct Merchant SEO/GEO and Shopify marketplace are **candidate scalable channels**; self-service is a prerequisite | Qualified merchant demand and conversion evidence |
| 2026-11-03 | Shopify feasibility is **GO for research**, not GO for public app implementation | Stage 1 technical, policy, cost and demand gates |
| 2026-11-03 | Pilot/outbound is not SMB P0 | Separate enterprise or explicit assisted exception justified |
| 2026-11-03 | Consumer independence and merchant guest experience remain mandatory | Separate product-level decision |

## Related contracts

- [Commercial Strategy](commercial-strategy.md) — company and dual-product position
- [Business Website IA & Copy](../product/business-website-ia-and-copy.md) — existing website and CTA contract; revision required before shipping self-service acquisition copy
- [Merchant Activation v1](../merchant-activation-v1.md) — durable activation events and cohort
- [Observability & Analytics Contract](../project/observability-and-analytics-contract.md) — acquisition/activation/ops boundaries
- [Merchant Commercial Readiness Scorecard](merchant-commercial-readiness-scorecard-2026-10-13.md) — **historical pilot baseline**, not the active PLG success definition
- [Consumer SEO Backlog](../project/seo-backlog.md) — independent Consumer workstream
