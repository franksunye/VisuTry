# VisuTry Store MVP Spec

**Status:** Ready for validation — not ready for full engineering build  
**Owner:** Product  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Related plan:** `docs/product/product-plan.md`  
**Related validation spec:** `docs/product/specs/visutry-store-landing-page.md`  
**Related roadmap:** `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md`

---

## 1. Problem

VisuTry's stronger recurring revenue opportunity is not casual consumer subscription. It is a merchant workflow that helps eyewear sellers and optical stores create shopper confidence, frame interest, lead capture, and measurable purchase intent.

However, building a full Shopify app, WooCommerce plugin, public API, or EHR/PMS integration before workflow validation would be premature.

---

## 2. Goal

Define the smallest VisuTry Store MVP that can validate merchant demand without overbuilding platform integrations.

The first version should be a hosted advisor / try-on workflow that a merchant can share or preview before any public app-store launch.

This spec is ready for merchant / agency validation. It is not yet an engineering-ready full implementation spec.

The immediate validation asset should be the Store landing page defined in `docs/product/specs/visutry-store-landing-page.md`. The landing page tests positioning, ICP, and pilot interest before full Store MVP engineering starts.

---

## 3. Validation Thesis

The first B2B validation should test whether merchants value a hosted eyewear decision workflow enough to continue into a paid pilot or deeper integration.

Validation question:

> Will an eyewear seller, optical store, or commerce agency use a hosted VisuTry link to help shoppers choose frames, capture intent, and measure frame interest before asking for Shopify, WooCommerce, widget, or API work?

Validation should prioritize workflow demand, not platform completeness.

First validation step:

> Launch a Store landing page with a sample Store Link / pilot CTA, then use targeted outreach to collect qualified merchant, agency, or stylist interest before building full Store infrastructure.

---

## 4. Non-goals

This MVP does not include:

- public Shopify app listing;
- WooCommerce plugin;
- EHR/PMS integration;
- medical-grade PD measurement;
- full white-label deployment;
- full inventory sync;
- enterprise SSO;
- raw public API as the primary product.

---

## 5. Target Users

Primary early buyers / validators:

- small eyewear sellers;
- Shopify-native DTC eyewear brands;
- independent optical stores with online sales or pre-shop interest;
- social sellers on Instagram / TikTok;
- boutique ecommerce agencies serving eyewear, fashion, or accessories merchants.

Avoid as first customers:

- large enterprise retailers requiring procurement and security review;
- prescription-first clinics requiring medical-grade claims;
- partners demanding full custom white-label deployment;
- merchants requiring real-time 3D AR before testing the workflow.

---

## 6. MVP Product Shape

### Merchant setup

- Merchant profile.
- Store name and logo.
- Contact email.
- Privacy / retention defaults.
- Optional brand color or lightweight theme.

### Frame catalog

Start with a small top-SKU set, not a full catalog.

Minimum frame fields:

| Field | Purpose | Required for validation |
| --- | --- | --- |
| `frameId` | Internal identifier. | Yes |
| `merchantId` | Owner. | Yes |
| `name` | Display name. | Yes |
| `sku` | Merchant reference. | Yes |
| `imageUrl` | Frame image for try-on. | Yes |
| `productUrl` | Optional purchase or product page link. | Preferred |
| `price` | Optional display / analytics. | Optional |
| `status` | Active / inactive. | Yes |
| `tags` | Shape, material, width, style, gender, etc. | Preferred |

### Hosted shopper flow

1. Shopper opens merchant-specific hosted link.
2. Shopper sees merchant context and privacy notice.
3. Shopper uploads photo.
4. Shopper selects or receives recommended frames.
5. VisuTry generates try-on results.
6. Shopper can compare frames.
7. Shopper saves favorites or submits contact / purchase intent.
8. Merchant can review basic interest signals.

### Merchant dashboard

First version can be simple and may be admin-assisted during validation:

- enabled frames;
- try-on opens;
- completed try-ons;
- failed try-ons;
- top frames by interest;
- lead submissions;
- render usage and quota;
- basic failure report.

---

## 7. Validation Package v0

The first validation package should be small enough to show, sell, or manually operate.

### Offer shape

**VisuTry Store Pilot v0**

- merchant name / logo;
- 8-20 frames in a small catalog;
- hosted advisor / compare link;
- shopper photo upload;
- frame try-on and comparison;
- favorites or lead capture;
- simple weekly usage report;
- 30-day pilot window.

### Validation assets

Before engineering a full merchant system, prepare:

1. Store landing page with clear ICP, workflow, and pilot CTA;
2. one-page merchant pitch;
3. clickable or live hosted demo using representative frames;
4. pilot onboarding checklist;
5. privacy and image-retention explanation;
6. expected metrics report template;
7. pricing hypothesis for pilot and continuation.

The landing page is the first validation asset and should be used before building merchant account, catalog management, or dashboard infrastructure.

### Validation target

Validate with:

- 3 eyewear merchants; or
- 1 boutique agency with 2-3 relevant merchant clients; or
- 5 stylist / eyewear consultant conversations if merchant access is slower.

---

## 8. Functional Requirements

### Merchant account

- Create merchant profile manually or through admin in first version.
- Assign hosted link slug or store ID.
- Associate frame records with merchant.
- Track merchant usage separately from consumer credits.

### Hosted link

- Public or semi-public merchant link.
- Merchant branding visible but not full white-label.
- Clear privacy and retention notice.
- Mobile-first flow.
- No B2C pricing prompts inside merchant-paid sessions unless configured.

### Frame catalog

- Add, edit, deactivate frames.
- Upload or reference frame images.
- Allow a small top-SKU list first.
- Do not require full inventory sync.

### Shopper flow

- Upload user photo.
- Choose frame or receive recommendation.
- Generate try-on.
- Compare selected frames.
- Save favorite or submit contact.

### Analytics

- Track merchant, frame, session, and event attribution.
- Show basic counts in merchant or admin dashboard.
- Track generation cost, completion, failure, and usage quota.

---

## 9. Data and Events

Minimum events:

| Event | Trigger |
| --- | --- |
| `merchant_page_viewed` | Hosted merchant link opened. |
| `merchant_photo_uploaded` | Shopper uploads photo. |
| `merchant_frame_selected` | Shopper selects frame. |
| `merchant_tryon_started` | Try-on generation starts. |
| `merchant_tryon_completed` | Try-on completes. |
| `merchant_tryon_failed` | Try-on fails. |
| `merchant_compare_started` | Shopper starts compare. |
| `merchant_favorite_saved` | Shopper saves a frame. |
| `merchant_lead_submitted` | Shopper submits contact / intent. |
| `merchant_product_clicked` | Shopper clicks product URL. |

Landing-page validation events are defined separately in `docs/product/specs/visutry-store-landing-page.md`.

Minimum data entities to evaluate:

- `Merchant` or `Store`;
- `MerchantFrame`;
- `MerchantSession`;
- `MerchantTryOnTask` or merchant-attributed `TryOnTask`;
- `MerchantLead`;
- `MerchantUsage`.

---

## 10. Pricing / Packaging Direction

Do not expose consumer credits as the primary merchant concept.

Early package options:

- Design Partner Pilot: setup fee + 30-day quota.
- Starter Store: small catalog + hosted link + included successful renders.
- Store: larger catalog + dashboard + analytics.
- Pro: widget, branding, higher quota, support.

Internal cost control may still use successful render quota.

Validation pricing hypotheses:

| Package | Use case | Notes |
| --- | --- | --- |
| Free discovery demo | Sales conversation / pitch only | No real merchant traffic; not a real pilot. |
| Design Partner Pilot | 30-day validation with real or realistic traffic | Setup fee or refundable deposit preferred to filter serious merchants. |
| Starter Store | Continuation after pilot | Small monthly plan with included successful renders. |

---

## 11. Privacy and Trust Requirements

- Merchant should not receive raw shopper face images by default.
- Shopper should see a clear privacy and retention notice before upload.
- Merchant dashboard should show interest signals, not sensitive face data by default.
- Avoid medical or fit guarantees.
- Use clear disclaimers that virtual try-on is visual decision support, not optical fit validation.

---

## 12. Acceptance Criteria

### Ready for validation

This spec is ready for validation when:

1. The target merchant / agency audience is clear.
2. The hosted link workflow is clear enough to explain in a sales conversation.
3. The minimum frame catalog fields are defined.
4. The minimum merchant events and metrics are defined.
5. The privacy boundary is clear.
6. The first validation package can be pitched without promising Shopify, WooCommerce, API, or EHR/PMS integration.
7. The Store landing page validation spec defines the first market test.

Current status: ready for validation.

### Ready for engineering

This spec should become engineering-ready only when at least one of the following is true:

1. 3 merchants agree to evaluate the hosted workflow;
2. 1 agency agrees to test with 2-3 relevant merchant clients;
3. a merchant agrees to a paid or deposit-backed pilot;
4. Store landing page and targeted outreach produce enough qualified interest that a hosted demo is required to continue sales conversations;
5. internal team decides to build a demo because sales conversations require it.

Engineering-ready acceptance criteria should then be expanded to include route structure, database schema, admin flows, permission model, and deployment plan.

---

## 13. Open Questions

1. Should the first MVP include AI recommendation, or start with merchant-selected top frames?
2. Should hosted links be public, password-protected, or demo-only for pilots?
3. Should merchant dashboard be built as a new area or initially admin-only?
4. Should leads include email only, or also phone / appointment request?
5. What is the minimum merchant catalog schema needed for useful recommendation?
6. Should shoppers be allowed to save results without login?
7. What exact retention policy should merchant sessions use?
8. Should merchant pilot quota be based on successful renders, sessions, or enabled frames?
9. Should the landing page primary CTA be `Get a sample Store Link`, `Join the pilot`, or `Book a demo`?

---

## 14. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft VisuTry Store MVP spec. |
| 2026-07-08 | Advanced to ready for validation and added validation package, gating criteria, and validation-focused acceptance criteria. |
| 2026-07-08 | Added Store landing page as the first validation asset before full Store engineering. |
