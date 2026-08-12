# VisuTry Market-Facing Productization Plan

Status: Active planning baseline  
Date: 2026-08-12  
Phase transition: Reference Factory complete → Market-facing productization

## 1. Why this phase exists

The Delivery Factory has reached the reference baseline:

- five Reference Brands;
- ten Reference Campaign Experiences, excluding Stores;
- Store and Campaign share one Merchant → Catalog → Experiences architecture;
- production publish uses the shared importer and Hardening lifecycle;
- fit-led, premium/product-led, fashion/style-led, active/technical and multi-brand retailer archetypes have been exercised;
- the Factory is repeatable without merchant-specific runtime forks.

The next bottleneck is no longer whether VisuTry can create merchant Experiences. The next bottleneck is whether the product is polished, discoverable and credible enough to support real merchant conversations and produce useful shopper-intent data.

This phase therefore focuses on three connected workstreams:

1. **Experience Design Hardening** — make the shopper Experience and Merchant Admin presentation-grade for eyewear / fashion / marketing buyers.
2. **Consumer → Merchant Distribution** — route existing VisuTry consumer traffic into Merchant Store/Campaign Experiences and measure it correctly.
3. **Business Web Presence** — establish a coherent B2B website surface without creating a separate product or duplicate website.

These are not three independent projects. Together they form the market-facing product layer.

---

## 2. Product model for this phase

```text
                         VISUTRY

                 Consumer Discovery Layer
                          │
              ┌───────────┴───────────┐
              │                       │
          2C Tools              Merchant Experiences
     Face Analysis                    │
     Try-On                         Store
     Compare                       Campaign
     Style Explorer                   │
              │                       │
              └───────────┬───────────┘
                          ↓
                   Shopper Intent
                          ↓
                Merchant Intelligence
                          ↓
                 Merchant Commerce
```

`/business` explains this system to merchants. It is not a separate runtime.

The current six merchant environments — one existing merchant plus five Reference merchants — should become reusable product surfaces rather than isolated demos.

Reference merchants remain clearly labeled as Reference Pilot / Simulation. They must never be described as customers, clients, partners or authorized case studies unless that relationship becomes real.

---

## 3. North Star

> Turn existing VisuTry consumer traffic into measurable merchant shopping intent, while presenting both shopper Experiences and Merchant Intelligence at a level credible to premium eyewear brands.

The product should eventually create the following loop:

```text
SEO / Organic / Existing 2C Traffic
              ↓
        VisuTry Consumer
              ↓
     Discovery / Intent
              ↓
   Merchant Store / Campaign
              ↓
 Recommendation / Try-On / Compare
              ↓
    Favorite / Product Click / Inquiry
              ↓
       Merchant Intelligence
              ↓
     Better merchant proof
              ↓
  More merchants / catalog / campaigns
              ↓
    Better consumer discovery
```

This is the first real product/data flywheel to validate.

---

# Workstream A — Experience Design Hardening

## 4. Objective

Move the current implementation from “functionally complete engineering product” to “brand-facing marketing product.”

The quality bar is not generic SaaS polish. The audience includes eyewear, fashion, ecommerce and marketing teams; visual detail is part of the product proposition.

The target feeling is:

```text
Shopper Experience
→ editorial / fashion / commerce

Merchant Admin
→ premium campaign intelligence / marketing SaaS
```

No major capability expansion is required for this workstream. Prefer hierarchy, interaction, motion, typography, image treatment, state design and responsive behavior over new features.

---

## 5. Shopper Experience scope

Audit and redesign the shared Store/Campaign runtime, not individual merchants.

Priority surfaces:

### 5.1 Experience entry / hero

- merchant identity is immediately legible;
- Store vs Campaign intent is clear without exposing internal terminology unnecessarily;
- headline, supporting copy and primary visual have a strong hierarchy;
- Reference / Simulation disclosure is visible but does not dominate the Experience;
- mobile first-screen density is controlled;
- no generic SaaS / dashboard visual language.

### 5.2 Photo entry

- upload / sample-photo choice feels obvious and low-friction;
- permission / privacy language is clear and visually quiet;
- empty, loading, upload-error and retry states receive intentional design;
- mobile photo selection does not produce layout jumps or ambiguous progress.

### 5.3 Recommendation

- recommended frames read as a curated decision surface rather than a raw product grid;
- frame imagery receives consistent sizing and optical alignment;
- brand, product, shape / fit / style information has disciplined hierarchy;
- selection state is unmistakable;
- the shared max-selection rule is visually obvious before users hit the limit;
- Campaign-specific catalog intent should be perceivable through copy / composition, not through new runtime logic.

### 5.4 Try-On

- generated shopper image is the dominant visual object;
- source/product context remains available without competing with the result;
- loading and generation states feel deliberate;
- retry/error treatment preserves trust;
- “View product” or equivalent merchant destination is visible but not visually aggressive before the user has evaluated the result.

### 5.5 Compare / shortlist

- comparison is visually optimized for decision-making;
- selected frame names and merchant/product brand remain clear;
- favorite / shortlist state is distinct from merchant inquiry or lead capture;
- mobile compare does not collapse into cramped cards or horizontal overflow without affordance.

### 5.6 Conversion destination

- Product Click remains merchant commerce destination;
- CTA language is configurable but visually consistent;
- outbound transition is clear;
- no implication that VisuTry owns checkout unless that capability is explicitly added later.

### 5.7 State completeness

Every critical surface must intentionally cover:

- initial;
- loading;
- empty;
- success;
- partial data;
- retryable failure;
- non-retryable failure;
- mobile;
- desktop.

---

## 6. Merchant Admin scope

The current Merchant Admin already supports Experience listing/detail, catalog selection and Experience-scoped metrics. This phase should improve its information architecture and visual authority rather than add broad new functionality.

Target mental model:

```text
Merchant
├ Overview
├ Experiences
│  ├ Store
│  └ Campaigns
├ Catalog
├ Shoppers / Intent
├ Analytics
└ Settings
```

Do not force all navigation changes in one implementation if the current routing does not require them. The visual and information hierarchy should move toward this model.

### 6.1 Overview

The first screen should answer:

- What is live?
- Which Experiences are getting traffic?
- Where is shopper intent forming?
- Which Experiences need attention?
- What is happening recently?

Avoid a wall of equal-weight metric cards.

### 6.2 Experiences list

Each Experience should show only the information needed to choose the next action:

- name;
- Store / Campaign;
- status;
- dates if applicable;
- selected catalog size;
- sessions;
- recommendation / Try-On / compare / favorite / click / inquiry summary;
- public route;
- Reference / Live provenance.

Use stronger visual hierarchy than the current repeated metric-card treatment.

### 6.3 Experience detail

Primary structure:

1. Experience identity / status / public route;
2. funnel;
3. intent / conversion signals;
4. catalog subset;
5. configuration.

Configuration controls should not visually compete with performance intelligence.

### 6.4 Funnel presentation

Preferred conceptual funnel:

```text
Sessions
→ Recommendation
→ Try-On
→ Compare
→ Favorite / Shortlist
→ Product Click / Inquiry
```

Rates must have explicit denominators and avoid fake precision.

No revenue number should be shown unless the system actually owns reliable revenue attribution.

### 6.5 Catalog presentation

- Merchant Catalog is clearly distinct from Experience subset;
- thumbnails are reliable and visually aligned;
- selected / unselected / reordered state is obvious;
- product brand is visible for multi-brand retailers;
- bulk management is not required yet.

### 6.6 Reference / Live provenance

Current Reference data must remain clearly distinguishable from live merchant data.

The existing lack of session/event-level Reference vs Live segmentation remains a known P0-before-real-merchant gap. Do not hide this limitation with visual styling.

---

## 7. Design hardening Definition of Done

A design-hardening release is complete when:

- all shared Store/Campaign critical surfaces have been audited on mobile and desktop;
- all critical interaction states are intentionally designed;
- shopper flow is visually coherent across at least three materially different merchant archetypes;
- Merchant Admin Overview / Experiences / Experience detail have a clear information hierarchy;
- Reference disclosures remain accurate but visually integrated;
- no merchant-specific visual fork is required;
- no regression to consumer Credits / 2C purchase logic occurs inside merchant Experiences;
- a salesperson can show a Campaign and then its Admin detail without either surface looking like an internal engineering demo.

---

# Workstream B — Consumer → Merchant Distribution

## 8. Objective

Use current VisuTry traffic to generate real interaction with Merchant Experiences.

Do not build a logo directory whose only purpose is to show demos. Build a **Consumer Discovery Layer** that maps shopper intent to relevant Merchant Campaigns.

The primary routing model should be:

```text
User intent
    ↓
Campaign Experience
    ↓
Merchant products
```

not:

```text
User
 ↓
Brand directory
```

Brand / retailer browsing can exist as a secondary dimension.

---

## 9. Discovery surface

Candidate route:

```text
/en/discover
```

Alternative naming may be chosen during IA work, but avoid creating overlapping `/brands`, `/campaigns` and `/discover` pages before the information architecture is settled.

Recommended structure:

### 9.1 Featured shopping intents

Examples derived from existing Experiences:

- Find frames for smaller faces;
- Find your frame;
- Statement frames;
- Sunglasses edit;
- Active eyewear;
- Multi-brand frame discovery.

These are links into real Store/Campaign Experiences.

### 9.2 Explore brands & retailers

List the six current merchant environments with:

- identity;
- short descriptor;
- Store link where appropriate;
- relevant Campaign links;
- clear Reference labeling for simulated merchants.

### 9.3 Discovery card requirements

Each card should answer:

- what decision / intent does this help with?
- which merchant / retailer is behind it?
- what products are represented?
- what happens after click?

Avoid case-study language.

---

## 10. Distribution entry points

The Discover layer alone will not create meaningful traffic. Existing 2C surfaces should expose contextual entry points where intent is already known.

Candidate sources:

### 10.1 Face Analysis

After face shape / recommendation results:

- route users into fitting Campaigns;
- avoid generic “browse brands” CTA when a more specific Experience exists.

### 10.2 Compare / Try-On

After a user expresses interest in eyewear:

- offer related Merchant Experiences;
- preserve distinction between current 2C tool history and merchant-owned Experience sessions.

### 10.3 Style Explorer

Style-driven users can be routed into fashion / statement / sunglasses Campaigns.

### 10.4 SEO / editorial pages

Relevant Visual SEO / eyewear education pages can point to matching Experiences when contextually appropriate.

Do not force commercial links into every SEO page. Relevance is more important than volume.

### 10.5 Home / navigation

A lightweight Discover entry may be added once the Discovery page is mature enough.

Do not make merchant references dominate the core 2C value proposition prematurely.

---

## 11. Attribution contract

Internal VisuTry traffic must be measurable separately from external merchant traffic.

At minimum record first-touch fields such as:

```text
merchantId
experienceId
source = visutry
surface = discover | face-analysis | compare | style-explorer | seo | other
referrer
landingPath
campaign / acquisition context where applicable
```

The authoritative Experience remains the server-resolved Experience attached to the session. Do not trust client-supplied Experience identity after session creation.

Important distinction:

- Experience Campaign = first-class merchant Experience;
- acquisition campaign / UTM campaign = traffic attribution metadata.

Do not conflate them.

---

## 12. Distribution metrics

Initial metrics should answer:

### Traffic

- VisuTry → Merchant Experience sessions;
- traffic by source surface;
- traffic by merchant;
- traffic by Experience.

### Engagement

- recommendation completion;
- Try-On completion;
- compare start;
- favorite / shortlist;
- product click;
- inquiry where applicable.

### Intent

- which Campaigns produce the strongest downstream intent;
- which source surfaces produce the strongest downstream intent;
- which product subsets receive repeated interest.

Do not claim merchant conversion uplift from Reference traffic.

---

## 13. Discovery / distribution Definition of Done

The first release is complete when:

- one coherent Discover surface exists;
- all current merchant environments are represented appropriately;
- existing Reference Stores / Campaigns remain directly reachable;
- at least three meaningful 2C entry surfaces route to relevant Merchant Experiences;
- first-touch source surface is persisted;
- Merchant Admin can separate Experience performance by Experience;
- Reference traffic is not presented as live merchant performance;
- mobile and desktop discovery flows are verified;
- the feature is useful to a consumer even if the consumer does not know the merchant names in advance.

---

### Phase B1 implementation state — COMPLETE — 2026-08-12

- The existing `MerchantSession` acquisition context now supports nullable
  `acquisitionSurface`; historical sessions remain valid with `NULL` and no
  backfill.
- VisuTry-owned handoffs use `source=visutry`, `medium=internal`, and a stable
  lowercase surface taxonomy. Unknown surfaces normalize to `NULL`, and
  external/direct traffic cannot become internal surface traffic through query
  input alone.
- Store and Campaign routes continue to resolve `merchantId` and
  `experienceId` server-side. Acquisition metadata is first-touch session
  context and never selects or changes the Experience.
- `buildMerchantExperienceHref` is the shared URL handoff helper for future
  distribution surfaces. B1 does not add Discover or any new CTA.
- PR #56 merged to `main` as `cad5a6e5f96dc28ee087ef72f5e384c4382b5bfd`.
- Production deployment `dpl_6wUhia5LxzRUpcdto9qJQgcoera2` is READY and serves
  `www.visutry.com`; migration `20260812150000_add_acquisition_surface` is
  applied and `MerchantSession.acquisitionSurface` is readable in production.
- Production read-back passed for AKILA Statement Frames
  (`/en/c/akila/statement-frames`, session
  `cmsppc84u000204l8bp6jhdul`), Luna Optical Store
  (`/en/store/luna-optical`, session `cmsppd23c000104ji8mjke06i`), and the
  direct-control AKILA Store (`/en/store/akila`, session
  `cmsppdneq000604jiwpgzb17a`). Internal sessions persisted
  `source=visutry`, `medium=internal`, `acquisitionSurface=discover`; the
  direct session kept `acquisitionSurface=NULL`.
- The read-only attribution aggregation returned one matching discover
  session for both AKILA and Luna. Verification created only the initial
  `merchant_page_viewed`/session records; no downstream shopper actions or
  Consumer Credits were used. Verification date: 2026-08-12.

# Workstream C — Business Web Presence

## 14. Objective

Establish a B2B narrative and entry point without splitting VisuTry into two disconnected websites.

Preferred architecture:

```text
visutry.com
├ Consumer
│  ├ Face Analysis
│  ├ Try-On
│  ├ Compare
│  ├ Style Explorer
│  └ Discover
│
└ /business
   ├ Overview
   ├ AI Shopping Experiences
   ├ For Brands
   ├ For Retailers
   ├ Reference Experiences
   └ Launch a Pilot
```

Do not create a separate subdomain or separate application unless a later operational requirement justifies it.

---

## 15. B2B positioning

Primary positioning direction:

> **Turn your eyewear catalog into measurable AI shopping experiences.**

Supporting narrative:

```text
Your Catalog
    ↓
Store / Campaign Experiences
    ↓
AI Recommendation
    ↓
Try-On
    ↓
Compare / Shortlist
    ↓
Shopper Intent
    ↓
Your Commerce Destination
```

Avoid leading with “virtual try-on software.” Try-On is one capability in a broader commerce journey.

The merchant should understand that VisuTry does not require them to:

- rebuild their ecommerce site;
- migrate checkout;
- replace Shopify / BigCommerce / their current commerce system;
- build an AI stack internally.

Do not claim integrations that are not built.

---

## 16. `/business` page responsibilities

The initial B2B site can begin as one strong page rather than a large information architecture.

It must answer:

1. What is VisuTry for merchants?
2. What does the shopper experience?
3. What does the merchant receive?
4. What can be launched today?
5. How quickly can a pilot be created?
6. What happens to merchant catalog / product destinations?
7. Can I see examples?
8. How do I start?

Recommended sections:

### Hero

Clear commercial outcome, not a feature list.

### How it works

Catalog → Experience → shopper journey → intent → merchant destination.

### Experience types

Store and Campaign as two delivery surfaces from one Catalog.

### Reference Experiences

Use the five reference archetypes as demonstrations, with explicit simulation disclosure.

### Merchant Intelligence

Show polished Admin / Experience analytics, without implying revenue attribution.

### For brands / for retailers

Explain the difference between single-brand catalog and multi-brand retailer use cases.

### Launch model

Explain the current assisted onboarding / pilot process truthfully.

### CTA

Preferred direction:

- Launch a pilot;
- See a demo;
- Build this for my catalog.

Exact commercial terms should follow the current business model; do not invent pricing in UI.

---

## 17. Navigation

Possible future top-level navigation:

```text
Try On
Face Analysis
Discover
For Business
```

Do not change navigation until `/discover` and `/business` are both coherent destinations.

The purpose is not to force B2B into the 2C journey. It is to make the two sides of the marketplace / infrastructure legible within one product.

---

## 18. Business website Definition of Done

- `/business` has a coherent B2B narrative;
- Reference Experiences are directly accessible;
- shopper and Merchant Admin visuals are production-quality assets, not mockups where live surfaces are available;
- language never implies Reference merchants are customers;
- assisted onboarding / pilot process is represented accurately;
- CTA enters an existing or minimal merchant lead flow;
- no CRM, self-service onboarding or commerce integration is required to launch the page;
- mobile presentation is first-class.

---

# Shared program requirements

## 19. Design system direction

The three workstreams should share one visual system while preserving different contexts.

### Consumer / Merchant Experience

- editorial;
- product imagery first;
- generous whitespace;
- premium eyewear / fashion sensibility;
- restrained functional chrome;
- clear, calm interaction states.

### Merchant Admin

- premium marketing intelligence;
- strong hierarchy;
- restrained data visualization;
- fewer repeated cards;
- clear action vs insight separation;
- professional empty/reference states.

### Business website

- combines editorial commerce visuals with credible product proof;
- no generic AI-gradient landing-page aesthetic;
- real Store/Campaign/Admin surfaces should carry more proof than decorative graphics.

---

## 20. Data and provenance rules

The following remain mandatory:

- Merchant Catalog owns products;
- Experience selects subsets; products are not duplicated per Campaign;
- Store and Campaign are sibling Experience types;
- tenant boundary is `merchantId`, not product brand;
- session Experience identity is server-authoritative;
- acquisition metadata is separate from Experience identity;
- favorite / shortlist is separate from lead capture;
- Reference / Simulation provenance remains visible;
- no synthetic traffic should be described as live merchant behavior;
- no revenue attribution is shown unless reliable revenue data exists.

---

## 21. Known gaps and priority

### P0 — before real merchant data is mixed with Reference data

**Reference vs Live session/event segmentation**

Reason: current Reference provenance must not contaminate merchant reporting when real live traffic arrives.

This should be planned before onboarding a real merchant with meaningful production traffic, but it does not need to block visual hardening or Discovery design work.

### P1 — catalog fidelity

- decimal millimeter dimensions;
- typed lens / technical feature facts.

These improve catalog quality but do not currently block market-facing productization.

### P2 — operational hardening

- additional image-host compatibility only when repeated;
- other catalog normalization issues only when repeated across merchants.

Do not implement speculative platform capability.

---

# Execution order

## 22. Recommended sequence

### Phase A — Experience Design & Distribution Audit

**Do first. No broad implementation yet.**

Audit the current production implementation across:

- shared Store runtime;
- shared Campaign runtime;
- mobile + desktop;
- recommendation;
- Try-On;
- Compare;
- favorite / product click;
- Merchant Admin overview;
- Experiences list;
- Experience detail;
- catalog selection;
- current consumer homepage/navigation;
- Face Analysis completion path;
- Compare / Style Explorer entry points;
- current six merchant environments;
- current 2B / Store-related landing content.

Output a page-by-page redesign / distribution plan with:

- current-state screenshots or exact route references;
- UX issue;
- visual issue;
- data issue;
- proposed change;
- mobile requirement;
- priority P0/P1/P2;
- whether change is CONTENT / CONFIG / DATA / PRODUCT CODE;
- shared vs merchant-specific impact.

### Phase B — Experience Design Hardening

Implement the shared shopper and Admin visual/interaction improvements accepted from the audit.

Do not simultaneously build `/business`.

### Phase C — Consumer Discovery & Attribution

Build `/discover` (or final selected route), contextual traffic entry points and source-surface attribution.

Start collecting real VisuTry-origin Experience sessions.

### Phase D — B2B Website

Build `/business` using the polished shopper Experience, polished Admin and real Reference Experience routes as proof.

### Phase E — Merchant Outreach

Only after the above surfaces are credible enough for external scrutiny, begin structured merchant outreach.

---

## 23. Program gates

### Gate A — Brand-facing quality

A premium eyewear marketing lead can open a Campaign and its Admin detail without encountering obvious engineering-demo visual debt.

### Gate B — Traffic loop

VisuTry can send its own traffic into Merchant Experiences and measure source → Experience → intent.

### Gate C — B2B narrative

A new merchant prospect can understand VisuTry, see credible live examples and know how to start from `/business` without a founder verbally filling major gaps.

### Gate D — Real merchant readiness

Before real merchant production traffic is mixed with the reference estate, Reference vs Live segmentation is resolved.

---

# Immediate next task

## 24. Experience Design & Distribution Audit

The next implementation task is **not** to start redesigning arbitrary pages.

The next task is to produce one evidence-based audit covering the current production product and turning this plan into an implementation backlog.

The audit must answer:

1. Which shopper surfaces currently fail the premium eyewear / marketing quality bar?
2. Which Admin surfaces still feel like internal tooling?
3. Where do mobile layouts create material friction?
4. Which states are missing or visually unfinished?
5. Which current 2C surfaces are natural entry points into Merchant Campaigns?
6. What should `/discover` contain and what should it not contain?
7. Which attribution fields already exist, and which are missing for VisuTry-origin traffic?
8. What can be improved using content/config/data only?
9. What truly requires shared product code?
10. What must be completed before `/business` is worth launching?

The audit should end with a sequenced implementation backlog, not a broad design essay.

---

# Non-goals for this phase

Do not start:

- Reference Brand 6;
- more Reference Campaign production for its own sake;
- full Campaign Builder;
- generic crawler;
- merchant self-service onboarding;
- Shopify / BigCommerce app integration;
- CRM;
- marketing automation;
- revenue attribution;
- enterprise permissions;
- AI-agent public API;
- new recommendation engine;
- new Try-On engine;
- merchant-specific runtime forks;
- a separate B2B application / website stack.

Any new capability must be justified by a concrete market-facing blocker or repeated real-merchant need.

---

## 25. Phase success condition

This phase succeeds when VisuTry is no longer merely capable of generating merchant Experiences, but presents and distributes them as a credible market product:

> **Polished shopper experience + credible merchant intelligence + owned consumer distribution + clear B2B narrative.**

At that point, the primary unknown should become commercial demand, not product presentation or delivery readiness.
