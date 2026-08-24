# VisuTry Store Implementation Plan

**Status:** Historical D0→M1 execution contract; technical core implemented, real merchant acceptance pending
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-05  
**Last updated:** 2026-08-24
**Related demo spec:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related MVP spec:** `docs/product/specs/visutry-store-mvp.md`  
**Required engineering foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`  
**Architecture decision:** `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`  
**Related landing page:** `docs/product/specs/visutry-store-landing-page.md`  
**Production verification:** `docs/ops/store-d0-production-verification-2026-08-05.md`

---

## 1. Purpose

This plan defines the execution sequence for VisuTry Store from the current working Sales Demo to the first paid merchant pilots.

Reconciliation note: the implementation has advanced beyond the D0-era
sequence in this file. Experience/Campaign architecture, Reference Factory,
Business Website, Merchant Workspace, Sponsored Usage, attribution, public
discovery, and agent-native operations are implemented. Use
`docs/product/product-plan.md` for current priority; retain this plan for its
Pilot acceptance and durable engineering requirements.

The execution direction is now explicit:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

VisuTry Store must therefore be built from Day 1 as an **agent-ready commerce foundation**, even when the first merchant-facing product is still a hosted Storefront.

The guiding rule is:

> Build the minimum reusable commerce foundation that can convert human and AI-agent traffic into personalized eyewear decisions, measurable purchase intent, and merchant revenue. Do not build broad platform integrations before demand requires them.

Store execution proceeds in four layers:

1. **Foundation** — tenant, catalog, session, usage, privacy, attribution, events, product identity.
2. **Storefront** — fastest delivery surface for shopper experience and merchant pilot adoption.
3. **Campaign Engine** — traffic / audience / intent-specific experiences, attribution, and higher-ARPU merchant value.
4. **Commerce Infrastructure** — later Shopify, widget, API, agent and ecosystem integrations.

A public Shopify app, WooCommerce plugin, EHR/PMS integration, broad public agent API, or autonomous checkout is outside the current plan.

---

## 2. Strategic Product Thesis

VisuTry Store is not a generic virtual try-on plugin and is not a generic merchant website builder.

The target system is:

```text
Human Traffic / AI-Agent Traffic
            ↓
   Merchant / Campaign Context
            ↓
      Merchant Catalog
            ↓
    AI Frame Intelligence
            ↓
 Face / Shopper Understanding
            ↓
 Personalized Recommendation
            ↓
       Virtual Try-On
            ↓
        Frame Compare
            ↓
 Favorite / Product Click / Inquiry
            ↓
   Conversion / Revenue Signal
            ↓
   Merchant Commerce System
```

The commercial value to validate is:

> Help eyewear merchants turn qualified traffic into personalized frame discovery, try-on, comparison, measurable purchase intent, and ultimately more revenue.

The product must accept two traffic classes from the beginning:

- **Human traffic:** Search, Social, Ads, Email, QR, Direct, Referral.
- **AI-agent traffic:** ChatGPT, Claude, Perplexity, Gemini, and future shopping / search agents.

Agent-readiness is a product and data-contract requirement now. A generalized public agent action API is not an M1 requirement.

---

## 3. Day-1 Realignment — Immediate Priority

The current implementation already proves the Store workflow technically. The immediate execution priority is to make every external and demo surface express the long-term product correctly.

### P0.1 Sales Landing Page — reposition now

The existing Store landing page must move away from a narrow **Merchant Store / virtual try-on storefront** narrative.

New positioning:

> **AI Commerce Infrastructure for Eyewear — built for both human shoppers and AI agents.**

Merchant-facing value proposition:

> Give VisuTry your catalog and traffic. We turn that traffic into personalized recommendations, try-ons, comparisons, measurable purchase intent, and conversion insight.

The landing page should communicate three layers:

1. **AI Decision Engine** — understand shopper + understand frames + recommend.
2. **AI Conversion Engine** — recommendation → try-on → compare → intent → merchant outcome.
3. **Agent-Ready Commerce Foundation** — structured catalog, stable product identity, attributable AI-agent traffic, and future agent actions.

Do not sell the current Storefront as the final product. Present it as the fastest deployable commerce surface.

### P0.2 Shopper Demo — reframe as Agent-Ready Store Foundation

The shopper demo remains a real working shopper journey, but its product story changes from “visit a merchant store and try frames” to:

> **A traffic-to-decision experience that can be entered by a human shopper or routed by an AI agent.**

Required shopper narrative:

```text
Traffic / Campaign Entry
→ Shopper Intent
→ Merchant Catalog Context
→ AI Recommendation
→ Try-On
→ Compare
→ Product / Inquiry Intent
```

The demo should make these ideas visible where useful without adding fake controls:

- merchant / campaign context;
- catalog subset or collection context;
- personalized shortlist;
- recommendation reason;
- try-on and compare;
- product destination / inquiry;
- source / campaign continuity through the journey.

The shopper remains anonymous-first. A VisuTry consumer login must not be required before the first useful recommendation / try-on result.

### P0.3 Admin Demo — reframe as Campaign / Commerce Control Plane

The current merchant admin should stop looking like only a Store operations dashboard.

It should increasingly answer:

> **Where did high-intent traffic come from, what did shoppers want, which frames were recommended, and what commerce actions followed?**

Priority admin views / metrics:

- traffic source / campaign;
- AI Assistant / Agent as a distinct acquisition class where reliably identifiable;
- engaged shoppers;
- recommendation completion;
- try-on rate;
- compare rate;
- favorite rate;
- product click rate;
- inquiry / lead rate;
- high-intent shoppers;
- top frames / collections;
- successful renders / usage;
- attributed conversion or revenue when available.

Do not build a generalized marketing automation suite. The first admin should prove the information architecture and data model for a future Campaign Engine.

### P0.4 Preserve one core implementation

Do not create separate Shopper, Campaign, or Agent stacks.

All channels must reuse:

- Merchant;
- MerchantFrame;
- MerchantSession;
- Store events;
- recommendation core;
- Try-On generation;
- Compare;
- MerchantIntent;
- usage / attribution;
- privacy and asset boundaries.

Campaign and agent concepts should extend the existing Store core, not fork it.

---

## 4. Current Implementation Status

| Stage | Status | Evidence / boundary |
| --- | --- | --- |
| D0-0 / STORE-0 foundation | Complete | Module boundary, tenant model, session capability, usage policy, asset seam, idempotency, events, validation, migrations, and tests are implemented. |
| STORE-1 merchant foundation | Complete | Luna Optical is seeded with 16 active representative frames backed by reviewed product assets. |
| STORE-2 shopper route | Complete | Merchant route, privacy notice, session issuance, upload, catalog, and recommendation are operational. |
| STORE-3 recommendation | Complete | Merchant-scoped deterministic shortlist is operational. |
| STORE-4 Try-On / Compare | Engineering complete | One-frame production smoke passed; browser-level 2/3/4-frame Compare and partial-failure evidence remain Gate A1 items. |
| STORE-5 intent / insights | Complete | Durable intent/events, aggregation, trends, inquiries, high-intent shortlists, funnel, catalog health, inventory, and privacy-safe activity views are implemented. |
| Sales Demo visual layer | Complete | Shopper / admin shells and real workflow are implemented. |
| **Sales LP positioning** | **Needs revision now** | Current narrative must move from Merchant Store to AI Commerce / Campaign / Agent-Ready foundation. |
| **Shopper demo narrative** | **Needs revision now** | Existing workflow stays; entry, intent, campaign/source, and agent-ready story must be explicit. |
| **Admin demo narrative / IA** | **Needs revision now** | Evolve from Store metrics to campaign/source/intent/conversion control-plane story. |
| Controlled D0 production QA | Passed | See production verification record. |
| Gate A1 external traffic | Closed | Private asset access and remaining browser/concurrency evidence are required. |
| Merchant validation | Active | Run demos, collect own-frame sample requests, traffic/campaign context, and pilot evidence. |
| M1 pilot hardening | Not started | Starts after Gate B or explicit Product decision. |

---

## 5. Execution Gates

### Gate A0 — Engineering foundation

Complete and mandatory for all future Store work.

Foundation must preserve:

- modular Store boundary;
- merchant tenant isolation;
- anonymous merchant session capability;
- server-owned usage policy;
- shared Try-On attribution and idempotency;
- durable Store events;
- asset / privacy boundary;
- consumer regression isolation.

### Gate A1 — Allow non-team shopper traffic

Do not share a working Store URL for independent merchant / shopper use until:

- MerchantSession capability is server-enforced;
- abuse / usage limits are server-enforced;
- shopper assets use controlled access;
- privacy notice and retention / cleanup behavior are active;
- analytics / logs exclude raw shopper images and sensitive face payloads;
- tenant, authorization, abuse, privacy, and browser tests pass.

Current status: **closed**.

### Gate B — Start M1 paid-pilot hardening

Proceed when one or more are true:

- 3 merchants request a sample experience using their own frames;
- 1 merchant agrees to a paid or deposit-backed pilot;
- 5+ merchant conversations confirm the same traffic-to-conversion workflow;
- Product explicitly decides to operationalize a real-traffic pilot to capture conversion data.

### Gate C — Build self-service commerce integration

Do not start until M1 has at least 3 active merchant pilots and repeated onboarding / distribution pain is visible.

Potential later work:

- Shopify OAuth / product sync;
- WooCommerce;
- public widget / SDK;
- automated catalog import;
- merchant billing automation;
- advanced attribution;
- public agent interfaces.

---

## 6. Foundation Requirements — Build for Campaign and Agent Readiness

### 6.1 Catalog identity

Minimum merchant frame fields:

```text
merchant_id
frame_id
sku?
name
image_url
canonical_product_url
price?
currency?
brand?
variant?
availability?
shape
material?
color?
width_class?
style_tags?
status
```

Rules:

- product / frame identity must be stable;
- canonical product destination must remain explicit;
- merchant-provided commerce facts must not be invented;
- AI-enriched style / fit metadata must be distinguishable from merchant source facts;
- catalog data should be useful to humans and machine-readable discovery.

### 6.2 Acquisition / campaign attribution baseline

Every MerchantSession should retain first-touch context where available:

```text
source
medium?
campaign?
referrer?
landing_url?
ai_agent_source?
locale
device_type
```

Rules:

1. Context persists through recommendation, try-on, compare, and intent.
2. UTM / campaign parameters are attribution only, never authorization.
3. AI-assistant referrals are classified separately when reliable.
4. Attribution contains no raw face images or sensitive analysis payloads.
5. Session-level / first-touch attribution is sufficient for M1.
6. A first-class `Campaign` entity is optional until real merchant workflow needs persistent campaign configuration.

### 6.3 Agent-ready public baseline

Public merchant / campaign surfaces should support four principles:

- **Discoverable** — stable intended-public URLs.
- **Understandable** — explicit merchant, product, frame, price / availability facts where verified.
- **Actionable later** — recommendation / try-on / compare remain behind reusable application contracts.
- **Measurable** — agent-originated sessions and downstream intent remain attributable.

M1 does **not** require:

- public agent tool protocol;
- agent access to shopper photos;
- agent-specific recommendation fork;
- autonomous purchase execution.

---

## 7. Sales Demo Execution

### D0 Shopper experience

Keep the current real sequential workflow:

1. campaign / merchant entry;
2. privacy notice;
3. photo upload;
4. face / shopper understanding;
5. merchant-only recommendation shortlist;
6. select up to 4 frames;
7. try-on;
8. compare;
9. favorite / product click / inquiry.

Do not simulate live video, cart, physical-fit percentages, or fake checkout.

### D0 Admin experience

Required demo story:

1. **Acquisition:** source / campaign / AI-agent traffic.
2. **Engagement:** sessions, upload, recommendation.
3. **Decision:** try-on, compare, favorite.
4. **Intent:** product click, inquiry, high-intent shortlist.
5. **Catalog intelligence:** top frames, frame attributes, recommendation alignment.
6. **Usage:** successful renders, quota / cost context.

Privacy rules:

- no raw shopper face image by default;
- no sensitive face-analysis payload;
- synthetic demo activity must be explicitly identified and never masquerade as real merchant traffic.

### D0 QA additions for the new narrative

In addition to existing Store QA, verify:

1. source / campaign context survives the full shopper journey;
2. AI-assistant source can be classified where testable;
3. admin funnel can filter / group by source when sample volume exists;
4. product destination remains attached after recommendation / try-on / compare;
5. no agent-readable surface exposes shopper-sensitive data;
6. no consumer Credits Pack prompt appears.

---

## 8. Sales Landing Page Execution

This is a **P0 parallel workstream**, not a later marketing cleanup.

### Required message hierarchy

**Hero:**

> Turn eyewear traffic into personalized purchase intent.

**Support:**

> VisuTry combines catalog intelligence, AI recommendation, virtual try-on, comparison, and measurable conversion signals — for both human shoppers and AI-agent traffic.

**Three capability blocks:**

1. Understand your catalog.
2. Guide every shopper to better frame choices.
3. Measure the journey from traffic to merchant outcome.

**Agent-ready proof block:**

- structured merchant / frame facts;
- stable product destinations;
- AI-assistant traffic attribution;
- future-ready action contracts.

**CTA:**

- Request a merchant demo;
- Build a sample experience with your own frames.

Do not lead with “Build your AI eyewear store.”

---

## 9. Merchant Validation Sprint

**Target:** active now, 2-4 weeks.  
**Goal:** validate willingness to route real traffic through VisuTry and pay for measurable decision / conversion value.

### Funnel target

| Stage | Target |
| --- | ---: |
| Qualified merchants | 50-100 |
| Positive replies | 10-20 |
| Demo calls | 5-10 |
| Own-frame sample requests | 3-5 |
| Pilot commitments | 1-3 |
| Paid / deposit-backed pilots | 1-3 |

### Questions to capture after each demo

1. What traffic sources matter most today: Search, Ads, Social, Email, QR, Direct, AI assistants?
2. Which audience / campaign would you route through VisuTry first?
3. How do you maintain frame product data today?
4. Would 8-20 top frames be enough for a first campaign / pilot?
5. Is personalized recommendation materially more valuable than Try-On alone?
6. Which KPI matters most: product click, inquiry, add-to-cart, appointment, conversion, revenue?
7. Can VisuTry use a hosted campaign / Store experience before deeper integration?
8. What would prevent launch?
9. Would USD 99-199/month work for a lightweight Store pilot?
10. Would a higher campaign / usage fee be acceptable if VisuTry can show qualified shopper and conversion value?

Classify requests as:

- required to run pilot;
- useful after pilot;
- enterprise / later.

---

## 10. M1 — First Paid Merchant MVP

**Target:** 2-4 weeks after Gate B.  
**Goal:** operate 3-5 real merchants without developer intervention for normal shopper usage.

M1 includes:

1. merchant profile;
2. 8-50 frame catalog;
3. assisted onboarding;
4. AI frame enrichment + review;
5. hosted merchant / campaign entry link;
6. personalized shortlist;
7. virtual try-on;
8. frame compare;
9. product click / favorite / inquiry;
10. source / campaign attribution;
11. merchant analytics;
12. merchant-specific usage limits;
13. merchant authentication;
14. privacy / retention;
15. operational monitoring.

### Catalog onboarding priority

1. **CSV import** — first repeatable path.
2. **Manual / admin add** — fallback / correction.
3. **URL-assisted import** — use when it materially reduces pilot setup.
4. **Shopify product sync** — after repeated pilot demand.

### Merchant admin views

Required:

- Overview;
- Campaign / Acquisition;
- Frames / Catalog Intelligence;
- Shopper Activity / Intents;
- Usage.

Do not build yet:

- complex report builder;
- multi-touch attribution;
- generalized campaign automation;
- team RBAC;
- custom dashboards.

Merchant usage remains separate from consumer credits.

---

## 11. Engineering Work Breakdown — Revised Priority

### STORE-0 — Foundation

**Status:** complete; mandatory regression boundary.

Maintain:

- Store module boundary;
- tenant isolation;
- usage policy;
- event contract;
- asset / retention seam;
- idempotency;
- consumer isolation tests.

### STORE-1 — Merchant / Catalog Intelligence

**Status:** base complete; extend incrementally.

Next:

- stable canonical product identity;
- preserve merchant source facts;
- enrichment provenance;
- collection / campaign subset support when needed.

### STORE-2 — Shopper / Campaign Entry

**Status:** base complete; narrative / attribution upgrade now.

Next:

- source / campaign context;
- anonymous-first entry;
- campaign / collection context where useful;
- stable product destination through full journey.

### STORE-3 — Recommendation

**Status:** complete; improve only from pilot evidence.

### STORE-4 — Try-On / Compare

**Status:** engineering complete; finish Gate A1 browser / partial-failure evidence.

### STORE-5 — Intent / Commerce Insights

**Status:** base complete; admin IA upgrade now.

Next:

- source / campaign funnel;
- AI-agent source class;
- high-intent shopper metrics;
- product / inquiry attribution;
- conversion / revenue field when merchant integration provides it.

### STORE-6 — Pilot Operations

Starts after Gate B:

- CSV onboarding;
- catalog review;
- merchant auth;
- usage limits;
- monitoring;
- pilot checklist;
- operator tooling.

### STORE-7 — Agent-Ready Commerce Foundation

**Start now as a thin parallel workstream.**

This is not a public agent API project.

Tasks:

- stable public merchant / frame identities;
- structured product facts where appropriate;
- canonical destination URLs;
- AI-assistant referral classification;
- source / campaign attribution contract;
- public-surface crawlability / machine readability review;
- confirm recommendation / Try-On / Compare application contracts can later be exposed without duplication.

Done when:

> human and AI-agent traffic can be understood as two acquisition sources entering the same merchant decision / conversion core.

---

## 12. 90-Day Execution Sequence

### Days 0-15 — Realign the surface

- revise Sales LP positioning;
- revise Shopper demo narrative / entry context;
- revise Admin demo IA around campaign, source, intent, conversion;
- add attribution baseline;
- document agent-ready catalog / public-surface requirements;
- finish remaining Gate A1 evidence.

**Outcome:** product story, demo, and architecture all point to the same end-state.

### Days 15-45 — Merchant validation

- contact 50-100 qualified merchants;
- run 5-10 demos;
- build 3-5 own-frame samples;
- capture traffic source + campaign + KPI needs;
- test Store pilot pricing and higher-value campaign pricing language;
- convert strongest merchants to pilot commitments.

**Outcome:** evidence that merchants will route traffic and pay for decision / conversion value.

### Days 30-60 — Pilot readiness

- complete reusable CSV onboarding;
- catalog enrichment review;
- merchant authentication;
- usage policy / monitoring;
- source / campaign reporting;
- pilot operator checklist.

**Outcome:** launch-ready workflow for 3-5 merchants.

### Days 45-90 — First paid pilots

- onboard 1-3 paid or deposit-backed merchants;
- run real traffic;
- measure recommendation → try-on → compare → intent;
- measure source / campaign funnel;
- collect merchant continuation / willingness-to-pay evidence;
- decide whether Storefront or Campaign motion should lead the next scale phase.

**Outcome:** first repeatable commercial proof, not platform breadth.

---

## 13. Definition of Done for M1

M1 is ready for a real paid pilot when:

1. Store engineering foundation remains compliant.
2. Merchant can be provisioned without code changes.
3. 8-50 frames can be onboarded through CSV / admin tooling.
4. AI enrichment can be reviewed before activation.
5. Shopper flow works on mobile and desktop.
6. Shopper can enter anonymously.
7. Recommendation uses merchant catalog only.
8. Shopper can try and compare selected frames.
9. Product click / favorite / inquiry is attributable to merchant + frame + session.
10. Source / campaign context persists through the journey.
11. AI-assistant source can be separated where reliably identifiable.
12. Merchant can view basic source, funnel, catalog, intent, and usage insights.
13. Merchant usage is isolated from consumer credits.
14. Failed generation is observable and retryable.
15. Privacy notice and retention policy are implemented.
16. Merchant cannot access raw shopper face images by default.
17. Public machine-readable surfaces expose merchant/product facts only, never shopper-sensitive data.
18. At least one pilot merchant completes end-to-end acceptance testing with its own catalog and traffic source.

---

## 14. Metrics for First Pilots

Do not judge Store only by raw Try-On volume.

Track:

```text
Traffic Source / Campaign
→ Store Session
→ Photo Upload
→ Recommendation Viewed
→ Frame Selected
→ Try-On Completed
→ Compare Started
→ Favorite / Product Click / Inquiry
→ Conversion / Revenue when available
```

Merchant-level metrics:

- sessions by acquisition source;
- AI-agent / AI-assistant sessions where identifiable;
- upload rate;
- recommendation completion;
- recommendation-to-try rate;
- compare rate;
- favorite rate;
- product click rate;
- inquiry / lead rate;
- high-intent shopper count;
- top-frame concentration;
- successful render cost per engaged shopper;
- merchant continuation / willingness to pay;
- attributed conversion / revenue when technically available.

The strongest early business signal remains:

> Merchant chooses to keep the workflow live and pay after seeing real shopper behavior.

---

## 15. Explicitly Deferred

Do not add to D0 / M1 unless a pilot cannot proceed without it:

- Shopify public app;
- WooCommerce plugin;
- EHR/PMS;
- prescription / insurance workflow;
- PD measurement claims;
- generalized public API;
- public agent action protocol;
- autonomous agent checkout;
- full widget SDK distribution;
- generalized campaign builder;
- marketing automation suite;
- team RBAC;
- enterprise SSO;
- complex merchant billing;
- transaction take-rate system;
- advanced multi-touch attribution;
- large-scale catalog crawler;
- native Store app.

---

## 16. Current Decision Summary

As of 2026-08-06:

- Store is the primary recurring-revenue engine to validate.
- Consumer remains the acquisition / proof layer.
- **Storefront is the delivery surface; AI Commerce / Campaign Engine is the business.**
- The Sales Landing Page must be repositioned immediately around traffic → decision → measurable commerce value.
- Shopper Demo and Admin Demo must be reframed now around Campaign / Agent-Ready Store Foundation, not postponed to a later phase.
- Human and AI-agent traffic must enter the same Store intelligence / conversion core.
- Agent-readiness starts now at the catalog, attribution, public-surface, and application-contract layers.
- A public agent API is explicitly not required now.
- D0 foundation and core demo workflow are implemented.
- Gate A1 remains closed until privacy / access / browser evidence is complete.
- Merchant validation is the main commercial workstream.
- Catalog onboarding starts assisted; CSV is the first repeatable pilot path.
- Shopify sync remains a later optimization.
- EHR/PMS remains deferred.
- First proof target is 1-3 paid / deposit-backed pilots, then 3-5 active merchants.
- Near-term success is merchant adoption and measurable conversion value, not platform breadth.

---

## 17. Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created execution plan separating D0 Sales Demo from M1 first-pilot MVP and defined engineering gates, epics, and acceptance criteria. |
| 2026-08-05 | Added mandatory D0-0 engineering foundation gate and STORE-0 work breakdown for modular boundaries, tenant isolation, usage policy, events, assets, idempotency, and tests. |
| 2026-08-05 | Recorded STORE-0 through STORE-5 completion and controlled production verification; moved execution to merchant validation while keeping Gate A1 closed and M1 gated. |
| 2026-08-06 | Rebased execution around **Storefront as delivery surface / AI Commerce & Campaign Engine as business**. Added Day-1 LP, Shopper Demo, Admin Demo realignment and an Agent-Ready Store Foundation workstream. |
