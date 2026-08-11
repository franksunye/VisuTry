# VisuTry Pilot Delivery Factory Plan

**Status:** Active planning / execution  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-11  
**Related:** `docs/product/plans/visutry-store-implementation-plan.md`  
**Related spec:** `docs/product/specs/pilot-delivery-kit-spec.md`

---

## 1. Objective

Build a repeatable capability to take a qualified eyewear brand or retailer from public catalog intake to a stable VisuTry hosted pilot in **1–2 days**, while producing five high-quality reference pilots that exercise different merchant archetypes.

The work has two simultaneous goals:

1. **Delivery readiness** — prove that a new merchant can be onboarded without bespoke product development.
2. **Sales proof** — provide five realistic, working reference pilots that demonstrate the breadth of the VisuTry commerce workflow beyond a generic demo.

Success is not “five custom demos.” Success is:

> By the sixth merchant, the normal path is configuration + catalog + QA + publish, not custom engineering.

Target delivery progression:

- Pilot 1: <= 2 working days.
- Pilot 3: <= 1 working day for a clean catalog.
- Pilot 5: <= 4–6 hands-on hours, excluding waiting/review.
- Pilot 6+: no code change for a normal merchant unless a real product gap is found.

---

## 2. Naming and evidence policy

These first five are **Reference Pilots / Pilot Simulations**, not claimed merchant partnerships.

Allowed wording:

- Reference Pilot
- Pilot Simulation
- Sample Merchant Experience
- Reference Store

Do not claim:

- that the brand is a VisuTry customer;
- that the brand authorized or paid for the pilot unless that becomes true;
- real conversion lift, revenue uplift, or merchant results from simulated traffic;
- synthetic intent events as real merchant traffic.

Public brand assets and catalog facts may be used only for internal validation, private sales demonstration, or brand-specific outreach where legally appropriate. Public marketing use must be reviewed for trademark / copyright / endorsement risk.

---

## 3. Selected Reference Pilot Portfolio

Selection criteria:

1. Independent or boutique-oriented eyewear business with a real public catalog.
2. Public product imagery and product destinations are sufficiently structured for assisted catalog onboarding.
3. Distinct merchant / shopper problem so each pilot tests a different delivery pattern.
4. Representative of merchants VisuTry could plausibly sell to.
5. Together the five must test DTC, premium brand, fashion / collaboration, existing-VTO differentiation, and multi-brand optical retail.

### P1 — ello sunglasses

**Archetype:** Narrow-fit / problem-led DTC sunglasses brand.  
**Why selected:** The brand is explicitly built for petite faces and smaller head sizes. Its public site describes six distinct petite-fit frame styles, detailed measurements, polarized UV400 lenses, and a 10-day home try-on. The site identifies itself as powered by Shopify. This creates an unusually clear shopper problem for recommendation: fit and proportion, not just style.

**Reference pilot hypothesis:**

> VisuTry can turn a fit-specific catalog into a guided “which petite frame suits me?” journey, then validate the shortlist with Try-On and Compare.

**Primary test:** Fit metadata, size classes, recommendation reasons, small catalog onboarding, product click intent.

**Catalog target:** All 6 core styles, optionally selected colorways.

**Research snapshot:** `https://ellosunglasses.com/`, `https://ellosunglasses.com/pages/petite-frame-size-guide`.

### P2 — Lowercase NYC

**Archetype:** Premium independent optical + sunglasses brand.  
**Why selected:** Lowercase is an independent Brooklyn eyewear brand with a strong premium identity, handmade production story, optical and sunglass ranges, and a public catalog of roughly 60 products. Its site identifies Shopify as the commerce platform. Product pages expose shape/design copy, size dimensions, variants, and product imagery.

**Reference pilot hypothesis:**

> VisuTry can preserve a premium brand aesthetic while reducing shopper uncertainty across a broader optical / sun catalog.

**Primary test:** Brand theming, larger catalog normalization, optical + sun segmentation, recommendation shortlist, premium presentation.

**Catalog target:** 16–24 representative frames across optical and sun, not the entire catalog in v1.

**Research snapshot:** `https://lowercasenyc.com/`, `https://lowercasenyc.com/collections/all`.

### P3 — AKILA

**Archetype:** Fashion / culture / collaboration-led independent eyewear brand.  
**Why selected:** AKILA describes itself as an independent Los Angeles eyewear brand focused on handmade limited-run eyewear, with optical and sunglasses collections, sustainability positioning, collaborations, and stores in Los Angeles and New York. The catalog is highly style-led and visually expressive.

**Reference pilot hypothesis:**

> VisuTry can support fashion-led discovery where the shopper is choosing a visual identity, not only solving a technical fit problem.

**Primary test:** Style tags, campaign / collection entry, statement-frame recommendation, social-style traffic context, Compare.

**Catalog target:** 12–20 current, visually distinct frames across core / collaboration / optical where product facts are public.

**Research snapshot:** `https://akila.la/`, `https://akila.la/en-gb/pages/akila-eyewear`.

### P4 — Article One

**Archetype:** Active / performance eyewear with existing VTO.  
**Why selected:** Article One positions around independent optical, active use, practical fit technology, and premium design. Importantly, current product pages already include a 3D / AR Virtual Try-On experience. This makes Article One a deliberate benchmark rather than a greenfield VTO target.

**Reference pilot hypothesis:**

> VisuTry should demonstrate value beyond “has virtual try-on”: recommendation → shortlist → Try-On → Compare → measurable intent and campaign/source continuity.

**Primary test:** Competitive differentiation, performance/fit metadata, recommendation reasons, existing-VTO benchmark, intent instrumentation.

**Catalog target:** 12–16 representative Active / sun frames.

**Research snapshot:** `https://www.articleoneeyewear.com/optical`, representative product pages with the current Virtual Try-On section.

### P5 — Framed EWE

**Archetype:** Multi-brand independent optical retailer.  
**Why selected:** Framed EWE operates online and in Phoenix / Los Angeles, selling independent eyewear brands across eyeglasses and sunglasses and offering eye exams / prescription services. Unlike the first four pilots, the catalog is merchant-curated and multi-brand.

**Reference pilot hypothesis:**

> VisuTry can function as a retailer-level decision layer over many brands, while keeping stable merchant product identity and product destinations.

**Primary test:** Multi-brand catalog, brand filters, retailer attribution, retailer inquiry, mixed product identity, larger catalog curation.

**Catalog target:** 20–30 representative frames across 5–8 brands, curated rather than full-store import.

**Research snapshot:** `https://framedewe.com/`.

---

## 4. Why these five as a portfolio

| Pilot | Business pattern | Primary complexity exercised |
| --- | --- | --- |
| ello | niche DTC | fit / proportion recommendation |
| Lowercase | premium independent brand | brand fidelity + larger catalog |
| AKILA | fashion / collaboration | style discovery + campaign context |
| Article One | existing VTO / active | value beyond VTO + intent measurement |
| Framed EWE | multi-brand optical retailer | multi-brand product identity + inquiry |

This mix is intentionally not homogeneous. If the same delivery system can support all five without merchant-specific forks, it is stronger evidence that the Store / Commerce foundation is reusable.

---

## 5. Delivery Factory Workflow

Every pilot must use the same operational path:

```text
Merchant research
    ↓
Pilot intake record
    ↓
Catalog capture / CSV normalization
    ↓
Merchant facts vs AI enrichment separation
    ↓
Select 8–50 pilot frames
    ↓
Merchant configuration
    ↓
Frame enrichment + review
    ↓
Hosted Store / campaign route
    ↓
Recommendation QA
    ↓
Try-On / Compare QA
    ↓
Intent + attribution QA
    ↓
Publish as private/reference pilot
    ↓
Capture implementation time + exceptions
```

A delivery exception must be classified as one of:

- data problem;
- asset problem;
- configuration gap;
- reusable product gap;
- merchant-specific request.

Only a reusable product gap should normally justify new platform code.

---

## 6. Pilot Definition of Done

A reference pilot is complete only when all of the following are true:

### Catalog

- 8–50 reviewed frames are active;
- every frame has stable merchant-scoped identity;
- canonical product URL is present where public;
- source facts are separated from AI-enriched attributes;
- primary frame image is usable for Try-On;
- no invented price / availability / product fact.

### Shopper journey

- reference/pilot URL opens correctly on desktop and mobile;
- privacy notice and anonymous session work;
- recommendation produces a useful merchant-scoped shortlist;
- shopper can select frames;
- Try-On works on selected frames;
- Compare works for completed results;
- product click, favorite, and/or inquiry can be captured as applicable;
- no Consumer credit prompt appears in Merchant Store flow.

### Measurement

- source / campaign context can be attached to the session;
- recommendation, Try-On, Compare, favorite, product click and inquiry events are persisted where applicable;
- merchant insight view shows the pilot activity;
- synthetic/reference traffic is clearly tagged and distinguishable from future live merchant traffic.

### QA

- Smoke checks pass for the pilot route;
- no cross-merchant catalog leakage;
- no raw shopper face image is exposed in merchant analytics;
- failed generation does not incorrectly create positive intent or consume consumer credits;
- mobile viewport is usable for the full critical journey.

### Sales evidence

Capture a standard evidence pack:

1. Pilot overview card.
2. Shopper entry screenshot.
3. Recommendation screenshot.
4. Try-On / Compare screenshot.
5. Merchant insight screenshot using clearly synthetic/reference data.
6. Catalog size / merchant archetype.
7. Actual implementation time.
8. Exceptions / manual steps required.

---

## 7. Execution Sequence

### Stage A — Factory baseline before Pilot 1

Timebox: <= 1 day.

Required:

- freeze the Pilot Delivery Kit contract in the related spec;
- define merchant config fields;
- define catalog CSV contract;
- define reference/synthetic traffic marker;
- define QA checklist;
- create implementation-time log template.

Do not build self-service onboarding yet.

### Stage B — P1 ello

Timebox: <= 2 days.

Purpose: establish the golden path with the smallest, clearest catalog.

Output:

- first complete reference pilot;
- first catalog CSV;
- first merchant config;
- first QA run;
- list of every manual step.

### Stage C — P2 Lowercase

Timebox: <= 2 days.

Purpose: force brand fidelity and catalog scaling.

Pass condition: no bespoke Store code for Lowercase-specific visual treatment beyond supported merchant theme/configuration.

### Stage D — P3 AKILA

Timebox: <= 1–2 days.

Purpose: test style/campaign-led discovery and visually diverse frames.

Pass condition: campaign / collection context can change entry and reporting without forking the recommendation or Store stack.

### Stage E — P4 Article One

Timebox: <= 1 day.

Purpose: prove the sales narrative “beyond VTO.”

Pass condition: reference pilot clearly demonstrates recommendation, comparison and intent continuity that a simple product-page VTO does not represent.

### Stage F — P5 Framed EWE

Timebox: <= 2 days.

Purpose: test multi-brand merchant catalog behavior.

Pass condition: stable merchant product identity and brand distinctions survive recommendation, Try-On, Compare and product click/inquiry.

### Stage G — Factory retrospective

Immediately after P5:

- total hands-on time per pilot;
- repeated manual tasks;
- defects found;
- configuration gaps;
- catalog import pain;
- top 3 automation candidates;
- decide whether CSV/admin tooling is enough or URL-assisted import is now justified.

The next product investment must be driven by repeated pain across these five pilots, not hypothetical onboarding complexity.

---

## 8. Metrics for this initiative

Primary operational metrics:

- time from intake to published reference pilot;
- hands-on operator hours;
- number of code changes per pilot;
- number of merchant-specific forks: target **0**;
- catalog acceptance rate without manual image repair;
- QA defects per pilot;
- repeated manual steps across >= 3 pilots.

Primary sales-readiness metrics:

- 5 reference pilots complete;
- 5 merchant archetypes represented;
- at least 3 different catalog / shopping patterns proven;
- standard evidence pack complete for all five;
- sales can demo a merchant-relevant reference in <= 2 minutes.

North-star acceptance:

> A sixth normal eyewear merchant with 8–50 usable frames can be launched in <= 1 working day without product code changes.

---

## 9. What not to build during the five-pilot sprint

Unless a pilot is blocked, do not start:

- Shopify OAuth / app-store integration;
- generic crawler platform;
- merchant self-service builder;
- generalized Campaign Builder;
- custom recommendation engine per merchant;
- second Try-On pipeline;
- full CRM;
- verified revenue attribution claims;
- broad enterprise permissions system.

The sprint is a **repeatability test**, not a platform-expansion sprint.

---

## 10. Research limitations

Brand facts above are based on publicly accessible website content reviewed on 2026-08-11. They are research candidates, not partnership claims. Catalog size, product availability, technology stack and site features may change. Before each pilot is built, perform a fresh catalog and asset review and record the snapshot date.