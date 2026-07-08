# VisuTry Commercial Strategy

**Status:** Active source of truth  
**Created:** 2026-07-08  
**Scope:** Commercial direction, product packaging, target customer layers, and the relationship between VisuTry's consumer, prosumer, and B2B strategies.

---

## 1. Purpose of This Document

This document is the top-level commercial strategy source of truth for VisuTry.

It does not replace the existing execution plans, SEO/GEO plans, B2B roadmap, or free detector commercialization plan. Instead, it defines the shared strategic logic that those documents should follow.

The key questions answered here are:

1. Who should VisuTry ultimately serve?
2. What role should the consumer product play?
3. Why is consumer subscription not the strongest primary monetization path?
4. How should Face Shape Detector, Glasses Advisor, Virtual Try-On, and Frame Compare be assembled into commercial workflows?
5. Which existing strategy documents remain active, supporting, or historical?
6. What should the next product and GTM work optimize for?

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

> Use the consumer product to capture high-intent eyewear decision demand, then convert the same capabilities into professional and merchant workflows where repeated usage, customer service, and sales conversion justify recurring payment.

In practical terms:

1. **2C is the acquisition and proof layer.**  
   Free detector, one-time report, credits pack, try-on, comparison, and shareable results create traffic, usage data, and lightweight revenue.

2. **Prosumer is the service workflow layer.**  
   Eyewear stylists, image consultants, and small service providers can use VisuTry repeatedly for client recommendations and report generation.

3. **B2B is the stronger recurring revenue layer.**  
   Optical stores, eyewear sellers, DTC eyewear brands, Shopify/WooCommerce merchants, and agencies need tools that improve shopper confidence, shortlist frames, and create purchase intent.

4. **The durable moat is workflow depth, not image generation alone.**  
   Basic virtual try-on can be copied. Harder-to-copy value comes from merchant onboarding, frame catalog management, recommendation logic, privacy trust, analytics, client reports, and eventually optical workflows.

---

## 4. What Is Already Proven

Current evidence should be interpreted conservatively but clearly.

### 4.1 Paid consumer evidence

Existing paid customers have bought the low-friction USD 2.99 Credits Pack. The paid behavior is concentrated in glasses try-on rather than broad universal try-on categories.

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

This means the core commercial unit is already visible:

> One shopper photo + one frame/product image → one useful try-on or recommendation outcome.

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

> qualified traffic → free detector/advisor/try-on → continuation → credits/report/merchant intent.

Programmatic SEO may still matter later, but only when each page has a distinct user intent, clear product continuation, and enough quality to avoid thin-page risk.

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

> Help shoppers choose frames with more confidence and create purchase, lead, or appointment intent.

B2B product opportunity:

> VisuTry Store: an AI eyewear advisor and try-on workspace for small optical businesses and eyewear sellers.

Core capabilities:

- merchant account;
- frame catalog;
- hosted advisor/try-on link;
- shopper face-shape and frame-interest flow;
- lead capture;
- saved favorites;
- merchant dashboard;
- lightweight analytics;
- branded report or result link.

### 6.4 Partner channel: agencies, resellers, and platform wrappers

Partner users may include:

- Shopify/WooCommerce agencies;
- boutique ecommerce implementers;
- eyewear/fashion marketing agencies;
- regional resellers;
- commerce platforms or vertical SaaS providers.

Partner strategy should be cautious.

The goal is not to build bespoke white-label systems too early. The better path is:

1. Use generic widget and hosted flows as the core.
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

### 7.5 VisuTry Store

Target:

- independent optical stores;
- eyewear sellers;
- small DTC brands;
- social sellers.

Purpose:

- shopper-facing advisor link;
- merchant catalog;
- lead capture;
- try-on analytics.

Possible pricing:

- Starter: small catalog / hosted link;
- Store: catalog + dashboard + analytics;
- Pro: widget, branding, higher quota, support.

### 7.6 VisuTry Widget / SDK

Target:

- merchants with ecommerce sites;
- agencies;
- platform integrations.

Purpose:

- embed try-on/advisor capability into product pages or store flows.

Sequence:

1. Hosted advisor/try-on link first.
2. Generic iframe/script widget second.
3. Shopify beta wrapper after merchant validation.
4. WooCommerce wrapper after generic widget is stable.
5. Public API only after repeated technical buyer demand.

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

1. Merchant creates store profile.
2. Merchant uploads frame catalog or starts with a small top-SKU set.
3. VisuTry generates hosted advisor/try-on link or widget snippet.
4. Shopper uploads photo and receives recommendation/try-on flow.
5. Shopper saves favorites or submits contact/purchase intent.
6. Merchant dashboard records lead, interest, frame, and conversion signals.

Key principle:

> The merchant does not buy image generation. The merchant buys better shopper decision support and measurable purchase intent.

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

Possible model:

- monthly plan by catalog size or enabled SKUs;
- included render quota;
- overage by successful render;
- setup fee for design partners;
- agency or reseller terms only after demand is proven.

---

## 10. Relationship to Existing Strategy Documents

This section defines the role of existing documents so the strategy system does not fragment.

| Document | Role | Status |
| --- | --- | --- |
| `docs/strategy/commercial-strategy.md` | Top-level commercial source of truth. | Active source of truth. |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | B2B commerce roadmap and merchant/widget strategy. | Active supporting roadmap. |
| `docs/strategy/2026-06-28-free-face-shape-growth-commercialization-plan.md` | Free detector, consumer growth, credits conversion, ads/API sequencing. | Active supporting plan. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Public product path, SEO/GEO page contracts, keyword ownership. | Active source of truth for SEO/GEO and public page architecture. |
| `docs/strategy/analytics/gtm.md` | GTM, SEO, analytics, and channel execution handbook. | Execution document. |
| `docs/strategy/seo/2026-06-12-growth-kpi-operating-plan.md` | Commercial traffic KPI operating plan. | Active operating plan. |
| `docs/strategy/growth/2026-06-18-external-growth-sprint.md` | Short-term external traffic sprint. | Time-boxed execution plan. |
| `docs/strategy/reseller-technical-roadmap.md` | Reseller/co-branding technical considerations. | Supporting technical roadmap. |
| `docs/strategy/seo/programmatic-seo-execution-plan.md` | Earlier large-scale programmatic SEO plan. | Historical/reference; not current first-priority strategy. |
| `docs/project/seo-backlog.md` | SEO implementation backlog. | Active task backlog. |

Guideline:

- If a document conflicts with this commercial strategy, update the lower-level document or mark the conflict explicitly.
- If SEO/GEO page copy conflicts with the SEO/GEO sync document, follow the SEO/GEO sync document.
- If B2B implementation details conflict with the B2B commerce roadmap, resolve inside that roadmap and reference the decision here only if it changes the top-level strategy.

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

### Phase B: Define VisuTry Studio MVP

Goal:

- validate whether professional individuals need repeated client-facing reports.

MVP capabilities:

- client profile or session;
- advisor report;
- multi-frame comparison;
- shareable report link;
- lightweight branding.

Validation:

- 5-10 stylists/consultants interviewed;
- 2-3 real client workflows tested;
- willingness to pay for recurring use or report bundles.

### Phase C: Define VisuTry Store MVP

Goal:

- validate merchant workflow before building a full platform app.

MVP capabilities:

- merchant profile;
- small frame catalog;
- hosted advisor/try-on link;
- lead capture;
- basic merchant dashboard;
- frame-interest analytics.

Validation:

- 3 merchants or 1 agency-backed merchant group;
- top-SKU pilot;
- measurable try-on opens and completions;
- merchant feedback on whether this helps sales or customer confidence.

### Phase D: Widget and platform wrappers

Goal:

- turn the hosted workflow into embeddable commerce infrastructure.

Sequence:

1. Generic hosted page.
2. iframe or script widget.
3. Shopify beta wrapper.
4. WooCommerce beta wrapper.
5. Public API only after technical buyer pull.

---

## 12. Open Questions

1. Should VisuTry Studio and VisuTry Store be separate products, or one merchant/pro dashboard with different modes?
2. Should the first professional workflow focus on eyewear stylists or independent optical stores?
3. Should the merchant MVP start with hosted links only, or include a basic embeddable widget from day one?
4. What is the minimum frame catalog schema needed for useful recommendation without becoming a full inventory system?
5. Should credits remain visible in B2B plans, or be fully abstracted into render quota?
6. How should privacy be presented when the consumer uses free browser-side detection versus merchant-paid try-on flows?
7. Which metric should become the B2B north star: try-on completion, saved frame, lead submission, add-to-cart lift, appointment request, or merchant retention?

---

## 13. Strategic Summary

VisuTry should be understood as an eyewear decision platform, not merely a virtual try-on image generator.

The recommended commercial direction is:

1. Use free consumer tools to capture high-intent eyewear decision demand.
2. Monetize casual consumers through one-time reports and credits packs rather than subscription-first pricing.
3. Convert proven consumer workflows into prosumer and merchant workflows.
4. Build toward VisuTry Studio, VisuTry Store, and VisuTry Widget as recurring revenue products.
5. Let existing strategy documents remain as supporting roadmaps and operating plans, while this document defines the unified commercial direction.

One-line internal strategy:

> Free tools create demand, credits monetize immediate decisions, and professional workflows create recurring revenue.
