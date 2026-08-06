# VisuTry Store Demo & Pilot Readiness Plan

**Status:** Active execution plan  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-06  
**Purpose:** Realign the existing Sales Demo to the commerce / campaign direction and prepare the first real merchant pilots.  
**Architecture:** `docs/decisions/ADR-008-commerce-domain-over-storefront.md`  
**Commerce architecture:** `docs/product/specs/visutry-commerce-architecture.md`  
**Sales Demo spec:** `docs/product/specs/visutry-store-sales-demo.md`  
**MVP spec:** `docs/product/specs/visutry-store-mvp.md`  
**Store implementation plan:** `docs/product/plans/visutry-store-implementation-plan.md`

---

## 1. Objective

The current Sales Demo already proves that the Store workflow can run. The next step is not to add broad platform features. The next step is to turn the Demo into the first credible representation of the future commerce product and make the system safe and operational enough for early real merchant traffic.

The working product thesis is:

> **Storefront is the delivery surface. Campaign Engine is the business.**

The near-term execution objective is:

> **Revise the Demo so merchants understand the traffic → decision → intent → conversion story, then make the same implementation reusable for the first 1–3 real pilots.**

A successful outcome is not a prettier demo. It is a working pilot path where a merchant can provide products, route a defined audience/traffic source, observe real shopper behavior, and decide whether to pay.

---

## 2. What Changes Now

### Keep

- current Merchant tenant model;
- anonymous MerchantSession;
- merchant-specific hosted route;
- merchant catalog / MerchantFrame;
- recommendation;
- Try-On;
- Compare;
- MerchantIntent and Store events;
- usage policy;
- privacy / retention boundaries;
- existing Admin access for internal operation;
- Consumer isolation under ADR-007.

### Change / strengthen

- Store Demo positioning;
- traffic/source/campaign entry context;
- shopper journey narrative;
- product identity and destination continuity;
- merchant admin information architecture;
- merchant pilot onboarding workflow;
- merchant-specific usage / operational controls;
- pilot measurement contract;
- production readiness for independent real traffic.

### Do not build now

- general campaign builder;
- Shopify public app;
- WooCommerce plugin;
- EHR/PMS integration;
- CRM/CDP;
- marketing automation;
- multi-touch attribution;
- autonomous agent shopping;
- enterprise RBAC;
- broad self-service billing.

---

## 3. Phase P0 — Demo Realignment

**Target:** immediate / before the next merchant outreach wave.  
**Goal:** make the working demo tell the future commerce story without faking future functionality.

### P0.1 Shopper entry

The shopper page should clearly communicate:

```text
Merchant / Campaign Context
        ↓
Personalized eyewear decision experience
        ↓
Recommendation → Try-On → Compare
        ↓
Product / Inquiry Intent
```

Required changes:

1. Keep merchant identity visually primary.
2. Add a concise context line that can represent campaign/collection intent, for example:
   - Find frames for your face;
   - Summer sunglasses shortlist;
   - Professional frames collection.
3. Preserve `source`, `medium`, `campaign`, `referrer`, and `aiAgentSource` when present.
4. Keep anonymous-first upload / recommendation; no Consumer login gate.
5. Make merchant product destination visible and persistent after recommendation.
6. Keep one primary action per state.
7. Do not display unsupported cart, purchase, inventory, fit, prescription, or AI-agent claims.

### P0.2 Recommendation state

The recommendation state must feel like a commerce decision step, not a technical AI output.

Required:

- merchant-only product shortlist;
- product name / price where verified;
- short recommendation reason;
- stable product URL / destination;
- clear selection state;
- ability to continue into Try-On / Compare;
- track recommendation completion and selected frames.

### P0.3 Try-On / Compare state

Required:

- preserve product identity through generation;
- support 2–4 frame comparison;
- preserve source/campaign/session attribution;
- record successful / failed generation honestly;
- product click / favorite / inquiry available from the decision result;
- no Consumer Credits prompt.

### P0.4 Admin / merchant intelligence story

The internal Admin demo should be revised around the merchant commerce funnel:

```text
Acquisition
→ Engagement
→ Recommendation
→ Try-On
→ Compare
→ Intent
→ Conversion signal
```

Minimum information architecture:

**Overview**
- sessions;
- engaged shoppers;
- recommendation completion;
- try-on rate;
- compare rate;
- product click rate;
- inquiry rate;
- high-intent shoppers;
- successful renders / usage.

**Acquisition**
- source;
- medium;
- campaign;
- referrer;
- AI Assistant / Agent where reliably identified.

**Catalog / Product Intelligence**
- top recommended frames;
- top tried frames;
- top clicked / favorited frames;
- frame attribute distribution;
- catalog health.

**Shopper Intent**
- session-level shortlist;
- favorites;
- product clicks;
- inquiries;
- high-intent journeys.

Do not label any metric as revenue or conversion unless a verified merchant conversion source exists.

### P0.5 Demo seed data

Luna Optical should include enough synthetic first-party events to demonstrate:

- at least 3 acquisition sources;
- one AI-assistant source;
- multiple recommendation sessions;
- Try-On and Compare completion;
- favorites, product clicks, and inquiries;
- different frame performance;
- identifiable demo/synthetic status.

Synthetic data MUST use the same event/intent model as live data and must never be mixed with real pilot reporting without a visible distinction.

---

## 4. Phase P1 — Pilot-Ready Product Hardening

**Target:** before independent merchant shopper traffic.  
**Goal:** make one current Store implementation safe and repeatable for 1–3 pilot merchants.

### P1.1 Close external-traffic gate

Gate A1 must be closed before merchants independently share the Store URL.

Required:

- controlled/private shopper asset delivery;
- session capability enforcement;
- upload/generation abuse limits;
- retention / cleanup verified;
- browser-level 2/3/4 frame Compare test;
- partial-failure behavior verified;
- Store background failures isolated from Consumer;
- logs and analytics contain no raw face image or sensitive analysis payload;
- deployment smoke tests for concurrency / leases.

### P1.2 Merchant onboarding

Pilot onboarding should be an operator-assisted workflow, not a developer project.

Target workflow:

```text
Merchant qualified
→ Pilot brief
→ Merchant profile
→ Catalog import
→ AI enrichment
→ Human review
→ Campaign/source setup
→ Pilot URL
→ QA
→ Launch
```

Required onboarding checklist:

1. merchant name / logo / website / contact;
2. pilot goal / KPI;
3. audience / source / campaign to test;
4. 8–50 frames;
5. SKU / product URL / image / price where available;
6. frame enrichment review;
7. privacy / retention terms;
8. usage allowance;
9. launch URL;
10. success criteria and reporting cadence.

### P1.3 Catalog import

Priority order:

1. CSV import;
2. Admin/manual correction;
3. URL-assisted import where useful;
4. Shopify sync only after repeated onboarding pain.

The pilot must not require merchants to manually classify every frame.

### P1.4 Merchant authentication

The shopper remains anonymous-first.

For pilot merchant reporting:

- internal Admin operation is acceptable during the first controlled pilot if the merchant receives scheduled reports;
- before merchant self-service dashboard access, use merchant membership / tenant-scoped authorization;
- do not represent merchant access by a global `ADMIN` role;
- merchant users must never gain cross-tenant admin visibility.

### P1.5 Usage controls

Each pilot merchant requires:

- explicit usage allowance;
- server-side enforcement;
- successful / failed generation accounting policy;
- internal usage / cost visibility;
- ability to suspend merchant or campaign entry without affecting Consumer.

---

## 5. Phase P2 — Pilot Measurement Contract

**Goal:** prove merchant commerce value, not merely usage.

### 5.1 Required funnel

Every pilot report should be able to show:

```text
Landing Sessions
→ Engaged Shoppers
→ Recommendation Completed
→ Try-On
→ Compare
→ Product Click / Favorite / Inquiry
→ Verified Conversion when available
```

### 5.2 Minimum KPIs

| Layer | KPI |
| --- | --- |
| Acquisition | sessions by source / campaign |
| Engagement | upload / recommendation completion |
| Decision | shortlist, Try-On rate, Compare rate |
| Intent | favorite, product click, inquiry |
| Catalog | top recommended / tried / clicked frames |
| Usage | generation success / failure / render consumption |
| Conversion | merchant-provided lead / appointment / order when verifiable |

### 5.3 Pilot success criteria

Each pilot must define one primary business KPI before launch.

Examples:

- product click rate;
- inquiry rate;
- appointment lead rate;
- add-to-cart rate if integrated;
- purchase conversion if reliable data is available.

Secondary metrics may explain behavior but must not replace the agreed primary KPI.

### 5.4 Revenue attribution

M1 may report:

- `VisuTry-originated product clicks`;
- `VisuTry-originated inquiries`;
- `merchant-confirmed conversions`.

Do not report `attributed revenue` unless the order/conversion source can be matched reliably.

---

## 6. Phase P3 — Campaign Readiness Without Building a Campaign Platform

The first pilots should begin collecting enough context to tell us when a first-class Campaign aggregate is justified.

For every merchant capture:

- traffic source;
- merchant campaign / collection name if applicable;
- target audience / intent;
- catalog subset;
- business objective;
- primary KPI.

Use the existing session attribution first.

Create a first-class Campaign model only when one merchant needs multiple persistent experiences or campaign-level reporting/configuration.

### Trigger examples

- Summer Sunglasses vs Professional Frames need separate reporting;
- different paid ad campaigns route to different frame subsets;
- merchant wants campaign-specific offer / landing copy;
- pricing is based on active campaigns;
- same merchant runs multiple markets / languages / audiences.

---

## 7. Merchant Pilot Package

The first pilot should be simple to buy and simple to operate.

Suggested pilot structure:

**Founding Pilot**

- 30 days;
- hosted merchant / campaign experience;
- 8–50 catalog frames;
- AI recommendation;
- Try-On + Compare;
- source / campaign tracking;
- product click / favorite / inquiry tracking;
- weekly merchant report;
- assisted setup.

Commercial validation target:

- USD 99–199/month for Storefront-style pilot;
- test higher campaign / usage pricing where merchant traffic and conversion value justify it;
- deposit-backed pilot is a valid willingness-to-pay signal.

The pilot package must not promise Shopify integration, full white-label, advanced attribution, or guaranteed conversion uplift.

---

## 8. Demo-to-Pilot Acceptance Checklist

### Product

- [ ] Merchant-specific hosted route works.
- [ ] Anonymous shopper session works without Consumer login.
- [ ] Merchant catalog contains stable product identity.
- [ ] Recommendation uses merchant-only frames.
- [ ] Try-On result remains attached to the merchant product.
- [ ] Compare works for 2–4 frames.
- [ ] Product click / favorite / inquiry is durable.
- [ ] Source / campaign context survives the full journey.

### Privacy / reliability

- [ ] Gate A1 privacy requirements are closed.
- [ ] Abuse / usage controls are merchant-scoped.
- [ ] Retention cleanup is verified.
- [ ] No raw shopper face assets appear in merchant analytics.
- [ ] Consumer regression suite passes.
- [ ] Store cron/job failure cannot block Consumer.

### Merchant operations

- [ ] Onboarding checklist exists.
- [ ] CSV import can be completed without developer code changes.
- [ ] Catalog enrichment can be reviewed / corrected.
- [ ] Merchant can be suspended safely.
- [ ] Merchant usage can be inspected.
- [ ] Pilot KPI is configured / documented.

### Measurement

- [ ] Funnel events are durable.
- [ ] Source / campaign report works.
- [ ] Product-intent report works.
- [ ] Synthetic demo data is separated from live data.
- [ ] Verified conversion terminology is used correctly.

---

## 9. Recommended Execution Sequence

### Week 1 — Demo commerce realignment

- revise Store shopper entry narrative;
- ensure source/campaign attribution is visible in test flows;
- strengthen product identity/destination continuity;
- revise Admin IA to Acquisition / Decision / Intent / Usage;
- update Luna synthetic demo event mix;
- update merchant demo script.

### Week 2 — Pilot operations

- finish CSV onboarding path;
- create merchant onboarding checklist;
- add pilot configuration / usage controls where missing;
- close remaining Gate A1 items;
- create pilot launch QA checklist;
- prepare weekly merchant report format.

### Week 3 — First merchant setup

- onboard first own-frame merchant;
- configure pilot source / audience / KPI;
- run end-to-end QA;
- collect baseline merchant metrics where available;
- launch controlled traffic.

### Week 4+ — Learn and promote only proven concepts

- review funnel and merchant feedback weekly;
- identify repeatable merchant requests;
- determine whether first-class Campaign is now required;
- determine whether merchant self-service dashboard is required;
- determine whether URL import / Shopify sync is the next onboarding bottleneck;
- do not expand platform breadth without repeated evidence.

---

## 10. Decision Gates After First Pilots

### Promote Campaign to first-class domain when

- multiple campaigns per merchant are real;
- persistent campaign configuration is required;
- campaign-level metrics influence merchant decisions or pricing.

### Build merchant self-service when

- 3+ active merchants require direct dashboard access;
- internal operator workflow becomes a bottleneck.

### Build Shopify integration when

- 3+ pilots repeat catalog/update pain;
- merchant willingness to pay is already proven.

### Build conversion integration when

- merchants want ROI / revenue reporting;
- a reliable checkout/order source can be connected.

### Build public agent interface when

- agent-originated traffic is meaningful;
- merchants request actionable agent commerce rather than referral only;
- privacy and authorization contracts are clear.

---

## 11. Definition of Success

This plan succeeds when VisuTry can show:

1. a Demo that communicates the future AI commerce product accurately;
2. at least one real merchant catalog operating without a custom engineering fork;
3. real shopper traffic flowing through recommendation → Try-On → Compare → intent;
4. merchant-facing source and intent measurement;
5. 1–3 paid or deposit-backed pilot commitments;
6. evidence that tells us which next commerce capability deserves promotion into the platform.

The key discipline is:

> **Use the Storefront to learn the commerce domain. Build only the pieces that real campaigns and real merchants prove necessary.**

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created Demo realignment and first-pilot readiness execution plan. |
