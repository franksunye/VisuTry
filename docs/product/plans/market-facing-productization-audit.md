# VisuTry Market-Facing Productization Audit

**Status:** Phase 0 audit complete — planning baseline only
**Audit date:** 2026-08-12
**Audited surface:** `https://www.visutry.com` production deployment, repository at `main` (`7c2bff4`)
**Owner:** Product / Design / Growth / Engineering
**Related:** `docs/product/specs/merchant-experience-architecture.md`, `docs/product/plans/pilot-delivery-factory-plan.md`, `docs/product/specs/pilot-delivery-kit-spec.md`

> This document is the implementation baseline for the Market-Facing Productization phase. It records page-level decisions and distribution work. It does not implement UI, add routes, add analytics pipelines, or change merchant data.

## 1. Executive summary

VisuTry has a credible shared commerce runtime: Merchant → Catalog → Experience is implemented, Store and Campaign share the shopper flow, the six configured merchants are visible in Admin, and the core intent funnel already records sessions, recommendations, Try-Ons, Compare, Favorites, Product Clicks, and Inquiries.

The product is not yet brand-ready for external eyewear or fashion marketing teams. The main gap is not basic functionality. It is the distance between a working technical demo and a coherent market-facing system:

1. The 2C site is organized as a collection of AI tools. There is no internal discovery layer that naturally routes a shopper from an existing VisuTry intent to a merchant Experience.
2. Store and Campaign have a good shared visual baseline, but the runtime is materially the same for every merchant. Current differentiation is mostly name, headline, catalog, and accent; logo, hero treatment, editorial copy, and campaign mood are not expressed strongly enough.
3. The shopper decision path is understandable, but recommendation and Try-On states still expose implementation language (`AI edit`, ranking version, technical disclaimers) and do not consistently make product destination, shortlist, Compare, and next action feel like one commerce decision.
4. Admin is a useful internal intelligence surface, but it still reads as an engineering dashboard: technical route labels, repeated provenance warnings, `No date`, `Legacy / Unassigned`, zero-data cards, and limited comparison between Experiences.
5. `/en/store` is a reasonable B2B landing page, but it is still embedded in the 2C information architecture and is a single page rather than a business narrative with a clear MVP site map.
6. Attribution foundations exist, but internal VisuTry distribution is not a first-class acquisition surface. `source`, `medium`, `campaign`, `referrer`, `landingUrl`, `merchantId`, and `experienceId` are available across parts of the flow; an explicit internal `surface` contract and handoff instrumentation are missing.

### Quality verdict

| Surface | Verdict | Reason |
| --- | --- | --- |
| Consumer homepage | NEEDS POLISH | Clear, responsive, and credible for a consumer AI tool; not yet a premium eyewear discovery destination and contains no merchant discovery path. |
| Face Analysis | NEEDS POLISH | Good editorial marketing shell and recommendation narrative; the result-to-merchant bridge is absent from the audited path. |
| Try-On | NEEDS POLISH | Clear product-photo workflow and honest limitations; still generic, account/credit-oriented, and disconnected from merchant catalog journeys. |
| Compare | NEEDS POLISH | Strong preset comparison proposition; product commerce identity and merchant continuation are missing. |
| Style Explorer | NEEDS POLISH | Strongest fashion/editorial potential; auth gate and no merchant/brand continuation make it a separate island. |
| Pricing | NEEDS POLISH | Information is complete but feels like a utility pricing page, not part of a premium product narrative. |
| Dashboard / History | NOT BRAND-READY | Anonymous production state exposes only a heading with no professional sign-in or empty-state explanation; authenticated content was not inferred from that state. |
| Merchant Store | NEEDS POLISH | Best current shopper visual baseline, especially on mobile; shared shell, disclosure density, and weak campaign-specific expression limit market readiness. |
| Merchant Campaign | NEEDS POLISH | Campaign headline and selected catalog are present; Store/Campaign visual distinction is too small and the pre-upload state is still generic. |
| Admin portfolio / overview | NEEDS POLISH | Strong structural foundation and meaningful funnel language; technical terminology, zero-data treatment, and lack of Experience comparison reduce sales-demo credibility. |
| Admin Experiences / detail | NEEDS POLISH | Correct architecture and safe editing controls; too much control-plane language and not enough marketing-performance interpretation. |
| `/en/store` B2B landing | NEEDS POLISH | Reusable story and lead capture exist; no `/business` IA, proof taxonomy, or clear separation from the 2C site. |

### Scope conclusion

The first implementation should be **A1 Shopper Experience visual hardening**, with a deliberately small shared-runtime pass plus content/config cleanup. It should make one Store and one Campaign feel ready to show to a marketing director before expanding distribution or building `/business`.

## 2. Audit basis and constraints

### Guiding-plan check

The requested file `docs/product/plans/market-facing-productization-plan.md` is not present in the repository at audit time. The audit therefore used the available architecture baseline and delivery documents listed above, plus the task brief. This is recorded as a documentation gap; it is not a reason to invent a second product direction.

The available documents consistently establish:

- Merchant owns identity and catalog.
- Store and Campaign are sibling Experiences.
- Experiences select from a merchant-owned catalog.
- The runtime is shared across recommendation, Try-On, Compare, privacy, usage, intent, and attribution.
- Reference work must be labeled as simulation/reference data and must not imply a customer, partner, or case study.
- The next phase is productization and repeatable delivery, not a generalized Campaign Builder or merchant-specific React forks.

### Audit method

- Read the product architecture, pilot factory, pilot kit, and related sales-readiness material.
- Inspected the real Next.js routes, components, analytics contracts, Store session acquisition, and Admin pages.
- Used the already authenticated Chrome session for production Admin and public Store/Campaign surfaces.
- Captured deterministic seeded/pre-existing page states only. No new AI face analysis or Try-On generation was triggered.
- Evaluated visual quality against a brand-facing bar: would an eyewear marketing director willingly send this page to a colleague or executive?

## 3. Current product map

### Consumer / 2C

| Surface | Route | Current role | Audit note |
| --- | --- | --- | --- |
| Homepage | `/en` | Consumer entry and tool workflow | Clear four-step path: Detector → Advisor → Try-On → Compare. No Discover or merchant Experience entry. |
| Face Shape Detector | `/en/face-shape-detector` | Free, on-device first step | Natural fit for intent-based merchant distribution after completion. |
| Face Analysis / Glasses Advisor | `/en/face-analysis` | Paid/deeper recommendation report | Strongest existing semantic bridge to “which frames suit me”; no merchant Experience handoff observed. |
| Try-On | `/en/try-on/glasses` | Upload portrait + product image | Generic VisuTry product flow; not merchant catalog aware. |
| Compare | `/en/try-on/glasses/compare` | Preset-frame comparison | Good comparison proposition; no product URL or merchant continuation. |
| Style Explorer | `/en/style-explorer` | Fashion/style exploration | Editorial potential, but auth-gated and disconnected from merchant catalog. |
| Pricing | `/en/pricing` | Credits and subscription plans | Consumer utility page; no business plan separation. |
| Dashboard | `/en/dashboard` | Authenticated history/home | Anonymous production visit showed only `Dashboard` and footer, without an explicit sign-in or empty-state explanation. |
| History | `/en/dashboard/history` | Authenticated Try-On history | Anonymous production visit showed heading plus footer only. |
| Existing SEO surfaces | `/en/face-shapes/*`, `/en/brand/*`, `/en/category/*`, guides/blog | Organic discovery | These are content/consumer SEO surfaces, not merchant Experience distribution. |
| B2B landing | `/en/store` | Store-for-businesses marketing page | Useful existing material; should become the first content source for `/business`. |

### Merchant shopper runtime

| Surface | Route pattern | Current role |
| --- | --- | --- |
| Store | `/{locale}/store/{merchantSlug}` | Evergreen merchant Experience over the selected catalog. |
| Campaign | `/{locale}/c/{merchantSlug}/{experienceSlug}` | Selected-catalog Experience with campaign headline/context. |
| Flow | Shared component | Privacy gate → upload → recommendation → selection/shortlist → Try-On → Compare/intent actions. |
| Shopper events | Store session APIs | Session, recommendation, selection, Try-On, Compare, Favorite, Product Click, Inquiry. |
| Provenance | Merchant/Experience `referenceData` | Visible marker on reference surfaces; current wording is repeated in multiple locations. |

### Merchant Admin

| Surface | Route | Current role |
| --- | --- | --- |
| Store portfolio | `/admin/store` | Six-merchant portfolio summary, catalog frames, sessions, purchase signals, retention health. |
| Merchant intelligence | `/admin/store/merchants/{id}` | Merchant-level summary, funnel, catalog, shopper sessions, inquiries, interest trend. |
| Experiences list | `/admin/store/merchants/{id}/experiences` | Store/Campaign filter, public route, catalog scope, funnel counts, Legacy/Unassigned. |
| Experience detail | `/admin/store/merchants/{id}/experiences/{experienceId}` | Funnel plus safe copy/date/CTA/offer controls and catalog selection. |
| General Admin | `/admin/dashboard`, `/admin/face-analysis`, `/admin/try-on`, etc. | Existing operations/admin surfaces; not part of the market-facing merchant IA. |

## 4. Shopper Experience assessment

### 4.1 Homepage

The homepage has a clear consumer promise, a strong first CTA, a four-step workflow, product proof, privacy messaging, FAQ, and a quiet Store-for-business bridge. On desktop it reads as a polished AI utility landing page; on mobile it becomes a long but coherent vertical sequence.

The issue is positioning and continuation. The primary structure teaches VisuTry’s tools, not the shopper’s broader eyewear decision intent. The B2B bridge appears late and no surface routes a user into an appropriate merchant Experience. The homepage can support distribution, but it should not become an ad wall.

**Verdict: NEEDS POLISH.**

### 4.2 Face Analysis

The page has the right semantic material for distribution: feature report, likely face shape, frame directions, reasons, and a Try-On next step. It is currently a product marketing page plus an upload gate, with a long guide/FAQ tail. The audited page does not expose a merchant-aware completion state, relevant fit campaign, or “continue shopping this edit” action.

**Verdict: NEEDS POLISH.**

### 4.3 Try-On

The marketing shell explains product-image upload, browser preview, retention, and limitations responsibly. The operational flow is generic and account/credit-oriented. It helps a shopper who already owns a frame image, but it does not naturally move a user into a merchant catalog after an image result.

**Verdict: NEEDS POLISH.**

### 4.4 Compare

The page communicates the side-by-side decision value well and explains the one-credit-per-frame model. The pre-generation state is understandable and has a strong visual proof image. However, preset frame names are not merchant products, there is no product destination continuity, and the “Selling frames?” bridge is a generic B2B CTA rather than a relevant Experience recommendation.

**Verdict: NEEDS POLISH.**

### 4.5 Style Explorer

This is the most promising 2C surface for fashion/editorial distribution. The “four sides of your eyewear style” framing, preview imagery, and occasion language are closer to a campaign mindset than the other consumer pages. It is still an isolated authenticated product: it does not continue into a merchant edit, brand, or campaign and does not explain what a shopper can do after the four looks.

**Verdict: NEEDS POLISH.**

### 4.6 Pricing

Pricing is explicit and operationally honest. It is visually and semantically a utility/credit page, with plan tables and retention details. It should remain useful, but it should not carry the primary burden of the market-facing brand story. Business buyers need a separate path and should not be asked to interpret consumer credits.

**Verdict: NEEDS POLISH.**

### 4.7 Dashboard and History

The anonymous production state at `/en/dashboard` and `/en/dashboard/history` showed only the page heading and footer. This may be an auth/session state rather than a data-loss issue; no inference about authenticated records is made. It is nevertheless not demo-ready because a user or sales presenter sees no clear sign-in CTA, no empty-state explanation, and no recovery path.

**Verdict: NOT BRAND-READY.**

### 4.8 Merchant Store / Campaign path

The Store/Campaign runtime has a coherent visual baseline:

- merchant identity and reference marker are visible above the fold;
- the Campaign route has an editorial headline and catalog count;
- privacy is explicit before upload;
- the stepper makes Upload → Recommendation → Try-On legible;
- recommendation cards show product image, name, price, shape/color/width, and a reason;
- Try-On result cards can expose View product, Favorite, Ask store, and shortlist behavior;
- mobile layout is intentionally composed rather than a raw desktop shrink.

The main gaps are market-facing, not foundational:

- `experience.headline` is rendered, but the configured `experience.description` and `heroAssetUrl` are not used by the shared shopper component, so the Experience data contract cannot currently create a materially different hero.
- The Store and Campaign hero use the same “Your frame edit / One photo. Your best frames.” presentation. Campaign intent is present as copy but not as a distinct visual mode.
- The initial state includes repeated privacy/storage language and a visible `Early-access storage notice`; this is responsible but too heavy for a polished brand landing state.
- Recommendation copy includes technical framing such as `Step 2 · AI edit` and, in the ready state, `Ranking store-rank-v1`. These are useful for QA, not for shoppers.
- The decision path has several competing actions and long vertical distance between recommendation, Try-On, Compare, Product Click, Favorite, and Inquiry on mobile.
- Merchant identity is consistent but generic: current public evidence showed the same Store icon and VisuTry-powered shell across merchants, with differences mostly in name, headline, catalog imagery, and text.
- The public Experience metadata sets Campaign routes to `noindex, follow`; this is safe for unapproved reference simulations but means they are not SEO-ready landing pages by default.

**Store verdict: NEEDS POLISH. Campaign verdict: NEEDS POLISH.**

## 5. Merchant Admin assessment

### 5.1 What is already working

- The six-merchant portfolio is visible in one place.
- The architecture is legible: Store and Campaign are sibling Experiences.
- The funnel correctly stops at intent signals and explicitly avoids inferring revenue or checkout.
- Catalog health, top frames, inquiries, shopper interest, recent journeys, and sessions are conceptually the right merchant intelligence areas.
- Reference/synthetic provenance is visible rather than silently mixed with live traffic.
- Experience detail exposes safe configuration controls and selected catalog ordering without creating merchant-specific code.

### 5.2 P0 visual/product issues

1. **Technical vocabulary is too visible.** `merchantId`/`experienceId` are not prominent in the inspected copy, but `/default`, `No date`, `Legacy / Unassigned`, `reference/synthetic provenance`, and control-plane language still make the surface feel internal.
2. **The top-level metric hierarchy is not decision-oriented enough.** “Purchase signals” can be read as completed commerce even though the system intentionally records only interest/intent. Use “Intent signals” or “High-intent actions” consistently.
3. **Zero data is repetitive and visually weak.** “Building data”, “Appears after shopper activity”, and empty panels repeat without telling a merchant what a successful shopper journey looks like.
4. **Experiences cannot be compared quickly.** The list has counts but no side-by-side conversion rates, source mix, catalog scope summary, or clear best-performing Experience story.
5. **Reference disclosure is repeated at card level.** The disclosure is necessary, but the current repetition competes with the merchant/product story and lowers perceived polish.
6. **Catalog inventory dominates the merchant overview.** It is useful for operations, but a marketing/growth user needs the journey and Experience performance before a 20-item frame inventory.

### 5.3 P1 refinement

- Rename sections and metrics around shopper decisions and marketing questions.
- Add source/medium/campaign/referrer context where available without adding a second event system.
- Replace `No date — No date` with “Evergreen” for Store and an explicit active window or “No campaign window set” for Campaign.
- Use a compact status/provenance treatment: one page-level disclosure plus a low-noise badge on each Experience.
- Give each Experience a concise “who is this for / what is this edit” summary.
- Keep catalog selection operational, but show the selected scope as a merchandising edit rather than a raw list first.

### 5.4 P2 nice-to-have

- Attribute-level frame performance (shape, width class, material, price band).
- Saved report/share view for a merchant demo.
- Tablet-specific density and comparison layout once the desktop information hierarchy is stable.

## 6. Design language assessment

There are currently at least four visual languages:

| Language | Observed traits | Assessment |
| --- | --- | --- |
| Consumer UI | Blue/indigo gradient backgrounds, Inter/system typography, rounded-lg cards, blue primary CTA, utility navigation. | Clear and accessible, but generic SaaS/AI rather than premium editorial eyewear. |
| Shopper Store/Campaign | Serif display headings, cream/blue-white atmospheric background, glass/backdrop blur, rounded-2xl/3xl cards, soft shadows, merchant accent. | Closest to the desired premium editorial direction. Needs stronger brand/theme expression and less technical copy. |
| Admin UI | Dark teal hero, slate cards, teal/violet/rose metric accents, rounded-2xl/3xl cards, dense catalog tables/cards. | Restrained and credible baseline, but the language is more internal operations than marketing intelligence. |
| B2B landing | Consumer blue/indigo background, blue CTAs, marketing cards and generic Store imagery. | Reuses existing assets well, but does not yet have a distinct restrained B2B intelligence identity. |

### Recommended unified direction

- **Consumer / Shopper:** premium editorial eyewear commerce — warm neutral canvas, restrained ink, one intentional accent, high-quality product/portrait imagery, serif display only for editorial moments, concise decision copy.
- **Merchant Admin:** restrained premium marketing intelligence — dark ink/teal anchors, quiet data surfaces, fewer decorative gradients, comparison-first hierarchy, narrative labels instead of engineering labels.

Do not build a complete design system in this phase. Establish only the shared layers needed for consistency:

1. **Tokens:** canvas, ink, muted text, border, accent, success/warning/error, radius scale, shadow scale, type roles, content max-width, mobile gutters.
2. **Primitives:** page shell, brand header, disclosure badge, primary/secondary CTA, metric card, empty state, product card, Experience card, funnel step, catalog item.
3. **Patterns:** shopper decision step, editorial hero, reference disclosure, Admin comparison row, zero-data state, mobile sticky action.

## 7. Six-Merchant variation audit

### Current inventory and Experience map

| Merchant | Store route / headline | Campaigns and routes | Catalog | Current portfolio signals | Differentiation verdict |
| --- | --- | --- | ---: | --- | --- |
| Luna Optical (original merchant) | `/en/store/luna-optical` · “Find frames that suit you — then try them on.” | No Experiences; all activity remains Legacy / Unassigned. | 16 | 61 sessions, 35 intents | Functional legacy surface, not a safe public Reference Brand until provenance wording is normalized. |
| ello sunglasses | `/en/store/ello-sunglasses` · “Discover frames for smaller faces.” | Petite Fit (10), Summer Sunglasses (6) | 12 | 7 sessions, 4 intents | Strongest problem-led copy; current public visual is still shared shell, not a petite-fit visual system. |
| Lowercase NYC | `/en/store/lowercase-nyc` · “Explore independent eyewear shaped in Brooklyn.” | Find Your Frame (10), Sunglasses Edit (10) | 20 | 0 sessions, 0 intents | Good editorial copy and catalog; insufficient Brooklyn/premium brand treatment in runtime. |
| AKILA | `/en/store/akila` · “Explore AKILA's current eyewear collection.” | Current Edit (9), Statement Frames (9) | 18 | 3 sessions, 0 intents | Style/collaboration concepts exist in data; public treatment is not materially more expressive than other merchants. |
| Article One | `/en/store/article-one` · “Explore Article One eyewear built for movement.” | Active Eyewear (9), Find Your Fit (9) | 18 | 0 sessions, 0 intents | Performance/use-case narrative is present; existing VTO benchmark is not reflected as a stronger journey. |
| Framed EWE | `/en/store/framed-ewe` · “Explore independent eyewear across Framed EWE’s curated catalog.” | Find Your Frames (11), Sunglasses Edit (12) | 20 | 6 sessions, 0 intents | Multi-brand catalog is visible in data; retailer curation and brand mix need stronger presentation. |

The Admin portfolio totals observed were **6 active merchants, 104 catalog frames, 77 sessions, and 39 purchase-intent signals**. Those totals include Luna’s legacy/unassigned traffic and should not be presented as a homogeneous Reference portfolio.

### Shared runtime versus merchant-specific expression

Use the shared runtime for:

- upload, privacy, recommendation, selection, Try-On, Compare, Favorite, Product Click, Inquiry;
- session capability, retention, usage, event taxonomy, and Admin funnel;
- product card structure and responsive primitives.

Use content/config/data/theme for:

- logo/mark and merchant name;
- accent token and neutral/contrast mode;
- hero asset and hero crop;
- headline, subhead, editorial copy, campaign mood;
- catalog scope, sort order, frame metadata, price, product URL;
- campaign label, offer, CTA label and destination;
- Reference/Simulation provenance.

Do not write merchant-specific React forks. The current gap is a shared presentation/config gap: `heroAssetUrl` and `description` are present in the Experience data contract but not rendered by the shopper runtime, and current logo/hero treatment is not strong enough to differentiate the six contexts.

## 8. Consumer distribution opportunities

The principle is to route based on shopper intent, not to insert generic advertising.

| Surface | User intent | Recommended Experience type | CTA | Attribution required | UX risk |
| --- | --- | --- | --- | --- | --- |
| Face Shape result | “What suits my face?” | Fit/face-shape Campaign | “Explore frames for your face” | `source=visutry`, `medium=internal`, `surface=face-analysis-result`, target `experienceId` | Feels arbitrary if the Campaign has no face-shape/fit relevance. |
| Face Analysis result | Wants a reasoned shortlist | Fit or recommendation-led Campaign | “Try a curated frame edit” | `surface=face-analysis`, `merchantId`, `experienceId` | Interrupts report completion if placed before the user sees the result. |
| Try-On completion | Has visualized one frame and wants alternatives | Store or collection Campaign | “Explore more frames” | `surface=try-on-completion` | Generic upsell risk; must preserve the user’s current frame context. |
| Compare completion | Has finalists and wants adjacent options | Store or collection Campaign | “See another curated edit” | `surface=compare-completion` | Can weaken decision closure; keep secondary. |
| Style Explorer result | Wants a style direction | Statement/style Campaign | “Shop this style edit” | `surface=style-explorer`, style/occasion context | Brand mismatch if the edit is not visually aligned. |
| Dashboard / History | Returning shopper with prior decisions | Store/Campaign re-entry | “Continue exploring frames” | `surface=dashboard-history` | Must not expose stale or unexplained recommendations. |
| Homepage workflow | New shopper browsing for help | Featured Campaign, secondary | “Explore a frame edit” | `surface=home`, first-touch preserved | Homepage becomes ad-like if more than one quiet module is used. |
| SEO guide completion | Searcher has an eyewear question | Relevant Campaign only when semantically aligned | “Try a related frame edit” | `surface=seo-guide`, content cluster | Commercial CTA can damage editorial trust. |
| Footer / navigation | Explicitly looking for more | Discover entry | “Discover frame edits” | `surface=nav` or `footer` | Low intent; keep Discover secondary. |

### Distribution rule

Every internal handoff must be a real link to a known Experience, preserve the shopper’s first-touch acquisition fields, and add an internal surface marker. It must not create a second analytics taxonomy or infer campaign IDs from arbitrary UTM text.

## 9. Discover IA decision

| Option | 2C usefulness | SEO | Merchant value | Scalability | Attribution | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| A — Brands directory first | Low/medium; asks shoppers to know a brand first. | Strong brand/category landing potential. | High for brand browsing, weak for intent-led conversion. | Medium; grows by merchant count. | Clear merchant attribution, weaker intent. | Do not lead with this. |
| B — Intent/Campaign discovery first | High; starts with a shopper need/style. | Medium initially; improves with indexable live Experience content. | High; gives each Campaign a clear job. | High if Experience metadata is structured. | Strong surface → Experience → intent continuity. | Recommended first IA. |
| C — Hybrid | High if hierarchy is disciplined. | High. | High. | High but more content/curation work. | Strong. | Target state after B is proven. |

### Recommendation

Build the conceptual route `/en/discover` with this first-release hierarchy:

1. **Featured Experiences** — a small curated set of active, approved Experiences.
2. **Shop by need / style** — petite fit, sunglasses, active/movement, statement frames, independent optical, and similar intent labels sourced from Experience configuration.
3. **Brands & Retailers** — secondary directory sourced from approved Merchant records.

First-version content should come from existing active Experience records, selected catalog metadata, merchant theme/config, and manually curated ordering. Do not add a CMS, crawler, recommendation model, or new merchant onboarding product in Phase 0.

Reference Experiences should remain `noindex` until usage rights, copy quality, and provenance policy are approved. Live/authorized merchant Experiences can later receive a separate indexability policy.

## 10. Attribution assessment

### Existing support

- Store shopper code reads `utm_source`, `utm_medium`, `utm_campaign`, `document.referrer`, and the current landing URL.
- The session request passes acquisition context into `createStoreSession`.
- Server-side session creation applies Experience defaults for source/campaign and persists `experienceId`, merchant identity, reference status, and acquisition fields on the MerchantSession/event path.
- Existing analytics v2 supports `merchant_id`, `store_id`, `campaign_id`, `campaign_name`, `surface`, `entry_point`, and `landing_surface` context.
- Existing event taxonomy already includes shopper events such as `campaign_landed`, `recommendation_viewed`, `tryon_started`, `comparison_completed`, `frame_favorited`, `purchase_intent_clicked`, and `lead_created`.

### Current gap

The Store session acquisition contract persists `source`, `medium`, `campaign`, `referrer`, `landingUrl`, and AI referral classification, but it does not persist an explicit internal distribution `surface`. The public Store/Campaign runtime can receive external UTM/referrer context, but current 2C pages do not provide a standardized internal handoff that sets:

```text
source = visutry
medium = internal
surface = discover | face-analysis | compare | try-on | style-explorer | dashboard | home
merchantId = target merchant
experienceId = target Experience
campaign = optional stable Experience/campaign context
referrer = originating VisuTry route
```

### Minimum gap, without a second analytics system

1. Extend the existing Store acquisition payload/metadata with `surface` (or an equivalently named internal field).
2. Add one shared internal-link helper that appends/sets the known target context and calls the existing event layer where an interaction event is already appropriate.
3. Keep `merchantId` and `experienceId` authoritative from the resolved destination/session; do not trust arbitrary URL values when a server-side Experience resolves them.
4. Preserve external first-touch acquisition separately from internal continuation.
5. Expose the same fields in Admin filters/summary only after the event/session data is present.

No new analytics pipeline, revenue attribution, multi-touch model, CRM, or checkout integration is in scope.

## 11. B2B website audit and MVP IA

### Current `/en/store`

The existing page already contains reusable material for:

- the problem: shoppers need help finding the right frames;
- the workflow: add frames → share Store link → guide/try/compare → see intent;
- shopper proof imagery;
- merchant dashboard imagery;
- privacy/trust framing;
- sample Store lead capture.

It is not yet a complete B2B site because it sits under the 2C navigation, uses consumer visual conventions, and does not distinguish brand, retailer, reference, and pilot narratives.

### MVP site map (IA only in this phase)

```text
/business
├── /business/brands
├── /business/retailers
├── /business/experiences
├── /business/reference
└── /business/pilot
```

| Page | Job | First content source |
| --- | --- | --- |
| `/business` | Explain the value proposition and route by business type. | Existing `/en/store` hero, workflow, dashboard, privacy, lead form. |
| `/business/brands` | Explain brand/campaign use cases. | Experience architecture, ello/Lowercase/AKILA/Article One reference patterns. |
| `/business/retailers` | Explain multi-brand optical and inquiry use cases. | Framed EWE pattern and current intent model. |
| `/business/experiences` | Explain Store versus Campaign with shopper funnel. | Existing Store/Campaign runtime and Admin funnel. |
| `/business/reference` | Show approved Reference Experiences with correct wording. | Five reference portfolio records and evidence policy. |
| `/business/pilot` | Explain assisted pilot delivery and inputs. | Pilot delivery factory and pilot kit. |

Non-goals: full B2B implementation, pricing portal, CRM, self-service onboarding, Campaign Builder, Shopify app, or new product functionality.

## 12. Navigation recommendation

### Current issue

Desktop main navigation exposes five separate tool links: Detector, Advisor, Try On, Explorer, Compare. It has no Discover and no For Business. Mobile places the same tool list in a menu and repeats the authenticated Advisor CTA. The footer has a Store-for-business link, but it is a late secondary resource link rather than a clear business entry.

### Recommended IA

Desktop primary:

```text
Try On   Face Analysis   Discover   For Business
```

Secondary/utility:

```text
Style Explorer   Compare   Pricing   Language   Account
```

The exact grouping can keep existing routes, but the visible hierarchy should stop making five tools look like five equal products. `Discover` should be the merchant Experience entry; `For Business` should point to `/business` without displacing the 2C primary CTA.

Mobile:

- keep Logo, Account, and menu in the top bar;
- place Try On, Face Analysis, Discover, and Style Explorer first in the menu;
- place Compare and Pricing under “More” or after the primary actions;
- keep For Business as a distinct lower menu item and footer group;
- preserve a single strong action per page state.

## 13. Reference Experience presentation rules

### Portfolio classification

- **Reference Brands / Reference Experiences:** ello sunglasses, Lowercase NYC, AKILA, Article One, Framed EWE.
- **Original merchant / legacy demo:** Luna Optical. It currently has 16 frames and legacy/unassigned activity but no active Experiences. Do not present it as a Reference Brand without an explicit provenance/config decision.

### Allowed wording

Use:

- Reference Brand
- Reference Experience
- Reference Implementation
- Reference Pilot
- Pilot Simulation
- Sample Merchant Experience
- Reference Store
- Reference Campaign

Do not use unless there is future authorization and a real commercial relationship:

- Customer
- Client
- Partner
- Case Study

### Presentation rule

Use one concise page-level badge such as **Reference Pilot · Simulation** or **Reference Implementation**. Add a short disclosure in the page footer/details panel explaining that traffic/data may be synthetic and does not represent merchant results. Avoid repeating the full warning on every card and metric. Never show reference data beside live traffic without an explicit provenance boundary.

## 14. Data flywheel

```text
VisuTry traffic
  → Merchant Store / Campaign Experience
  → Shopper interaction
  → Experience metrics
  → Merchant proof
  → Better campaign / catalog selection
  → More merchant value
```

### Already available

- Merchant and Experience identity;
- reference/synthetic provenance;
- sessions;
- photos uploaded;
- recommendations and selected frames;
- Try-On started/completed/failed;
- Compare started/completed/partial;
- Favorites / shortlist;
- Product Clicks;
- Inquiries;
- catalog health and selected catalog scope;
- source, medium, campaign, referrer, landing URL in the Store session acquisition path;
- existing event taxonomy and Admin funnel summaries.

### Missing for productization

- first-class internal distribution `surface`;
- clear Experience-level source/medium comparison;
- consistent engaged-session and step-completion definitions across Admin;
- compact Experience narrative metadata: audience/need/style, hero treatment, and merchandising goal;
- trustworthy zero-data and synthetic-data presentation;
- enough frame-level attribution to explain why a frame is top-performing without implying revenue.

### Do not build now

- revenue attribution;
- checkout/order integration;
- ROI/ROAS;
- CRM/CDP;
- multi-touch attribution;
- shopper identity graph;
- autonomous shopping/agent conversion claims;
- a second event system.

## 15. Page-level redesign and distribution backlog

Type values are intentionally limited to `CONTENT`, `CONFIG`, `DATA`, and `PRODUCT CODE`. Priority means implementation priority, not severity of a production defect.

| ID | Surface | Route / Component | Problem | User impact | Brand-facing impact | Recommended change | Type | Priority | Mobile impact | Shared vs merchant-specific | Dependency | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0-01 | Shopper | Store/Campaign hero · `StoreShopperExperience` | Configured Experience description/hero asset are not expressed; Store and Campaign feel alike. | Cannot quickly understand why this edit is for them. | Every merchant appears to use the same demo template. | Render headline, description, hero asset, Experience type, and a compact campaign/context label through shared primitives. | PRODUCT CODE | P0 | Hero must collapse cleanly with one CTA and no horizontal overflow. | Shared runtime + config | Theme/content fields already exist. | Store and Campaign render distinct approved context, hero treatment, and CTA without a merchant React fork. |
| P0-02 | Shopper | Recommendation state | `AI edit`, `Ranking store-rank-v1`, and long technical explanations expose implementation language. | Feels like an AI report, not shopping advice. | Lowers trust and editorial polish. | Replace technical labels with shopper language; keep ranking/version only in QA/admin. | CONTENT | P0 | Short reason copy remains readable in cards. | Shared | Copy review. | No shopper-visible ranking/version strings; each card has one concise reason. |
| P0-03 | Shopper | Recommendation → selection | Product identity and next action are not persistent enough across the journey. | Harder to decide what to try or buy next. | Commerce story feels unfinished. | Make product name, price, product destination, selected state, and “Try this”/“Compare” hierarchy persistent through the result panel. | PRODUCT CODE | P0 | Sticky/nearby action is available without trapping the viewport. | Shared runtime | P0-01 card pattern. | A shopper can identify the frame and reach Product Click/selection without re-finding the card. |
| P0-04 | Shopper | Try-On / Compare result panel | Core path is visually secondary after recommendation and can become a long scroll. | Users may stop after recommendation. | Try-On is not the visual hero of the decision. | Reframe completed Try-On as the main result, keep Compare as a clear secondary decision action, and keep Favorite/Product Click/Inquiry grouped. | PRODUCT CODE | P0 | Completed result and primary action appear within one mobile decision block. | Shared runtime | P0-03. | Seeded 1–4 frame flow shows Recommendation → Try-On → Compare → intent in a single understandable hierarchy. |
| P0-05 | Shopper | Privacy/disclosure | Correct privacy language is repeated and `Early-access storage notice` competes with brand story. | More cognitive load before upload. | Makes a polished Campaign feel like an internal pilot tool. | Keep one concise pre-upload disclosure with expandable detail; preserve legal/trust coverage. | CONTENT | P0 | Disclosure is scannable above the upload CTA. | Shared + reference config | Legal/content approval. | Disclosure is visible before upload, detail remains available, and the hero is not dominated by warnings. |
| P0-06 | Shopper | Store/Campaign mobile | Step labels truncate and recommendation/result sections are dense/long. | More scrolling and lower action confidence. | Mobile feels like a compressed desktop flow. | Shorten step labels, define mobile card density, and add a clear mobile action rhythm. | PRODUCT CODE | P0 | Verify at 430px width and common 390px width. | Shared | P0-03/P0-04. | No step label truncation; primary action and current step remain obvious at 390–430px. |
| P0-07 | Consumer | Dashboard / History | Anonymous state shows heading/footer without a clear gate or empty state. | User cannot tell whether to sign in, wait, or start a new flow. | Not safe for demo or returning-user screenshots. | Add explicit auth gate, empty state, and next action; do not infer missing data. | PRODUCT CODE | P0 | Gate and CTA fit within first mobile viewport. | Shared consumer | Auth state contract. | Anonymous and authenticated-empty states each explain status and provide a next action. |
| P0-08 | Admin | Portfolio / merchant overview | `Purchase signals`, repeated zero-data copy, and long catalog-first hierarchy are ambiguous. | Marketing users cannot quickly answer “what needs attention?” | Feels like internal telemetry. | Rename intent metrics, lead with Experience/funnel summary, and provide narrative zero states. | CONTENT | P0 | Cards stack with the decision hierarchy intact. | Shared Admin | Metric definition approval. | No metric implies revenue/checkout; zero states tell the user what action/data is needed. |
| P0-09 | Admin | Experiences list/detail | `No date`, `/default`, `Legacy / Unassigned`, and repeated reference warnings reduce polish. | Harder to compare Store/Campaign status and readiness. | Sales demo looks unfinished. | Use Evergreen/active-window language, human-readable route labels, compact provenance badge, and clearer Experience summary. | CONTENT | P0 | Cards remain readable without dense multi-column overflow. | Shared Admin + config | Provenance copy rule. | A merchant can identify type, status, route, scope, window, and provenance without engineering terminology. |
| P0-10 | Attribution | Store acquisition/session contract | Internal VisuTry handoffs lack a first-class `surface`. | Cannot reliably explain which result/page created a merchant session. | Weakens merchant proof and distribution learning. | Extend existing acquisition metadata with `source=visutry`, `medium=internal`, `surface`, referrer, and authoritative target Experience context. | DATA | P0 | N/A; metadata must not block navigation. | Shared data contract | Existing event/session foundations. | An internal handoff produces inspectable source/medium/surface/merchantId/experienceId without a new event system. |
| P0-11 | Attribution | 2C → Experience links | No shared link/handoff pattern exists for result surfaces. | Distribution would be ad hoc and unmeasurable. | Merchant value cannot be demonstrated. | Define one internal Experience CTA/link helper and use it only on approved surfaces. | PRODUCT CODE | P0 | CTA remains secondary and non-intrusive on mobile. | Shared consumer/store | P0-10 and approved targets. | Each enabled CTA preserves first-touch fields and records the originating surface. |
| P0-12 | Reference | All public Store/Campaign and Admin | Reference wording is valid but repeated and Luna is not clearly classified. | Users may misunderstand simulated data. | Legal/brand credibility risk. | Apply one presentation rule; classify Luna as original/legacy demo unless explicitly approved as Reference Implementation. | CONFIG | P0 | Badge does not push core CTA below fold. | Shared + merchant config | Provenance decision. | Five references use approved wording; Luna is never presented as Customer/Partner/Case Study. |
| P1-01 | Consumer | Homepage and primary navigation | Tool-first IA has no Discover entry. | Shoppers cannot browse relevant frame edits. | Merchant distribution remains invisible. | Add a quiet Discover entry and one contextually relevant featured Experience module. | PRODUCT CODE | P1 | Mobile menu keeps 2C path primary and business secondary. | Shared consumer | P0-11. | Homepage has at most one non-ad-like Experience module and navigation reaches `/discover`. |
| P1-02 | Consumer | Face Analysis result | No relevant merchant continuation after a face/fit intent is known. | User must leave VisuTry or restart discovery. | Missed highest-intent handoff. | Add a secondary fit/edit CTA after result completion. | CONTENT | P1 | Secondary CTA does not compete with report completion. | Shared consumer + curated config | Approved Experience mapping. | A round/square/etc. result can map to a relevant Experience without hardcoded merchant UI. |
| P1-03 | Consumer | Try-On/Compare completion | No natural “Explore more frames” continuation. | Decision ends at generic tool result. | Merchant value is not visible. | Add a quiet secondary continuation using approved Store/Campaign targets. | CONTENT | P1 | One-tap continuation after result; no forced interstitial. | Shared consumer | P0-11. | Completion state offers a relevant continuation with internal attribution and no ad-like interruption. |
| P1-04 | Consumer | Style Explorer result | Fashion intent does not connect to a statement/style Experience. | Style exploration has no shopping continuation. | Weakest link between editorial promise and merchant value. | Add a style/occasion mapping and secondary CTA. | CONFIG | P1 | Mapping is optional and does not block generation/history. | Shared + curated mapping | P0-11. | Approved style outputs map to zero or one Experience; no fallback looks like an ad. |
| P1-05 | Discover | New `/en/discover` IA | No discovery surface exists. | No place to browse intent-led Experiences. | Merchant portfolio cannot be shown coherently. | Implement Featured Experiences → Shop by need/style → Brands & Retailers using existing records only. | PRODUCT CODE | P1 | Cards and filters work at 390–430px. | Shared + config/data | P0-01, P0-12, P0-11. | Active approved Experiences render with type, merchant, context, catalog scope, provenance, CTA, and attribution. |
| P1-06 | Discover | Experience content source | Merchant/Experience records lack a disciplined discovery summary. | Cards may be generic or misleading. | All brands flatten into the same card. | Add/curate intent/style/audience labels and short editorial summaries via config. | CONFIG | P1 | Labels wrap within two lines. | Shared config | Copy review. | Every featured item has one intent, one concise summary, one route, and an approved provenance state. |
| P1-07 | Admin | Portfolio comparison | Portfolio shows totals but not comparable Experience performance. | Growth user cannot decide what to improve/share. | Demo lacks a clear intelligence story. | Add comparison-ready rates/counts for sessions → recommendation → Try-On → Compare → intent, without revenue claims. | PRODUCT CODE | P1 | Mobile uses a horizontal/stacked comparison pattern with no clipping. | Shared Admin | P0-08, P0-10. | Merchant/Experience comparison uses the same definitions and exposes reference/live provenance. |
| P1-08 | Admin | Experience detail | Funnel exists but source/medium/campaign and catalog context are not decision-ready. | Hard to understand why an Experience performs. | Feels like configuration rather than campaign intelligence. | Add compact acquisition and merchandising context blocks. | PRODUCT CODE | P1 | Blocks collapse/stack predictably. | Shared Admin | P0-10. | Detail page answers who/what/source/scope/status/performance without exposing internal IDs. |
| P1-09 | Theme | Shopper presentation config | `logoUrl`, accent, headline, description, hero asset, and catalog mood are not all expressed. | Shopper sees generic shell. | Brands do not look like distinct brand contexts. | Define minimal theme/presentation config and render it through shared primitives. | CONFIG | P1 | Theme never reduces contrast or CTA visibility. | Shared + merchant config | P0-01. | ello, AKILA, Article One, Lowercase, and Framed EWE are recognizably distinct through data/config/theme only. |
| P1-10 | Design language | Consumer/Store/Admin/B2B shared primitives | Radius, shadows, blue accents, typography, and card density vary by surface without a deliberate token layer. | Product feels assembled from pages. | Lowers confidence in a market-facing system. | Establish a small token/primitives layer; do not rewrite every page. | PRODUCT CODE | P1 | Tokens include mobile gutters and type scale. | Shared | A1/A2 design decisions. | New/updated surfaces consume the agreed tokens; no merchant-specific CSS fork is introduced. |
| P1-11 | B2B | `/business` IA | B2B story is a single `/en/store` landing page inside 2C nav. | Business buyer cannot self-orient by brand/retailer/pilot need. | Sales demo has no coherent site architecture. | Create the MVP content architecture and route map from existing material. | CONTENT | P1 | Mobile content order starts with value, proof, and CTA. | Shared site | A1/A2 proof language. | IA and content inventory are approved before page implementation. |
| P1-12 | SEO | Merchant Experience metadata | Campaign routes are `noindex`; no policy distinguishes reference simulation from approved live Experience SEO. | Discovery cannot rely on search for current Experiences. | Risk of exposing unapproved references or missing approved content. | Define indexability policy by provenance/approval; keep references noindex until approved. | CONFIG | P1 | N/A. | Shared route config | P0-12 and legal approval. | Reference routes remain noindex; approved live routes have an explicit, reviewable policy. |
| P2-01 | Admin | Catalog intelligence | Frame cards show counts but limited attribute-level insight. | Harder to learn which attributes create interest. | Less compelling intelligence narrative. | Add shape/width/material/price-band summaries after core funnel is stable. | DATA | P2 | Use progressive disclosure on mobile. | Shared Admin | P1-07. | Attribute summaries are descriptive and do not imply revenue or physical fit. |
| P2-02 | Shopper | Store/Campaign merchandising | No richer editorial modules beyond hero/catalog/flow. | Campaigns have limited storytelling range. | Fashion/editorial quality plateaus. | Add optional editorial modules from config after A1 proves the base journey. | CONFIG | P2 | Modules are optional and do not lengthen the default path excessively. | Shared + merchant config | P1-09. | A Campaign can add one approved editorial module without custom React. |
| P2-03 | Admin | Demo handoff | No saved/shareable intelligence view for a sales walkthrough. | Presenter must navigate raw Admin. | Lower demo confidence. | Add a read-only demo/report view only after data/provenance hierarchy is stable. | PRODUCT CODE | P2 | Responsive report layout. | Shared Admin | P1-07/P1-08. | Report clearly labels simulation/reference data and uses no revenue claims. |

### Backlog totals

- **P0:** 12 items — shopper clarity, Admin language/empty states, attribution minimum, provenance.
- **P1:** 12 items — Discover/distribution, Admin comparison, theme/config, B2B IA, SEO policy.
- **P2:** 3 items — deeper intelligence and optional editorial/reporting enhancements.
- **Estimated PRODUCT CODE changes:** 12 backlog items are explicitly `PRODUCT CODE` (P0-01, P0-03, P0-04, P0-06, P0-07, P0-11, P1-01, P1-05, P1-07, P1-08, P1-10, P2-03). This is a planning estimate of change areas, not a promise of 12 files or a permission to implement them in this audit.
- **CONTENT / CONFIG / DATA-only opportunities:** 13 items can be solved without new shopper/admin product behavior if the existing runtime exposes the required fields: copy/provenance, Experience presentation configuration, discovery labels, metadata/indexability policy, internal attribution contract, and attribute definitions.

## 16. Recommended implementation sequence

### Phase A1 — Shopper Experience visual hardening

**Scope**

- Store/Campaign hero expression and shared theme primitives;
- shopper copy cleanup and disclosure compression;
- Recommendation → Try-On → Compare → Product Click/Favorite/Inquiry hierarchy;
- mobile step/card/action cleanup;
- dashboard/history auth and empty states;
- approved reference presentation rules.

**Non-goals**

- no new Discover route;
- no `/business` pages;
- no recommendation/Try-On engine rewrite;
- no merchant-specific UI fork;
- no new analytics pipeline;
- no new merchant or Campaign Builder.

**Definition of Done**

- One Store and one Campaign pass desktop and 390–430px mobile review.
- A deterministic seeded path clearly communicates upload → recommendation → Try-On → Compare → intent.
- No shopper-visible ranking/version or unnecessary technical terminology.
- Product identity and destination remain visible through the decision path.
- Reference disclosure is correct, concise, and not mistaken for customer proof.
- Empty/loading/error/success states have a clear next action.

### Phase A2 — Merchant Admin visual hardening

**Scope**

- portfolio/merchant/Experience hierarchy;
- intent metric wording and zero-data states;
- Experience status/window/provenance language;
- comparison-ready summary layout;
- catalog as supporting merchandising intelligence, not the first story.

**Non-goals**

- no RBAC;
- no import/crawler;
- no CRM;
- no revenue/checkout metrics;
- no new Admin modules beyond the audited surfaces.

**Definition of Done**

- A brand marketing user can answer: what is live, who is it for, which Experience is performing, what frames attract intent, and what data is synthetic.
- Zero-data and legacy states are professional and explanatory.
- No metric implies revenue or completed purchase.
- Admin terminology is usable in a sales demo without engineering translation.

### Phase B1 — Internal attribution

**Scope**

- add internal surface to the existing Store session/acquisition contract;
- standardize internal handoff links;
- preserve first-touch acquisition while recording VisuTry continuation;
- expose the minimum fields needed to validate attribution in Admin.

**Non-goals**

- no second analytics system;
- no multi-touch attribution;
- no revenue attribution;
- no CRM or checkout integration.

**Definition of Done**

- A test click from each approved surface records `source`, `medium`, `surface`, `referrer`, merchant identity, and Experience identity.
- External acquisition is not overwritten by internal continuation.
- Existing events remain the canonical transport.
- Reference/synthetic data remains visibly separated.

### Phase B2 — Discover / distribution surface

**Scope**

- `/en/discover` intent-first IA;
- curated Featured Experiences and Shop by need/style;
- selected homepage/result completion handoffs;
- approved Merchant/Experience content/config only.

**Non-goals**

- no crawler;
- no CMS;
- no autonomous recommendation model;
- no forced ads in the 2C path;
- no public exposure of unapproved references.

**Definition of Done**

- Discover is useful with the current six-merchant dataset and degrades gracefully when no approved Experience matches.
- Every card has explicit merchant, Experience, route, intent/context, catalog scope, and provenance.
- Every handoff is attributable through the existing event/session layer.
- Mobile and desktop hierarchy preserve intent-first browsing.

### Phase C1 — `/business` MVP

**Scope**

- implement the approved MVP site map/content architecture;
- move/reuse current `/en/store` proof and lead narrative;
- separate brand, retailer, Experience, reference, and pilot messaging.

**Non-goals**

- no broad B2B product build;
- no self-service onboarding;
- no business pricing/billing portal;
- no CRM or sales automation;
- no new Reference Brand.

**Definition of Done**

- A business visitor can understand the value proposition, choose brand vs retailer context, see how Store/Campaign works, understand reference provenance, and request an assisted pilot.
- The 2C primary path remains intact.
- All public claims are limited to current capability and approved reference wording.

## 17. Explicit non-goals for this audit

- No large-scale CSS rewrite.
- No new `/discover` implementation in Phase 0.
- No new `/business` implementation in Phase 0.
- No new Admin feature module.
- No new analytics pipeline.
- No merchant-specific React fork.
- No Brand 6.
- No Campaign Builder.
- No crawler or automated catalog intake.
- No CRM, Shopify app, or ecommerce checkout integration.
- No Recommendation/Try-On engine rewrite.
- No revenue attribution or conversion-rate claims beyond current intent signals.
- No production bug hotfix was applied during this audit; obvious issues are recorded in the backlog.

## 18. Evidence log

Evidence was collected from the real production deployment with the authenticated Chrome session available in the task. The table records the page, viewport, and state inspected. Screenshot captures were visual checkpoints; no AI generation was triggered.

| Evidence | URL | Viewport | State / finding |
| --- | --- | --- | --- |
| E-01 | `https://www.visutry.com/en` | 1253×648 desktop; 430×932 mobile | Homepage hero, workflow, tool navigation, B2B bridge, footer; mobile menu and stacked workflow. |
| E-02 | `https://www.visutry.com/en/face-analysis` | 1253×648 desktop | Advisor marketing shell, upload/loading state, face-shape guide, Try-On links. |
| E-03 | `https://www.visutry.com/en/try-on/glasses` | 1253×648 desktop | Product-photo Try-On marketing shell, limitations, auth/credit continuation. |
| E-04 | `https://www.visutry.com/en/try-on/glasses/compare` | 1253×648 desktop; 430×932 mobile | Preset comparison marketing state and authenticated pre-generation state with credits/presets. |
| E-05 | `https://www.visutry.com/en/style-explorer` | 1253×648 desktop | Fashion/editorial marketing shell, preview imagery, auth gate. |
| E-06 | `https://www.visutry.com/en/pricing` | 1253×648 desktop | Credits/subscription plans and comparison table. |
| E-07 | `https://www.visutry.com/en/dashboard` and `/en/dashboard/history` | 1253×648 desktop | Anonymous state: heading/footer only; auth/empty-state gap recorded without inferring data loss. |
| E-08 | `https://www.visutry.com/en/store/ello-sunglasses` | 430×932 mobile | Existing deterministic state with uploaded photo, recommendation cards, Try-On result, Favorite/Product/Inquiry/shortlist actions. |
| E-09 | `https://www.visutry.com/en/store/ello-sunglasses` | 1253×648 desktop-equivalent route state | Pre-upload Store hero and privacy gate; six-merchant public Store routes were compared. |
| E-10 | `https://www.visutry.com/en/c/ello-sunglasses/petite-fit` | 430×932 mobile; 1253×648 desktop | Campaign privacy gate, editorial headline “Find frames for smaller faces”, 10-frame scope, shared “Your frame edit” treatment. |
| E-11 | `https://www.visutry.com/admin/store` | 1253×704 desktop | Six merchants, 104 frames, 77 sessions, 39 intent signals, retention health. |
| E-12 | `https://www.visutry.com/admin/store/merchants/cmsovc43q00003ai87qtpyf2r` | 1253×704 desktop | Framed EWE merchant overview, funnel, zero-data panels, catalog, legacy/session table. |
| E-13 | `https://www.visutry.com/admin/store/merchants/{id}/experiences` | 1253×704 desktop | All six Experience lists, Store/Campaign tabs, public routes, catalog scope, Legacy/Unassigned. |
| E-14 | `https://www.visutry.com/admin/store/merchants/cmsoere1s0000n5fy1kbvpecs/experiences/cmsoqbcuw000e40i85rql86ev` | 1253×704 desktop | ello Store detail, funnel, settings, 12 selected frames, reference/no-revenue wording. |
| E-15 | Admin portfolio through connected Chrome tab | Connected tab retained desktop viewport | A temporary mobile viewport override was not reliably applied to the already-open claimed Admin tab; no mobile pass is claimed for Admin. This remains a follow-up verification item. |

## 19. Handoff

This document is the sole Phase 0 implementation baseline. The first implementation ticket should be **A1 Shopper Experience visual hardening**, starting with P0-01 through P0-06 and P0-12, followed by the Admin P0 set. Do not start `/business`, Discover, Campaign Builder, or merchant-specific UI before A1/A2 acceptance criteria are met.
