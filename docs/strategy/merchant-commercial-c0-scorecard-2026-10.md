# Merchant Commercial C0 — Funnel Source of Truth & Weekly Scorecard

**Status:** C0 source-code audit / `BASELINES_UNKNOWN`, ready for Lead scope review — not a growth launch.
**Baseline code:** `main 3e27b0f5cc02742632f9510b2360329eae674ad5` (2026-10-12).
**Authority:** [#353](https://github.com/franksunye/VisuTry/issues/353), [#356](https://github.com/franksunye/VisuTry/issues/356).
**Product separation:** Merchant B2B funnel only. Consumer B2C `docs/strategy/analytics/gtm.md` is independent.
**No Production SQL, GA4 admin read, Stripe charge, lead contact or user-level identity joins were performed for this C0 audit.** Every numeric baseline below is `UNKNOWN`, not zero.

## 1. Operational source-of-truth matrix

| Business question / canonical numerator | Correct source and code authority | Correct denominator / classification | Baseline | Limitation / next verification |
| --- | --- | --- | --- | --- |
| Business Pilot / Enterprise request submitted | Persisted `BusinessPilotLead` after `POST /api/business/pilot-leads`; `src/modules/business/application/business-pilot-leads.ts`. `goal=enterprise` denotes enterprise inquiry | Consented, unique `requestId` records; separately segment Pilot vs Enterprise | UNKNOWN | `b2b_sales_intent_clicked` is only a CTA click; `b2b_lead_created` emitted after API success is secondary observation. Do not count honeypot accepted-but-unpersisted submissions |
| Qualified requests | `BusinessPilotLead.status=QUALIFIED` or later explicit status; `src/modules/business/domain/business-pilot-lead.ts` | Qualified / unique persisted non-spam inquiries from same period; status transition timing requires its own durable history if weekly transition accounting is desired | UNKNOWN | Current-state `status` is not a prospect list or a historical reply event; manual contact/response evidence must remain separately governed |
| Contact attempts / replies / demos | `BusinessPilotLead` operator status such as `CONTACTED` and `DEMO_SCHEDULED`; `demoAt` is an optional scheduled timestamp | Explicitly actioned real inquiries, not all CTA clicks or TEST Merchant accounts | UNKNOWN | Attempt count, reply rate, response SLA and meeting attendance are **not proven** by one current status field; maintain privacy-safe operator ledger before asserting |
| Merchant self-service workspaces created | Durable `MerchantActivationEvent` event `merchant_workspace_created`; `src/modules/merchant/application/merchant-activation-report.ts` | Created `SELF_SERVICE_SIGNUP` cohort with `classification in (REAL,POSSIBLE_EXTERNAL)` and `referenceData=false`; confirmed `REAL` reported **separately** | UNKNOWN | `POSSIBLE_EXTERNAL` is unverified candidate, not confirmed real customer or conversion |
| First usable product | `merchant_first_item_added` and `merchant_catalog_ready` server activation milestones; canonical `MerchantFrame` is business state | Same workspace-created candidate cohort; First Item and Catalog Ready are separate milestones | UNKNOWN | Invalid/PENDING catalog rows cannot be labeled Ready. `MerchantCommercialKpis.funnel.catalogReady` uses `catalogItems>0` and is **not** equivalent to the activation report's actual `catalog_ready` milestone |
| Private First Value | `merchant_store_previewed` persisted authenticated event; `docs/merchant-activation-v1.md` | Same eligible workspace-created cohort, at most once per Merchant for milestone conversion | UNKNOWN | Preview is the First Value endpoint, **not publish**. Code currently reports `averageTimeToFirstItemMs`, not a verified time-to-first-preview aggregate; derive separately if needed |
| Published Store | `merchant_store_published` server activation event and current `Experience.status=ACTIVE` (distinct event vs state) | Same eligible cohort for stage conversion; business-facing current ACTIVE Store count is a different metric | UNKNOWN | Publishing is not proof of public image decode, merchant sales or active shopper experience |
| Guest Store / Campaign visits | `MerchantSession` canonical tenant/Experience rows; `getMerchantAttributionBreakdown` and `src/modules/store/application/merchant-analytics.ts` | Eligible `REAL` merchants only in commercial totals; separately filter Reference/TEST/Internal/Automation and first-party Discovery Canary per `isCommercialMerchant` | UNKNOWN | GA4 visits and attribution are top-of-funnel observation, not authenticated sale or distinct human users |
| Engaged shopper decisions and intent | `MerchantEvent` and `MerchantIntent` grouped per Experience/session; canonical Merchant Analytics | Same eligible `REAL` commercial sessions. Define each event/intent type explicitly before presenting a numerator | UNKNOWN | Favorite, frame click or inquiry signals do not establish completed purchase or GMV. `MerchantSession` and `MerchantIntent` must remain separate from operator activation events |
| Pilot/recurring merchants and actual revenue | Canonical commercial status, plan/entitlement and verified Stripe provider evidence; `src/modules/merchant/domain/merchant-commercial-kpis.ts` | Only `isCommercialMerchant=REAL`, excluding Discovery Canary; test transactions are not revenue | UNKNOWN | `PAID_ACTIVE` must be matched with canonical billing truth. Founding Pilot receipts dedupe by Checkout Session; Test Stripe never counted as Live revenue. #352 permits prelaunch config equivalence but **did not execute a Live Merchant charge** |
| Merchants continuing or lost | Actual billing period/subscription status and explicitly recorded `BusinessPilotLead` outcome/objection where applicable | Previously activated, real paid merchants whose observation window elapsed | UNKNOWN | No observed 30-day cohort or renewal denominator is supplied in C0; never invent retention or churn |
| Acquisition/cost health | GA4 B2B acquisition observation and separately approved infra/AI provider cost ledgers | Source- and time-scoped B2B traffic versus actually incurred, segregated merchant cost | UNKNOWN | Axiom/Vercel telemetry is diagnostic; neither is the finance system or Stripe revenue truth |

**Provenance rules.** Keep four evidence planes distinct: (1) GA4/Business page click observation, (2) durable `BusinessPilotLead` inquiries, (3) `MerchantActivationEvent` and shopper `MerchantSession/Event/Intent` respectively, (4) verified commercial billing. Never sum candidate `POSSIBLE_EXTERNAL` with confirmed `REAL` as if all were proven merchants. `isCommercialMerchant` currently accepts only `REAL` and excludes the first-party Discovery Canary, even when classified REAL. Do not publish Merchant contact PII, raw attribution URLs, session IDs, API keys, or billing account IDs in a scorecard.

## 2. Weekly one-page Scorecard template (no invented values)

Reporting interval: `[week start UTC, week end UTC)`. Owner: Merchant Commercial Lead. Last actual data refresh: **NOT_EXECUTED**.

| Scorecard area | KPI to report | This week | Prior week | Accountable owner / source |
| --- | --- | --- | --- | --- |
| Acquisition | Qualified B2B Pilot/Enterprise inquiries; acquisition source breakdown | UNKNOWN | UNKNOWN | Business operations — `BusinessPilotLead` |
| Outreach | First contacts, replies, real demo meetings, pending follow-up | UNKNOWN | UNKNOWN | Founder-led outreach ledger + verified lead status |
| First Value | Eligible signups, first persisted item, ready Catalog, private Store previews, published Stores | UNKNOWN | UNKNOWN | Merchant product — `MerchantActivationReport` |
| Time to Value | Median/P90 signup→private preview, eligible completed cohort | UNKNOWN | UNKNOWN | Merchant product; requires bounded persisted-event timeline calculation, not current `averageTimeToFirstItemMs` |
| Shopper value | Qualified commercial Store/Campaign sessions, engaged sessions, supported intent counts | UNKNOWN | UNKNOWN | Merchant Analytics, REAL-only |
| Commercial proof | Active paid real merchants, active founding pilots, recurring MRR, deduped Live Pilot receipts | UNKNOWN | UNKNOWN | Billing + verified Stripe records |
| Continuation | 30-day reviews, continued/renewed pilots, lost reasons with actual eligible denominator | UNKNOWN | UNKNOWN | Commercial owner; no rate without elapsed cohort |
| Cost / quality | Merchant provider spend, support actions per delivery, release QA minutes, known public-render failures | UNKNOWN | UNKNOWN | Infrastructure / Factory execution ledger |

Each week, provide the raw numerator **and denominator**, interval, comparison basis, data provenance, `REAL` vs `POSSIBLE_EXTERNAL` separation, and a one-line `NEXT_ACTION`. Use `UNKNOWN` until the source has actually been read and cohort exclusions applied; `0` is allowed only after a real zero-valued query. Do not infer historical conversions from feature tests or reference merchants.

## 3. C0 gaps & bounded next decisions

1. **Baseline not queried:** No authorized live Postgres/GA4/Stripe operating queries in this review; therefore the scorecard is a reusable reporting contract, not a measured business-performance report. Next: separately authorized aggregate-only reads and source timestamps, no person-level exports.
2. **Founder-led outreach measurement is incomplete:** Durable lead `status` supports a minimal pipeline; first-contact attempts, responses and completed demos need explicit operator entries with dates, not made-up application events. Begin with the existing lead workflow before building a CRM.
3. **First Value timing gap:** The activation report exposes `averageTimeToFirstItemMs`; true signup→private-preview median/P90 must be computed from actual milestone events and must distinguish not-yet-previewed cohorts.
4. **Commercial eligibility differs by report:** Activation uses `REAL + POSSIBLE_EXTERNAL` candidate cohort and a separate confirmed REAL count. Commercial KPIs use only `REAL` except Discovery Canary; use the right denominator for each funnel stage.
5. **Accepted Billing scope:** #352 is CLOSED under the Owner-approved **Stripe Test + Production Live config equivalence** policy. This permits C0 measurement planning, not Live revenue claims or unsupervised outreach. G4 `releaseReady=false` until the independent release gates close.

## 4. Scope decision

**C0 SOURCE-MATRIX / SCORECARD DRAFT READY FOR LEAD REVIEW.** No website screenshot regeneration (owned by #325), prospect list, automated messaging, live campaign, schema migration, reclassification, Stripe operation or Production data write. Future C1/C2 actions require current product proof and Owner approval; Consumer GTM remains separate.

Related authority: `docs/merchant-commercial-measurement-v1.md`, `docs/merchant-activation-v1.md`, `docs/project/observability-and-analytics-contract.md`, `src/modules/merchant/application/merchant-activation-report.ts`, `src/modules/merchant/domain/merchant-commercial-kpis.ts`, `src/modules/business/application/business-pilot-leads.ts`, Issue #352 final billing acceptance and Issue #353 commercial scope.
