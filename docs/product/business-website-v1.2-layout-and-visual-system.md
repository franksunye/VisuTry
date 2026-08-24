# VisuTry Business Website v1.2 — Layout & Visual System

Status: **Implemented and production-verified v1.2 baseline**
Last reconciled: **2026-08-24**

Purpose: evolve the current Business Website from a clean SaaS-style first release into a more brand- and agency-ready B2B experience, while preserving the proven IA, copy baseline, responsive system, and commercial logic.

Implementation evidence: all seven visual asset IDs are mapped to production
assets, PR #121 shipped the v1.2 integration, and PR #125 closed the current
Business browser contract after rebasing onto the latest production fixes.

This document defines the **page layout first** and the **visual asset slots second**. Product screenshots and marketing imagery are intentionally treated as replaceable assets with stable IDs so implementation can proceed before final asset production.

---

## 1. v1.2 Design Objective

Target audience:

- eyewear brands
- premium / fashion / lifestyle brands
- ecommerce and digital teams
- advertising agencies
- 4A agencies
- commerce innovation teams

Target qualities:

- concise
- elegant
- professional
- premium
- editorial
- restrained
- product-authentic
- credible in a brand/agency presentation

Do not redesign the product into a different visual identity. v1.2 should **evolve** the current system.

Keep:

- white / pearl / light cool-neutral foundation
- restrained sapphire-blue accent
- strong typography hierarchy
- generous spacing
- current navigation IA
- current Business copy and claims boundaries
- current responsive behavior as baseline

Reduce:

- generic SaaS card grids
- repeated rounded-card compositions
- architecture diagrams that feel like internal product diagrams
- raw screenshots pasted into frames
- decorative gradients without product evidence

Increase:

- editorial composition
- eyewear materiality
- product close-ups
- asymmetric layouts
- real UI evidence
- page-specific visual personality
- meaningful negative space

---

## 2. Global Page Composition Rules

### Desktop

- Maximum content width: approximately 1200–1280px.
- Hero should generally occupy 75–90vh at 1440×900, without forcing every page into the same 50/50 template.
- Use asymmetry intentionally. Avoid identical left-copy/right-card composition on every page.
- One dominant visual focal point per viewport.
- Prefer one large visual + one supporting proof element over six equal cards.

### Tablet

- Collapse product visuals below copy before horizontal crowding appears.
- Header should collapse early enough that `Commerce Intelligence` never causes compression.
- Hero asset may become full-width below text.

### Mobile

- Keep copy concise above the fold.
- Use one primary CTA before secondary proof.
- Marketing assets should use dedicated mobile crops where necessary rather than shrinking desktop composites.
- Avoid showing dense dashboards at unreadable scale.

---

## 3. Visual Asset Registry

All Business marketing visuals must use stable IDs.

| Asset ID | Name | Primary Use | Preferred Ratio | Source Requirement | Production Mode |
|---|---|---|---|---|---|
| `B2B-VIS-01` | Business Hero Master Visual | Homepage | 16:10 desktop / 4:5 mobile | Can be art-directed independently, but must not invent product UI | Direct generation / composition |
| `B2B-VIS-02` | Platform / Catalog-to-Experience Visual | Platform | 16:10 | Can be designed from product architecture + real catalog concepts | Direct generation / HTML/marketing composition |
| `B2B-VIS-03` | Real Store Experience | Homepage + Store | 16:10 / 4:3 | **Must use current real Store UI** | Screenshot capture → marketing treatment |
| `B2B-VIS-04` | Campaign Experience | Campaigns | 16:10 | **Must use current real Campaign UI** | Screenshot capture → marketing treatment |
| `B2B-VIS-05` | Merchant Workspace | Platform + Pilot / integrations | 16:10 | **Must use current real Merchant Workspace UI** | Screenshot capture → marketing treatment |
| `B2B-VIS-06` | Commerce Intelligence | Commerce Intelligence | 16:10 | **Must use current approved insights / real UI** | Screenshot capture → marketing treatment |
| `B2B-VIS-07` | Reference Experience Set | Examples | 4:3 cards | **Must use current reference routes** | Screenshot capture → unified thumbnail treatment |

### Asset rules

Any asset that looks like product UI must be traceable to a current product surface.

Allowed:

- cropping
- reframing
- selective zoom
- visual hierarchy improvements
- background cleanup
- combining two or three true UI crops
- restrained labels / callouts

Forbidden:

- fake metrics
- fake merchant/customer relationships
- unsupported fit scores
- invented controls
- invented video modes
- fake revenue attribution
- fake Shopify sync
- fake checkout behavior
- UI modules that do not exist

---

# 4. Page Layout Specifications

## 4.1 `/business` — Business Overview

### Job

Create a premium first impression for brands and agencies and explain the full commerce proposition without feeling like a generic SaaS homepage.

### Hero layout

**Editorial split, not equal columns.**

Left 42–46%:

- eyebrow: AI Commerce for Eyewear
- H1
- short supporting paragraph
- primary CTA: Start a Pilot
- secondary CTA: Explore Store
- microcopy

Right / lower-right 54–58%:

- `[B2B-VIS-01] Business Hero Master Visual`
- large visual, minimal chrome
- visual should feel eyewear-commerce-first, not dashboard-first

### Section 1 — Decision Journey

Replace generic five-card grid with a **horizontal editorial sequence**:

`Discover / Recommend → Try-On → Compare → Continue`

- 4 stages, compact
- one highlighted shopper decision moment
- use typography and thin connectors instead of four equal SaaS cards

### Section 2 — Store + Campaigns

Two large asymmetric modules:

- Store = persistent experience
- Campaigns = focused experience

Store module includes preview slot:

- `[B2B-VIS-03]` supporting crop

Campaign module may use a small visual crop from `[B2B-VIS-04]` when available.

### Section 3 — Merchant Operating Model

Use `[B2B-VIS-05]` as the primary proof.

Copy should explain that merchant setup, Store, Campaigns, and insights are operated from one workspace.

### Section 4 — Commerce Intelligence

Short dark or high-contrast band.

- one strong sentence
- 3 observable signals max
- link to Commerce Intelligence
- no generic six-card analytics grid

### Section 5 — Pilot

Compact commercial close:

- `$149 / 30 days`
- 8–50 reviewed frames
- one Store or Campaign Experience
- Start a Pilot

Do not repeat full Pricing page detail.

---

## 4.2 `/business/platform` — Platform

### Job

Explain the system model clearly to digital / commerce / agency stakeholders while staying visually elegant.

### Hero layout

Left:

- eyebrow
- H1
- supporting copy
- CTAs

Right:

- `[B2B-VIS-02] Platform / Catalog-to-Experience Visual`

This should **not** look like a generic internal architecture card.

Desired visual model:

`Merchant Catalog → Store / Campaign → Recommendation / Try-On / Compare → Product Handoff → Intelligence`

Use a refined editorial system diagram with product imagery or real-product cues.

### Section 1 — One catalog, multiple experiences

Use a wide process band instead of 7 equal step cards.

### Section 2 — Catalog Foundation

Split layout:

- concise copy
- real catalog / frame data crop if available from Merchant UI

No asset slot required yet; can use HTML layout.

### Section 3 — Shared Decision Runtime

Use Store / Try-On real UI evidence from `[B2B-VIS-03]` rather than legacy screenshot.

### Section 4 — Experience Model

Three editorial columns:

- Store
- Campaigns
- Commerce Intelligence

Keep very light card treatment or border-only treatment.

### Section 5 — Merchant Workspace

Use `[B2B-VIS-05]` full-width or 60/40 split.

---

## 4.3 `/business/store` — Store

### Job

This is the most concrete product page. It should be the strongest product-truth page on the site.

### Hero layout

Avoid generic left text / right framed screenshot.

Use:

- H1 and copy in a narrower top-left editorial block
- `[B2B-VIS-03] Real Store Experience` as the dominant visual spanning the width below / to the right
- visual should occupy more area than copy

### Section 1 — What the Store does

Use **3 grouped outcomes**, not 6 equal cards:

1. Guide discovery
2. Help shoppers evaluate
3. Return intent to commerce

Each can contain 2–3 capabilities as small labels.

### Section 2 — Shopper Journey

Visual sequence:

`Enter Store → Select / Recommend → Try-On → Compare → Product / Inquiry`

This can be implemented in HTML; real UI crops from `[B2B-VIS-03]` can support stages later.

### Section 3 — Beyond VTO

Large editorial statement:

> Virtual Try-On shows a frame. VisuTry helps shoppers decide which frame to try.

Pair with one crop from `[B2B-VIS-03]` or real Try-On/Compare source.

### Section 4 — Product Proof

Use real current Store route / approved demo.

No Luna live-deployment claims.

---

## 4.4 `/business/campaigns` — Campaigns

### Job

Speak directly to brand, media, ecommerce, and agency teams.

### Hero layout

Copy left / top:

- campaign traffic → focused shopping journey

Dominant visual:

- `[B2B-VIS-04] Campaign Experience`

Include a **small supporting traffic strip**, not a large SaaS flow diagram:

`Search / Social / Email / QR → Campaign`

The real Campaign experience should be the main evidence.

### Section 1 — Why Campaign Experiences

Use 4 editorial use cases:

- collection launch
- paid acquisition
- creator/editorial traffic
- fit/style intent

Prefer large typography blocks over icon cards.

### Section 2 — One catalog, many contexts

Show one catalog feeding multiple campaign contexts.

Can be HTML / CSS visual.

### Section 3 — Product Journey

Use a crop / alternate composition from `[B2B-VIS-04]`.

### Section 4 — Measurement

Concise; link to Commerce Intelligence.

### Section 5 — Reference Campaign

Use `[B2B-VIS-07]` thumbnail / real route proof.

---

## 4.5 `/business/commerce-intelligence` — Commerce Intelligence

### Job

Explain observable shopper intent credibly, without pretending VisuTry is a mature BI suite or revenue-attribution platform.

### Hero layout

Use darker / stronger contrast than other Business pages.

Left:

- eyebrow
- H1
- short copy

Right / full-width lower visual:

- `[B2B-VIS-06] Commerce Intelligence`

The visual must be product-authentic.

### Section 1 — Observable Intent

Use 4 signal groups max:

- Recommendation
- Try-On / Compare
- Product interest / favorite / inquiry
- Product handoff / source context

Avoid 6 repeated cards if possible.

### Section 2 — Experience Context

Explain Store vs Campaign behavior comparison.

### Section 3 — Evidence Boundary

Keep explicit:

- intent ≠ revenue guarantee
- revenue attribution requires order/commerce integration

Use compact note treatment, not a large warning block.

---

## 4.6 `/business/pricing` — Pricing

### Job

Present the Founding Merchant Pilot as a focused B2B engagement, not a generic SaaS pricing-table page.

### Hero layout

Editorial commercial composition:

Left:

- H1
- description

Right:

- `$149`
- `/ 30 days`
- 3–4 included items

Keep current pricing visual concept, but make it feel more like a **pilot engagement card** than a subscription tier card.

No external asset required.

### Section 1 — What is included

Split into:

- Catalog & Experience
- Capacity
- Assisted launch & review

Avoid 6 equal feature cards.

### Section 2 — After the Pilot

Two-column editorial copy:

- no automatic commitment
- continuation discussed separately

### Section 3 — CTA

Start a Pilot.

---

## 4.7 `/business/examples` — Examples

### Job

Provide strong visual product proof without implying false customer relationships.

### Hero

Shorter hero than other pages.

- Product Proof eyebrow
- H1
- one paragraph

### Main content

Use `[B2B-VIS-07] Reference Experience Set`.

Preferred layout:

- one larger featured experience
- four supporting 4:3 thumbnails

Each tile must clearly label:

- Reference Experience
- simulation based on public catalog information

Avoid a text-only card grid.

### Store Product Preview

Use supporting crop from `[B2B-VIS-03]` if useful.

---

## 4.8 `/business/integrations` — Integrations & Deployment

### Job

Explain practical deployment to technical/ecommerce stakeholders without claiming integrations that are not GA.

### Hero

More restrained than Homepage.

Use a process-led composition rather than a screenshot-heavy hero.

### Section 1 — Current Pilot Path

Replace six equal step cards with a single horizontal process:

`Catalog Review → Configure → Hosted Launch → Product Handoff → Intent Review`

### Section 2 — Merchant Workspace Proof

Use `[B2B-VIS-05]` crop.

### Section 3 — Current vs Future

Two-column:

**Current**
- hosted Store / Campaign
- reviewed product data
- product / inquiry handoff

**Direction**
- deeper commerce sync
- API / agent traffic

Clearly distinguish current capability from direction.

---

## 4.9 `/business/pilot` — Pilot

### Job

Make the manual Pilot process feel deliberate, premium, and low-risk.

### Hero

Keep text-led.

- H1
- short explanation
- primary CTA
- pricing link

No large decorative screenshot in hero.

### Section 1 — What to Send

Use four concise information blocks, but reduce heavy card styling.

### Section 2 — How the Pilot Starts

Large visual process:

`Request → Scope Review → Confirmation → Launch & Review`

### Section 3 — Merchant Workspace / Setup Proof

Use `[B2B-VIS-05]` supporting crop to prove the operating model.

### Section 4 — 30-day Scope

Compact commercial summary.

---

# 5. Asset-to-Page Mapping

| Asset | Homepage | Platform | Store | Campaigns | Intelligence | Pricing | Examples | Integrations | Pilot |
|---|---|---|---|---|---|---|---|---|---|
| `B2B-VIS-01` | Primary Hero | — | — | — | — | — | — | — | — |
| `B2B-VIS-02` | — | Primary Hero | — | — | — | — | — | — | — |
| `B2B-VIS-03` | Product proof | Supporting | Primary Hero | — | — | — | Supporting | — | — |
| `B2B-VIS-04` | Supporting | — | — | Primary Hero | — | — | Supporting | — | — |
| `B2B-VIS-05` | Operating proof | Supporting | — | — | — | — | — | Supporting | Supporting |
| `B2B-VIS-06` | Small proof/link | — | — | Small proof/link | Primary Hero | — | — | — | — |
| `B2B-VIS-07` | — | — | — | Reference proof | — | — | Primary | — | — |

---

# 6. Placeholder Implementation Standard

Before final assets exist, use a dedicated development placeholder component rather than legacy marketing screenshots.

Placeholder display should contain only:

- asset ID
- asset name
- required ratio
- source status: `DIRECT`, `NEEDS STORE CAPTURE`, `NEEDS CAMPAIGN CAPTURE`, `NEEDS MERCHANT CAPTURE`, `NEEDS INSIGHTS CAPTURE`, `NEEDS REFERENCE CAPTURES`

Example:

```text
B2B-VIS-03
REAL STORE EXPERIENCE
16:10
NEEDS CURRENT STORE CAPTURE
```

Production note:

**Do not expose unfinished asset placeholders on the public production site.** Implement layout changes behind a development branch / preview deployment until the required hero asset for each affected page is available.

---

# 7. Asset Production Order

Recommended sequence:

1. `B2B-VIS-03` Real Store Experience
2. `B2B-VIS-04` Campaign Experience
3. `B2B-VIS-05` Merchant Workspace
4. `B2B-VIS-06` Commerce Intelligence
5. `B2B-VIS-01` Business Hero Master Visual
6. `B2B-VIS-02` Platform / Catalog-to-Experience Visual
7. `B2B-VIS-07` Reference Experience Set

Reason:

The first four assets depend most strongly on real current product UI and establish the visual truth system. Once those are approved, the more art-directed Hero and Platform visuals can inherit the same visual language instead of defining it prematurely.

---

# 8. Implementation Sequence

### Phase A — Layout branch / preview

1. Preserve current IA and copy baseline.
2. Refactor Business page rendering to support page-specific compositions instead of one universal template.
3. Add visual placeholder slots using the stable IDs above.
4. Remove reliance on legacy Luna marketing assets from the v1.2 preview implementation.
5. Deploy Preview only.
6. Validate at 1440, 1280, 768, 390 widths.

### Phase B — Real UI capture

For every `NEEDS ... CAPTURE` asset:

- Codex/browser captures current UI source
- source screenshot is reviewed for truth
- no product/UI invention

### Phase C — Marketing visual production

- transform current UI capture into editorial B2B marketing material
- preserve product truth
- generate desktop and mobile crops where necessary

### Phase D — Asset integration + production QA

- replace placeholder IDs with final assets
- responsive visual QA
- brand/4A visual QA
- product-truth QA
- production deployment

---

# 9. Definition of Done

v1.2 is complete when:

- all nine Business pages have intentionally differentiated layouts
- no page relies on legacy Luna product-concept assets
- every UI-looking marketing visual is traceable to current product UI
- Homepage, Store, Campaigns, and Commerce Intelligence each have a distinct visual identity
- Examples is visual rather than primarily text-card based
- no fake metrics or unsupported UI claims are present
- 1440 / 1280 / 768 / 390 layouts pass
- a brand or agency reviewer can understand both the commerce story and the real product evidence without logging in
