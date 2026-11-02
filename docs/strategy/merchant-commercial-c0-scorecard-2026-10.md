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
| Qualified requests | `BusinessPilotLead.status=QUALIFIED` as a current-state snapshot; `src/modules/business/domain/business-pilot-lead.ts` | Qualified / unique persisted non-spam inquiries from same period; status transition timing requires its own durable history if weekly transition accounting is desired | UNKNOWN | Current-state `status` is not a prospect list or a historical reply event; manual contact/response evidence must remain separately governed |
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


---

## 5. 2026-11-02 C1 observed baseline — Production read-only + GA4/GSC

**Status: OBSERVED_BASELINE / CONTINUITY_READY; not a completed merchant conversion or validated sales attribution.** This addendum supersedes the `UNKNOWN` values above **only for the explicitly observed sources, scopes and times**; the original C0 audit remains preserved as historical evidence. No production mutations, test submissions, payment operations, identity stitching or customer outreach were performed. Exclude all internal/test, reference, suspicious, unknown and unverified candidate records from the REAL commercial numerator.

### 5.1 Source-specific observations

| Plane | Observation and time window | Values / scope | Interpretation and boundary |
| --- | --- | --- | --- |
| GA4 Business entry | GA4 `AI-2024 / visutry.com` → Reports → Landing page; **2026-10-05–2026-11-01**; table search `business` | **52 landing sessions**, **50 active users**, **47 new users** across 8 `/en/business...` routes; 0 key events, $0 GA4-reported revenue. Site-wide landing report 6,918 sessions (Business entries 0.75%). | *Landing-page sessions*, not all Business pageviews or 52 qualified merchants. No confirmed internal-traffic exclusion. GA4 revenue is not Stripe truth. |
| GA4 B2B behavior | Same GA4 property → Reports → Events; same 28-day window; event name search `b2b` | **23 total `b2b_*` events / 10 GA4 users**: `b2b_sales_intent_clicked` **15 events / 7 users**; `b2b_landing_viewed` **4**; `b2b_resource_video_started` **2**; `b2b_resource_opened` **1**; `b2b_resource_video_completed` **1**. **No `b2b_lead_form_started` / `b2b_lead_created`** events in the filtered report. | CTA events are not necessarily unique human leads and can include `source=store_landing`; the default event-name table does not prove they all originated on `/business`. Event-name filters and landing-session denominators cannot be divided into a true conversion rate. |
| GA4 recommended leads | Same property → Lead acquisition; **2026-10-05–2026-11-01** | Standard report shows **0 new / 0 qualified / 0 converted leads** across all site channels. | GA4's recommended `generate_lead`/`qualify_lead`/`close_convert_lead` events populate that report; our custom `b2b_lead_created` is a separate event contract. Thus standard lead-report zeros are **not** standalone evidence of zero durable leads. |
| GSC Business search discovery | Search Console property `https://www.visutry.com/`, Google Web, **2026-10-03–2026-10-30**, `/business` page contains filter | **0 clicks / 4 impressions** across three returned pages. | Organic Google Search only, not all channels. Main `/en/business` absent from rows does not prove an indexing error. |
| Persisted Business inquiries | Production Admin → Business Inquiries, read-only as of **2026-11-02**; backed by `listBusinessPilotLeads` bounded `take:200` | **One listed record**, explicitly labelled `internal-qa / production-smoke` (2026-08-24). **0 observed non-QA Pilot/Enterprise lead records** in the admin list. | The observed record is TEST, not a real inquiry. Do not expose lead contact fields or assume this UI is a complete lifetime export beyond its 200-row bound. |
| Merchant commercial portfolio | Production Admin → Store → Commercial, read-only as of **2026-11-02 14:39 UTC** | Portfolio reports **150 merchants overall**, **128 POSSIBLE_EXTERNAL**, **0 commercial eligible REAL**, **0 Paid REAL**, **0 active Pilots**, **0 subscriptions**, **$0 MRR**, **$0 Pilot one-time revenue**, **0 commercial shopper sessions/intents**. | Counts are *current classification and commercial KPI definitions*, not proof that no real people ever signed up; unverified candidates are excluded by design. Monetary zeros describe eligible REAL merchant commercial view, not the entire company's B2C receipts. |
| Durable self-service activation | Production Admin → Store → Self-service activation report, observed same day; post-Activation-v1 **lifetime candidate cohort (not the GA4 28-day window)** | **71 candidate workspaces** = **0 confirmed REAL + 71 POSSIBLE_EXTERNAL**. **5 returned** (7.0%), **0 first product**, **0 Catalog ready**, **0 Store Preview**, **0 Store publish**, **13 commercial intent**, **0 checkout started**. | Only newly instrumented `SELF_SERVICE_SIGNUP` workspaces with `referenceData=false`; older legacy workspaces omitted. 13 durable merchant commercial-intent milestones are NOT the GA4 15 CTA events. |

**B2B entry breakdown, GA4 landing sessions:** `/en/business` 17, `/en/business/pilot` 15, `/en/business/pricing` 7, `/en/business/integrations` 6, `/en/business/commerce-intelligence` 4, `/en/business/platform` 1, `/en/business/resources` 1, `/en/business/store` 1. Total **52**.

### 5.2 Actual state of the data bridge

1. **Working:** GA4 receives B2B custom events; the public Pilot form calls `POST /api/business/pilot-leads` and tracks `b2b_lead_created` after a successful response; the Production Admin Business Inquiries and Store pages expose persisted records and durable Merchant Activation/KPI aggregates. Observed live values were read without data mutation.
2. **Not yet end-to-end proven:** GA4 `b2b_sales_intent_clicked` → `b2b_lead_form_started` → persisted non-QA `BusinessPilotLead` → genuine `REAL` Merchant First Value → verified Live Merchant billing. No production non-QA lead or confirmed REAL merchant exists in the observed source set to validate that whole chain.
3. **Coverage caution:** GA4 recorded 52 Business landing sessions but only 4 `b2b_landing_viewed` events; these may represent different event populations. Audit placement/source parameters before treating `b2b_landing_viewed` as complete Business traffic. The site's existing `page_view`/Landing page reports already serve entry counts.
4. **Recommended GA4 events:** Google's Lead acquisition report uses `generate_lead`, `qualify_lead`, and `close_convert_lead` among recommended events. Adding those must mirror the durable lead/business status contract and preserve spam/duplicate/idempotency guards; **do not manufacture a test lead or mark a CTA as a lead** to make reports nonzero.

### 5.3 Weekly read-only refresh procedure

- Fix each report to a stated UTC or GA4 property-date interval; explicitly distinguish 28-day GA4 and all-time activation. Never divide numbers across those windows.
- GA4 **Landing page**: filter `business`, capture sessions/users and eight exact paths; GA4 **Events**: filter `b2b`, capture event names/counts; **Lead acquisition**: record configured recommended-event counts with disclaimer.
- Production Admin **Business Inquiries**: count new persisted non-QA, consented requests, separately by Pilot and Enterprise status; no contact PII in summaries. Production Admin **Store**: capture REAL-only commercial metrics and candidate activation milestones separately. Audit candidate classification rather than silently promote POSSIBLE_EXTERNAL to REAL.
- Commercial finance: corroborate any **nonzero** paid/receipt value with billing records and Stripe LIVE provider evidence before marking VERIFIED. Do not use B2C GA4 `purchase` as B2B payment proof.
- Report a numerically verified zero when a source was read; otherwise `UNKNOWN`. For each stage retain source, timeframe, confirmed REAL exclusion, numerator/denominator, and next action. No person-level cross-system join unless separately reviewed and consented.

**Next evidence gate (P0-A):** verify the end-to-end event and persistence contract with isolated local/Preview test fixtures, diagnose 71-candidate first-product abandonment without corrupting Production, then observe the first genuinely external consented lead and the first verified REAL merchant through private Preview and billing. External outreach requires the existing independent Owner approval gate in #353.
