# Merchant Commercial-Ready & First Pilot Scorecard — 2026-10-13

**Status:** Source-contract baseline prepared; **NOT** an observed commercial baseline, launch certificate, or external outreach approval  
**Owner:** Merchant Lead / Product / Growth  
**Parent:** [#356](https://github.com/franksunye/VisuTry/issues/356) Commercial-Ready, [#414](https://github.com/franksunye/VisuTry/issues/414) integrated RC, [#353](https://github.com/franksunye/VisuTry/issues/353) acquisition-to-Pilot  
**Current scope:** SMB self-service first. Enterprise-assisted Factory [#406/#407](https://github.com/franksunye/VisuTry/issues/406) is a separate P1 certification. The independent Consumer funnel must not be merged into these Merchant totals.

## 1. Decision boundaries

1. [#352](https://github.com/franksunye/VisuTry/issues/352) Merchant billing was **Owner-accepted and closed** based on real Stripe Test Mode E2E plus verified Stripe Live/Vercel price/mode equivalence. This **does not assert** a new live merchant transaction or a signed webhook observed on the latest production runtime.
2. [#325](https://github.com/franksunye/VisuTry/issues/325) / [#272](https://github.com/franksunye/VisuTry/issues/272) real-product Business website proof and the post-merge production smoke are **completed**. Reuse the real Merchant Home and Analytics proof; do not rebuild marketing mockups.
3. [#417](https://github.com/franksunye/VisuTry/pull/417) was accepted on exact-HEAD real local PostgreSQL16/MCP evidence and merged as `8c1d4422cec3b1575f932479b97f1ba20421c429`. This is a **scoped Agent fix**, not final #362 or #414 signoff.
4. **Not yet Commercial-Ready:** [#418](https://github.com/franksunye/VisuTry/pull/418) final real Campaign fixture QA; [#384](https://github.com/franksunye/VisuTry/issues/384) Owner-to-guest Hero runtime; [#359](https://github.com/franksunye/VisuTry/issues/359) positive controlled external URL→approved import; active Cloudflare Worker deployment/route inspection; and the integrated same-SHA [#414](https://github.com/franksunye/VisuTry/issues/414) RC.
5. All live Production Merchant/Blob writes, Cloudflare deploy/purge, paid providers, live Stripe charges, public publication and external prospect outreach need their own appropriate authorization. Source-review PASS, mock PASS and real runtime PASS are distinct.

## 2. Commercial funnel source-of-truth matrix

**Baseline column is intentionally `UNKNOWN`.** No fresh, qualified Production cohort or prospect ledger was queried for this report. `UNKNOWN` must not be rendered as 0, and successful Local/Reference/Demo events must not be represented as real demand.

| Funnel metric | Exact rule / denominator | Authority | Evidence status / owner |
| --- | --- | --- | --- |
| Qualified prospects, contacted, replied, meetings and pilot requests | Count unique qualified merchant organisations by stage in approved prospect ledger; retain date, source, stage and evidence, excluding repeats | Approval-controlled sales/prospect ledger; NOT GA4 | **UNKNOWN** — Growth/Lead. No prospect contact authorized yet |
| Business landing traffic by acquisition source | Aggregate inbound page sessions and source/medium, per Business surface and period; never equate visits with qualified leads | GA4/GTM only where configured and current | **UNKNOWN** — Growth; inspect actual GA4 availability before declaring denominator |
| Created self-service merchant workspaces | Distinct `merchant_workspace_created` Merchants, cohort scoped to `classificationSource=SELF_SERVICE_SIGNUP`, `referenceData=false`; keep REAL distinct from POSSIBLE_EXTERNAL | PostgreSQL `MerchantActivationEvent`, `getMerchantActivationReport()` | **UNKNOWN** — Merchant/Product; code contract verified |
| First usable product / catalog readiness | Distinct eligible cohort Merchants with `merchant_first_item_added` and `merchant_catalog_ready` respectively; denominator above | PostgreSQL durable activation events + approved MerchantFrame readiness | **UNKNOWN** — Merchant/Product |
| Private Store Preview — **First Value** | Distinct cohort Merchants reaching `merchant_store_previewed` after a usable product; separately verify actual DRAFT, owned product and non-public state for QA | PostgreSQL activation event + Store/Experience/Catalog state | **UNKNOWN** — Merchant/Product; local #359 Manual/CSV QA is not live conversion |
| Signup → First Value elapsed time | Merchant-level elapsed time between first durable workspace event and first qualifying private Store Preview; report sample count, median and distribution only if actual timestamps available | PostgreSQL activation event timeline | **UNKNOWN** — Merchant/Product; Playwright wall time is not human time |
| Store published | Distinct eligible merchants with verified Store `ACTIVE` / `merchant_store_published`; denominator same cohort | PostgreSQL Experience lifecycle + activation event | **UNKNOWN** — Merchant/Product |
| Qualified Merchant Store/Campaign visitors | Distinct `MerchantSession` on owned Experience in window; exclude TEST, INTERNAL, REFERENCE, AUTOMATION, SUSPICIOUS and unqualified provenance; report by source/Experience | PostgreSQL `MerchantSession` + canonical distribution eligibility | **UNKNOWN** — Commerce Analytics; NOT total Consumer SEO visits |
| Engaged shoppers, recommendation, Try-On and Compare | Counts under canonical Merchant Session/Event/Generation definitions; do not assume every visitor is engaged or every Try-On succeeds | PostgreSQL `MerchantSession` / `MerchantEvent` + generation/task truth | **UNKNOWN** — Commerce Analytics |
| Intent / high-intent shoppers | Product Click/Favorite/Inquiry and high-intent signals based on implemented Merchant Intent/Event and attribution; count distinct qualified sessions where appropriate | PostgreSQL `MerchantIntent`, `MerchantEvent` and distribution contract | **UNKNOWN** — Commerce Analytics; NOT orders, GMV, ROAS or incrementality |
| AI Commerce Sessions and renders | One unique merchant-scoped `MerchantSession` crossing billable AI boundary; render attempts, success and limits separate; no normal-page-view charging | `MerchantUsageLedger` and canonical commerce capability | **UNKNOWN** — Product/Finance; meter not inferred from GA4 |
| Founding Pilot requested / started | Request is sales intent; Pilot start requires verified one-time $149 receipt + applicable durable commercial state, not signup or a redirect | Prospect ledger for request; PostgreSQL `MerchantBillingEvent` / canonical Merchant commercial state for paid | **UNKNOWN** — Sales/Finance; Stripe Test QA is not revenue |
| Active recurring merchants / MRR | Only eligible REAL Merchants on active $199 Launch, $499 Growth, $999 Scale verified recurring state; exclude Founding Pilot one-time receipts | PostgreSQL canonical commercial state + verified billing events | **UNKNOWN** — Finance; never infer MRR from payment link click |
| Pilot continuation/renewal/churn reasons | Confirmed merchant decision and billing evidence; count completed eligible Pilot cohorts, separately report continuing, declined and pending | Sales decision ledger and Stripe-verified state | **UNKNOWN** — Sales/Finance |
| Provider + operational costs / support | Real paid render counts × recorded provider unit cost version; Stripe fees where observed; human onboarding/support hours tracked separately | Provider/invoice / operational telemetry + explicit hours ledger | **UNKNOWN** — Finance/Operations; Axiom is diagnostic, not revenue truth |

**Cohort rules:** `getMerchantActivationReport()` may include `REAL` and `POSSIBLE_EXTERNAL` as separate candidates; **only verified REAL** is suitable for the commercial KPI/revenue numerator. `MerchantDistributionReport` has its own session eligibility boundary. Never promote either candidate class to paid customer or qualified external shopper without independent provenance. Axiom logs diagnose, GA4 measures acquisition where configured, PostgreSQL owns durable product and payment facts. For canonical runtime interpretation see:

- `docs/merchant-activation-v1.md`
- `docs/project/observability-and-analytics-contract.md`
- `docs/commercial-entitlements-v1.md`
- `src/modules/merchant/domain/merchant-activation.ts`
- `src/modules/merchant/application/merchant-activation-report.ts`
- `src/modules/store/domain/merchant-distribution-report.ts`
- `src/modules/store/domain/merchant-commercial-plans.ts`

## 3. Offer and messaging control

**Market Capture / Founding Merchant Pilot v8:** **$149 for 30 days**; 8–50 reviewed frames; up to **1,500 AI-assisted shoppers / AI Commerce Sessions**, **3,500 Standard Try-On generations**, Recommendation, Try-On, Compare, shopper intent reporting, assisted setup and weekly review. Up to 5,000 Standard renders is a **time-boxed explicitly approved exception**, not the default promise.

External language: competitive virtual try-on **plus** personalized recommendation, comparison and measurable **observed purchase-intent signals**. Do not promise measured sales uplift, guaranteed fit, order attribution, ROAS or merchant revenue until the corresponding commerce integration/experiment supports it. Current recurring plan capabilities and enforced entitlements are governed by `docs/commercial-entitlements-v1.md` and `src/modules/store/domain/merchant-commercial-plans.ts`. The market-capture **pilot** narrative is governed by `docs/strategy/merchant-pricing-packaging-unit-economics.md`; older pricing scenarios are not a replacement for current canonical runtime plans.

Do not launch outreach to an invented audience. Proposed first qualified segment: independent optical/ecommerce eyewear merchants able to supply 8–50 genuine reviewed frames, with an authorized storefront and a specific recommendation/try-on/compare decision problem. This is a **working ICP hypothesis**, not observed conversion proof.

## 4. Weekly scorecard template (keep baseline UNKNOWN)

| Week | Qualified prospects | Replies / meetings | Pilot requests | REAL self-service workspaces | First item / private preview / published | Qualified shoppers / high intent | Paid Pilot / recurring | COGS / support | Top blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pre-G4 baseline (2026-10-13) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | #414 RC not signed off |

Update weekly with period, query provenance, exclusion rules and cohort size. A zero is valid **only** after a real authoritative query returns zero.

## 5. Execution sequence / release gate

1. **Before external outreach:** close the remaining delegated #418 + B1/B2/B3 evidence gaps honestly, run #414 on one final integrated SHA, then obtain #356 Lead Commercial-Ready signoff. A blocked production/auth integration remains a blocker or explicit accepted exclusion; never quietly convert it into PASS.
2. **C0 prepared, not executed against live accounts:** this file is the source/definition scorecard. Once accounts are accessible, query real baselines and audit Business CTA/contact routing, Demo proof provenance and analytics plumbing; do not ask Codex to recreate already accepted #325/#272 product screenshots.
3. **C1 website proof:** #325/#272 completed; reopen only on an observed current-site regression or changed product screenshot, not by schedule.
4. **C2 first controlled founder-led batch:** after explicit outreach approval, qualify up to 20 merchants with relevance and no bulk scraping/automated contact. Track factual responses and follow-ups in an approved private ledger.
5. **C3/C4:** observe actual merchant First Value and shopper intent; review Pilot after 30 days and merchant continuation. Reassess pricing after the first, third and fifth paid merchants based on true COGS, usage and support rather than fabricated GMV lift.
6. **Enterprise Factory #406/#407:** P1, separate from SMB G4; real safe shared-command regressions remain P0. No automatic Factory/Restore readiness claim from read-only Verify or unwired operation ledger.

**Decision as of this source snapshot:** `C0_DEFINITIONS=PREPARED`; `REAL_COMMERCIAL_BASELINE=UNKNOWN`; `G4_RELEASE_READY=false`; `EXTERNAL_OUTREACH=HOLD`.
