# VisuTry Store Implementation Plan

**Status:** D0 implemented and production-verified; merchant validation active; M1 gated
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-05  
**Last updated:** 2026-08-05  
**Related demo spec:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related MVP spec:** `docs/product/specs/visutry-store-mvp.md`  
**Required engineering foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`
**Architecture decision:** `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`
**Related landing page:** `docs/product/specs/visutry-store-landing-page.md`
**Production verification:** `docs/ops/store-d0-production-verification-2026-08-05.md`

---

## 1. Purpose

This plan defines the execution sequence for VisuTry Store from sales demo to first paid merchant MVP.

The guiding rule is:

> Build the minimum reusable commerce workflow required to close and operate real merchant pilots; do not build platform integrations before demand requires them.

Store engineering will therefore proceed in three gated stages:

1. **D0-0 — Engineering Foundation:** mandatory tenant, actor, usage, event, asset, and module boundaries.
2. **D0 — Sales Demo:** a working merchant-specific experience used in outreach and demos.
3. **M1 — Pilot MVP:** a reusable hosted Store product for the first 3-5 merchants.

A public Shopify app, WooCommerce plugin, EHR/PMS integration, or broad merchant platform is outside this plan.

### 1.1 Current implementation status

| Stage | Status | Evidence / boundary |
| --- | --- | --- |
| D0-0 / STORE-0 foundation | Complete | Module boundary, tenant model, session capability, usage policy, asset seam, idempotency, events, validation, migrations, and tests are implemented. |
| STORE-1 merchant foundation | Complete | Luna Optical is seeded with 16 active representative frames backed by unique, reviewed local product assets. |
| STORE-2 shopper route | Complete | Production merchant route, privacy notice, session issuance, upload, catalog, and recommendation are operational. |
| STORE-3 recommendation | Complete | Merchant-scoped deterministic shortlist is operational. |
| STORE-4 Try-On / Compare | Engineering complete | Production one-frame Try-On smoke passed. Browser-level 2/3/4-frame Compare and partial-failure evidence remains a Gate A1 item. |
| STORE-5 intent / insights | Complete | Durable intent/events, merchant-scoped aggregation, seven-day trends, recent inquiries, recommendation Fit Score, high-intent shortlists, portfolio KPIs, conversion funnel, catalog health, full inventory, and privacy-safe activity views are implemented. |
| Sales Demo visual layer | Complete | Dedicated merchant shopper/admin shells, real catalog preview, staged journey, shortlist, and polished try-on presentation are implemented without concept-only controls. |
| Controlled D0 production QA | Passed | See the production verification record linked above. |
| Gate A1 external traffic | Closed | Public Blob POC is temporary; private asset access and remaining concurrency/browser evidence are required. |
| Merchant validation | Active | Run team-operated demos and collect own-frame sample / pilot evidence. |
| M1 pilot hardening | Not started | Starts only after Gate B or an explicit Product decision. |

---

## 2. Product Thesis

VisuTry Store is not positioned as another virtual try-on widget.

The product should prove this workflow:

```text
Merchant Catalog
      ↓
AI Frame Intelligence
      ↓
Shopper Photo / Face Understanding
      ↓
Personalized Merchant-Frame Shortlist
      ↓
Virtual Try-On
      ↓
Frame Compare
      ↓
Product Click / Favorite / Inquiry
      ↓
Merchant Intent Insights
```

The commercial value to validate is:

> Help eyewear merchants reduce shopper choice friction and turn frame browsing into measurable purchase intent.

---

## 3. Execution Gates

### Gate A0 — D0 engineering foundation

Complete for D0 and mandatory as an ongoing merge gate for later Store work.

Engineering must satisfy the D0-0 acceptance criteria in:

- `docs/product/specs/visutry-store-engineering-foundation.md`

This gate establishes:

- modular-monolith Store boundaries;
- merchant tenant isolation;
- anonymous merchant session capability;
- server-owned Store usage policy;
- shared Try-On attribution and idempotency;
- durable Store events;
- asset/privacy boundary;
- isolation and regression test skeletons.

Implementation may combine D0-0 and STORE-1 in one PR, but shopper UI work must not be merged on top of undefined tenant, usage, idempotency, or privacy behavior.

### Gate A — Start D0 engineering

Complete for D0.

Reason:

- Store LP exists;
- core consumer Advisor, Try-On, and Compare capabilities already exist;
- current commercial strategy requires merchant conversations;
- a real demo materially improves those conversations.

### Gate A1 — Allow non-team shopper traffic

Do not share a working Store URL for independent use by merchants or shoppers until all are true:

- server-issued MerchantSession capability is enforced;
- Store Demo allowance and abuse limits are server-enforced;
- shopper assets use controlled access rather than permanent public URLs as authorization;
- privacy notice and explicit retention / cleanup behavior are active;
- merchant insight, events, analytics, and logs exclude raw shopper images and sensitive face payloads;
- external-traffic tenant, authorization, abuse, and privacy tests pass.

Current status: **closed**. Internal team-operated screen-share demos may proceed if no external shopper is given independent access and the operator note records the limitation.

### Gate B — Start M1 pilot MVP hardening

Proceed when one or more are true:

- 3 merchants request a sample Store using their own frames;
- 1 merchant agrees to a paid or deposit-backed pilot;
- 5+ demo calls consistently confirm the same workflow need;
- Product explicitly decides to operationalize the first pilot before payment in order to capture conversion data.

### Gate C — Build self-service commerce integration

Do not start until M1 has at least 3 active merchant pilots and repeated onboarding pain is visible.

Potential later work:

- Shopify OAuth / product sync;
- WooCommerce;
- public widget / SDK;
- automated website catalog import;
- merchant billing;
- advanced analytics.

---

## 4. D0 — Sales Demo Build

**Delivery status:** Engineering complete; production-verified for controlled use on 2026-08-05.
**Goal:** Support a credible 10-minute sales demo and merchant-specific sample Store.

### D0.0 Engineering foundation

Complete Gate A0 before feature work is considered merge-ready.

Required:

- `src/modules/store` domain/application/infrastructure/contracts boundary;
- Store actor and usage-policy contracts;
- tenant-scoped repository contracts;
- schema and migration plan covering merchant, frame, session, intent, events, and Try-On attribution;
- Store idempotency strategy;
- asset access and retention boundary;
- runtime request validation approach;
- tenant isolation, quota isolation, privacy, idempotency, and consumer regression tests.

Do not use fake consumer users, a client-controlled quota bypass, or a second Store generation task system.

### D0.1 Merchant foundation

Build:

- `Merchant` data model;
- `MerchantFrame` data model;
- one seeded merchant (`Luna Optical` or equivalent);
- 12-20 realistic merchant frames;
- merchant slug / ID propagation;
- basic admin or seed workflow for catalog loading.

Do not build a full merchant CRUD console if seed/admin tooling is faster.

### D0.2 Shopper Store route

Build merchant-scoped hosted shopper experience:

- merchant branding;
- privacy notice;
- photo upload;
- merchant catalog context;
- AI-assisted shortlist;
- select up to 4 frames;
- continue to try-on;
- continue to compare;
- favorite / interest;
- product click.

Design scope for D0:

- use the branded upload concept as the entry-state reference;
- use the full shopper workspace only as a visual north star for recommendation,
  try-on, and shortlist hierarchy;
- keep the real sequential workflow and do not simulate live video, cart, search,
  model avatars, or physical-fit percentages;
- make privacy consent a clear entry step without allowing it to obscure the merchant
  value proposition.

### D0.3 Recommendation adapter

Implement a Store-specific ranking adapter that reuses existing face / advisor signals.

Input:

```text
shopper analysis signals
+
MerchantFrame metadata
```

Output:

```text
ranked merchant frames
+
short recommendation reason
```

Initial ranking can be deterministic and rules-assisted. It does not need a new model-training project.

### D0.4 Try-On attribution

Reuse existing generation pipeline and add optional merchant attribution:

- `merchantId`;
- `merchantSessionId`;
- `merchantFrameId`.

Do not charge consumer credits for merchant demo sessions.

### D0.5 Compare adaptation

Reuse Frame Compare UI / task handling where possible.

Store differences:

- frames come from merchant catalog;
- product metadata remains attached to results;
- comparison action records merchant intent;
- no consumer pricing upsell.

### D0.6 Merchant insight view

Build a lightweight read-only insight page for demo purposes.

Required:

- sessions;
- recommendation completions;
- try-on completions;
- compare starts;
- favorites;
- product clicks;
- inquiries if enabled;
- top frames;
- recent anonymous session activity.
- current-versus-previous seven-day trends and a seven-day shopper-interest series;
- recent inquiries with shopper-provided identity and privacy-safe initials avatars;
- recent shortlists / high-intent journeys;
- recommendation Fit Score, explicitly labelled as recommendation alignment rather
  than a physical or optical measurement.

Sales-demo presentation requirements:

- branded Store portfolio and merchant hero rather than a raw operations table;
- conversion and catalog-health KPIs with explicit definitions;
- top-frame merchandising cards with product imagery;
- complete frame inventory showing SKU, price, attributes, status, tags, and engagement;
- no raw shopper photo, asset URL, or sensitive face-analysis payload;
- use the merchant-dashboard concept for visual hierarchy;
- permit a stable, repeatable, explicitly identified Luna Optical synthetic activity
  dataset for the sales workspace. It must persist through normal Store models, remain
  idempotent, and never delete or masquerade as genuine merchant activity;
- do not call a shortlist a cart and do not present recommendation Fit Score as
  physical fit.

### D0.7 Analytics

Implement Store events from the Sales Demo spec and validate event attribution.

### D0.8 D0 QA

Required test scenarios:

1. desktop happy path;
2. mobile happy path;
3. upload invalid image;
4. recommendation returns fewer than 4 frames;
5. one try-on fails while others succeed;
6. compare with 2 / 3 / 4 frames;
7. product click attribution;
8. merchant insight totals update;
9. no consumer Credits Pack prompt appears;
10. merchant insight does not expose raw shopper image.

---

## 5. D0 Deliverables

Engineering deliverables:

- completed D0-0 foundation gate;
- working merchant demo URL;
- seeded sample merchant and frame catalog;
- 16 unique, reviewed, low-noise local catalog images with no broken references;
- merchant-specific shopper workflow;
- merchant recommendation shortlist;
- merchant-attributed Try-On + Compare;
- merchant insight screen;
- event instrumentation;
- short README / operator note for seeding a new sample merchant.

Product / Growth deliverables in parallel:

- merchant prospect list, first 50;
- demo-call script;
- outreach message;
- sample-Store request process;
- pilot pricing hypothesis;
- demo feedback capture template.

D0 is not complete if only the code is done but the team cannot run a merchant demo immediately.

---

## 6. Merchant Validation Sprint

**Target:** immediately after D0, 2-4 weeks.  
**Goal:** convert product comprehension into pilot intent.

### Outreach funnel

Target first batch:

| Stage | Target |
| --- | ---: |
| Qualified merchants | 50-100 |
| Positive replies | 10-20 |
| Demo calls | 5-10 |
| Own-frame sample requests | 3-5 |
| Pilot commitments | 1-3 |

### Feedback to capture after each demo

Ask and record:

1. Where would you place this experience today: product page, dedicated link, pre-shop, social, or in-store follow-up?
2. How do you currently maintain frame product data?
3. Would starting with 8-20 top frames be acceptable?
4. Is personalized recommendation valuable, or is Try-On alone enough?
5. Which merchant metric matters most: product clicks, inquiries, add-to-cart, conversion, or appointment intent?
6. What would prevent you from launching a pilot?
7. Would USD 99-199/month be acceptable if the workflow produces useful shopper engagement / purchase intent?

Do not turn discovery calls into open-ended feature collection. Classify requests as:

- required to run pilot;
- useful after pilot;
- enterprise / later.

---

## 7. M1 — First Pilot Merchant MVP

**Target:** 2-4 weeks after Gate B.  
**Goal:** operate 3-5 real merchants without developer intervention for normal shopper usage.

### M1 scope

M1 includes:

1. merchant profile;
2. small frame catalog;
3. assisted catalog onboarding;
4. AI frame metadata enrichment;
5. hosted merchant Store link;
6. personalized shortlist;
7. virtual try-on;
8. frame comparison;
9. product click / favorite / inquiry intent;
10. merchant analytics;
11. merchant-specific usage limits;
12. basic merchant authentication for dashboard;
13. privacy / retention behavior;
14. operational failure monitoring.

### M1 catalog onboarding

Approved priority:

1. **CSV import** — first repeatable onboarding path;
2. **manual / admin add** — fallback and correction path;
3. **URL-assisted import** — optional if it materially reduces first-pilot onboarding;
4. **Shopify product sync** — after repeated pilot demand, not required for M1.

CSV should support at minimum:

```text
name
sku
image_url
product_url
price
currency
```

System enriches or allows review of:

```text
shape
material
color
width_class
style_tags
```

M1 should include a review step before AI-enriched catalog data becomes active.

### M1 merchant dashboard

Required pages / views:

- Overview;
- Frames;
- Shopper activity / intents;
- Usage.

Not required:

- complex report builder;
- cohorts;
- attribution modeling;
- team roles;
- custom dashboards.

### M1 usage model

Merchant usage must remain separate from consumer credits.

Track at minimum:

- successful renders;
- failed renders;
- active frames;
- shopper sessions.

Do not implement elaborate merchant billing until packaging is validated. Manual Stripe invoice / payment link is acceptable for first pilots if operationally easier.

---

## 8. Technical Reuse Strategy

Store should be a new commerce workflow on top of existing VisuTry capabilities, not a second product stack.

### Reuse directly where possible

- face photo validation;
- face-analysis signals;
- Glasses Advisor recommendation concepts;
- generation queue / task model;
- image storage;
- Try-On generation;
- Frame Compare task orchestration;
- authentication;
- analytics helpers;
- existing design system.

### Add Store-specific layers

- merchant identity;
- merchant frame catalog;
- frame intelligence metadata;
- merchant ranking adapter;
- merchant session;
- merchant intent;
- merchant usage attribution;
- merchant dashboard / insights.

### Avoid

- duplicated generation services;
- Store-specific model fork;
- parallel user/account system;
- Store-specific storage stack unless required by privacy boundary;
- premature external API surface.

---

## 9. Recommended Engineering Work Breakdown

### Epic STORE-0 — Engineering Foundation

Tasks:

- establish `src/modules/store` dependency boundary;
- define tenant-scoped repository contracts;
- define Store actor and server-owned usage policy;
- define Try-On attribution and idempotency invariants;
- define durable Store event contract;
- define asset access / retention seam;
- add required test skeletons and consumer regression coverage.

Done when:

- all D0-0 acceptance criteria in the engineering foundation spec are demonstrated in code, migration design, and tests.

STORE-0 is a mandatory prerequisite. It may ship in the same PR as STORE-1 but must be reviewed independently from feature behavior.

### Epic STORE-1 — Merchant & Catalog Foundation

Tasks:

- schema / migration for Merchant;
- schema / migration for MerchantFrame;
- seed sample merchant;
- seed sample frames;
- catalog validation helpers;
- operator seed/import note.

Done when:

- sample merchant and 12-20 frames are queryable by merchant slug.

### Epic STORE-2 — Merchant Shopper Session

Tasks:

- merchant Store route;
- session creation;
- photo upload;
- privacy copy;
- merchant context;
- mobile layout.

Done when:

- shopper can begin a merchant-scoped session from mobile or desktop.

### Epic STORE-3 — Recommendation

Tasks:

- map current face/advisor output to ranking inputs;
- normalize MerchantFrame tags;
- implement ranking adapter;
- return 4-8 frames with reasons;
- handle sparse metadata.

Done when:

- a shopper photo produces a credible merchant-only shortlist.

### Epic STORE-4 — Try-On & Compare Reuse

Tasks:

- add merchant attribution to generation;
- adapt frame selection;
- adapt compare UI;
- preserve merchant product metadata;
- retry / partial failure handling;
- bypass consumer credit prompts.

Done when:

- selected merchant frames can be generated and compared reliably.

### Epic STORE-5 — Intent & Insights

Tasks:

- MerchantIntent entity;
- favorite / product click;
- optional inquiry;
- aggregate metrics;
- top frames;
- recent sessions;
- insight page.

Done when:

- merchant can see useful purchase-intent signals without shopper raw images.

### Epic STORE-6 — Pilot Operations

Tasks:

- CSV import;
- enrichment / review;
- merchant dashboard auth;
- usage limits;
- monitoring;
- pilot onboarding checklist;
- operator tooling.

This epic belongs mainly to M1, not D0.

---

## 10. Definition of Done for M1

M1 is ready for a real paid merchant pilot when:

1. The Store engineering foundation remains compliant with its mandatory spec.
2. A merchant can be provisioned without code changes.
3. 8-50 frames can be onboarded through CSV or admin tools.
4. AI-enriched frame metadata can be reviewed before activation.
5. Shopper Store works on mobile and desktop.
6. Shopper receives personalized recommendations from merchant frames.
7. Shopper can try and compare selected merchant frames.
8. Product click / favorite / inquiry can be attributed to merchant + frame + session.
9. Merchant can log in and view basic insights.
10. Merchant usage is isolated from consumer credits.
11. Failed generation is observable and retryable.
12. Privacy notice and retention policy are implemented.
13. Merchant cannot access raw shopper face images by default.
14. At least one pilot merchant has completed end-to-end acceptance testing with its own catalog.

---

## 11. Metrics for First 3-5 Pilots

Do not judge Store only by raw try-on volume.

Track funnel:

```text
Store sessions
→ photo uploads
→ recommendations viewed
→ frame selected
→ try-on completed
→ compare started
→ favorite / product click / inquiry
```

Merchant-level metrics:

- Store session rate from placement;
- upload rate;
- recommendation-to-try rate;
- compare rate;
- product click rate;
- favorite / inquiry rate;
- top-frame concentration;
- successful render cost per engaged shopper;
- merchant continuation / willingness to pay.

The strongest early business signal is:

> merchant chooses to keep the workflow live and pay after seeing real shopper behavior.

---

## 12. Explicitly Deferred

Do not add to D0 or M1 unless a pilot cannot proceed without it:

- Shopify public app;
- WooCommerce plugin;
- EHR/PMS;
- real-time inventory counts;
- prescription / insurance workflow;
- PD measurement claims;
- public API;
- full widget SDK distribution;
- team RBAC;
- enterprise SSO;
- complex merchant billing;
- transaction take-rate system;
- advanced attribution;
- large-scale catalog crawler;
- mobile native Store app.

---

## 13. Current Decision Summary

As of 2026-08-05:

- Store is the primary long-term revenue engine to validate.
- Consumer remains the acquisition and proof layer.
- Existing Store LP remains the first inbound validation surface.
- D0-0 engineering foundation is implemented and remains mandatory for future Store changes.
- The working Sales Demo is implemented and production-verified for controlled merchant validation.
- Gate A1 remains closed; independent non-team shopper traffic is not approved.
- The current next step is merchant validation, not additional platform engineering.
- AI-assisted recommendation from merchant catalog is required in the Sales Demo and MVP.
- Catalog onboarding starts assisted; CSV is the first repeatable M1 import path.
- Shopify sync is a later optimization, not an MVP dependency.
- EHR/PMS integration is explicitly deferred.
- Store reuses VisuTry Advisor, Try-On, and Compare infrastructure.
- First commercial validation target is 3-5 merchant pilots, with USD 99-199/month as the working willingness-to-pay range rather than a finalized public price.

---

## 14. Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created execution plan separating D0 Sales Demo from M1 first-pilot MVP and defined engineering gates, epics, and acceptance criteria. |
| 2026-08-05 | Added mandatory D0-0 engineering foundation gate and STORE-0 work breakdown for modular boundaries, tenant isolation, usage policy, events, assets, idempotency, and tests. |
| 2026-08-05 | Recorded STORE-0 through STORE-5 completion and controlled production verification; moved execution to merchant validation while keeping Gate A1 closed and M1 gated. |
| 2026-08-05 | Polished the Store sales demo with a customer-presentable admin, complete inventory visibility, and a reviewed local catalog image set. |
| 2026-08-05 | Implemented the concept-guided Sales Demo visual layer while retaining real D0 capabilities and excluding simulated final-platform features. |
| 2026-08-05 | Added the merchant sales-intelligence layer: persisted seven-day trends, inquiries, initials avatars, recommendation-alignment Fit Score, high-intent shortlists, and an idempotent 14-day synthetic Luna activity seed with explicit provenance. |
