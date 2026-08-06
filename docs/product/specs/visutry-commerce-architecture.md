# VisuTry Commerce Architecture Spec

**Status:** Approved direction / incremental adoption  
**Owner:** Product / Engineering  
**Created:** 2026-08-06  
**Primary ADR:** `docs/decisions/ADR-008-commerce-domain-over-storefront.md`  
**Consumer stability ADR:** `docs/decisions/ADR-007-store-consumer-stability-boundary.md`  
**Current Store foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`  
**Pilot execution plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`

---

## 1. Purpose

This spec defines the architecture direction from the current Store SaaS foundation toward the long-term VisuTry commerce platform.

The target product is:

> **AI Commerce Infrastructure for Eyewear — built for both human shoppers and AI agents.**

The business evolution is:

```text
Storefront
  -> Campaign Engine
  -> Commerce Intelligence
  -> Commerce Infrastructure
```

This spec does not require a rewrite of the current Store implementation. It defines the boundaries that new pilot work must preserve so future campaign, measurement, integration, and agent capabilities can be added without replacing the core.

---

## 2. Architecture Principles

1. **Commerce is the domain; Storefront is a surface.**
2. **Merchant is the tenant boundary.**
3. **Shopper is anonymous-first for acquisition / campaign experiences.**
4. **Catalog product identity is durable commerce infrastructure.**
5. **Face understanding, recommendation, Try-On, and Compare are reusable capabilities.**
6. **Intent and verified Conversion are separate concepts.**
7. **Attribution must use durable first-party data, not only third-party analytics.**
8. **Human and AI-agent traffic use one commerce core.**
9. **Do not implement generalized martech breadth before pilot evidence.**
10. **Consumer stability remains governed by ADR-007.**

---

## 3. Target Logical Architecture

```text
                        VISUTRY COMMERCE PLATFORM

                         ┌──────────────┐
                         │   Merchant   │
                         └──────┬───────┘
                                │
                     ┌──────────▼──────────┐
                     │ Campaign / Context  │
                     └──────┬────────┬─────┘
                            │        │
                 ┌──────────▼──┐  ┌──▼────────────┐
                 │ Acquisition │  │ Catalog /     │
                 │ / Audience  │  │ Product Graph │
                 └──────┬──────┘  └──────┬───────┘
                        └─────────┬───────┘
                                  ▼
                       ┌───────────────────┐
                       │ Commerce Journey  │
                       └─────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
      Face Understanding   Recommendation      Try-On / Compare
              └──────────────────┬──────────────────┘
                                 ▼
                         Shopper Session
                                 ▼
                         Intent / Conversion
                                 ▼
                            Attribution
                                 ▼
                         Merchant Outcome
```

External systems surround this core:

```text
Acquisition                                      Commerce / Martech

Google / Meta / TikTok                          Shopify / WooCommerce
Email / QR / Direct         -> VisuTry ->       Merchant Site / Checkout
ChatGPT / Gemini / Claude                        CRM / Analytics / Ads
Perplexity / future agents                       Future APIs / CDP
```

---

## 4. Domain Ownership

### 4.1 Merchant

Current `Merchant` remains the tenant root.

It owns or scopes:

- catalog;
- shopper sessions;
- campaigns;
- events;
- intents;
- conversions;
- usage;
- merchant analytics;
- integrations.

### 4.2 Catalog / Product Identity

Current MerchantFrame data is the seed of a broader commerce product identity.

Minimum durable fields should include, where available:

```text
merchantId
productId / frameId
sku?
name
canonicalProductUrl?
imageUrl
price?
currency?
brand?
variant?
collection?
availability?

# eyewear intelligence
shape?
material?
color?
widthClass?
styleTags?

status
sourceFacts
aiEnrichment
```

Rules:

- merchant facts are authoritative commerce facts;
- AI enrichment is separately identifiable;
- product identity must remain stable across recommendation, Try-On, Campaign, clicks, and conversions;
- do not use image URL as the only product identity.

### 4.3 Campaign

Campaign is a future first-class aggregate, but M1 may continue without a dedicated table when merchant-wide first-touch attribution is sufficient.

Expected future contract:

```text
Campaign
id
merchantId
name
status
objective?
startAt?
endAt?
landingExperienceKey?
catalogSegmentId?
offerConfig?
conversionGoal?
externalCampaignRefs?
```

Create the aggregate when real merchant pilots need persistent campaign configuration or comparison.

### 4.4 Acquisition Touchpoint

M1 minimum is first-touch attribution on MerchantSession.

Required fields where available:

```text
source
medium
campaign
referrer
landingUrl
aiAgentSource
locale
deviceType
```

Future touchpoint model may add:

```text
externalCampaignId
clickId
occurredAt
channel
```

Do not implement multi-touch now.

### 4.5 Commerce Journey / Experience

Do not make the hosted Store page the canonical workflow definition.

The application layer should be able to orchestrate reusable capabilities such as:

- face understanding;
- intent/style capture;
- catalog ranking;
- recommendation;
- Try-On;
- Compare;
- favorite;
- product destination;
- inquiry.

M1 may use a fixed journey. The key constraint is that future journeys can reorder or omit capabilities without duplicating the core.

### 4.6 Shopper Session

Current `MerchantSession` remains valid.

It should represent the shopper journey context rather than a Storefront account.

The session should be capable of preserving:

- merchant;
- first-touch acquisition context;
- future campaign relation;
- selected/recommended products;
- generated Try-On tasks;
- intents;
- conversion references;
- locale and privacy/retention state.

Shopper login is not required for the first useful experience.

### 4.7 Intent

Behavioral intent can include:

- recommendation completed;
- shortlist created;
- favorite;
- compare;
- product click;
- inquiry;
- appointment intent.

Current MerchantIntent can continue for the existing explicit intent types.

### 4.8 Conversion

Verified conversion is distinct from intent.

Future types may include:

```text
LEAD_CREATED
APPOINTMENT_BOOKED
ADD_TO_CART
CHECKOUT_STARTED
PURCHASE
```

Expected future contract:

```text
Conversion
id
merchantId
merchantSessionId?
campaignId?
type
productId?
value?
currency?
externalConversionId?
occurredAt
verificationSource
```

Do not claim attributed revenue before a trustworthy conversion source exists.

### 4.9 Attribution / Measurement

Measurement should support the funnel:

```text
Traffic
 -> Engaged Shopper
 -> Recommendation
 -> Try-On
 -> Compare
 -> Intent
 -> Conversion
 -> Attributed Revenue
```

M1 requirements:

- durable source/campaign context;
- merchant/session/product linkage;
- event timestamps;
- consistent event semantics;
- admin funnel by source where sample size allows.

Later requirements:

- campaign-level reporting;
- conversion import/webhooks;
- revenue attribution;
- multi-touch only if justified.

---

## 5. Module Evolution

Current Store code remains valid. Incremental extraction should happen only when a concept is reused across surfaces.

Preferred future structure:

```text
src/modules/commerce/
  merchant/
  catalog/
  campaign/
  journey/
  measurement/
  attribution/
  integrations/

src/modules/store/
  # hosted Storefront-specific application / presentation logic

src/lib/
  # shared technical primitives, including generation core
```

### Extraction triggers

Move a concept from Store to Commerce when at least one is true:

1. it is used by Storefront and a second surface;
2. its lifecycle is independent of Storefront UI;
3. it becomes a merchant business object such as Campaign or Conversion;
4. keeping it inside Store creates duplicate logic in an integration;
5. the code name makes the business concept misleading.

Do not migrate solely for naming cleanliness.

---

## 6. Event Contract Baseline

All new commerce-relevant events should have a common envelope equivalent to:

```text
eventId
eventType
occurredAt
merchantId
merchantSessionId?
merchantFrameId? / productId?
campaignId?
source?
medium?
referrer?
aiAgentSource?
metadata
```

Rules:

- no raw shopper image in event payload;
- no sensitive face-analysis payload in analytics events;
- event names describe business behavior, not UI implementation details where possible;
- synthetic demo records remain identifiable;
- event semantics must remain stable enough for funnel reporting.

---

## 7. Pilot Architecture Requirements

Before real pilot traffic, the system should support:

1. Merchant tenant isolation.
2. Anonymous shopper session capability.
3. Controlled shopper asset access and retention.
4. Merchant catalog with stable product identity.
5. Source / campaign attribution preserved end-to-end.
6. Recommendation → Try-On → Compare → Intent using real merchant products.
7. Product destination attached to selected/recommended frames.
8. Durable commerce events.
9. Merchant-facing funnel and intent insight.
10. Merchant-specific usage controls.
11. Consumer isolation / regression safety.
12. A migration path to Campaign and Conversion without replacing session/catalog/event identity.

---

## 8. Explicitly Deferred Martech Capabilities

Do not build before evidence requires them:

- campaign builder UI;
- marketing automation journeys;
- email/SMS sending system;
- CRM/CDP replacement;
- audience segmentation engine;
- multi-touch attribution;
- ad-platform bid optimization;
- enterprise data warehouse;
- generalized experimentation platform;
- public agent action framework;
- autonomous checkout;
- generic ecommerce back office.

VisuTry should become a vertical commerce conversion / intelligence layer, not rebuild the entire martech stack.

---

## 9. Architecture Review Questions

Every material Store / Pilot PR should ask:

1. Is this a durable commerce concept or only a Storefront presentation concern?
2. Does it preserve Merchant as tenant root?
3. Is product identity stable and merchant-owned?
4. Does source/campaign context survive the shopper journey?
5. Is the event durable and measurement-safe?
6. Are intent and verified conversion being confused?
7. Is this capability reusable by a later widget / Campaign / agent surface?
8. Are we prematurely building a generalized martech platform?
9. Does Consumer remain isolated under ADR-007?

---

## 10. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created architecture North Star for evolution from Storefront to vertical commerce / martech platform. |
