# VisuTry Store Landing Page Spec

**Status:** Ready for validation — first market test before Store MVP engineering  
**Owner:** Product / Growth  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Related plan:** `docs/product/product-plan.md`  
**Related spec:** `docs/product/specs/visutry-store-mvp.md`

---

## 1. Purpose

This spec defines the first market validation asset for VisuTry Store: a focused B2B landing page and pilot CTA.

The goal is not to launch the full Store product. The goal is to validate whether independent optical stores, eyewear sellers, small eyewear brands, stylists, and boutique agencies understand the hosted VisuTry Store workflow and are willing to request a sample Store link, book a demo, or join a pilot.

---

## 2. Decision

Before building full Store MVP infrastructure, VisuTry should create a Store landing page.

The landing page should validate demand for:

- a hosted AI eyewear advisor and try-on link;
- a small merchant frame catalog;
- shopper photo upload and frame comparison;
- favorites / lead capture;
- simple usage reporting;
- a paid or deposit-backed pilot.

This page is a market validation asset. It is not a blog, not a full product area, and not a Shopify / WooCommerce / API launch.

---

## 3. Why Landing Page Before Blog

A blog is useful for long-term SEO and education, but it is too slow and indirect for the first Store validation.

The first validation needs direct evidence:

1. Do target merchants understand the value proposition?
2. Do they want a sample hosted Store link?
3. Are they willing to send frames for a pilot?
4. Are they willing to talk to VisuTry?
5. Are they willing to pay for a setup, pilot, or starter subscription?

A landing page with a concrete pilot CTA is better for this stage than a broad blog strategy.

Blog/content work should come after the value proposition and ICP are validated.

---

## 4. Target Audience

Primary audience:

- independent optical stores;
- small eyewear ecommerce sellers;
- Shopify-native DTC eyewear brands;
- frame stylists and image consultants;
- boutique ecommerce agencies serving eyewear, fashion, or accessories merchants.

Do not initially target:

- enterprise eyewear chains;
- prescription-first clinics requiring medical-grade claims;
- merchants that require full white-label deployment before testing;
- merchants that require real-time 3D AR as the starting point;
- EHR/PMS-integrated optical practices.

---

## 5. Core Positioning

### One-line positioning

> AI eyewear advisor and try-on link for optical stores and eyewear sellers.

### Product explanation

VisuTry Store gives a small eyewear business a hosted link where shoppers can upload a photo, receive AI-assisted frame guidance, try on selected frames, compare looks, and share interest signals with the merchant.

### Workflow positioning

The page should sell the workflow, not just the visual try-on technology:

> Upload frames → Share your Store link → Shoppers try and compare → You receive favorites, leads, and frame interest data.

---

## 6. Page Goal

The page should produce one of four outcomes:

1. Visitor requests a sample Store link.
2. Visitor joins the Store pilot.
3. Visitor books a short demo conversation.
4. Visitor submits business information and frame count.

Primary CTA:

> Get a sample Store Link

Secondary CTAs:

- Join the pilot
- Book a demo
- Send us your frames

Avoid `Buy now` in v0. This is a validation page, not a mature self-serve checkout flow.

---

## 7. Proposed Route

Preferred route:

```text
/en/store
```

Potential localized route later:

```text
/[locale]/store
```

The page should be public and indexable unless a separate private pilot page is created.

---

## 8. Information Architecture

### 8.1 Hero

Purpose: immediately explain what the product is and who it is for.

Suggested content:

- headline: `AI eyewear advisor & try-on link for optical stores`
- subheadline: `Help shoppers choose frames online with face-shape guidance, virtual try-on, side-by-side comparison, and lead capture.`
- CTA: `Get a sample Store Link`
- secondary CTA: `Join the pilot`

### 8.2 Problem

Explain the merchant pain:

- shoppers hesitate because they cannot judge which frames fit their face and style;
- merchants lose intent before shoppers visit, message, or buy;
- generic virtual try-on tools show images but do not capture preference or sales intent;
- small merchants do not want to build a full AR commerce stack.

### 8.3 Workflow

Show a simple four-step workflow:

1. Add your top frames.
2. Share your hosted Store link.
3. Shoppers upload, try on, and compare.
4. You receive favorites, leads, and usage signals.

### 8.4 Product Preview

Show or describe the minimum Store experience:

- merchant-branded hosted page;
- small frame catalog;
- shopper upload;
- AI frame guidance;
- frame comparison;
- lead / favorite capture;
- basic usage report.

The first page can use screenshots, stylized mockups, or current VisuTry capabilities if accurate. Do not imply unavailable merchant dashboard depth.

### 8.5 Why Not Just Virtual Try-On

Position VisuTry Store as a decision workflow:

- recommendation;
- try-on;
- comparison;
- favorites;
- lead capture;
- merchant usage signals.

### 8.6 Pilot Offer

Suggested copy:

> We help set up your first 8-20 frames, create a hosted Store link, and send you a simple usage report during a 30-day pilot.

The pilot should be framed as limited and collaborative, not as a fully mature SaaS plan.

### 8.7 Lead Form

Minimum fields:

- name;
- email;
- business name;
- business type;
- website / Instagram / store link;
- approximate number of frames;
- desired action: sample link / pilot / demo.

Optional fields:

- country / region;
- ecommerce platform;
- current virtual try-on tool;
- notes.

### 8.8 Trust / Privacy

Must state:

- shopper photos are used for try-on / analysis workflow;
- merchants should not receive raw face images by default;
- VisuTry Store is visual decision support, not a medical or optical fit guarantee;
- retention and deletion behavior should be explained before upload in the actual hosted flow.

---

## 9. Validation Metrics

Track page-level and funnel-level metrics:

| Metric | Why it matters |
| --- | --- |
| Store page views | Basic demand / traffic. |
| CTA clicks | Messaging resonance. |
| Lead form starts | Intent strength. |
| Lead form submissions | Qualified interest. |
| Sample link requests | Product-shape interest. |
| Pilot requests | Commercial intent. |
| Demo requests | Sales intent. |
| Merchant type distribution | ICP clarity. |
| Frame count distribution | Catalog / setup implications. |
| Source / campaign | Which outbound or content path works. |

Minimum events:

| Event | Trigger |
| --- | --- |
| `store_landing_viewed` | Store landing page loaded. |
| `store_cta_clicked` | Primary or secondary CTA clicked. |
| `store_lead_form_started` | Visitor begins the lead form. |
| `store_lead_submitted` | Visitor submits the lead form. |
| `store_sample_link_requested` | Visitor selects sample link request. |
| `store_pilot_requested` | Visitor selects pilot interest. |
| `store_demo_requested` | Visitor selects demo interest. |

---

## 10. Validation Targets

First 30-45 days:

- 20-50 targeted outbound prospects contacted;
- 10+ qualified Store page visits from target accounts;
- 3+ qualified lead form submissions;
- 3 merchant / agency / stylist conversations;
- 1 serious pilot candidate, ideally paid or deposit-backed.

The target is not high SEO traffic. The target is qualified workflow interest.

---

## 11. Implementation Notes

### Minimum implementation

- static marketing route;
- lead capture form;
- email notification or simple lead storage;
- basic analytics events;
- privacy note;
- CTA links with UTM support.

### Acceptable v0 lead destinations

- Resend email notification;
- database lead table;
- Airtable / Google Sheet if already operationally easy;
- admin-only manual review.

Do not build full merchant onboarding before validation requires it.

---

## 12. Non-goals

This landing page does not include:

- merchant dashboard implementation;
- merchant account onboarding;
- Shopify app installation;
- WooCommerce plugin;
- public API;
- self-serve billing;
- full catalog upload workflow;
- medical-grade fit or PD claims;
- broad content blog strategy.

---

## 13. Ready for Engineering Criteria

The landing page is ready for engineering when:

1. route is confirmed;
2. CTA destination is confirmed;
3. lead form fields are approved;
4. privacy copy is approved;
5. analytics events are approved;
6. page sections are approved;
7. first validation target list or outbound motion is prepared.

Current status: ready for validation planning; route and lead capture implementation can proceed as a lightweight product / growth task.

---

## 14. Relationship to Store MVP

This page is the entry point for Store MVP validation.

If the landing page and outbound validation produce qualified interest, update `docs/product/specs/visutry-store-mvp.md` from `Ready for validation` toward `Ready for engineering`.

If the landing page does not produce qualified interest after targeted outreach, revisit the ICP, positioning, offer shape, or pricing before building Store infrastructure.

---

## 15. Open Questions

1. Should the first CTA submit to email only, or create a database lead?
2. Should the primary CTA be `Get a sample Store Link` or `Join the pilot`?
3. Should the page show current Frame Compare screenshots or custom Store mockups?
4. Should we offer a free discovery demo or require a small setup fee / refundable deposit?
5. Should initial validation target optical stores, Shopify eyewear brands, stylists, or agencies first?
6. Should the first Store demo use VisuTry's 16 preset frames or a sample merchant-style catalog?
7. Should the page be English-only first, or also localized?

---

## 16. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created Store landing page validation spec. |
