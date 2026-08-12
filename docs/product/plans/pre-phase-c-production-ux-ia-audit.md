# Pre-Phase-C — Production UX / IA Audit

Audit date: 2026-08-12
Environment: `https://www.visutry.com`
Method: authenticated Chrome session, real production navigation, DOM/state inspection, visual screenshots, viewport checks, and fresh-tab console checks.
Scope: audit only. No production code, copy, route, or data was changed.

## Executive Verdict

**READY WITH POLISH**

VisuTry now presents a credible shopper Experience and a real owned-distribution loop, but the surrounding information architecture still reads partly as a collection of AI tools. Before a sales-facing `/business` narrative is refined, the highest-value work is IA framing and B2B positioning polish—not a shopper-runtime rewrite.

There are no P0 blockers in the audited consumer or Merchant Experience routes. There are P1 issues around the strategic navigation model, `/store` sales readiness, and the consistency of merchant intelligence data presentation.

## Audit Evidence

Screenshots were captured and visually reviewed in Chrome during this audit. The route/viewport matrix below is the canonical evidence reference; binary screenshots are intentionally not committed.

### Desktop evidence

- `1440 × 900`: `/en`, `/en/face-shape-detector`, `/en/face-analysis`, `/en/try-on/glasses`, `/en/try-on/glasses/compare`, `/en/style-explorer`, `/en/discover`, `/en/pricing`, `/en/store`.
- `1440 × 900`: `/en/store/luna-optical`, `/en/store/ello-sunglasses`, `/en/c/ello-sunglasses/petite-fit`, `/en/c/akila/statement-frames`, `/en/c/article-one/active-eyewear`, `/en/c/framed-ewe/find-your-frames`.
- `1440 × 900`: `/admin/store` and Framed EWE Experience detail at `/admin/store/merchants/cmsovc43q00003ai87qtpyf2r/experiences/cmsovca1l000l3ai8xc70cvbw`.

### Mobile evidence

- `390 × 844`: `/en`, `/en/face-analysis`, `/en/try-on/glasses/compare`, `/en/discover`, `/en/store`, and `/admin/store`.
- `430 × 932`: `/en`, `/en/discover`, `/en/store`, and the AKILA Statement Frames Campaign.

### Additional checks

- Locale spot checks: `/de/discover`, `/ja/discover`, `/fr`.
- Fresh-tab console checks: `/en`, `/en/discover`, Luna Store, AKILA Campaign, and `/admin/store` produced no console errors or warnings.
- No horizontal overflow was observed at tested mobile widths; measured document width stayed within the viewport.
- The production session was not used to upload a photo, run AI, buy credits, or create shopper intent data.

## Current IA

### Primary navigation observed

Desktop and mobile expose the same six equal-weight product links:

`Detector` · `Advisor` · `Try On` · `Explorer` · `Compare` · `Discover`

Utility actions are language, account, and a prominent `Glasses Advisor` CTA. There is no primary `Business` entry.

Mobile collapses the product links into a drawer while retaining the logo, account state, language control, and menu trigger.

### Secondary navigation observed

The footer repeats the consumer tools and adds `Pricing`. Resources include Blog, FAQ, Face Shape Guide, and `Store for Businesses`. Legal links are separate.

### Real route groups

```text
Consumer entry
├── /{locale}
├── /{locale}/face-shape-detector
├── /{locale}/face-analysis
├── /{locale}/try-on/glasses
├── /{locale}/try-on/glasses/compare
├── /{locale}/style-explorer
├── /{locale}/discover
└── /{locale}/pricing

Merchant shopper runtime
├── /{locale}/store
├── /{locale}/store/{merchantSlug}
└── /{locale}/c/{merchantSlug}/{experienceSlug}

Merchant intelligence
├── /admin/store
├── /admin/store/merchants/{merchantId}
├── /admin/store/merchants/{merchantId}/experiences
└── /admin/store/merchants/{merchantId}/experiences/{experienceId}

Editorial / SEO
├── /{locale}/blog
├── /{locale}/glasses-guide
├── /{locale}/face-shapes
└── related face-shape, brand, category, and guide routes
```

The actual Admin portfolio entry is `/admin/store`; `/admin/store/merchants` is not the portfolio route. Merchant and Experience detail routes use IDs.

## Recommended Phase-C Target IA

This is a recommendation only; it is not implemented by this audit.

```text
Market-facing VisuTry
├── Consumer decision journey
│   ├── Start: free face-shape discovery
│   ├── Understand: Advisor / fit guidance
│   ├── Explore: Discover intent-led Experiences
│   ├── Validate: Try-On and Compare
│   └── Decide: merchant Store / Campaign destination
├── Business narrative
│   └── /business — what VisuTry is, proof, deployment, intelligence, next step
├── Merchant proof / product surface
│   └── /store — hosted Store creation and live shopper proof
└── Editorial discovery
    └── blog and SEO guides supporting the decision journey
```

The future business narrative should coexist with `/store` initially. `/store` currently has a product-entry / sample-store role; it should not be silently renamed or redirected until a separate business narrative is credible.

## Surface Scorecard

| Surface | Desktop | Mobile | Clarity | Visual quality | Continuity | Sales readiness | Verdict |
|---|---|---|---|---|---|---|---|
| Homepage `/en` | Strong hero and workflow | Good, but long | Good | Good | Medium | Medium | POLISH |
| Face Shape Detector | Clear free/on-device promise | Good upload framing | Strong | Good | Medium | N/A | READY |
| Face Analysis | Clear paid analysis step | Usable, sparse initial state | Medium | Good | Medium | Medium | POLISH |
| Try-On | Understandable two-photo flow | Usable, vertically dense | Medium | Good | Medium | N/A | POLISH |
| Compare | Clear preset-frame comparison | No overflow, dense controls | Good | Good | Medium | N/A | POLISH |
| Style Explorer | Strong intent controls | Dense but usable | Medium | Good | Medium | N/A | POLISH |
| Discover | Editorial and intent-led | Strong first viewport | Strong | Strong | Strong | Strong proof layer | READY |
| Luna Store | Clear Live Store gate | Good, CTA remains visible | Strong | Strong | Strong | Strong demo | READY |
| Reference Store | Clear Reference disclosure | Good | Strong | Strong | Strong | Strong demo | READY |
| Reference Campaigns | Strong archetype differentiation | Strong gate and hierarchy | Strong | Strong | Strong | Strong demo | READY |
| Framed EWE Campaign | Multi-brand premise is clear | Good | Strong | Strong | Strong | Strong demo | READY |
| `/en/store` | Polished merchant landing | Good but long | Medium | Strong | Medium | Medium | POLISH |
| Admin portfolio | Dense but credible | Readable, long | Strong | Strong | Strong | Strong internal proof | READY |
| Admin Experience detail | Strong intelligence hierarchy | Not fully audited as a mobile detail flow | Strong | Strong | Strong | Strong internal proof | POLISH |

## Findings by Severity

### P0 — Must fix before Phase C

None found in the audited production surface.

The core consumer routes, Discover, Live/Reference Store and Campaign routes, and authorized Admin Store surfaces rendered without a fresh-tab console error, hydration failure, broken route, or mobile horizontal overflow.

### P1 — Should be addressed in Phase C

#### P1-01 — IA still presents an AI tools collection more than a decision platform

The primary nav gives six tools equal weight: Detector, Advisor, Try On, Explorer, Compare, Discover. The homepage reinforces a numbered tool workflow, and the footer repeats the same product list. This is understandable for an existing user, but a first-time buyer or shopper must infer how the tools relate to a single eyewear decision.

The product is already behaving like an eyewear decision platform in the Store/Campaign runtime and Discover attribution layer; the global IA has not caught up.

Impact: comprehension, first-session choice, sales narrative.

Recommendation: keep the tools, but frame them under a small number of decision jobs and make Discover the owned-experience exploration layer rather than another peer tool.

#### P1-02 — `/store` is polished but not yet a complete B2B sales narrative

The page clearly says “Help shoppers find the right frames faster” and shows a credible shopper visual. It explains catalog → shopper experience and includes a sample Store CTA. It does not yet answer, in one buyer journey, what VisuTry is beyond a Store widget, what merchant intelligence is received, how Campaign and Discover fit, what deployment looks like for a larger team, or what the commercial next step is.

It is currently a strong merchant product landing page, not yet a full `/business` replacement.

Impact: sales readiness, product comprehension, positioning.

Recommendation: create/refine a separate business narrative in Phase C scope. Keep `/store` as the product / proof surface until the business narrative is ready.

#### P1-03 — Merchant intelligence data quality is visibly uneven

Luna’s Admin overview repeatedly shows `Brand not provided` for frame-level interest and catalog rows, while Framed EWE shows explicit brands such as AKILA, RIGARDS, LOOL, Kuboraum, and AHLEM. The shopper product-brand contract is now explicit for structured data, but the live Luna data shown in Admin is still incomplete.

Impact: merchant trust, intelligence credibility, sales demo quality.

Recommendation: treat missing product brand data as a data/import quality backlog item before using Admin intelligence as a primary sales proof point. This is not a UI-only polish issue.

#### P1-04 — Discover is a real distribution layer, but the platform story is not yet visible around it

Discover is more than a static page: it links six catalog-backed Campaign Experiences and six Stores, keeps Reference/Live provenance clear, and preserves `source=visutry`, `medium=internal`, `surface`, and `campaign` attribution. The three contextual handoffs also resolve correctly in production.

The gap is not the Discover implementation. The gap is that the homepage and B2B story do not yet explain Discover as VisuTry-owned distribution and intent continuation. A shopper can use it; a buyer may not understand its strategic role.

Impact: sales narrative, cross-surface comprehension.

Recommendation: explain the distribution loop in the future business narrative and keep the Discover page editorial rather than adding operational analytics to it.

#### P1-05 — Campaign → Store relationship is mostly implicit

The Campaign first screen communicates merchant identity, Campaign identity, Reference/Simulation status, editorial premise, privacy, and the next upload step. The relationship between a specific Campaign and the merchant’s broader Store is not a prominent user-facing action in the initial state.

Impact: orientation, merchant continuity, sales demo explanation.

Recommendation: decide in Phase C whether Campaigns should expose a restrained “more from this Store” continuation. Do not add a generic marketplace directory to Campaign pages.

### P2 — Can follow after Phase C foundation

#### P2-01 — Homepage has feature overload below a strong hero

The homepage’s first viewport is clear and consumer-oriented, but the long page repeats workflow, AI advisor, try-on, comparison, proof, and business content. The page is credible but still asks users to understand several product modes before they reach owned discovery.

#### P2-02 — Tool naming has mild vocabulary drift

Navigation uses `Detector`, `Advisor`, `Try On`, `Explorer`, `Compare`, and `Discover`; the footer uses `Free Face Shape Detector`, `AI Glasses Advisor`, `Virtual Glasses Try-On`, and `Frame Compare`; merchant surfaces use `Store`, `Campaign`, and `Experience`. The names are individually understandable, but the system does not yet have one clear noun hierarchy.

#### P2-03 — Initial tool states are functional but not equally editorial

Face Analysis, Try-On, Compare, and Style Explorer use practical step/control layouts with credits and upload panels. Discover and Merchant Experiences feel more premium and editorial. This is acceptable for the current product, but the transition from consumer tool to merchant Experience can feel like a product-mode switch.

#### P2-04 — Admin mobile is usable but operationally long

At `390 × 844`, the Admin portfolio fits without overflow and preserves merchant/reference/live labels, but six merchant cards followed by health details create a long scan. This is not a blocker for authenticated operators, but a future mobile Admin pass should prioritize alerts and merchant selection before full portfolio detail.

## Detailed Audit Notes

### Primary navigation

- Logo and account orientation are clear on desktop and mobile.
- The six product links are too equal in strategic weight for a market-facing site.
- Discover is in the correct place as an owned distribution entry, but it is visually just another peer in the current nav.
- Try On, Compare, and Style Explorer are understandable after use but overlap conceptually for a first-time visitor.
- Business entry is currently only visible as `Store for Businesses` in the footer; it is not too prominent, but it is too hidden for sales readiness.
- The mobile menu is clean and functional. It preserves the complete tool list without horizontal overflow.

### Homepage

**KEEP**

- The promise “Find glasses that actually suit your face” is consumer-clear.
- The primary free CTA and existing-frame CTA are easy to distinguish.
- Privacy/no-login framing is visible early.
- The recommended workflow gives a usable first-session path.

**POLISH**

- Group the tools around user decisions rather than presenting four or more product modes as a feature tour.
- Introduce Discover as the place to continue into focused eyewear Experiences.
- Make the business path more intentional without competing with the consumer hero.

**REMOVE / DE-EMPHASIZE**

- De-emphasize repeated technical / AI proof blocks when they do not change the next action.
- Avoid making the homepage carry the full explanation of every tool and every future business promise.

### Face Shape Detector

The free, on-device promise is one of the clearest parts of the product. Upload requirements, privacy, and deterministic value are explicit. The likely continuity risk is after the result: the result should strongly bridge to Advisor, Discover, or a focused Experience rather than ending as a face-shape label. No production photo was uploaded in this audit.

Mobile upload framing is clear and the route fit within the tested viewport.

### Face Analysis

The landing state explains the two-step process and the one-credit cost. It is trustworthy, but the initial state has no strong `h1` and feels more like an app workspace than a market-facing decision page. The production route exposes a contextual Experience continuation only after an unlocked result; that is appropriate, but it was not exercised because doing so would require a real AI/paid path.

The main question for Phase C is not whether to add more CTAs, but which next decision should own the result: fit guidance, Discover, or a merchant Experience.

### Try-On

The page clearly separates user photo from glasses input and exposes remaining credits. The “Not sure what suits you?” Advisor link is a useful continuity bridge. The initial state is operational and understandable, but it is not visually as editorial as a Merchant Experience. No upload or generation was performed.

### Compare

The pre-result state is explicit: one user photo, up to four preset frames, then side-by-side results. The frame grid is dense but legible at both tested desktop and mobile widths. Credits are visible in this consumer-owned flow and should remain there. The contextual merchant continuation belongs after a completed result, not before selection; that state was not generated during this audit.

### Style Explorer

Style Explorer has the strongest fashion-intent framing among the tools, with style intent, category, occasion, and recommended frames. It still feels like an independent tool island because the relationship to Discover and Campaign Experiences is not clear before the result. It exposes credits and should remain a consumer tool with an editorial continuation after results.

### Discover

Discover is currently a genuine traffic distribution layer:

- six active, catalog-backed Campaign Experiences;
- six active merchant Store destinations;
- one restrained page-level Reference disclosure;
- explicit Live Merchant vs Reference Experience labeling;
- route-level attribution on Campaign and Store links;
- contextual handoffs from Face Analysis, Compare, and Style Explorer.

The page looks editorial rather than marketplace-like. The first viewport is strong on desktop and mobile. The six merchant cards are a secondary directory, not the hero story. The page is long, but the visual rhythm is controlled and cards remain understandable. The main remaining gap is strategic comprehension: the page does not explain that it is VisuTry-owned distribution, which is appropriate for shoppers but should be explained in `/business`.

### Merchant Store / Campaign

Live Luna, Reference ello Store, fit-led ello Campaign, fashion-led AKILA Campaign, active/technical Article One Campaign, and multi-brand Framed EWE Campaign were inspected.

Common strengths:

- merchant identity is immediately visible;
- Store vs Campaign and Reference vs Live/Simulation are clear;
- privacy and photo retention are visible before upload;
- the initial CTA is singular and obvious;
- Merchant routes explicitly avoid consumer credits;
- Campaign copy is shopper-safe and does not imply customer, partner, or endorsement relationships;
- the multi-brand Framed EWE premise is visible in the headline and product brands appear in the catalog.

Common polish opportunities:

- Campaign-to-Store continuity is not prominent in the first state;
- the same three-step upload/recommend/try-on frame is intentionally shared, but repeated across archetypes;
- the experience is sales-demo quality as a shopper product, while the surrounding B2B story still needs work.

### B2B `/en/store`

From a Head of Ecommerce / Digital Marketing / brand founder perspective, the page communicates:

- a branded shopper experience;
- catalog-to-shortlist workflow;
- try-on and comparison value;
- a low-integration sample Store entry point.

It does not yet communicate with enough precision:

- the distinction between VisuTry consumer distribution and merchant delivery;
- Campaign Experiences and intent-led Discover;
- the merchant intelligence model and its limitations;
- deployment options beyond a small sample Store;
- the next step for a serious buyer versus a self-serve sample creator.

The page should not be treated as the future `/business` page without a narrative upgrade.

### Admin

The authorized Admin session was able to inspect Luna, Framed EWE, portfolio, merchant overview, Experience list, and Experience detail.

Strengths:

- Reference vs Live segmentation is explicit and repeated with restraint;
- performance is framed as counts/rates, not revenue inference;
- privacy and retention health are visible;
- Store vs Campaign comparison is clear;
- Experience detail exposes copy, status, CTA, schedule, and selected catalog in one operational surface;
- Framed EWE selected frames show explicit product brands and multi-brand structure.

Risks:

- Luna’s missing product-brand data is visible in a sales-sensitive section;
- portfolio and detail pages are information-dense on mobile;
- `/admin/store` is the actual portfolio IA entry, which is clear once reached but not discoverable from the public navigation.

## Cross-Surface Continuity

| Journey | Observed result | Verdict |
|---|---|---|
| Homepage → Face Analysis → merchant handoff | Homepage links clearly to Advisor; result handoff exists in the unlocked state, but the paid/AI state was not generated | POLISH |
| Homepage → Discover → Campaign | Strong continuity; attribution survives and Campaign opens without consumer credits | READY |
| Compare → merchant handoff | Contract exists after completed batch; pre-result route is intentionally tool-first | POLISH |
| Style Explorer → merchant handoff | Contract exists after completed style result; no AI state generated | POLISH |
| Discover → Luna Store | Clear Live Merchant and Live catalog presentation | READY |

Visual continuity is strongest from Discover into Store/Campaign. The largest context switch is from the consumer tool surfaces into the merchant runtime: the latter is more editorial, more trust-heavy, and explicitly credit-free.

## Consumer Credits Audit

### Credits should remain visible

- Face Analysis / Advisor, where the one-credit analysis is the paid product step;
- Try-On, where custom generations consume decision credits;
- Compare, where consumer-generated comparison is credit-backed;
- Style Explorer, where multi-look generation consumes credits;
- Pricing, where the consumer credit model is explained.

### Credits should remain absent

- Discover;
- Live Luna Store;
- Reference Store;
- Reference Campaigns;
- contextual handoff landing into a Merchant Experience;
- `/en/store` merchant/B2B landing;
- Merchant Admin.

Production inspection confirms this separation is currently respected.

## Visual Consistency

VisuTry is becoming a product system, but it still contains three visual eras:

1. Consumer tools: blue/purple utility UI, step controls, credits, upload panels.
2. Shopper Experiences: editorial merchant identity, warm/neutral surfaces, strong provenance and privacy framing.
3. Admin / merchant intelligence: restrained SaaS analytics, dense cards, funnels, tables, and operational labels.

The separation is understandable and not inherently wrong. The missing layer is a clear narrative bridge between them. The shared header, typography, blue accents, rounded cards, and focus states are sufficient for a polish pass; a visual rewrite is not justified by this audit.

## Copy Vocabulary Notes

Observed vocabulary is individually clear but slightly uneven:

- `Detector` / `Face Shape Detector`;
- `Advisor` / `AI Glasses Advisor` / `Face Analysis`;
- `Try On` / `Try-On` / `Virtual Glasses Try-On`;
- `Explorer` / `Style Explorer`;
- `Compare` / `Frame Compare` / `Compare Glasses Frames`;
- `Discover` / `Experience` / `Campaign` / `Store`;
- `Store for Businesses` / `VisuTry Store` / future `/business`.

Recommendation for future content work: establish a vocabulary hierarchy where “eyewear decision” is the platform frame, “Experience” is the shopper destination, “Campaign” is a focused merchant edit, and “Store” is the broader merchant collection. Do not change copy in this audit.

## Trust and Privacy

Trust is a current strength:

- Reference Campaigns and Stores visibly say `Reference Pilot · Simulation` and `Reference catalog`;
- Discover discloses that Reference Experiences are demonstrations built from public catalog information;
- the disclosure does not claim customer, partner, or endorsement relationships;
- Live Luna is clearly separated as a live merchant;
- photo retention and raw-photo handling are visible before upload;
- Merchant Admin explicitly says simulation activity is not live merchant traffic;
- product CTA and inquiry language do not imply VisuTry owns merchant checkout;
- no false conversion or purchase claims were observed.

The remaining trust risk is not disclosure; it is data completeness in Admin, especially missing product brands for Luna.

## Performance / Perceived Quality

No full Lighthouse project was run. Real-browser inspection found:

- core pages render successfully in production;
- hero and catalog images were visible on the audited pages;
- no broken-image state was visible in the screenshots;
- no mobile horizontal overflow was observed;
- Discover and Merchant Experience first views are visually stable enough for review;
- the initial consumer tool states are functional but more utilitarian than the Shopper Experience layer.

No fresh console errors or warnings were recorded in isolated Chrome tabs for the five representative production routes listed in the evidence section. A reused-tab navigation through a non-portfolio `/admin/store/merchants` path produced transient DOM errors; the fresh-tab retest of supported core routes was clean, so this is recorded as a test-session artifact rather than a confirmed production blocker.

## Eight Required Answers

1. **Is the current IA clear?** Operationally yes; strategically only partially. It still reads as six AI tools around a workflow rather than one eyewear decision platform.
2. **Is Discover in the right position?** Yes as an owned distribution entry and primary route; its strategic role should be explained in the future business narrative.
3. **Are consumer tools too numerous or fragmented?** Mildly. The tools are useful, but equal-weight naming and overlapping Try-On/Compare/Explorer journeys increase first-session choice cost.
4. **Should the homepage change in Phase C?** Yes, through IA and hierarchy polish. Do not rebuild the hero or replace the current consumer promise.
5. **Should `/store` become `/business`?** Not by direct replacement. Keep `/store` as the Store/product proof surface and introduce a distinct `/business` narrative when ready.
6. **Are Store/Campaign routes sales-demo quality?** Yes for the shopper product and reference proof. The B2B narrative and incomplete Luna brand data are not yet sales-ready at the same level.
7. **Is mobile equal to desktop?** Merchant Experiences and Discover are close. Homepage and consumer tool flows remain usable but denser and longer; Admin mobile is usable but operationally long.
8. **Should Phase C refactor or polish?** Polish and reframe IA. No shared shopper-runtime refactor is justified by this audit.

## Phase C Recommended Scope

### Must polish

- Establish the market-facing IA frame: eyewear decision platform → Discover → Store/Campaign → decision actions.
- Shape a distinct `/business` narrative around shopper value, merchant delivery, proof, intelligence, deployment, and next step.
- Decide and document Campaign-to-Store continuity without turning Campaign pages into marketplaces.
- Close the missing product-brand data gap for live merchant intelligence, beginning with Luna.
- Keep Reference/Live, privacy, credits, and attribution boundaries exactly as audited.

### Should polish

- Reduce homepage feature overload and make the owned Discover continuation more legible.
- Consolidate future vocabulary for tools, Experiences, Campaigns, Stores, and Business.
- Improve post-result continuity from Face Analysis, Compare, and Style Explorer into the right merchant Experience.
- Prioritize Admin mobile information order and sales-demo scanability.

### Do not touch

- Do not replace the working Store/Campaign runtime with a new engine.
- Do not add ranking, personalization, AI generation, or a new analytics pipeline as part of IA work.
- Do not mix consumer credits into Merchant Experiences or Discover.
- Do not add a generic marketplace directory to Discover or Campaign routes.
- Do not start merchant self-service onboarding, CRM, commerce integrations, or Phase C implementation from this audit.

## Final Scope Confirmation

Product code changed = **No**
Real AI invoked = **No**
Credits purchased or payment submitted = **No**
Real shopper intent data created = **No**
Phase C started = **No**
