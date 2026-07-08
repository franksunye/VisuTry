# VisuTry Commercial Strategy

**Status:** Active source of truth  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Scope:** Top-level commercial direction, product packaging, target customer layers, and document hierarchy.

---

## 1. Purpose

This document defines VisuTry's current commercial strategy.

It should stay concise. External market references, competitor notes, revenue hypotheses, and benchmark details belong in `docs/strategy/commercial-benchmarks.md`. Execution details belong in roadmap, GTM, SEO, growth, and product specification documents.

Working rule:

> Commercial strategy makes decisions. Benchmarks collect evidence. Roadmaps define execution.

---

## 2. Strategic Thesis

VisuTry should not be positioned primarily as a consumer subscription product or a generic AI image-generation tool.

The stronger commercial thesis is:

> Use free and low-friction consumer tools to capture high-intent eyewear decision demand, then convert the same capabilities into professional and merchant workflows where repeated usage, client service, and shopper conversion justify recurring payment.

In practical terms:

1. **2C is the acquisition and proof layer.**  
   Free detector, one-time report, credits pack, try-on, comparison, and shareable results create traffic, usage evidence, and lightweight revenue.

2. **Prosumer is the service workflow layer.**  
   Eyewear stylists, image consultants, and small service providers can use VisuTry repeatedly for client recommendations and report generation.

3. **B2B is the stronger recurring revenue layer.**  
   Optical stores, eyewear sellers, DTC eyewear brands, Shopify/WooCommerce merchants, and agencies need tools that improve shopper confidence, shortlist frames, and create purchase intent.

4. **Workflow depth is the moat.**  
   Basic virtual try-on can be copied. Harder-to-copy value comes from frame catalog management, recommendation logic, client/report workflow, merchant analytics, privacy trust, and follow-up.

---

## 3. Product Architecture

The current public product path is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

Each product answers a distinct user question:

| Product | User question | Commercial role |
| --- | --- | --- |
| Face Shape Detector | What is my likely face shape? | Free acquisition and activation. |
| Glasses Advisor | Which frame directions are worth trying, and why? | Deeper recommendation and paid guidance. |
| Virtual Try-On | How does one specific product image look on my photo? | Visual proof and credits revenue. |
| Frame Compare | Which of several candidate frames looks best side by side? | Repeat usage, decision support, and credits revenue. |

This path should remain the consumer-facing architecture unless new evidence invalidates it.

---

## 4. Target Customer Layers

| Layer | Target users | Commercial role |
| --- | --- | --- |
| Consumer | High-intent eyewear shoppers | Free acquisition, one-time report, credits pack, product proof. |
| Prosumer | Stylists, image consultants, eyewear advisors | Repeat client workflow, report links, recommendation deliverables. |
| B2B merchant | Optical stores, eyewear sellers, DTC brands, Shopify/WooCommerce stores | Catalog, shopper advisor flow, try-on, lead capture, analytics. |
| Partner channel | Agencies, resellers, platform wrappers | Distribution after workflow validation, not bespoke white-label first. |

Priority sequence:

1. Keep the consumer acquisition and credits loop working.
2. Validate a professional workflow with stylists or consultants.
3. Validate a merchant workflow with small eyewear sellers or optical stores.
4. Package the proven workflow into hosted links, widgets, and later platform wrappers.

---

## 5. Product Packaging Direction

| Product package | Target | Role |
| --- | --- | --- |
| VisuTry Free | Consumers | Free face-shape detection and first-step guidance. |
| VisuTry Report / Glasses Advisor | High-intent consumers and prosumers | Deeper personalized recommendations and style guidance. |
| VisuTry Credits Pack | Consumers and light users | Low-friction one-time paid usage for try-on and comparison. |
| VisuTry Studio | Stylists and consultants | Client recommendation workspace and shareable reports. |
| VisuTry Store | Optical stores and eyewear sellers | Merchant catalog, public advisor link, lead capture, and analytics. |
| VisuTry Widget / SDK | Merchants, agencies, platforms | Embedded distribution shell after workflow validation. |

Key packaging principle:

> Do not sell image generation alone. Sell decision support, recommendation workflow, and measurable intent.

---

## 6. Pricing Direction

### Consumer

Consumer pricing should match low-frequency, high-intent usage.

Recommended order:

1. Free Face Shape Detector.
2. One-time Advisor / Report unlock.
3. Credits Pack for try-on and comparison.
4. Subscription only as a secondary option for heavy users.

Consumer subscription should not be the primary commercial story unless future data proves repeated monthly use.

### Prosumer

Prosumer pricing can support recurring revenue because usage is client-based.

Possible models:

- monthly plan with report quota;
- usage-based bundle;
- client history and branded report add-ons.

### B2B

B2B pricing should abstract consumer credits into business-friendly units.

Possible models:

- monthly plan by catalog size, enabled SKUs, or usage quota;
- included successful render quota;
- overage by successful render;
- setup fee for design partners;
- agency/reseller terms only after demand is proven.

---

## 7. Near-Term Roadmap

### Phase A: Consumer loop

Goal: grow qualified traffic and improve Detector → Advisor → Try-On → Compare → Credits continuation.

Focus:

- keep Face Shape Detector free and low-friction;
- make Credits Pack the clearest casual paid product;
- track result-to-paid-intent funnel;
- avoid consumer subscription-first messaging.

### Phase B: VisuTry Studio validation

Goal: test whether professional individuals need repeated client-facing reports.

MVP:

- client/session profile;
- advisor report;
- multi-frame comparison;
- shareable report link;
- lightweight branding.

### Phase C: VisuTry Store validation

Goal: test merchant workflow before building full platform apps.

MVP:

- merchant profile;
- small frame catalog;
- hosted advisor/try-on link;
- lead capture;
- basic merchant dashboard;
- frame-interest analytics.

### Phase D: Widget and platform wrappers

Sequence:

1. Hosted merchant/advisor page.
2. iframe or script widget.
3. Shopify beta wrapper.
4. WooCommerce beta wrapper.
5. Public API only after technical buyer pull.

---

## 8. Relationship to Existing Documents

| Document | Role | Status |
| --- | --- | --- |
| `docs/strategy/commercial-strategy.md` | Top-level commercial source of truth. | Active source of truth. |
| `docs/strategy/commercial-benchmarks.md` | External benchmark and market reference library. | Living supporting reference. |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | B2B commerce roadmap and merchant/widget strategy. | Active supporting roadmap. |
| `docs/strategy/2026-06-28-free-face-shape-growth-commercialization-plan.md` | Free detector, consumer growth, credits conversion, ads/API sequencing. | Active supporting plan. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Public product path, SEO/GEO page contracts, keyword ownership. | Active source of truth for SEO/GEO and public page architecture. |
| `docs/strategy/analytics/gtm.md` | GTM, SEO, analytics, and channel execution handbook. | Execution document. |
| `docs/strategy/seo/2026-06-12-growth-kpi-operating-plan.md` | Commercial traffic KPI operating plan. | Active operating plan. |
| `docs/strategy/growth/2026-06-18-external-growth-sprint.md` | Short-term external traffic sprint. | Time-boxed execution plan. |
| `docs/strategy/reseller-technical-roadmap.md` | Reseller/co-branding technical considerations. | Supporting technical roadmap. |
| `docs/strategy/archive/seo/programmatic-seo-execution-plan.md` | Earlier page-count-first programmatic SEO plan. | Archived historical reference. |
| `docs/project/seo-backlog.md` | SEO implementation backlog. | Active task backlog. |

Guidelines:

- If lower-level documents conflict with this strategy, update the lower-level document or mark the conflict explicitly.
- If external benchmark notes grow large, keep them in `commercial-benchmarks.md`, not here.
- If execution detail grows large, create or update a roadmap/spec instead of expanding this document.

---

## 9. Strategic Summary

VisuTry should be understood as an eyewear decision platform, not merely a virtual try-on image generator.

One-line internal strategy:

> Free tools create demand, credits monetize immediate decisions, and professional workflows create recurring revenue.
