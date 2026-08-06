# VisuTry Commerce Architecture Spec

**Status:** Approved direction / incremental adoption  
**Owner:** Product / Engineering  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Primary ADR:** `docs/decisions/ADR-008-commerce-domain-over-storefront.md`  
**Consumer stability ADR:** `docs/decisions/ADR-007-store-consumer-stability-boundary.md`  
**Current Store foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`  
**Pilot execution plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`  
**Commercial baseline:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Commercial entitlement:** `docs/product/specs/merchant-commercial-entitlements.md`

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

### Current maturity boundary

The long-term architecture supports intent, verified conversion, attribution and merchant outcomes. The current Market-Capture / Founding Pilot phase is intentionally narrower:

> **Current Pilot ends at personalized shopping decisions + measurable purchase intent. Verified conversion, revenue attribution and incrementality are later maturity layers.**

This is a delivery-stage boundary, not a change to the long-term domain model.

---

## 2. Architecture Principles

1. **Commerce is the domain; Storefront is a surface.**
2. **Merchant is the tenant boundary.**
3. **Shopper is anonymous-first for acquisition / campaign experiences.**
4. **Catalog product identity is durable commerce infrastructure.**
5. **Face understanding, recommendation, Try-On, and Compare are reusable capabilities.**
6. **Observed Intent, verified Conversion, attributed Revenue and Incremental Outcome are distinct evidence levels.**
7. **Attribution must use durable first-party data, not only third-party analytics.**
8. **Human and AI-agent traffic use one commerce core.**
9. **Do not implement generalized martech breadth before pilot evidence.**
10. **Commercial policy is versioned and provider-independent; pricing/allowance changes must not require changing the Commerce domain model.**
11. **Consumer stability remains governed by ADR-007.**

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

The logical architecture is intentionally broader than the current Pilot. In the Market-Capture phase, the implemented path may stop at `Intent`; `Conversion -> Attribution -> Merchant Outcome` remains a future extension until trustworthy commerce data exists.

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
- commercial policy / entitlement references;
- merchant analytics;
- integrations.

Commercial pricing itself is not a Commerce-domain invariant. Merchant records may reference a versioned commercial policy without embedding permanent prices or provider-specific economics into core domain behavior.

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
- future conversion references;
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

For the current Market-Capture phase, these observed intent signals are the primary merchant-value evidence and should be treated as first-class measurable outcomes without pretending they are completed commerce conversions.

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

A first-class conversion model is **not required for the Founding Pilot**.

Do not claim attributed revenue before a trustworthy conversion source exists.

### 4.9 Attribution / Measurement

Long-term measurement should support the full funnel:

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

Current Market-Capture boundary:

```text
Traffic
 -> Engaged Shopper
 -> Recommendation
 -> Try-On
 -> Compare
 -> Product Click / Favorite / Inquiry
 -> Measurable Intent
```

Current M1 / Pilot requirements:

- durable source/campaign context;
- merchant/session/product linkage;
- event timestamps;
- consistent event semantics;
- admin funnel by source where sample size allows;
- observed intent reporting.

Later, integration-dependent requirements:

- conversion import/webhooks;
- checkout/order linkage;
- attributed revenue.

Future, experiment-dependent requirements:

- controlled incrementality measurement;
- causal uplift claims;
- multi-touch only if justified.

Revenue attribution is not a Pilot-readiness requirement.

### 4.10 Commercial Policy / Entitlement Boundary

Commercial policy is a versioned cross-cutting concern around the Commerce domain, not a permanent domain constant.

The system should be able to represent or reference concepts such as:

```text
commercialStage
planCode
pricingVersion
entitlementVersion
commerceSessionAllowance
standardRenderAllowance
premiumRenderAllowance?
campaignAllowance?
effectiveFrom
```

Rules:

- pricing and entitlement versions may change without changing Merchant, Catalog, Journey, Intent or Conversion identities;
- provider/model identity must not leak into merchant-facing entitlement contracts;
- Market-Capture pricing can deliberately use favorable procurement economics without making those economics permanent architecture assumptions;
- historical merchant entitlements remain auditable;
- the Commerce domain must remain stable across future Pricing Versions.

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

Commercial policy may remain as a dedicated cross-cutting application/domain-support boundary rather than being coupled to Storefront UI or generation providers.

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
- event semantics must remain stable enough for funnel reporting;
- current events must not imply verified conversion when they only represent observed intent.

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
10. Merchant-specific, versioned usage controls independent from provider/model identity.
11. Consumer isolation / regression safety.
12. A migration path to Campaign and Conversion without replacing session/catalog/event identity.

The Founding Pilot does **not** require order/checkout integration, revenue attribution, incrementality experimentation, or a first-class Conversion aggregate.

---

## 8. Explicitly Deferred Martech Capabilities

Do not build before evidence requires them:

- campaign builder UI;
- marketing automation journeys;
- email/SMS sending system;
- CRM/CDP replacement;
- audience segmentation engine;
- conversion/order integration unless repeated merchant demand justifies it;
- revenue attribution infrastructure as a Pilot prerequisite;
- multi-touch attribution;
- ad-platform bid optimization;
- enterprise data warehouse;
- generalized experimentation platform;
- public agent action framework;
- autonomous checkout;
- generic ecommerce back office.

VisuTry should become a vertical commerce decision / intelligence layer first, and mature toward conversion / attribution capabilities only when merchant evidence justifies the integration cost.

---

## 9. Architecture Review Questions

Every material Store / Pilot PR should ask:

1. Is this a durable commerce concept or only a Storefront presentation concern?
2. Does it preserve Merchant as tenant root?
3. Is product identity stable and merchant-owned?
4. Does source/campaign context survive the shopper journey?
5. Is the event durable and measurement-safe?
6. Are observed intent, verified conversion, attributed revenue and incrementality being confused?
7. Is this capability reusable by a later widget / Campaign / agent surface?
8. Are we prematurely building a generalized martech or attribution platform?
9. Can pricing/entitlement/provider policy change without mutating the core Commerce domain?
10. Does Consumer remain isolated under ADR-007?

---

## 10. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created architecture North Star for evolution from Storefront to vertical commerce / martech platform. |
| 2026-08-06 | **Calibrated the architecture to the current Intent-First Market-Capture phase: made the Pilot boundary explicitly end at measurable intent, deferred conversion/revenue attribution/incrementality, and formalized pricing/entitlement as a versioned provider-independent commercial-policy boundary that can change without changing the Commerce domain.** |
