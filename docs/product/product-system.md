# VisuTry Product System

**Status:** Active source of truth for cross-repository product positioning  
**Created:** 2026-07-08  
**Owner:** Product / Engineering  
**Review cadence:** Monthly, or when Web, SDK, or Mobile ownership changes  
**Scope:** Relationship between `VisuTry`, `visutry-tryon-sdk`, and `visutry-mobile`.

---

## 1. Purpose

This document defines how the three VisuTry repositories relate to each other.

The goal is to prevent duplicated product logic, duplicated commercial systems, and unclear ownership between the main web platform, the reusable try-on SDK, and the mobile experience.

Working model:

> One brand. One platform. One reusable capability layer. Multiple product surfaces.

---

## 2. Repository Roles

| Repository | Role | Primary responsibility |
| --- | --- | --- |
| `franksunye/VisuTry` | Product platform and commercial system | Web product, user accounts, credits, payments, SEO/GEO, dashboards, history, admin, product plans, B2B validation. |
| `franksunye/visutry-tryon-sdk` | Reusable capability layer | Face geometry, face-shape analysis, recommendation, AR try-on, web / WeChat adapters, privacy-first on-device processing. |
| `franksunye/visutry-mobile` | Mobile experience surface | Camera-first PWA / future mini-program experience built on VisuTry platform APIs and SDK capabilities. |

Short version:

```text
VisuTry             = product platform and business system
VisuTry Try-On SDK  = reusable eyewear intelligence and try-on engine
VisuTry Mobile      = camera-first mobile product surface
```

---

## 3. VisuTry Main Platform

`franksunye/VisuTry` is the product and commercial source of truth.

It owns:

- public web product at `visutry.com`;
- Face Shape Detector;
- Glasses Advisor;
- Virtual Try-On;
- Frame Compare;
- account system;
- credits and Stripe payments;
- dashboard and history;
- sharing surfaces;
- SEO / GEO pages;
- product documentation;
- commercial strategy;
- B2B Store / Studio validation;
- admin and analytics surfaces.

It should answer:

1. Who is the user?
2. What is free and what consumes credits?
3. What was generated and saved?
4. What converted to payment?
5. What should be built, measured, or validated next?
6. What is the current commercial direction?

It should not duplicate low-level SDK internals once those capabilities are stabilized in the SDK.

---

## 4. VisuTry Try-On SDK

`franksunye/visutry-tryon-sdk` is the reusable capability layer behind the VisuTry product system.

It owns:

- face geometry primitives;
- MediaPipe / landmark integration;
- face-shape analysis algorithm;
- landmark overlays;
- pose solving;
- smoothing and quality gating;
- AR glasses try-on rendering;
- glasses recommendation logic;
- normalized glasses asset format;
- platform adapters for Web / H5 and WeChat Mini Program.

It should answer:

1. How is a face analyzed?
2. How are landmarks transformed into useful geometry?
3. How is face shape classified?
4. How are glasses recommended?
5. How is AR try-on rendered?
6. How can Web, Mobile, or Mini Program call the same capability consistently?

It should not own:

- Stripe payments;
- user credits;
- user accounts;
- SEO pages;
- merchant dashboard;
- B2B lead capture;
- product roadmap priority;
- business pricing.

---

## 5. VisuTry Mobile

`franksunye/visutry-mobile` is the mobile product surface.

It should provide a camera-first experience for:

- taking or uploading a face photo;
- face-shape detection;
- glasses advice;
- virtual try-on;
- frame comparison;
- saved results;
- sharing;
- mobile-first credits / conversion flows where supported by the platform;
- future WeChat Mini Program evolution.

It should call:

- VisuTry platform APIs for user, account, credits, history, payments, and persisted generation tasks;
- VisuTry Try-On SDK for face analysis and local / on-device capabilities.

It should not become a separate backend or independent commercial system.

---

## 6. Shared Product Path

The product system should align around the same eyewear decision flow:

```text
Face Shape Detector
→ Glasses Advisor
→ Virtual Try-On
→ Frame Compare
→ Save / Share / Buy / Lead Capture
```

Different surfaces may emphasize different parts of the path:

| Surface | Primary emphasis |
| --- | --- |
| Web | SEO/GEO acquisition, account, credits, payments, history, B2B validation. |
| SDK | Face geometry, recommendation, AR try-on, privacy-first local capability. |
| Mobile | Camera-first upload, fast results, swipeable comparison, save/share, retention. |
| Future Store / Widget | Merchant-hosted try-on, frame catalog, shopper intent, lead capture, analytics. |

---

## 7. Ownership Boundaries

### Platform-owned capabilities

These belong primarily in `franksunye/VisuTry`:

- Auth / account state;
- credits and quota;
- Stripe payments and webhooks;
- stored TryOnTask history;
- dashboard;
- admin;
- SEO / GEO;
- merchant validation;
- product planning and source-of-truth docs.

### SDK-owned capabilities

These belong primarily in `franksunye/visutry-tryon-sdk`:

- face geometry;
- landmark calculation;
- face-shape algorithm;
- AR renderer;
- recommendation engine;
- asset standard;
- platform adapters.

### Mobile-owned capabilities

These belong primarily in `franksunye/visutry-mobile`:

- mobile interaction design;
- PWA shell;
- camera-first flow;
- mobile state management;
- offline-friendly UI where appropriate;
- platform adapters for future mobile / mini-program migration.

---

## 8. What Not to Split Yet

Do not split the following into independent systems prematurely:

- independent Mobile backend;
- independent Mobile billing;
- independent Mobile account system;
- independent SDK commercial pricing;
- independent SDK merchant dashboard;
- separate Store backend before merchant validation;
- Shopify / WooCommerce public app before hosted workflow validation.

The system should evolve by validating demand first and extracting stable shared capability second.

---

## 9. Roadmap Sequencing

### Near term

- Keep VisuTry Web as the primary product and commercial validation surface.
- Keep SDK focused on stable, testable face / try-on / recommendation capabilities.
- Keep Mobile as a lightweight camera-first PWA surface using platform APIs and SDK.
- Complete Credits Pack conversion and Frame Compare productization in the main platform.

### Medium term

- Use SDK capabilities consistently across Web and Mobile.
- Validate VisuTry Store with hosted links before building platform wrappers.
- Decide whether custom frames and comparison-board sharing should be shared across Web and Mobile.

### Long term

- Package SDK capabilities for external developer / partner use where useful.
- Extend Mobile toward WeChat Mini Program if market need justifies it.
- Add merchant widget / Shopify / WooCommerce only after workflow validation.

---

## 10. Related Documents

- `docs/product/product-plan.md`
- `docs/product/specs/frame-compare.md`
- `docs/product/specs/credits-pack-conversion.md`
- `docs/product/specs/visutry-store-mvp.md`
- `docs/strategy/commercial-strategy.md`
- `docs/decisions/ADR-003-product-plan-execution-source-of-truth.md`
- `docs/decisions/ADR-004-frame-compare-core-implemented.md`

---

## 11. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created product system overview for Web, SDK, and Mobile repositories. |
