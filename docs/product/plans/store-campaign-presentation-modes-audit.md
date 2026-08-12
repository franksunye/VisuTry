# Phase D Pre-Audit — Store / Campaign Presentation Modes

**Status:** Audit complete · no implementation started  
**Audited:** 2026-08-12  
**Production:** `https://www.visutry.com`  
**Branch:** `codex/store-campaign-presentation-audit`

## Executive Verdict

**INTRODUCE LIMITED PRESENTATION MODES**

The production evidence supports three fixed presentation modes:

```text
ACTION_FIRST
PRODUCT_FIRST
EDITORIAL_FIRST
```

This is a presentation-layer problem, not a new shopper-runtime problem. The current runtime already has the required commerce path:

```text
Recommendation → Try-On → Compare → Favorite / Product Click → Intent
```

The recommended defaults are:

```text
STORE = PRODUCT_FIRST
CAMPAIGN = EDITORIAL_FIRST
Contextual / high-intent entry = ACTION_FIRST
```

This is worth a tightly bounded Phase D because it can improve merchant-facing product perception and sales-demo quality while reusing the current catalog, Experience, attribution, privacy, recommendation, Try-On, Compare, and intent contracts. It must remain three fixed templates, not a Page Builder.

## Audit method and evidence

The audit used the real production browser against the routes below. It covered:

- Desktop: `1440×900`
- Mobile: `390×844` and `430×932`
- Landing / first viewport
- Mid-page product and privacy composition
- Privacy gate and runtime entry
- Campaign → Store continuation
- DOM-visible headings, product cards, links, image loading, horizontal overflow, and browser console errors

The privacy gate was accepted only to inspect the safe runtime entry. No photo was uploaded, no recommendation or Try-On request was started, no Compare request was started, no payment was invoked, and no shopper intent was created. A result state therefore was not fabricated: the production runtime correctly requires a real photo before recommendation, Try-On, and Compare become available.

Evidence screenshots are local, outside the repository, and are not intended for commit:

```text
/tmp/visutry-phase-d-audit-WXwCmH/
```

Each evidence prefix has `-first.png`, `-mid.png`, and `-runtime.png` unless noted otherwise.

| Surface | Route | Viewport | Evidence prefix |
|---|---|---:|---|
| Discover context | `/en/discover` | 1440×900 | `desktop-discover-first.png` |
| Live Store · Luna Optical | `/en/store/luna-optical` | 1440×900 | `desktop-luna-store-*` |
| Reference Store · Framed EWE | `/en/store/framed-ewe` | 1440×900 | `desktop-framed-ewe-store-*` |
| ello · Petite Fit | `/en/c/ello-sunglasses/petite-fit?source=visutry&medium=internal&surface=discover&campaign=discover-featured` | 1440×900 | `desktop-ello-campaign-*` |
| AKILA · Statement Frames | `/en/c/akila/statement-frames?source=visutry&medium=internal&surface=discover&campaign=discover-featured` | 1440×900 | `desktop-akila-campaign-*` |
| Article One · Active Eyewear | `/en/c/article-one/active-eyewear?source=visutry&medium=internal&surface=discover&campaign=discover-featured` | 1440×900 | `desktop-article-one-campaign-*` |
| Framed EWE · Find Your Frames | `/en/c/framed-ewe/find-your-frames?source=visutry&medium=internal&surface=discover&campaign=discover-featured` | 1440×900 | `desktop-framed-ewe-campaign-*` |
| Luna Optical | `/en/store/luna-optical` | 390×844 | `mobile390-luna-store-*` |
| ello · Petite Fit | same Campaign route above | 390×844 | `mobile390-ello-campaign-*` |
| AKILA · Statement Frames | same Campaign route above | 390×844 | `mobile390-akila-campaign-*` |
| Framed EWE · Find Your Frames | same Campaign route above | 390×844 | `mobile390-framed-ewe-campaign-*` |
| Luna Optical | `/en/store/luna-optical` | 430×932 | `mobile430-luna-store-*` |
| ello · Petite Fit | same Campaign route above | 430×932 | `mobile430-ello-campaign-*` |
| AKILA · Statement Frames | same Campaign route above | 430×932 | `mobile430-akila-campaign-*` |
| Framed EWE · Find Your Frames | same Campaign route above | 430×932 | `mobile430-framed-ewe-campaign-*` |

All audited routes loaded without a production page error, horizontal overflow, or completed image-load failure. The final production browser console error check was empty.

## Why current pages feel tool-like

The issue is not simply a lack of visual richness. The production pages have product imagery, merchant identity, provenance, and campaign copy. They still feel tool-like for these concrete reasons:

1. **The privacy/upload workflow is the dominant first action.** The left side of the desktop layout and the top of the mobile layout are organized around `I understand — continue`, a three-step rail, and privacy disclosure. The shopper is asked to enter the tool before the catalog can become the main shopping surface.

2. **The current primary CTA is operational rather than commercial.** `I understand — continue` leads to `Upload your photo`; it does not express `Shop the edit`, `Explore the collection`, or `Try this frame`. This is correct for a high-intent handoff, but too dominant as the default Store/Campaign landing action.

3. **Product visibility exists, but product interaction is deferred.** The landing surface shows four featured frame tiles, but they are preview articles rather than a clear product-first entry. After the gate, the shared runtime lands on `Step 1 · Upload your photo`; recommendation cards, selection, Try-On, and Compare are later states.

4. **Store and Campaign share almost the same composition.** The visible distinction is mostly a small context label (`Curated collection` versus `The edit`), campaign name, and `Reference catalog` / `Live catalog` disclosure. Both then use the same three-step rail, privacy panel, generic hero treatment, and four-card preview. A campaign therefore reads as a themed tool skin, not a landing page with a story and merchandising hierarchy.

5. **The Experience content contract is under-expressed.** Production Experience records already contain `headline`, `description`, `heroAssetUrl`, CTA fields, selected frames, provenance, and attribution defaults. The shared shopper component primarily renders generic translation copy and Experience name; the configured headline/description/primary CTA are not the visual hero contract. The audited production records also have `heroAssetUrl = null`, so the hero block falls back to the same gradient/text visual for each context.

6. **The campaign story is one proposition plus one product strip.** ello, AKILA, Article One, and Framed EWE each communicate a useful premise—petite fit, statement style, active movement, or cross-brand comparison—but there is no second editorial block, visual story, or collection-specific CTA before the tool gate. The campaign-to-store link appears after the gate in the runtime continuation section.

7. **The shopper cannot reach a meaningful result state without entering the photo workflow.** This is a runtime safety and privacy boundary, not a defect. It means the landing layer must do more commerce and editorial work before the shopper decides whether to enter the AI flow.

## Production experience observations

| Experience | Current first impression | Sales-demo verdict |
|---|---|---|
| Luna Optical Store | Strong merchant identity, Live catalog, 16-frame count, four visible products, but upload/privacy remains the leading action. | **Borderline branded shopping experience:** a credible Store surface wrapped around an AI entry point. |
| Framed EWE Store | Multi-brand proposition and brand labels are visible, with Reference catalog disclosure; no deeper assortment story. | **Commerce surface with a tool-first center:** stronger than a generic demo, not yet a retailer merchandising page. |
| ello · Petite Fit | Clear fit-led premise and product subset; no fit story beyond the short description. | **An AI tool with a fit-themed catalog preview.** |
| AKILA · Statement Frames | The strongest campaign premise and most legible fashion positioning; four product images support the edit. | **Closest to a branded campaign, still tool-first because upload is the dominant CTA.** |
| Article One · Active Eyewear | “Designed for movement” is clear, but the page has no activity visual or editorial proof. | **An AI tool with technical/active copy.** |
| Framed EWE · Find Your Frames | Cross-brand purpose is clear and brand labels help comparison; it needs a retailer/editorial frame around the assortment. | **A useful comparison demo, not yet a branded shopping experience.** |

Reference provenance is already appropriately restrained. The audit observed `Reference Pilot · Simulation` and `Reference catalog`; it did not observe unsupported `Customer`, `Partner`, `Client`, `Trusted by`, or `Case Study` claims. That contract must remain unchanged.

## Store recommendation

### Current Store mode

`ACTION_FIRST` with a four-product merchandising preview.

The current Store is visually polished and the four-card catalog preview is useful, but the page hierarchy is still:

```text
Merchant identity → privacy gate → upload → recommendation → Try-On / Compare
                         ↘ four product preview
```

### Target Store mode

`PRODUCT_FIRST` by default.

The landing layer should first establish the merchant, catalog, and a small edited assortment. The AI workflow remains prominent, but becomes the next shopping action instead of the only meaningful action.

### Recommended Store presentation

- Keep the merchant mark, Live/Reference provenance, active frame count, and current four-card catalog component.
- Treat four frames as the default featured assortment: enough to show variety, still a clean desktop row and a 2×2 mobile grid.
- Use the existing ExperienceFrame ordering / selected catalog scope rather than adding a duplicate product list.
- Put a commerce-oriented landing CTA adjacent to the assortment, with the existing upload flow as the explicit Try-On path.
- Keep the privacy disclosure before photo upload; do not weaken or hide it.
- On mobile, keep two columns and avoid six-card default loading. A compact action can remain visible after the first product row; a new sticky runtime architecture is not required for the audit recommendation.

### Mobile presentation verdict

The current 390px and 430px layouts are structurally sound: no overflow, no broken images, and the four products become a readable 2×2 grid. The weakness is vertical order. Privacy and the upload workflow occupy the top of the page, while the product grid arrives after them. A Product-first Store should keep four products within the first meaningful scroll and move the primary Try-On action into a secondary but still visible position.

## Campaign recommendation

### Current Campaign mode

`EDITORIAL_FIRST` in naming, but `ACTION_FIRST` in hierarchy.

The campaigns have good headlines and focused product subsets, but the shared runtime makes the page feel like:

```text
Hero premise → privacy/upload gate → product preview → runtime
```

There is no real story section between proposition and tool entry, and the configured Experience description is not currently the main shopper-facing editorial copy.

### Target Campaign mode

`EDITORIAL_FIRST` by default.

The Campaign should sell the reason for the edit before asking for a photo:

```text
Hero / proposition → featured edit → shopping CTA → AI action → full Store continuation
```

This does not require a CMS, arbitrary blocks, or a second runtime. It requires the shared presentation layer to express existing Experience copy and selected frames with a distinct Campaign hierarchy.

### Recommended Campaign presentation

- Use the existing headline, description, hero asset when available, campaign name, and provenance disclosure.
- Default to four featured frames. For a campaign, four supports a 2×2 mobile edit and a strong desktop row without making the page feel like a catalog dump.
- Keep `I understand — continue` as the privacy/runtime action, but make it a secondary action to a campaign/product CTA on the landing layer.
- Keep `Visit the full Store` as a distinct continuation after gate/runtime and preserve all existing attribution query parameters.
- Do not invent testimonials, customer proof, partner claims, or unsupported campaign facts.

### Mobile presentation verdict

At 390px and 430px, the Campaign headline and description remain legible, and the four-card section is a workable 2×2 grid. The page is approximately 1.25–1.35k CSS pixels tall before the runtime can progress, so a six-product or long-story treatment would add scroll fatigue. The recommended mobile Campaign is a compressed editorial hero, four products, one clear shopping CTA, then the privacy/runtime action. `Try this frame` can be a product-level action only if it reuses the existing session path; it must not create a new AI or attribution path.

## Presentation mode evaluation

| Mode | Best use case | Store fit | Campaign fit | Mobile fit | Complexity | Reuse potential | Risk |
|---|---|---|---|---|---|---|---|
| `ACTION_FIRST` | Face Analysis / Compare handoff, QR, retargeting, direct Try-On traffic | Medium for a high-intent Store link | Low as a default | High | Low | High | Preserves the current “AI tool” impression if used everywhere |
| `PRODUCT_FIRST` | Hosted Store, known merchant/catalog traffic, evergreen assortment | High | Medium | High with 4 products / 2 columns | Low–medium | High | Product cards must remain honest and not imply recommendation before photo input |
| `EDITORIAL_FIRST` | Focused Campaign, seasonal or fit/style/occasion edit | Medium | High | Medium–high with compressed hero and 4 products | Medium | High if fixed sections use existing fields | Too much story can delay the action or create unsupported marketing claims |

### Do we need exactly 3 modes?

**Yes, exactly 3 fixed modes are justified.**

The evidence shows two different default needs—Store merchandising and Campaign proposition—plus a real contextual need for high-intent direct entry. A fourth mode would add naming and testing cost without a demonstrated production case. These modes should be a presentation resolver and a small number of fixed templates, not merchant-authored layouts.

## Product presentation options

| Option | Desktop suitability | Mobile suitability | Store suitability | Campaign suitability | Visual density | Implementation complexity | Verdict |
|---|---|---|---|---|---|---|---|
| Hero + 3 products | Clean and premium; leaves whitespace | Very comfortable; one row plus a partial/second row | Good for a tightly edited Store | Good for a narrow Campaign | Low | Low | Good optional compact treatment, not the default evidence-supported count |
| Hero + 4-product grid | Strong balance; four frames read as a real edit | Strong 2×2 grid at 390/430px | Best default | Best default | Medium | Low–medium | **Recommended default** |
| Hero + 6 products | More assortment proof on desktop | Long page and more scroll fatigue on mobile | Possible for a catalog destination | Weak for a focused Campaign | High | Medium | Do not make the default |
| Hero only + direct action | Fastest AI conversion path | Fastest high-intent path | Appropriate only for contextual entry | Too thin for Campaign | Low | Low | Preserve as `ACTION_FIRST`, not as the public default |

## Presentation Layer vs Shopper Runtime

### Presentation Layer — in scope for a future Phase D

- Hero structure, campaign copy, and hero asset treatment
- Featured product count and ordering using existing selected frames
- Editorial/product sections and CTA placement
- Store versus Campaign hierarchy
- Landing-level product-first or editorial-first entry
- Mobile grid and compact action placement
- Provenance badge/disclosure placement, without changing its meaning

### Shopper Runtime — explicitly out of scope

- Photo upload and temporary photo retention
- Face analysis / recommendation
- Frame selection and session creation
- Try-On submission, polling, and result delivery
- Compare task and result presentation
- Favorite, Product Click, Inquiry, or other intent capture
- Merchant session attribution and first-touch behavior
- Credits, AI providers, ranking, personalization, or analytics architecture

Presentation mode must not change:

```text
source
medium
surface
campaign
merchantSessionId
first-touch
```

The Campaign → Store continuation observed in production already preserves the expected handoff parameters, for example:

```text
/en/store/akila?source=visutry&medium=internal&campaign=discover-featured&surface=discover
```

## Configuration and data-contract audit

### Already exists

- `Experience.type`: `STORE` or `CAMPAIGN`
- `Experience.slug`, `name`, `headline`, `description`
- `Experience.heroAssetUrl`
- Primary and secondary CTA type, label, and URL fields
- Offer fields
- Experience-selected catalog frames with `sortOrder`
- `referenceData`, merchant provenance, and compact reference metadata
- `defaultSource` and `defaultCampaign`
- Merchant identity, logo, accent color, catalog frame image, name, shape, color, and explicit product brand
- Existing `ExperienceFrame` join that keeps selected products within the merchant boundary

The production records audited for ello, AKILA, Article One, and Framed EWE already have focused headlines, descriptions, selected frame counts, and provenance. Their current `heroAssetUrl` values are null, and their primary CTA metadata is `PRODUCT_OR_COLLECTION / View frame`, but that CTA is not currently the landing hero CTA.

### Missing from the current presentation expression

- A presentation-mode resolver that distinguishes Store, Campaign, and contextual entry
- Shopper rendering of the configured Experience headline and description as the main hero contract
- Shopper rendering of an approved Experience hero asset when available
- A landing-layer mapping from existing CTA metadata to product-first/editorial-first action hierarchy
- A clear fixed-template rule for featured product count and mobile layout

### Optional, only if derived defaults prove insufficient

- One nullable `presentationMode` override on the Experience configuration, constrained to the three fixed modes
- A small presentation resolver that derives defaults from `Experience.type` and existing contextual acquisition/handoff data before introducing an override

The first implementation should try derived defaults:

```text
CAMPAIGN → EDITORIAL_FIRST
STORE → PRODUCT_FIRST
known high-intent/contextual handoff → ACTION_FIRST
```

This means a schema change is **not required to validate the model or ship the first fixed pass**. If merchant-specific override becomes necessary after sales validation, a single constrained field is preferable to a new content system.

### Do not add

- `sections[]`, `blocks[]`, layout JSON, or arbitrary component definitions
- Merchant-defined WYSIWYG or drag/drop layouts
- Duplicate `featuredProducts[]` data when `ExperienceFrame.sortOrder` already provides selected ordering
- New ranking, personalization, AI-generated merchandising, or analytics pipelines
- Merchant slug switches, brand maps, or merchant-specific React forks
- Any new consumer-credit behavior

## Component reuse map

### Can reuse directly

| Existing component / contract | Future role |
|---|---|
| `StoreShopperExperience` | Shared shell and runtime boundary; retain session, privacy, recommendation, Try-On, Compare, and continuation behavior |
| `MerchantMark` inside `StoreShopperExperience` | Merchant identity header for all three modes |
| Existing featured frame tile markup | Four-product Store/Campaign merchandising unit |
| `ExperienceFrame.sortOrder` and selected catalog resolution | Featured product ordering and scope |
| `StoreTryOnComparePanel` | Runtime result / Try-On / Compare state after recommendation |
| `JourneyStep` | Runtime progress rail after the shopper enters the tool |
| `ImageUpload` | Runtime photo entry |
| `StoreLandingAnalytics` | Existing landing instrumentation, unchanged |
| `getPublicMerchantProfile` / Experience repository mapping | Existing data contract source; no parallel presentation data model |

### Can reuse with minor adaptation

| Existing component / contract | Adaptation boundary |
|---|---|
| `StoreMarketingVisual` | Reuse its image/error/fallback treatment for a fixed editorial hero only if the shopper hero needs the same safe asset handling; do not turn it into a layout builder |
| Discover Experience cards | Reuse visual language and provenance treatment for a landing edit, but keep shopper CTA semantics separate |
| Existing primary/secondary CTA fields | Map approved CTA types to fixed mode actions; do not create arbitrary links |
| Existing campaign continuation section | Keep as the fixed Campaign → Store bridge after runtime entry |

### Should not reuse or expand

- Admin Experience configuration UI as a Page Builder
- Analytics or AI components as presentation controls
- Generic marketing blocks that bypass merchant/catalog provenance
- Any component that duplicates product truth or merchant identity

## Mobile guidance

The production layouts pass the basic mobile integrity checks at 390×844 and 430×932: no horizontal overflow, no completed image failures, and readable two-column product grids. The recommended fixed rules are:

- Four featured products by default, two columns on mobile.
- Campaign hero copy compressed to one premise plus one short description.
- No six-product default on mobile.
- Keep privacy disclosure visible before photo upload; do not hide it behind a marketing mode.
- For `PRODUCT_FIRST`, show the first product row before or adjacent to the main Try-On entry.
- For `EDITORIAL_FIRST`, show hero → four-product edit → shopping CTA → privacy/runtime entry.
- For `ACTION_FIRST`, keep the current direct upload hierarchy and do not force a merchandising detour.
- Treat sticky mobile action as optional polish only; it is not required to validate the three-mode model.

## Sales-demo view

For an Eyewear Brand Founder, Head of Ecommerce, Digital Marketing Director, or Retail Innovation Lead:

- Luna currently communicates a credible branded Store, but the first question it answers is “How do I start the AI?” rather than “What collection am I shopping?”
- AKILA is the strongest current Campaign because its statement-frame proposition is immediately legible and its product imagery supports the premise.
- ello has a useful fit-led entry but needs a stronger product-first fit edit before it reads as a commerce experience.
- Article One has a clear technical/active premise but needs a visual or merchandising cue for movement.
- Framed EWE demonstrates multi-brand comparison well, but needs a clearer retailer/editorial frame to feel like a branded destination.

The overall current answer is: **“This is an AI tool with a branded catalog surface.”** The target after a bounded Phase D presentation pass is: **“This is a branded shopping experience that includes an AI tool.”**

## Reference / Live contract

Keep the current provenance language and hierarchy:

```text
Reference catalog
Live catalog
Reference Pilot · Simulation
```

Presentation modes must not weaken provenance or replace it with unsupported customer, partner, client, trust, or case-study language.

## Recommended Phase D scope

### Must build

- A shared, fixed three-mode presentation resolver with derived defaults.
- `PRODUCT_FIRST` Store landing composition using the existing four featured frame tiles.
- `EDITORIAL_FIRST` Campaign landing composition using existing headline, description, hero asset when present, selected frames, and provenance.
- Preserve `ACTION_FIRST` for contextual/high-intent entries.
- Render existing Experience content fields in the shopper presentation layer.
- Preserve the existing privacy gate, runtime state machine, attribution query parameters, merchant session boundary, and Campaign → Store continuation.
- Add visual regression coverage at desktop, 390px, and 430px for the three modes.

### Nice to have

- Curate approved hero assets for the strongest sales-demo Campaigns.
- Tune four featured-frame ordering per Experience using existing `sortOrder`.
- Add a compact mobile action treatment after the first product row if the fixed layout needs it.

### Do not build

- Page Builder, sections/blocks JSON, drag/drop, WYSIWYG, or arbitrary merchant components.
- New schema for product truth, brand identity, attribution, analytics, or AI.
- New recommendation, ranking, personalization, or AI-generated merchandising system.
- Consumer Credits in Merchant Experiences.
- Merchant-specific React forks, slug switches, or hardcoded brand maps.
- A fourth presentation mode without a demonstrated production use case.

## Acceptance criteria answers

1. **Why do current Store/Campaign pages feel like a tool?** The upload/privacy workflow is the dominant hierarchy; product cards are passive previews; Store and Campaign share one template; existing Experience content and CTA fields are under-expressed; Campaign lacks a story layer.
2. **Should Store be Product-first?** Yes, by default, with four featured frames and the existing AI action retained as the next step.
3. **Should Campaign be Editorial-first?** Yes, by default, using the existing headline/description/hero/selected frames and a fixed editorial composition.
4. **Should ACTION_FIRST be retained?** Yes, for contextual/high-intent handoffs such as Face Analysis, Compare, QR, retargeting, and direct Try-On traffic.
5. **Do we need exactly three modes?** Yes. Three are justified; a fourth is not.
6. **How many frames should the first presentation show?** Four by default. Three is a valid compact option; six is not the default.
7. **What is the mobile recommendation?** Four products in a 2×2 grid, compressed hero copy, no six-card default, privacy remains explicit, and the action stays close to the product edit.
8. **How much can be reused?** Most of the shopper shell, merchant identity, featured frame tiles, Experience selection/order, provenance, CTA data, and runtime can be reused directly; only presentation composition and field mapping need adaptation.
9. **Is a schema change required?** No for the first derived-default pass. An optional single constrained mode override can be considered later; no Page Builder schema is justified.
10. **Will this affect attribution or runtime?** It should not. `source`, `medium`, `surface`, `campaign`, `merchantSessionId`, first-touch, privacy, AI, Try-On, Compare, and intent contracts remain unchanged.
11. **Is this worth Phase D?** Yes, provided the phase stays limited to three fixed presentation templates and existing Experience/config data.

## Audit completion guardrails

```text
product code changed = No
schema changed = No
template enum added = No
runtime changed = No
attribution changed = No
AI invoked = No
payment invoked = No
shopper intent created = No
Admin changed = No
Page Builder started = No
Phase D implementation started = No
```

The next action after this audit is a review decision on the bounded Phase D scope. Do not implement Presentation Modes in this audit PR.
