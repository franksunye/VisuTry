# VisuTry Pilot Delivery Factory Plan

**Status:** Active execution — Merchant Experience architecture upgrade  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-11  
**Updated:** 2026-08-11  
**Related:** `docs/product/plans/visutry-store-implementation-plan.md`  
**Related spec:** `docs/product/specs/pilot-delivery-kit-spec.md`  
**Architecture baseline:** `docs/product/specs/merchant-experience-architecture.md`

---

## 1. Objective

Build a repeatable delivery capability that can take a qualified eyewear brand or retailer from public catalog intake to a stable VisuTry hosted commerce experience in **1–2 days**, and then let the same merchant launch additional targeted Campaigns from the reviewed catalog in **1–2 hands-on hours** without product code changes.

The reference portfolio is therefore upgraded from:

> **5 Reference Stores / Pilots**

into:

> **5 Reference Brands / Merchants × 2–3 Experiences each = approximately 10–15 Reference Experiences.**

The work has three simultaneous goals:

1. **Merchant delivery readiness** — prove a new merchant can be onboarded without bespoke product development.
2. **Campaign delivery readiness** — prove an existing merchant can launch differentiated journeys without duplicating catalog or forking the Store stack.
3. **Sales proof** — give Sales multiple credible, brand-relevant examples before merchant outreach begins.

Success is not “15 custom demos.” Success is:

> By the sixth merchant, normal merchant delivery is configuration + catalog + QA + publish; by the second Campaign for an existing merchant, normal Campaign delivery is catalog selection + campaign configuration + QA + publish.

---

## 2. Architecture rule for the factory

All reference work follows the shared Merchant Experience architecture:

```text
Merchant / Brand
│
├── Brand / Theme
├── Catalog
└── Experiences
    ├── Store Experience (optional)
    ├── Campaign Experience A
    ├── Campaign Experience B
    └── Campaign Experience C
```

Key rules:

- Catalog belongs to Merchant.
- Store and Campaign are sibling Experiences.
- Store is not a mandatory parent for Campaign.
- `STORE` and `CAMPAIGN` reuse the same recommendation, Try-On, Compare, privacy, usage, intent, attribution, and event foundations.
- An Experience selects from the Merchant catalog; it must not create duplicate product identity.
- A merchant that only wants one 8–50 frame hosted Store remains a first-class, simple use case.
- A merchant that only wants one Campaign does not need to configure a broad Store first.

See `docs/product/specs/merchant-experience-architecture.md` for the domain contract.

---

## 3. Naming and evidence policy

These first references are **Reference Experiences / Pilot Simulations**, not claimed merchant partnerships.

Allowed wording:

- Reference Brand
- Reference Experience
- Reference Pilot
- Pilot Simulation
- Sample Merchant Experience
- Reference Store
- Reference Campaign

Do not claim:

- that the brand is a VisuTry customer;
- that the brand authorized or paid for the pilot unless that becomes true;
- real conversion lift, revenue uplift, or merchant results from simulated traffic;
- synthetic intent events as real merchant traffic.

Public brand assets and catalog facts may be used only for internal validation, private sales demonstration, or brand-specific outreach where legally appropriate. Public marketing use must be reviewed for trademark / copyright / endorsement risk.

---

## 4. Selected Reference Brand Portfolio

The five selected brands remain useful because they exercise different merchant and shopper patterns. The change is that each brand should now prove more than one Experience where that adds meaningful learning value.

Selection criteria:

1. Independent or boutique-oriented eyewear business with a real public catalog.
2. Public product imagery and product destinations are sufficiently structured for assisted catalog onboarding.
3. Distinct merchant / shopper problem so each brand tests a different delivery pattern.
4. Representative of merchants VisuTry could plausibly sell to.
5. Together the portfolio should exercise DTC, premium brand, fashion / collaboration, existing-VTO differentiation, and multi-brand optical retail.

### B1 — ello sunglasses

**Archetype:** Narrow-fit / problem-led DTC sunglasses brand.  
**Why selected:** The brand is explicitly built for petite faces and smaller head sizes. Its public site describes six distinct petite-fit frame styles, detailed measurements, polarized UV400 lenses, and a 10-day home try-on. The site identifies itself as powered by Shopify. This creates an unusually clear shopper problem for recommendation: fit and proportion, not just style.

**Merchant-level test:** Fit metadata, size classes, recommendation reasons, small catalog onboarding, stable product click destination.

**Catalog target:** All 6 core styles, optionally selected colorways.

**Reference Experience hypotheses:**

1. **Hosted Store / Petite-fit Store** — broad persistent experience over the reviewed catalog.
2. **Find Your Petite Fit** — intent-led Campaign focused on proportion / size guidance.
3. **Summer Sunglasses / Best Frames for Small Faces** — collection or seasonal Campaign if it adds distinct presentation / CTA / analytics learning.

**Research snapshot:** `https://ellosunglasses.com/`, `https://ellosunglasses.com/pages/petite-frame-size-guide`.

### B2 — Lowercase NYC

**Archetype:** Premium independent optical + sunglasses brand.  
**Why selected:** Lowercase is an independent Brooklyn eyewear brand with a strong premium identity, handmade production story, optical and sunglass ranges, and a public catalog of roughly 60 products. Its site identifies Shopify as the commerce platform. Product pages expose shape/design copy, size dimensions, variants, and product imagery.

**Merchant-level test:** Brand theming, larger catalog normalization, optical + sun segmentation, premium presentation.

**Catalog target:** 16–24 representative frames across optical and sun, not the entire catalog in v1.

**Reference Experience hypotheses:**

1. **Premium Brand Store** — broad optical + sun experience using shared theme primitives.
2. **Optical Essentials** — optical-only Campaign / subset.
3. **Sunglasses Collection** — sun-only Campaign with distinct hero / CTA.

**Research snapshot:** `https://lowercasenyc.com/`, `https://lowercasenyc.com/collections/all`.

### B3 — AKILA

**Archetype:** Fashion / culture / collaboration-led independent eyewear brand.  
**Why selected:** AKILA describes itself as an independent Los Angeles eyewear brand focused on handmade limited-run eyewear, with optical and sunglasses collections, sustainability positioning, collaborations, and stores in Los Angeles and New York. The catalog is highly style-led and visually expressive.

**Merchant-level test:** Style tags, collection context, visually expressive brand treatment, social-style traffic context, Compare.

**Catalog target:** 12–20 current, visually distinct frames across core / collaboration / optical where product facts are public.

**Reference Experience hypotheses:**

1. **Brand / Style Store** — persistent discovery surface.
2. **Statement Frames** — style-intent Campaign.
3. **New Collection / Collaboration** — campaign-led discovery with selected frames and campaign creative.

**Research snapshot:** `https://akila.la/`, `https://akila.la/en-gb/pages/akila-eyewear`.

### B4 — Article One

**Archetype:** Active / performance eyewear with existing VTO.  
**Why selected:** Article One positions around independent optical, active use, practical fit technology, and premium design. Current product pages already include a 3D / AR Virtual Try-On experience. This makes Article One a deliberate benchmark rather than a greenfield VTO target.

**Merchant-level test:** Competitive differentiation, performance/fit metadata, recommendation reasons, existing-VTO benchmark, intent instrumentation.

**Catalog target:** 12–16 representative Active / sun frames.

**Reference Experience hypotheses:**

1. **Active Eyewear Store** — persistent experience over selected active / sun frames.
2. **Find Your Fit** — fit / use-case Campaign.
3. **Beyond VTO Decision Journey** — sales-reference Campaign explicitly demonstrating recommendation → Try-On → Compare → measurable intent.

**Research snapshot:** `https://www.articleoneeyewear.com/optical`, representative product pages with the current Virtual Try-On section.

### B5 — Framed EWE

**Archetype:** Multi-brand independent optical retailer.  
**Why selected:** Framed EWE operates online and in Phoenix / Los Angeles, selling independent eyewear brands across eyeglasses and sunglasses and offering eye exams / prescription services. Unlike the first four brands, the catalog is merchant-curated and multi-brand.

**Merchant-level test:** Multi-brand catalog, brand filters, retailer attribution, retailer inquiry, mixed product identity, larger catalog curation.

**Catalog target:** 20–30 representative frames across 5–8 brands, curated rather than full-store import.

**Reference Experience hypotheses:**

1. **Multi-brand Optical Store** — persistent retailer-level decision surface.
2. **Sunglasses Edit** — selected multi-brand Campaign.
3. **Multi-brand Optical Selection** — optical-intent Campaign emphasizing retailer curation.

**Research snapshot:** `https://framedewe.com/`.

---

## 5. Why 5 Brands × 10–15 Experiences

The original five-merchant portfolio already tests merchant diversity. The expanded portfolio now tests **experience repeatability** inside the same merchant.

| Brand | Business pattern | Merchant complexity | Experience complexity |
| --- | --- | --- | --- |
| ello | niche DTC | fit / proportion data | intent-led petite-fit journey |
| Lowercase | premium independent brand | brand fidelity + larger catalog | optical vs sun subsets / presentation |
| AKILA | fashion / collaboration | style intelligence | campaign / collection context |
| Article One | existing VTO / active | value beyond VTO | recommendation + comparison + intent continuity |
| Framed EWE | multi-brand optical retailer | multi-brand identity + inquiry | retailer curation across subsets |

The portfolio is intentionally not homogeneous.

The strongest proof is not that VisuTry can make five different branded pages. It is that the same Merchant + Catalog + Experience system can support all five brands and multiple journeys per brand without merchant-specific forks.

---

## 6. Delivery Factory Workflow

### 6.1 New Brand / Merchant workflow

```text
Merchant research
    ↓
Merchant intake record
    ↓
Catalog capture / CSV normalization
    ↓
Merchant facts vs AI enrichment separation
    ↓
Select 8–50 reviewed merchant frames
    ↓
Merchant configuration
    ↓
Frame enrichment + review
    ↓
Create first Experience (usually Store)
    ↓
Recommendation QA
    ↓
Try-On / Compare QA
    ↓
Intent + attribution QA
    ↓
Publish private/reference Experience
    ↓
Capture implementation time + exceptions
```

### 6.2 Additional Campaign workflow

```text
Existing Merchant + reviewed Catalog
    ↓
Campaign hypothesis / objective
    ↓
Select catalog subset
    ↓
Campaign copy / creative / offer
    ↓
CTA / destination configuration
    ↓
Source / date / attribution context
    ↓
Journey + mobile QA
    ↓
Performance-view QA
    ↓
Publish Reference Campaign
    ↓
Capture campaign delivery time + exceptions
```

A normal second Campaign should not require:

- a new merchant tenant;
- duplicate frame rows;
- a new recommendation engine;
- a new Try-On flow;
- a new admin stack;
- product code changes.

### 6.3 Standard publish lifecycle

Every reference merchant delivery includes the following operator lifecycle:

```text
Research
    → Catalog Normalize
    → Enrichment Review
    → Experience Config
    → Preflight
    → URL Health
    → Dry Run
    → Production Publish
    → DB Read-back
    → Route Smoke
    → Evidence Pack
    → Delivery Accounting
```

The shared commands are intentionally assisted-operations tooling, not a crawler or self-service onboarding product:

```text
npm run pilot:preflight -- pilot/<merchant-slug>
npm run pilot:check-urls -- pilot/<merchant-slug>
npm run db:seed:pilot -- pilot/<merchant-slug> --dry-run
npm run db:seed:pilot -- pilot/<merchant-slug>              # production requires explicit confirmation
npm run pilot:verify -- pilot/<merchant-slug>
npm run pilot:route-smoke -- pilot/<merchant-slug>
npm run pilot:qa -- pilot/<merchant-slug> --production
```

Preflight, URL health, dry-run and read-back are non-mutating. Production publish remains an explicit write operation guarded by the existing confirmation flag. Code merge alone does not complete merchant delivery; production read-back, route smoke, evidence and delivery accounting are part of the Definition of Done.

---

## 7. Delivery exception classification

Every delivery exception must be classified as one of:

- data problem;
- asset problem;
- configuration gap;
- reusable product gap;
- merchant-specific request.

Only a reusable product gap should normally justify new platform code.

A repeated Experience / Campaign need is stronger evidence of a reusable product gap than a one-off brand preference.

---

## 8. Definition of Done

### Merchant / Catalog

- 8–50 reviewed frames are active where applicable;
- every frame has stable merchant-scoped identity;
- canonical product URL is present where public;
- source facts are separated from AI-enriched attributes;
- primary frame image is usable for Try-On;
- no invented price / availability / product fact;
- Experiences reference existing MerchantFrame identity rather than duplicate products.
- the shared preflight command passes required fields, identity uniqueness, URL syntax, Experience selections, Store count and reference provenance;
- product and image URL health has a recorded result before publish;
- a seed dry-run records create/update/deactivate and ExperienceFrame plans before any production write.

### Experience / shopper journey

- reference URL opens correctly on desktop and mobile;
- merchant and Experience identity are correct;
- privacy notice and anonymous session work;
- recommendation produces a useful Experience-scoped shortlist from the selected merchant catalog;
- shopper can select frames;
- Try-On works on selected frames;
- Compare works for completed results;
- favorite / shortlist and merchant conversion actions work where configured;
- product click / inquiry / coupon / appointment / collection CTA points to the correct destination where applicable;
- no Consumer credit prompt appears in Merchant Experience flow.

### Measurement

- `merchant_id` and Experience context are attached to the shopper session;
- source / campaign context survives the full journey;
- recommendation, Try-On, Compare, favorite / shortlist, product click and inquiry events are persisted where applicable;
- Merchant Overview can aggregate across Experiences;
- Experience / Campaign performance can be isolated;
- synthetic/reference traffic is clearly distinguishable from future live merchant traffic.

### QA

- smoke checks pass for the route;
- no cross-merchant catalog leakage;
- no cross-Experience catalog leakage;
- no raw shopper face image is exposed in merchant analytics;
- failed generation does not incorrectly create positive intent or consume consumer credits;
- mobile viewport is usable for the full critical journey.
- post-publish DB read-back matches the Delivery Kit catalog and Experience configuration;
- deterministic Store/Campaign route smoke passes on desktop and mobile without calling a real AI provider;
- the evidence pack records URL health, dry-run, read-back, route smoke and delivery accounting.

### Sales evidence

Each brand should eventually have:

1. Brand / merchant overview card.
2. At least one persistent or broad Experience screenshot.
3. At least one differentiated Campaign entry screenshot.
4. Recommendation screenshot.
5. Try-On / Compare screenshot.
6. Campaign / Experience performance screenshot using clearly synthetic/reference data.
7. Catalog size / merchant archetype.
8. Actual merchant setup time and incremental Campaign setup time.
9. Exceptions / manual steps required.

---

## 9. Execution Sequence

### Stage A — P1 ello baseline: complete / baseline proven

P1 has already established the first generic Merchant / catalog delivery path and reusable Delivery Kit.

The next work should not simply clone the same Store four more times.

### Stage B — Architecture upgrade before broad reference production

Timebox: minimal architecture slice, not a generalized Campaign Builder.

Required:

- first-class Experience concept;
- `STORE | CAMPAIGN` distinction;
- merchant-owned catalog + Experience frame selection;
- Experience-aware session / attribution context;
- Experience-level presentation / CTA configuration needed by references;
- campaign list / performance IA sufficient for sales demonstration;
- compatibility with existing Store route / shopper flow;
- reference/synthetic-data separation preserved.

Pass condition:

> ello can support its current Store plus a second differentiated Campaign without duplicate catalog rows or merchant-specific product code.

### Stage C — B2 Lowercase

Purpose: force brand fidelity, larger catalog normalization, and at least one meaningful catalog subset Campaign.

Pass condition: no bespoke Lowercase Store / Campaign components beyond supported theme / Experience configuration.

### Stage D — B3 AKILA

Purpose: prove style / collection / campaign-led discovery.

Pass condition: campaign / collection context changes entry, catalog subset, CTA, and reporting without forking recommendation or Try-On.

### Stage E — B4 Article One

Purpose: prove the sales narrative “beyond VTO.”

Pass condition: recommendation, comparison, intent continuity, and Campaign performance are clearly demonstrable against a merchant that already has VTO.

### Stage F — B5 Framed EWE

Purpose: test multi-brand merchant catalog behavior across multiple Experience subsets.

Pass condition: stable merchant product identity and underlying brand distinctions survive Store, Campaign, recommendation, Try-On, Compare, product click and retailer inquiry.

### Stage G — Factory retrospective

After the 5-brand / 10–15-Experience reference portfolio reaches sufficient coverage:

- total hands-on time per new merchant;
- incremental hands-on time per Campaign;
- repeated manual tasks;
- defects found;
- configuration gaps;
- catalog import pain;
- Campaign setup pain;
- top 3 automation candidates;
- decide whether CSV/admin tooling is enough or URL-assisted import is justified;
- decide when a self-service Campaign Builder becomes justified.

The next product investment must be driven by repeated pain across real reference delivery, not hypothetical platform completeness.

---

## 10. Metrics for this initiative

### Operational metrics

- time from merchant intake to first published Experience;
- hands-on operator hours per new merchant;
- time from existing merchant to additional Campaign publish;
- hands-on operator hours per additional Campaign;
- number of code changes per merchant;
- number of code changes per additional Campaign;
- merchant-specific forks: target **0**;
- Campaign-specific runtime forks: target **0**;
- catalog acceptance rate without manual image repair;
- QA defects per Experience;
- repeated manual steps across >= 3 brands / Experiences.

### Sales-readiness metrics

- 5 reference brands complete;
- approximately 10–15 reference Experiences complete where each adds real learning / sales value;
- 5 merchant archetypes represented;
- Store-only use case demonstrable;
- multi-Campaign merchant use case demonstrable;
- at least 3 different catalog / shopping / campaign patterns proven;
- standard evidence pack complete;
- Sales can select a merchant-relevant reference and explain it in <=2 minutes.

### North-star acceptance

**Merchant delivery:**

> A sixth normal eyewear merchant with 8–50 usable frames can be launched in <=1 working day without product code changes.

**Campaign delivery:**

> An existing merchant can launch a new Campaign from its reviewed catalog in <=1–2 hands-on hours without product code changes.

---

## 11. What not to build during this sprint

Unless the reference portfolio is blocked, do not start:

- Shopify OAuth / app-store integration;
- generic crawler platform;
- merchant self-service onboarding;
- drag-and-drop or generalized page builder;
- generalized marketing automation;
- email campaign delivery platform;
- CRM;
- custom recommendation engine per merchant / Campaign;
- second Try-On pipeline;
- verified revenue attribution claims without real commerce data;
- broad enterprise permissions system;
- autonomous AI-agent checkout.

The sprint is a **Merchant + Experience repeatability test**, not a platform-completeness sprint.

---

## 12. Research limitations

Brand facts above are based on publicly accessible website content reviewed on 2026-08-11. They are research candidates, not partnership claims. Catalog size, product availability, technology stack and site features may change. Before each reference is built, perform a fresh catalog and asset review and record the snapshot date.
