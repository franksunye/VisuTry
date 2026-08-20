# VisuTry Business Website IA & Copy

**Status:** Draft v1 — Canonical Business Website Baseline  
**Owner:** Product / Growth / Sales  
**Created:** 2026-08-20  
**Purpose:** Define the information architecture, navigation, page roles, merchant-facing copy, CTA system, claims boundary, pricing language, and evidence rules for the VisuTry Business website.

## Related source-of-truth documents

This document consolidates and must remain consistent with:

- `docs/product/specs/merchant-experience-architecture.md`
- `docs/product/specs/merchant-commercial-entitlements.md`
- `docs/strategy/merchant-pricing-packaging-unit-economics.md`
- `docs/product/sales/visutry-store-sales-pitch.md`
- `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md`
- `docs/product/specs/visutry-store-landing-page.md`
- `docs/product/specs/pilot-delivery-kit-spec.md`
- `docs/product/specs/campaign-conversion-policy.md`

Where this document conflicts with a later approved commercial, product, or claims document, the later approved source of truth wins and this document must be updated.

---

# 1. Purpose

VisuTry currently has strong Business product capability and sales material, but the public website presents Business content as a small number of isolated surfaces mixed into the broader Consumer site.

The purpose of the Business website is to create a coherent merchant-facing product area that can support:

- founder-led merchant outreach;
- merchant evaluation before a sales conversation;
- pricing and Pilot evaluation;
- Store and Campaign product education;
- Commerce Intelligence positioning;
- product and platform proof;
- AI / search indexing of the Business offer;
- future self-service merchant acquisition without forcing a redesign of the Consumer website.

The Business website is not a separate brand. It is a dedicated information architecture under VisuTry.

Primary root:

```text
/{locale}/business
```

Business pages should use their own Business navigation and Business footer while remaining visually consistent with the VisuTry brand.

---

# 2. Current Commercial Stage

VisuTry is currently in **Market Capture / controlled founder-led merchant acquisition**.

The current externally sellable offer is not a mature recurring SaaS price card.

The approved current commercial offer is:

## Founding Merchant Pilot

**USD $149 / 30 days**

Includes:

- one hosted merchant-specific Store or Campaign Experience;
- 8–50 reviewed merchant frames;
- personalized frame recommendation;
- Standard Virtual Try-On;
- Frame Compare;
- Product Click / Favorite / Inquiry intent signals where enabled;
- source / campaign continuity;
- merchant intent-performance view;
- assisted setup;
- weekly Pilot review;
- up to 1,500 AI-assisted shoppers / AI Commerce Sessions;
- up to 3,500 Standard Try-On generations.

The current $149 offer is a **market-capture pricing version**, not permanent lifetime pricing.

Do not publish old Launch / Growth / Scale price-card numbers as current external plans until a new pricing version is explicitly approved.

---

# 3. Positioning

## 3.1 Primary Business positioning

> **Turn your eyewear catalog into a personalized AI shopping experience.**

Supporting explanation:

> VisuTry helps shoppers get recommendations from your own frame catalog, try selected frames on, compare finalists, and continue to your product or inquiry flow — while giving you visibility into which products and shopper journeys create stronger purchase intent.

## 3.2 Short Business positioning

> **VisuTry turns eyewear catalogs into measurable AI shopping experiences.**

## 3.3 First-touch sales framing

> **We turn an eyewear catalog into a hosted recommendation + Try-On + Compare experience that sends shoppers back to your product pages and shows which frames create intent.**

## 3.4 Positioning ladder

Use this hierarchy consistently.

| Layer | Merchant language | Business role |
| --- | --- | --- |
| 1 | AI Storefront | First SaaS product / Pilot surface |
| 2 | Campaign Experience | Reusable experience for specific traffic, audiences, collections or offers |
| 3 | Commerce Intelligence | Recommendation, Try-On, Compare, product-click and intent insight |
| 4 | Agent-Ready Commerce | Future distribution expansion for AI-assistant / agent traffic |
| 5 | AI Commerce Platform / Infrastructure | Long-term platform position |

The first merchant should be able to understand and buy Layer 1 without having to understand the entire long-term platform vision.

---

# 4. Product Model Used by the Website

The Business website must reflect the approved Merchant Experience Architecture.

```text
Merchant
│
├── Brand / Theme
├── Catalog
│
└── Experiences
    ├── Store Experience
    ├── Campaign Experience A
    ├── Campaign Experience B
    └── ...
```

Core rule:

> **Store and Campaign are first-class delivery modes of one shared commerce experience runtime.**

Do not present Campaign as a child feature of Store.

Do not present Store as a mandatory prerequisite for Campaign.

Externally, Store and Campaign should remain distinct merchant-facing concepts because they are easier to understand.

---

# 5. Business Website IA

## 5.1 Core pages

```text
/{locale}/business
/{locale}/business/platform
/{locale}/business/store
/{locale}/business/campaigns
/{locale}/business/commerce-intelligence
/{locale}/business/pricing
/{locale}/business/examples
```

## 5.2 Secondary pages

```text
/{locale}/business/integrations
/{locale}/business/pilot
```

## 5.3 Business navigation

Recommended Desktop Header:

```text
VisuTry Business
Platform | Store | Campaigns | Intelligence | Pricing | Examples
                                      Merchant Sign In | Start a Pilot
```

Recommended labels:

- `Platform`
- `Store`
- `Campaigns`
- `Intelligence`
- `Pricing`
- `Examples`

Do not add `Solutions`, `Resources`, `Industries`, `Enterprise`, or large dropdown menus at the current stage.

## 5.4 Business mobile navigation

Use the same six primary links in a simple vertical menu.

Recommended order:

1. Platform
2. Store
3. Campaigns
4. Intelligence
5. Pricing
6. Examples
7. Merchant Sign In
8. Start a Pilot
9. For Shoppers

---

# 6. Claims Boundary

This section applies to all Business marketing pages.

## 6.1 Claims allowed now

The website may state that VisuTry can provide or support:

- merchant-scoped catalogs;
- hosted Store Experiences;
- hosted Campaign Experiences;
- personalized frame recommendation;
- Virtual Try-On;
- Frame Compare;
- product click / favorite / inquiry intent signals where enabled;
- source and Campaign context;
- merchant intent-performance views;
- reviewed catalog onboarding;
- assisted setup;
- hosted-first deployment;
- handoff to merchant product pages or inquiry destinations;
- multiple Experiences from one merchant catalog;
- different Experience catalog subsets;
- shopper-decision workflows built around recommendation → Try-On → Compare → product intent.

## 6.2 Claims that require careful wording

The website may describe:

- `Commerce Intelligence` as observed engagement and purchase-intent behavior;
- `Attribution` only where source / Campaign context is actually available;
- AI-assistant / agent traffic as a platform direction or developing distribution capability unless the specific surface is currently production-ready and documented.

## 6.3 Claims forbidden now

Do not claim:

- guaranteed physical fit;
- prescription accuracy;
- pupillary-distance or medical measurement;
- medical advice;
- published AI accuracy percentages unless independently validated and approved;
- guaranteed conversion uplift;
- guaranteed revenue lift;
- incremental GMV;
- current full revenue attribution if commerce/order integration is not present;
- completed Shopify sync unless it is currently shipped and approved for marketing;
- one-click self-service catalog onboarding if the current process remains assisted;
- autonomous purchasing or checkout execution unless explicitly implemented;
- that Reference Experiences are customers, partners, clients, or production case studies unless they truly are.

---

# 7. Page: Business Overview

**Route:** `/{locale}/business`  
**Page role:** Explain the Business offer in one visit and route merchants into Store, Campaigns, Intelligence, Pricing, Examples or Pilot.  
**Primary audience:** Eyewear brand founders, ecommerce leads, growth leads, independent optical-store owners, merchandising / digital leads.

## 7.1 Hero

**Eyebrow**  
AI Commerce for Eyewear

**H1**  
Turn your eyewear catalog into a personalized AI shopping experience.

**Subheadline**  
Help shoppers narrow the catalog, get recommendations, try frames on, compare finalists, and continue to your product or inquiry flow — while you see which products and journeys create stronger intent.

**Primary CTA**  
Start a Pilot

**Secondary CTA**  
See a Store Example

**Microcopy**  
Hosted first. Keep your current ecommerce site and product pages.

## 7.2 Section — The merchant problem

**Eyebrow**  
From browsing to confident choice

**Heading**  
Showing more frames is easy. Helping shoppers decide is harder.

**Body**  
Eyewear shoppers often browse many frames without knowing what to try first. Virtual Try-On can show a frame on a face, but it does not always solve the earlier decision problem: which frames are worth trying, comparing, and clicking through to buy or inquire about.

VisuTry combines catalog guidance, recommendation, Try-On, Compare, and merchant intent signals into one decision journey.

## 7.3 Section — The core shopper journey

**Heading**  
One guided path from catalog to product intent.

```text
Merchant catalog
→ Shopper context
→ Personalized shortlist
→ Try-On
→ Compare
→ Product / inquiry destination
→ Intent insight
```

Suggested supporting cards:

- **Recommend** — Narrow a merchant catalog into a more relevant shortlist.
- **Try On** — Let shoppers preview selected frames using their own photo.
- **Compare** — Help shoppers review finalists side by side.
- **Continue** — Send high-intent shoppers to the merchant's product or inquiry destination.
- **Measure** — See recommendation, Try-On, Compare and product-interest behavior.

## 7.4 Section — Two ways to launch

**Heading**  
Use one catalog across always-on and campaign-specific experiences.

### Store

**Title**  
An always-on AI Storefront for your eyewear catalog.

**Body**  
Create a persistent, merchant-branded shopping experience where shoppers can discover, narrow, try, compare, and continue to your existing commerce destination.

**CTA**  
Explore Store

### Campaigns

**Title**  
Focused experiences for specific traffic, collections and intent.

**Body**  
Reuse the same merchant catalog in Campaign Experiences built around a collection, audience, source, style story, promotion, or shopping intent.

**CTA**  
Explore Campaigns

## 7.5 Section — Commerce Intelligence

**Heading**  
See what shoppers actually do before the product click.

**Body**  
Page views alone do not explain whether shoppers found a relevant frame. VisuTry captures decision-stage signals such as recommendation completion, Try-On, Compare, favorite, inquiry, product click, top frames, and source / Experience context where available.

**CTA**  
Explore Intelligence

## 7.6 Section — Hosted first

**Heading**  
Add a decision layer without rebuilding your ecommerce stack.

**Body**  
Your existing website, product pages and checkout remain the commerce source of truth. VisuTry starts as a hosted shopping experience that can sit between selected traffic and your current destination.

**Allowed supporting examples**

- paid social traffic;
- email campaigns;
- creator / influencer links;
- QR entry points;
- direct traffic;
- dedicated collection campaigns;
- pre-shop traffic before an appointment or store visit.

## 7.7 Section — Pilot CTA

**Heading**  
Start with a real frame set and a 30-day Pilot.

**Body**  
We start with 8–50 reviewed frames, set up one hosted Store or Campaign Experience, and review shopper behavior with you before you decide how to continue.

**Primary CTA**  
Start a Founding Pilot

**Secondary CTA**  
View Pricing

---

# 8. Page: Platform

**Route:** `/{locale}/business/platform`  
**Page role:** Explain the system behind Store, Campaigns and Intelligence without forcing merchants into technical architecture.  
**Primary CTA:** Start a Pilot  
**Secondary CTA:** Explore Store

## 8.1 Hero

**Eyebrow**  
VisuTry Platform

**H1**  
One decision layer between eyewear traffic and merchant commerce.

**Subheadline**  
Use one merchant catalog to power Store and Campaign Experiences with recommendation, Virtual Try-On, Compare, intent measurement, and product handoff.

## 8.2 Section — Platform model

**Heading**  
One catalog. Multiple shopping experiences.

```text
Merchant
├── Catalog
├── Store Experience
├── Campaign Experiences
└── Commerce Intelligence
```

**Body**  
Products belong to the merchant catalog. Store and Campaigns reuse that catalog rather than duplicating product truth. Each Experience can select a different subset of frames and present a different shopper context.

## 8.3 Section — Catalog foundation

**Heading**  
Start from the merchant's own frames.

**Body**  
VisuTry is designed around merchant-scoped product identity and reviewed product data. The goal is not to replace catalog management systems, but to make the product data required for guided eyewear decisions usable by Store and Campaign Experiences.

**Current-stage wording**  
Catalog onboarding is assisted and reviewed. Supported intake methods depend on the current Pilot workflow.

Do not promise generic one-click crawling or universal catalog sync unless explicitly shipped.

## 8.4 Section — Decision runtime

**Heading**  
Recommendation, Try-On and Compare work as one journey.

**Body**  
Recommendation helps narrow the set of frames. Try-On helps visualize selected products. Compare helps shoppers review finalists. Product links or inquiry actions then return the shopper to the merchant's existing selling flow.

## 8.5 Section — Experience runtime

**Heading**  
Store and Campaign are different modes of the same commerce experience runtime.

**Body**  
A merchant can run only a Store, only Campaigns, or both. Campaigns are not children of Store and do not require a Store to exist first.

## 8.6 Section — Intelligence layer

**Heading**  
Measure the decision path, not only the page view.

**Body**  
VisuTry records merchant-scoped session, Experience and intent behavior so merchants can understand which products and shopper journeys create more engagement and purchase intent.

## 8.7 Section — Distribution direction

**Heading**  
Built for more than one traffic source.

**Body**  
The same commerce experience model can support traffic from websites, campaigns, social, email, QR and — as the platform evolves — AI assistants and shopping agents.

Use future-tense wording for agent distribution unless the specific integration is currently production-ready.

---

# 9. Page: Store

**Route:** `/{locale}/business/store`  
**Page role:** Sell the most concrete and easiest-to-understand Business product surface.  
**Primary CTA:** Start a Pilot  
**Secondary CTA:** View a Store Example

## 9.1 Hero

**Eyebrow**  
AI Storefront

**H1**  
Turn your eyewear catalog into an AI-guided storefront.

**Subheadline**  
Give shoppers a merchant-branded path from discovery and recommendation to Try-On, Compare, and your existing product or inquiry destination.

## 9.2 Section — What the Store does

**Heading**  
Help shoppers choose before they leave the experience.

Suggested feature blocks:

- Merchant-branded hosted experience
- Reviewed merchant frame catalog
- Personalized frame recommendation
- Virtual Try-On
- Frame Compare
- Product Click / Favorite / Inquiry signals where enabled
- Source context
- Merchant intent view

## 9.3 Section — Shopper workflow

**Heading**  
A simpler path through a difficult category.

```text
Enter Store
→ Add shopper context / photo
→ Get shortlist
→ Try selected frames
→ Compare finalists
→ Continue to product or inquiry
```

## 9.4 Section — Why not just VTO

**Heading**  
Virtual Try-On shows a frame. VisuTry helps shoppers decide which frame to try.

**Body**  
VisuTry treats Try-On as one step in the decision journey. Recommendation narrows the catalog before Try-On, Compare helps evaluate finalists, and intent signals help the merchant understand which frames and journeys created stronger interest.

## 9.5 Section — Keep your existing commerce stack

**Heading**  
Your current ecommerce site remains the destination.

**Body**  
The hosted Store is designed to complement existing product pages and checkout rather than replace them. For the current Pilot, the merchant's existing product or inquiry destinations remain the commerce source of truth.

## 9.6 Section — Store proof

**Heading**  
See a Reference Store Experience.

Use reference examples with visible evidence labels such as:

> Reference Experience · Simulation

Do not label a reference as a customer, client or partner unless that relationship is real and approved for publication.

## 9.7 Section — CTA

**Heading**  
Launch one Store Experience with your own frames.

**Body**  
The Founding Merchant Pilot starts with 8–50 reviewed frames and one hosted Store or Campaign Experience.

**Primary CTA**  
Start a Pilot

**Secondary CTA**  
View Pricing

---

# 10. Page: Campaigns

**Route:** `/{locale}/business/campaigns`  
**Page role:** Explain how a merchant can reuse the same catalog across focused shopping Experiences for traffic, audience, collection or intent contexts.  
**Primary CTA:** Start a Pilot  
**Secondary CTA:** See Campaign Examples

## 10.1 Hero

**Eyebrow**  
Campaign Experiences

**H1**  
Turn campaign traffic into a guided eyewear decision journey.

**Subheadline**  
Build focused shopping Experiences for specific collections, audiences, channels, style stories, offers or shopper intent — using the same merchant catalog and decision tools.

## 10.2 Section — Campaign model

**Heading**  
Do not send every shopper into the same catalog journey.

**Body**  
Different traffic arrives with different context. A collection launch, creator link, paid-social ad, email campaign, QR code or fit-focused promotion can each use a dedicated Experience with its own message and selected product set.

## 10.3 Section — One catalog, multiple Campaigns

```text
Merchant Catalog
├── Campaign A: Small-face collection
├── Campaign B: Statement frames
├── Campaign C: Sunglasses edit
└── Campaign D: Office / professional eyewear
```

**Body**  
Campaign Experiences select subsets from the merchant catalog rather than creating separate product truth. The same recommendation, Try-On, Compare, privacy, usage and intent foundations can be reused across Experiences.

## 10.4 Section — Traffic entry points

Suggested examples:

- Paid social
- Search campaigns
- Creator / influencer links
- Email
- QR
- Direct launch links
- Collection pages
- Future AI-assistant / agent traffic where supported

## 10.5 Section — Shopper journey

```text
Traffic source
→ Campaign context
→ Relevant catalog subset
→ Recommendation
→ Try-On
→ Compare
→ Product / inquiry destination
→ Intent signal
```

## 10.6 Section — Campaign measurement

**Heading**  
Compare shopper behavior by Experience.

**Body**  
Where available, merchants can review source / Campaign context together with recommendation, Try-On, Compare, favorite, inquiry and product-click behavior.

Do not claim revenue attribution unless order / commerce data is actually connected.

---

# 11. Page: Commerce Intelligence

**Route:** `/{locale}/business/commerce-intelligence`  
**Header label:** Intelligence  
**Page role:** Explain why VisuTry is more than a VTO surface and how merchants can learn from observed shopper decision behavior.  
**Primary CTA:** Start a Pilot  
**Secondary CTA:** Explore Examples

## 11.1 Hero

**Eyebrow**  
Commerce Intelligence

**H1**  
See which frames and shopping journeys create stronger intent.

**Subheadline**  
Understand how shoppers move through recommendation, Try-On, Compare, favorite, inquiry and product-click behavior across Store and Campaign Experiences.

## 11.2 Section — From traffic to intent

**Heading**  
Page views show traffic. Decision signals show what happened next.

**Body**  
VisuTry is designed to capture the decision-stage behavior that occurs before a shopper returns to a merchant product or inquiry destination.

## 11.3 Current evidence level

The website should explicitly distinguish three evidence levels.

### Current — Observed Engagement + Purchase Intent

Examples:

- Commerce Sessions
- recommendation completion
- Try-On
- Compare
- Product Click
- Favorite
- Inquiry
- source / Campaign context
- top frames
- high-intent behavior

### Later — Attributed Conversion / Revenue

Requires commerce integration or order-data access.

### Future — Incremental Outcome

Requires credible experiment design.

Do not blur these levels.

## 11.4 Section — Questions Intelligence can help answer

Suggested merchant questions:

- Which frames are recommended most often?
- Which frames are tried on most often?
- Which frames reach Compare?
- Which products receive favorites, inquiries or product clicks?
- Which Experience creates stronger engagement?
- Which traffic source produces more high-intent behavior?

## 11.5 Section — Optimization loop

```text
Launch Experience
→ Observe shopper behavior
→ Identify high-interest frames / journeys
→ Adjust catalog subset or Campaign context
→ Re-run and compare
```

Position this as an optimization workflow, not a guaranteed conversion engine.

---

# 12. Page: Pricing

**Route:** `/{locale}/business/pricing`  
**Page role:** Present the current approved merchant offer clearly and truthfully.  
**Primary CTA:** Start a Pilot  
**Secondary CTA:** Contact Us

## 12.1 Hero

**Eyebrow**  
Founding Merchant Offer

**H1**  
Start with a 30-day Pilot using your real frames.

**Subheadline**  
A low-friction way to test recommendation, Virtual Try-On, Compare and merchant intent signals before deciding how to continue.

## 12.2 Pricing card

### Founding Merchant Pilot

**$149 / 30 days**

Includes:

- 8–50 reviewed merchant frames
- 1 hosted Store or Campaign Experience
- personalized frame recommendation
- Standard Virtual Try-On
- Frame Compare
- Product Click / Favorite / Inquiry intent signals where enabled
- source / Campaign context
- merchant intent-performance view
- assisted setup
- weekly Pilot review
- up to 1,500 AI-assisted shoppers
- up to 3,500 Standard Try-On generations

**Primary CTA**  
Start a Pilot

## 12.3 Pricing note

Recommended wording:

> The Founding Merchant Pilot is a limited market-capture offer for early merchant validation. It is not lifetime pricing. Continuation options are discussed after the Pilot based on usage, product needs, Campaign scope, integrations and support requirements.

## 12.4 Do not publish yet

Do not publish recurring Launch / Growth / Scale plan prices until a new recurring pricing version is approved.

Do not publish a default 5,000-render allowance. The optional Founding Launch Bonus may only be granted as an approved, recorded commercial exception.

## 12.5 FAQ

### Is this a subscription?

No. The current Founding Merchant Pilot is a 30-day Pilot offer. Continuation terms are discussed after the Pilot.

### Do we need to replace our ecommerce site?

No. The current hosted Pilot is designed to complement your existing website, product pages and commerce destination.

### Do we need engineering work?

Not for the hosted Pilot. Catalog onboarding is assisted. Deeper integrations are outside the current default Pilot scope.

### Can we use our own frames?

Yes. The Pilot is built from a reviewed merchant frame set.

### Is Virtual Try-On the only product?

No. Try-On is one step. The Pilot combines recommendation, Try-On, Compare and merchant intent signals.

### Does VisuTry guarantee conversion uplift?

No. The current Pilot measures observed engagement and purchase-intent behavior. Revenue attribution or incremental conversion requires deeper commerce data and credible experimental design.

---

# 13. Page: Examples

**Route:** `/{locale}/business/examples`  
**Page role:** Show product patterns and reference Experiences without overstating customer proof.  
**Primary CTA:** Start a Pilot

## 13.1 Hero

**Eyebrow**  
Reference Experiences

**H1**  
See how different eyewear businesses can use Store and Campaign Experiences.

**Subheadline**  
Explore reference implementations for different catalog, merchandising, fit, collection and retailer scenarios.

## 13.2 Evidence rule

Every non-customer implementation must visibly use a disclosure such as:

> **Reference Experience · Simulation**

Supporting note:

> Reference Experiences demonstrate product patterns and do not represent customer performance or commercial relationships unless explicitly stated.

## 13.3 Suggested reference categories

Use the existing reference portfolio and map each example to a merchant problem.

- Fit / proportion-led DTC
- Premium independent brand
- Fashion / collection-led brand
- Sport / performance brand
- Multi-brand retailer

## 13.4 Card structure

Each example card should include:

- Brand / reference name
- Reference label
- Business pattern
- Shopper problem
- Experience type: Store / Campaign
- Key flow demonstrated
- CTA: View Experience

Do not publish conversion metrics unless they come from real merchant data and are approved for external use.

---

# 14. Page: Integrations

**Route:** `/{locale}/business/integrations`  
**Page role:** Explain current hosted-first integration boundaries and future extensibility without overclaiming production capabilities.

## 14.1 Hero

**Eyebrow**  
Integrations

**H1**  
Start hosted. Keep your existing commerce destination.

**Subheadline**  
VisuTry can begin as a hosted decision Experience and hand shoppers back to your current product or inquiry flow. Deeper commerce integrations can be added as the product and merchant relationship mature.

## 14.2 Current-stage language

Current Pilot:

- hosted Store / Campaign Experience;
- reviewed merchant catalog;
- merchant product / inquiry destinations;
- source / Campaign context where available;
- assisted onboarding.

## 14.3 Developing / future language

May include, when appropriate and clearly labeled:

- ecommerce-platform sync;
- API integrations;
- merchant catalog automation;
- AI-assistant / agent traffic;
- richer conversion attribution.

Do not present roadmap items as shipped.

---

# 15. Page: Pilot

**Route:** `/{locale}/business/pilot`  
**Page role:** Convert qualified merchant interest into a structured Pilot request instead of relying on generic mailto contact.  
**Primary CTA:** Apply for a Pilot

## 15.1 Hero

**Eyebrow**  
Founding Merchant Pilot

**H1**  
Test VisuTry with your own eyewear catalog.

**Subheadline**  
Start with one focused Store or Campaign Experience, a reviewed frame set, and a 30-day learning cycle.

## 15.2 Recommended form fields

Minimum:

- Name
- Work email
- Business / brand name
- Website / store link
- Business type
- Approximate frame count
- Ecommerce / selling destination
- Primary goal
- Notes

Suggested goal options:

- Help shoppers choose frames
- Add recommendation before Try-On
- Improve Campaign shopping experience
- Compare Store / Campaign intent
- Test hosted AI shopping
- Explore AI-assistant / agent traffic

## 15.3 Pilot terms summary

Display the same approved baseline used on Pricing.

Do not imply automatic acceptance. Use language such as:

> We review each Pilot request for catalog quality, product fit and the most useful first Experience.

---

# 16. Business Footer

Business pages should use a Business-specific footer rather than the Consumer product footer.

Recommended structure:

## Platform

- Overview
- Store
- Campaigns
- Intelligence
- Pricing

## Explore

- Examples
- Discover Brands
- Integrations

## Business

- Start a Pilot
- Merchant Sign In
- Contact

## Company / Legal

- Blog
- Privacy
- Terms

Brand line:

> **AI commerce for eyewear brands and retailers.**

Consumer bridge:

> **For shoppers → VisuTry Consumer**

Language selection may remain in the footer rather than the Business Header.

---

# 17. CTA System

Keep CTA language consistent across all Business pages.

## Primary conversion CTA

> **Start a Pilot**

Use for high-intent page actions.

## Product exploration CTAs

- Explore Store
- Explore Campaigns
- Explore Intelligence
- See Examples
- View Pricing

## Proof CTAs

- View a Store Example
- View a Campaign Example
- See Reference Experiences

## Merchant account CTA

> Merchant Sign In

## Consumer bridge

> For Shoppers

Avoid rotating between many synonymous CTA labels such as:

- Join now
- Get started
- Request access
- Build my store
- Create my sample
- Start free

unless the specific action truly differs.

---

# 18. SEO / Metadata Direction

Business pages should target merchant intent, not Consumer face-shape / Try-On search intent.

Suggested metadata themes:

## `/business`

**Title direction**  
AI Commerce for Eyewear Brands & Retailers | VisuTry

**Description direction**  
Turn your eyewear catalog into a guided AI shopping experience with recommendation, Virtual Try-On, Compare, merchant product handoff, and measurable shopper intent.

## `/business/store`

**Title direction**  
AI Eyewear Storefront for Brands & Retailers | VisuTry

## `/business/campaigns`

**Title direction**  
AI Eyewear Campaign Experiences | VisuTry

## `/business/commerce-intelligence`

**Title direction**  
Eyewear Commerce Intelligence & Shopper Intent | VisuTry

## `/business/pricing`

**Title direction**  
VisuTry Business Pricing — Founding Merchant Pilot

## `/business/examples`

**Title direction**  
VisuTry Store & Campaign Reference Experiences

Canonical URLs should remain locale-specific and use the approved localization framework.

---

# 19. Visual / Evidence Rules

Business pages should feel more commercial and platform-oriented than the Consumer tool pages, but remain within the same VisuTry visual system.

Recommended characteristics:

- clean white / soft-slate surfaces;
- restrained blue accent;
- clear product screenshots / Reference Experience captures;
- merchant-facing workflow diagrams;
- limited use of abstract AI illustration;
- proof before decoration;
- no invented logos or customer marks;
- every Reference Experience clearly labeled.

When a screenshot is unavailable, use a neutral product placeholder rather than implying a capability that cannot be shown.

---

# 20. Recommended Build Sequence

## Phase 1 — Core Business Website

Build first:

1. Business Header / layout
2. `/business`
3. `/business/store`
4. `/business/campaigns`
5. `/business/commerce-intelligence`
6. `/business/pricing`
7. `/business/examples`
8. Business Footer

`/business/platform` may ship in the same phase or immediately after the three concrete product pages depending on implementation capacity.

## Phase 2 — Acquisition / Integration

Then add:

1. `/business/integrations`
2. `/business/pilot`
3. durable Merchant Lead persistence
4. stronger merchant sign-in handoff
5. real customer proof as available
6. revised recurring pricing when approved

---

# 21. Product / Website Separation Rule

The Consumer and Business websites should share brand and core technology but not primary information architecture.

## Consumer question

> **Which glasses suit me and what should I try?**

Consumer navigation:

```text
Detector | Analysis | Try On | Compare | Explorer
```

## Merchant question

> **How can VisuTry help my shoppers choose frames and show me what creates intent?**

Business navigation:

```text
Platform | Store | Campaigns | Intelligence | Pricing | Examples
```

Do not reintroduce `For Business` into the Consumer primary Header merely because the Business site becomes larger. Business remains reachable from the Consumer footer and direct Business URLs.

---

# 22. Current Canonical Message Summary

If only five merchant-facing statements remain consistent across the website, use these:

1. **Turn your eyewear catalog into a personalized AI shopping experience.**
2. **Recommendation, Try-On and Compare work as one shopper decision journey.**
3. **Store and Campaigns reuse one merchant catalog as different Experience modes.**
4. **VisuTry measures observed shopper engagement and purchase intent without overclaiming revenue uplift.**
5. **The current external offer is the $149 / 30-day Founding Merchant Pilot — not a mature recurring price card.**

These statements should anchor Business copy until a new approved product or commercial baseline replaces them.
