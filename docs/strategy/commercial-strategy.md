# VisuTry Commercial Strategy

**Status:** Active source of truth  
**Created:** 2026-07-08  
**Last updated:** 2026-08-06  
**Owner:** Product / Strategy
**Scope:** Commercial direction, product packaging, target customer layers, and the relationship between VisuTry's consumer, prosumer, and B2B strategies.

---

## 1. Purpose of This Document

This document is the top-level commercial strategy source of truth for VisuTry.

It does not replace the existing execution plans, SEO/GEO plans, B2B roadmap, free detector commercialization plan, or commercial benchmark notes. Instead, it defines the shared strategic logic that those documents should follow.

External market references, competitor notes, revenue hypotheses, and benchmark details belong in `docs/strategy/commercial-benchmarks.md`, not in this document.

The key questions answered here are:

1. Who should VisuTry ultimately serve?
2. What role should the consumer product play?
3. Why is consumer subscription not the strongest primary monetization path?
4. How should Face Shape Detector, Glasses Advisor, Virtual Try-On, and Frame Compare be assembled into commercial workflows?
5. What is VisuTry Store ultimately selling to merchants?
6. How should Store support both human traffic and AI-agent traffic?
7. Which existing strategy documents remain active, supporting, or historical?
8. What should the next product and GTM work optimize for?

---

## 2. Current Strategic Context

VisuTry currently has several validated product assets:

- Free or low-friction face-shape detection.
- Login-based AI face analysis and glasses recommendation.
- Single glasses virtual try-on.
- Multi-frame comparison.
- A preset library of common frames.
- User dashboard for try-on, payment, and analysis records.
- Stripe-based credits and subscription infrastructure.
- SEO/GEO, analytics, and external distribution plans.

The current public product path is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

This path should remain the public consumer-facing product architecture unless new evidence invalidates it.

Each product answers a distinct user question:

| Product | User question | Commercial role |
| --- | --- | --- |
| Face Shape Detector | What is my likely face shape? | Free acquisition and activation. |
| Glasses Advisor | Which frame directions are worth trying, and why? | Deeper recommendation and paid guidance. |
| Virtual Try-On | How does one specific product image look on my photo? | Visual proof and credits revenue. |
| Frame Compare | Which of several candidate frames looks best side by side? | Repeat usage, decision support, and credits revenue. |

---

## 3. Core Commercial Thesis

VisuTry should not be positioned primarily as a consumer subscription product.

The stronger commercial thesis is:

> Use the consumer product to capture high-intent eyewear decision demand, then convert the same capabilities into professional and merchant workflows where repeated usage, customer service, sales conversion, and measurable purchase intent justify recurring payment.

In practical terms:

1. **2C is the acquisition and proof layer.**  
   Free detector, one-time report, credits pack, try-on, comparison, and shareable results create traffic, usage data, product proof, and lightweight revenue.

2. **Prosumer is the service workflow layer.**  
   Eyewear stylists, image consultants, and small service providers can use VisuTry repeatedly for client recommendations and report generation.

3. **B2B is the primary recurring-revenue layer to validate.**  
   Optical stores, eyewear sellers, DTC eyewear brands, Shopify/WooCommerce merchants, and agencies need tools that improve shopper confidence, shortlist frames, create purchase intent, and connect that intent to revenue.

4. **Storefront is the delivery surface; the larger business is the AI Commerce / Campaign Engine.**  
   The hosted Store is the simplest way to deliver and validate the workflow. The long-term product is not a merchant website builder. It is a conversion layer that can power campaign-specific shopper experiences across hosted pages, ecommerce sites, ads, social traffic, email, QR, and future agent channels.

5. **The durable moat is workflow + intent intelligence, not image generation alone.**  
   Basic virtual try-on can be copied. Harder-to-copy value comes from merchant onboarding, frame intelligence, recommendation logic, shopper intent, attribution, privacy trust, campaign optimization, analytics, and eventually agent-ready commerce interfaces.

Internal north star:

> **VisuTry is AI commerce infrastructure for eyewear, built to turn both human and AI-agent traffic into measurable purchase intent and revenue.**

---

## 4. What Is Already Proven

Current evidence should be interpreted conservatively but clearly.

### 4.1 Paid consumer evidence

From 2026-06-23 through 2026-07-26, VisuTry recorded 10 completed USD 2.99 Credits Pack payments from 10 distinct user records, for USD 29.90 in gross transaction value. The paid behavior is concentrated in glasses try-on rather than broad universal try-on categories.

This supports the following conclusion:

> Users are willing to pay for a lightweight, no-subscription eyewear decision tool when they have immediate intent.

The current evidence does not yet support a subscription-first consumer model.

### 4.2 Workflow evidence

Two consumer usage patterns matter commercially:

1. **Frame comparer:** a user compares many frames before deciding.
2. **Specific-frame validator:** a user wants to test one product image, screenshot, or frame from a store/email before buying.

Both patterns are directly relevant to merchant workflows.

### 4.3 Technical evidence

VisuTry already has reusable commercial infrastructure:

- AI try-on task pipeline.
- Image upload and storage.
- Asynchronous processing and polling.
- Result history and sharing.
- Quota and Stripe payment logic.
- Admin visibility.
- Face-landmark geometry foundation.
- Frame recommendation and comparison product concepts.
- Merchant Store D0 with merchant catalog, anonymous session, recommendation, try-on, compare, intent, and insight foundations.

This means the core commercial unit is no longer only an image-generation unit. The more valuable unit is:

> Shopper intent + merchant catalog → personalized recommendation → visual validation → measurable conversion signal.

### 4.4 AI discovery evidence

VisuTry already receives meaningful AI-assistant referral traffic in addition to search traffic.

This should be treated as an early operating signal, not proof of a finished channel strategy:

> AI assistants and future shopping agents are becoming an additional acquisition surface that Store should be designed to understand, attribute, and eventually serve directly.

---

## 5. What Is Not Working as the Primary Strategy

### 5.1 Consumer subscription-first pricing

Ordinary consumers do not usually need glasses try-on every month. Their job is episodic:

- choose glasses;
- validate a few frames;
- compare candidates;
- buy or visit a store.

This makes a monthly or annual consumer subscription difficult to justify as the default commercial path.

Subscriptions can remain available, but they should not be the main story for casual shoppers.

### 5.2 Isolated face analysis as a paid product

A paid face analysis report can work for high-intent users, but basic face-shape identification is increasingly a free acquisition job.

The free detector should answer the first question quickly:

> What is my likely face shape?

Paid value should come from the next decision layers:

- deeper glasses recommendation;
- specific-frame try-on;
- multi-frame comparison;
- saved history;
- shareable report;
- merchant or consultant workflow.

### 5.3 Page-count-first SEO

Older plans to generate 1000+ pages should not be treated as the first commercial priority.

The current priority is not more pages by default. It is a tighter commercial loop:

> qualified traffic → useful decision experience → recommendation / try-on / compare → intent → conversion.

Programmatic SEO may still matter later, but only when each page has a distinct user intent, clear product continuation, and enough quality to avoid thin-page risk.

### 5.4 Generic merchant storefront positioning

VisuTry should not compete primarily as a generic ecommerce storefront, website builder, EHR/PMS replacement, inventory ERP, or CRM.

Those categories create heavy integration and implementation requirements while moving VisuTry away from its strongest differentiated asset: eyewear decision intelligence.

The Store product should sit between traffic and commerce:

```text
Traffic / Audience
      ↓
VisuTry AI Commerce Experience
      ↓
Recommendation / Try-On / Compare
      ↓
Purchase Intent
      ↓
Merchant Commerce System
```

---

## 6. Target Customer Layers

### 6.1 Consumer: Free entry + one-time / credits conversion

Consumers are still important, but their role is not primarily recurring subscription revenue.

Consumer product role:

- capture search demand;
- prove product value quickly;
- collect behavior data;
- convert high-intent users to one-time reports or credits packs;
- generate shareable assets and SEO/GEO signals.

Recommended consumer monetization:

| Product | Role |
| --- | --- |
| Free Face Shape Detector | Acquisition and trust. |
| One-time Style / Advisor Report | Paid guidance for higher-intent users. |
| Credits Pack | Main casual paid product for try-on and comparison. |
| Subscription | Secondary option for heavy users only. |

### 6.2 Prosumer: Stylists and eyewear consultants

Prosumer users may include:

- eyewear stylists;
- personal image consultants;
- boutique fashion consultants;
- optician-adjacent advisors;
- creators who provide styling recommendations.

Their likely workflow:

1. Upload or receive a client photo.
2. Generate face-shape and style direction.
3. Upload or choose multiple candidate frames.
4. Generate try-on and comparison results.
5. Send a client-facing report link or PDF-like page.
6. Repeat for the next client.

Prosumer product opportunity:

> VisuTry Studio: a client recommendation workspace for eyewear styling and visual decision support.

Key capabilities:

- client profiles;
- report links;
- saved recommendations;
- multi-frame comparison;
- advisor notes;
- branded or semi-branded deliverables.

### 6.3 B2B: Optical stores, eyewear sellers, and commerce merchants

B2B users may include:

- independent optical stores;
- small eyewear retailers;
- DTC eyewear brands;
- Shopify eyewear stores;
- WooCommerce eyewear stores;
- Instagram/TikTok eyewear sellers;
- online sellers with limited technical resources.

Their commercial job is not entertainment. Their job is:

> Turn qualified traffic into confident shoppers, measurable purchase intent, and more revenue.

B2B product opportunity:

> **VisuTry Store: an AI Commerce / Campaign Engine for eyewear merchants.**

The hosted merchant Storefront remains the first delivery surface, but it should be treated as one deployment mode of a broader engine rather than the final product definition.

Core capabilities:

- merchant identity and catalog;
- AI frame intelligence;
- shopper face/style understanding;
- merchant-specific recommendation;
- virtual try-on and frame compare;
- purchase-intent capture;
- source / campaign attribution;
- conversion-oriented merchant analytics;
- agent-ready product and campaign surfaces;
- hosted experience first, widget / platform / API surfaces later when justified by demand.

### 6.4 Partner channel: agencies, resellers, and platform wrappers

Partner users may include:

- Shopify/WooCommerce agencies;
- boutique ecommerce implementers;
- eyewear/fashion marketing agencies;
- regional resellers;
- commerce platforms or vertical SaaS providers.

Partner strategy should be cautious.

The goal is not to build bespoke white-label systems too early. The better path is:

1. Use generic hosted campaign/store flows as the core.
2. Allow co-branding or reseller rollout only where it supports real merchant distribution.
3. Keep privacy boundaries strict: partners should not access raw end-user face images by default.
4. Avoid partner-specific engineering unless there is active demand and a clear path to recurring revenue.

---

## 7. Product Packaging Direction

### 7.1 VisuTry Free

Purpose:

- acquire consumer traffic;
- build trust;
- produce activation data;
- route users into Advisor, Try-On, Compare, or content.

Includes:

- free face-shape estimate;
- browser-side processing where applicable;
- basic frame direction suggestions;
- continuation CTAs.

Does not include:

- deep VLM report by default;
- unlimited generated try-ons;
- saved long-term history by default;
- merchant workflows.

### 7.2 VisuTry Report / Glasses Advisor

Purpose:

- deepen personalized recommendation;
- convert users who want more than a face-shape label;
- create a bridge into try-on and comparison.

Includes:

- AI-generated glasses recommendation report;
- frame direction explanation;
- style guidance;
- top frame directions;
- continuation into try-on.

Pricing direction:

- one-time unlock or credit-based usage;
- not subscription-first.

### 7.3 VisuTry Credits Pack

Purpose:

- main casual paid product;
- supports repeated try-on and comparison;
- low-friction purchase.

Positioning:

> Continue comparing frames with a one-time credits pack. No subscription required.

### 7.4 VisuTry Studio

Target:

- stylists;
- consultants;
- service professionals;
- small creators providing eyewear or image advice.

Purpose:

- repeatable client workflow;
- recommendation report generation;
- visual comparison deliverables.

Possible pricing:

- monthly plan;
- usage-based bundle;
- report quota.

### 7.5 VisuTry Store / Campaign Engine

Target:

- independent optical stores;
- eyewear sellers;
- DTC brands;
- social sellers;
- ecommerce/growth teams running traffic campaigns.

Purpose:

- convert merchant traffic into personalized eyewear decisions;
- connect shopper intent to the merchant's own catalog;
- measure recommendation, try-on, compare, product click, inquiry, and later revenue outcomes;
- support both human discovery traffic and AI-assistant / agent-originated traffic.

Product hierarchy:

1. **Storefront — delivery surface.** Hosted merchant-specific experience that is easiest to demo, sell, and deploy.
2. **Campaign Engine — commercial product.** Merchant → campaign/audience/intent → catalog subset → AI experience → conversion metrics.
3. **Commerce Intelligence — expansion layer.** Understand which shoppers, frames, sources, and campaigns produce stronger intent and conversion.
4. **Commerce Infrastructure — later distribution layer.** Widget, Shopify/WooCommerce wrappers, APIs, agent actions, and platform integrations after repeated demand.

Possible pricing evolution:

- first pilots: merchant SaaS + included usage;
- early growth: merchant plan + campaign/usage tiers;
- later: higher-value analytics, attributed conversion, transaction/affiliate, or performance-linked components when evidence supports them.

Do not force the mature pricing model into the first pilot. The immediate objective remains willingness-to-pay and workflow validation.

### 7.6 VisuTry Widget / SDK

Target:

- merchants with ecommerce sites;
- agencies;
- platform integrations.

Purpose:

- embed recommendation / try-on / compare capability into product pages or campaign flows.

Sequence:

1. Hosted advisor/campaign Store first.
2. Generic iframe/script widget second when placement demand repeats.
3. Shopify beta wrapper after merchant validation.
4. WooCommerce wrapper after generic widget is stable.
5. Public API and agent-action interfaces only after repeated technical buyer or agent-channel demand.

---

## 8. Product Workflow Strategy

### 8.1 Consumer workflow

Recommended consumer path:

1. Free Face Shape Detector.
2. Basic frame direction suggestions.
3. Continue to Glasses Advisor, Virtual Try-On, or Frame Compare.
4. Use free/initial try-on where available.
5. Convert to one-time report or credits pack.
6. Save/share results.

Key principle:

> Do not block the first useful result behind login or payment when the search intent is low-commitment discovery.

### 8.2 Prosumer workflow

Recommended consultant path:

1. Create or open a client profile.
2. Upload client photo.
3. Generate face-shape and frame direction analysis.
4. Add candidate frames.
5. Generate try-on and comparison output.
6. Send a shareable report link.
7. Repeat for another client.

Key principle:

> The paid object is not a single try-on image. It is a client-ready recommendation deliverable.

### 8.3 Merchant workflow

Recommended merchant path:

1. Merchant creates a Store/campaign profile.
2. Merchant uploads or connects a representative frame catalog.
3. Merchant chooses a campaign intent, audience, or catalog subset where useful; the first MVP may default to one Store-wide campaign.
4. VisuTry exposes a hosted shopper experience first, then later widget/platform surfaces when demand is proven.
5. Anonymous shopper enters from search, social, ads, email, QR, direct, referral, or an AI assistant/agent.
6. Shopper receives personalized recommendation, try-on, and compare without mandatory account creation.
7. Shopper expresses product, favorite, inquiry, or later checkout intent.
8. Merchant dashboard records source, journey, frame, intent, and conversion signals.

Key principle:

> The merchant does not buy image generation or a generic storefront. The merchant buys a measurable AI conversion experience.

### 8.4 Agent-ready commerce workflow

Store should increasingly support two acquisition classes:

```text
Human Traffic
Search / Social / Ads / Email / QR / Direct

AI-Agent Traffic
ChatGPT / Claude / Perplexity / Gemini / future shopping agents
```

The required capability model is:

1. **Discoverable** — merchant, campaign, and product/frame surfaces can be found by search and AI systems when intended to be public.
2. **Understandable** — merchant catalog and campaign information use stable URLs, explicit product facts, structured metadata, and consistent semantics.
3. **Actionable** — later interfaces may allow agents to request recommendation, product shortlist, try-on/compare continuation, or purchase destinations without duplicating the Store core.
4. **Measurable** — source/referrer, campaign attribution, agent-originated sessions, recommendation, try-on, intent, and revenue can be measured.

Important boundary:

> Agent-readiness is a product and data-contract requirement now; broad public agent APIs are not an immediate build requirement.

The first implementation should optimize public Store/campaign pages, catalog metadata, source attribution, and conversion measurement before building autonomous agent actions.

---

## 9. Pricing Direction

### 9.1 Consumer pricing

Consumer pricing should be simple and aligned with low-frequency use.

Recommended direction:

| Offering | Suggested role |
| --- | --- |
| Free Detector | Always free. |
| One-time Advisor / Report | Optional paid unlock. |
| Credits Pack | Main casual paid product. |
| Subscription | Secondary heavy-user option. |

Consumer subscriptions should not be the primary homepage or pricing story unless future data proves repeated monthly use.

### 9.2 Prosumer pricing

Prosumer pricing can support recurring revenue because usage is client-based.

Possible model:

- monthly plan with report quota;
- additional credits for extra try-ons;
- branded report add-on;
- client history retention.

### 9.3 B2B pricing

B2B pricing should not expose consumer credits as the main concept.

Near-term validation model:

- monthly merchant plan;
- included successful-render / shopper-session allowance;
- simple usage overage where needed;
- optional setup fee for assisted onboarding;
- manual billing is acceptable for first pilots.

Longer-term expansion model, only after evidence:

- campaign tiers or active-campaign limits;
- traffic / engaged-shopper / successful-render usage tiers;
- premium conversion analytics;
- attributed transaction / affiliate / performance-linked revenue where technically and commercially justified.

The strategic objective is to move Store budget perception from a low-value VTO utility toward a measurable ecommerce / growth / revenue product.

---

## 10. Relationship to Existing Strategy Documents

This section defines the role of existing documents so the strategy system does not fragment.

| Document | Role | Status |
| --- | --- | --- |
| `docs/strategy/commercial-strategy.md` | Top-level commercial source of truth. | Active source of truth. |
| `docs/strategy/commercial-benchmarks.md` | External benchmark and market reference library for commercial strategy. | Living supporting reference. |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | B2B commerce roadmap and merchant/widget strategy. | Active supporting roadmap; lower-level wording should follow this Store / Campaign Engine thesis. |
| `docs/strategy/2026-06-28-free-face-shape-growth-commercialization-plan.md` | Free detector research, consumer growth evidence, credits conversion, ads/API sequencing. | Living supporting reference; not an execution plan. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Public product path, SEO/GEO page contracts, keyword ownership. | Active source of truth for SEO/GEO and public page architecture. |
| `docs/strategy/analytics/gtm.md` | Qualified-traffic acquisition, conversion, and measurement operating strategy. | Active source of truth for GTM execution. |
| `docs/strategy/seo/2026-06-12-growth-kpi-operating-plan.md` | Earlier commercial traffic KPI baseline and operating plan. | Superseded historical reference. |
| `docs/strategy/growth/2026-06-18-external-growth-sprint.md` | Earlier short-term external traffic sprint. | Superseded time-boxed plan. |
| `docs/strategy/reseller-technical-roadmap.md` | Reseller/co-branding technical considerations. | Supporting technical roadmap. |
| `docs/strategy/archive/seo/programmatic-seo-execution-plan.md` | Earlier large-scale programmatic SEO plan. | Archived historical reference; not current first-priority strategy. |
| `docs/project/seo-backlog.md` | SEO implementation backlog. | Active task backlog. |

Guideline:

- If a document conflicts with this commercial strategy, update the lower-level document or mark the conflict explicitly.
- If an older growth or channel plan conflicts with the GTM operating strategy, follow `docs/strategy/analytics/gtm.md`; historical tasks become active only after they are migrated into its current queue.
- If SEO/GEO page copy conflicts with the SEO/GEO sync document, follow the SEO/GEO sync document.
- If B2B implementation details conflict with the Store MVP / implementation plan, follow the current Store product specs and gates.
- If external benchmark notes become detailed, keep them in `docs/strategy/commercial-benchmarks.md`, not in this document.

---

## 11. Near-Term Roadmap

### Phase A: Keep the 2C acquisition and credits loop sharp

Goal:

- grow qualified traffic;
- improve first useful result;
- route users into advisor, try-on, compare, and credits pack.

Work:

- keep Face Shape Detector free and low-friction;
- improve Detector → Advisor/Try-On/Compare continuation;
- make Credits Pack the clearest casual paid product;
- track result-to-paid-intent funnel;
- avoid consumer subscription-first messaging.

### Phase B: Validate Store as the AI commerce conversion layer

Goal:

- prove that merchants value measurable shopper intent and conversion, not merely VTO functionality.

Current delivery surface:

- hosted merchant Store;
- small merchant catalog;
- anonymous shopper workflow;
- recommendation;
- try-on;
- compare;
- intent and merchant insight.

Validation:

- 3 merchants request own-frame samples, or equivalent evidence;
- 1 merchant agrees to a paid/deposit-backed pilot, or Product explicitly authorizes a live-data pilot;
- merchant conversations identify the KPI they will pay to improve: product click, inquiry, add-to-cart, conversion, appointment, or attributed revenue.

### Phase C: Make Store campaign-ready and agent-ready

Goal:

- turn the hosted Store from a single merchant experience into a reusable conversion engine that can accept multiple traffic sources and campaign intents.

Capabilities to add only as needed for pilot operation:

- stable source/campaign attribution;
- optional campaign/audience/catalog-subset configuration;
- conversion funnel by acquisition source;
- public, machine-understandable merchant and product/frame metadata where privacy-safe;
- AI-assistant / agent referral classification;
- agent-originated intent and revenue attribution.

Do not require a generalized campaign builder or public agent API for the first pilot.

### Phase D: Distribution surfaces and commerce infrastructure

Goal:

- distribute the proven conversion engine into merchant systems and agent ecosystems.

Sequence:

1. Hosted Store / campaign surface.
2. Generic iframe or script widget when merchant placement demand repeats.
3. Shopify beta wrapper.
4. WooCommerce beta wrapper.
5. Public API / agent actions after technical buyer or agent-channel pull.

### Phase E: VisuTry Studio validation

Studio remains a separate professional-workflow opportunity, but Store is the current primary B2B revenue engine to validate.

---

## 12. Open Questions

1. Which first merchant KPI best predicts willingness to pay: product click, inquiry, add-to-cart, conversion, appointment intent, attributed revenue, or merchant retention?
2. Is the hosted Store the dominant long-term surface, or primarily the first surface for a broader Campaign Engine?
3. When do merchants need multiple explicit campaigns versus one Store-wide conversion experience?
4. What is the minimum frame catalog schema needed for useful recommendation without becoming a full inventory system?
5. Which traffic/source dimensions are most valuable to merchants: search, social, ads, direct, referral, AI assistant/agent, or campaign-specific tags?
6. When does agent-readiness require an explicit action/API surface rather than strong public metadata and links?
7. What monthly usage unit best fits pricing: successful renders, engaged shopper sessions, active campaigns, conversion value, or a blended tier?
8. Should transaction / affiliate / performance revenue become part of the model after SaaS and attribution are validated?
9. How should privacy be presented when an anonymous shopper comes through merchant-paid or agent-originated flows?

---

## 13. Strategic Summary

VisuTry should be understood as an eyewear decision and conversion platform, not merely a virtual try-on image generator.

The recommended commercial direction is:

1. Use free consumer tools to capture high-intent eyewear decision demand and prove the intelligence layer.
2. Monetize casual consumers through one-time reports and credits packs rather than subscription-first pricing.
3. Treat Store as the primary recurring-revenue engine to validate.
4. Use the hosted Storefront as the first delivery surface, while building toward an AI Commerce / Campaign Engine.
5. Measure the merchant funnel from traffic source through recommendation, try-on, compare, purchase intent, and eventually revenue.
6. Design Store for both human traffic and AI-agent traffic through discoverable, understandable, actionable, and measurable commerce surfaces.
7. Add widget, Shopify/WooCommerce, public API, and agent actions only when repeated demand proves the need.

One-line internal strategy:

> **Free tools create demand; Store turns human and agent traffic into measurable eyewear purchase intent and recurring merchant revenue.**

---

## 14. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created unified commercial strategy and product-layer model. |
| 2026-08-06 | Reframed Store from merchant storefront/workspace to AI Commerce / Campaign Engine; defined Storefront as the first delivery surface, added human + AI-agent traffic strategy, agent-ready commerce requirements, conversion/revenue positioning, and campaign-oriented expansion path. |
