# VisuTry Store MVP Spec

**Status:** Draft  
**Owner:** Product  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Related plan:** `docs/product/product-plan.md`  
**Related roadmap:** `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md`

---

## 1. Problem

VisuTry's stronger recurring revenue opportunity is not casual consumer subscription. It is a merchant workflow that helps eyewear sellers and optical stores create shopper confidence, frame interest, lead capture, and measurable purchase intent.

However, building a full Shopify app, WooCommerce plugin, public API, or EHR/PMS integration before workflow validation would be premature.

---

## 2. Goal

Define the smallest VisuTry Store MVP that can validate merchant demand without overbuilding platform integrations.

The first version should be a hosted advisor / try-on workflow that a merchant can share or preview before any public app-store launch.

---

## 3. Non-goals

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

## 4. Target Users

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

## 5. MVP Product Shape

### Merchant setup

- Merchant profile.
- Store name and logo.
- Contact email.
- Privacy / retention defaults.
- Optional brand color or lightweight theme.

### Frame catalog

Start with a small top-SKU set, not a full catalog.

Minimum frame fields:

| Field | Purpose |
| --- | --- |
| `frameId` | Internal identifier. |
| `merchantId` | Owner. |
| `name` | Display name. |
| `sku` | Merchant reference. |
| `imageUrl` | Frame image for try-on. |
| `productUrl` | Optional purchase or product page link. |
| `price` | Optional display / analytics. |
| `status` | Active / inactive. |
| `tags` | Shape, material, width, style, gender, etc. |

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

First version can be simple:

- enabled frames;
- try-on opens;
- completed try-ons;
- failed try-ons;
- top frames by interest;
- lead submissions;
- render usage and quota;
- basic failure report.

---

## 6. Functional Requirements

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

## 7. Data and Events

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

Minimum data entities to evaluate:

- `Merchant` or `Store`;
- `MerchantFrame`;
- `MerchantSession`;
- `MerchantTryOnTask` or merchant-attributed `TryOnTask`;
- `MerchantLead`;
- `MerchantUsage`.

---

## 8. Pricing / Packaging Direction

Do not expose consumer credits as the primary merchant concept.

Early package options:

- Design Partner Pilot: setup fee + 30-day quota.
- Starter Store: small catalog + hosted link + included successful renders.
- Store: larger catalog + dashboard + analytics.
- Pro: widget, branding, higher quota, support.

Internal cost control may still use successful render quota.

---

## 9. Privacy and Trust Requirements

- Merchant should not receive raw shopper face images by default.
- Shopper should see a clear privacy and retention notice before upload.
- Merchant dashboard should show interest signals, not sensitive face data by default.
- Avoid medical or fit guarantees.
- Use clear disclaimers that virtual try-on is visual decision support, not optical fit validation.

---

## 10. Acceptance Criteria

The MVP is acceptable when:

1. A merchant can have a profile and small frame catalog.
2. A hosted merchant advisor / try-on link can be opened on mobile.
3. Shopper can upload photo, try one or more frames, and see results.
4. Shopper can save favorite or submit contact / intent.
5. Merchant usage and frame interest can be measured.
6. Merchant quota is separate from consumer credits.
7. Privacy boundaries are clear and do not expose raw shopper images to merchant by default.
8. The workflow can be shown to at least 3 merchants or 1 agency-backed merchant group.

---

## 11. Open Questions

1. Should the first MVP include AI recommendation, or start with merchant-selected top frames?
2. Should hosted links be public, password-protected, or demo-only for pilots?
3. Should merchant dashboard be built as a new area or initially admin-only?
4. Should leads include email only, or also phone / appointment request?
5. What is the minimum merchant catalog schema needed for useful recommendation?
6. Should shoppers be allowed to save results without login?
7. What exact retention policy should merchant sessions use?

---

## 12. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft VisuTry Store MVP spec. |
