# VisuTry Reference Portfolio Index

**Status:** Sales reference source of truth
**Date:** 2026-08-12
**Use:** Founder-led sales demos, prospect matching, internal enablement
**Naming rule:** Reference Experience / Reference Pilot / Concept Implementation

## 1. How to use this index

These five entries are product demonstrations assembled from public catalog information. They are not customer success stories.

Never describe the brands below as customers, clients, partners, authorized pilots, or case studies unless separate written authorization is obtained. Do not present the route metrics as merchant performance: the seeded reference traffic is explicitly marked `referenceData=true`, and the current reference evidence reports zero synthetic business activity unless otherwise stated.

The preferred sales sentence is:

> “Here is a Reference Experience showing how the same VisuTry Store/Campaign workflow can be adapted to this merchant archetype. We can build the equivalent experience from your catalog.”

## 2. Portfolio map

| Reference | Archetype | Catalog rows | Store route | Campaign route 1 | Campaign route 2 | Best sales question |
| --- | --- | ---: | --- | --- | --- | --- |
| ello sunglasses | Fit/problem-led DTC | 12 | [`/en/store/ello-sunglasses`](https://www.visutry.com/en/store/ello-sunglasses) | [`/en/c/ello-sunglasses/petite-fit`](https://www.visutry.com/en/c/ello-sunglasses/petite-fit) | [`/en/c/ello-sunglasses/summer-sunglasses`](https://www.visutry.com/en/c/ello-sunglasses/summer-sunglasses) | “Do shoppers need help narrowing by fit/proportion?” |
| Lowercase NYC | Premium independent / product-led | 20 | [`/en/store/lowercase-nyc`](https://www.visutry.com/en/store/lowercase-nyc) | [`/en/c/lowercase-nyc/find-your-frame`](https://www.visutry.com/en/c/lowercase-nyc/find-your-frame) | [`/en/c/lowercase-nyc/sunglasses-edit`](https://www.visutry.com/en/c/lowercase-nyc/sunglasses-edit) | “Could product identity and a focused edit reduce catalog hesitation?” |
| AKILA | Fashion / style / collection-led | 18 | [`/en/store/akila`](https://www.visutry.com/en/store/akila) | [`/en/c/akila/statement-frames`](https://www.visutry.com/en/c/akila/statement-frames) | [`/en/c/akila/current-edit`](https://www.visutry.com/en/c/akila/current-edit) | “Can campaigns turn a collection point of view into a shopping journey?” |
| Article One | Active / technical / function-led | 18 | [`/en/store/article-one`](https://www.visutry.com/en/store/article-one) | [`/en/c/article-one/active-eyewear`](https://www.visutry.com/en/c/article-one/active-eyewear) | [`/en/c/article-one/find-your-fit`](https://www.visutry.com/en/c/article-one/find-your-fit) | “Is recommendation + compare useful beside an existing VTO?” |
| Framed EWE | Multi-brand retailer | 20 | [`/en/store/framed-ewe`](https://www.visutry.com/en/store/framed-ewe) | [`/en/c/framed-ewe/find-your-frames`](https://www.visutry.com/en/c/framed-ewe/find-your-frames) | [`/en/c/framed-ewe/sunglasses-edit`](https://www.visutry.com/en/c/framed-ewe/sunglasses-edit) | “Can a retailer guide discovery across brands without duplicating catalog identity?” |

All entries have one Store and two Campaign experiences. Stores are not counted as Campaigns. The portfolio therefore contains 5 Stores + 10 Campaigns.

## 3. Reference cards

### ello sunglasses — guided fit discovery

- **Merchant archetype:** Fit/problem-led DTC; the catalog is organized around smaller-face discovery.
- **Business problem modeled:** Shoppers who identify with petite/small-face needs need a faster way to narrow a broad sunglasses set before trying products.
- **Experience premise:** Use catalog fit metadata and a petite-fit Campaign to move from “which styles might work?” to a small, explainable shortlist; use the Summer Sunglasses Campaign for a seasonal edit.
- **Capabilities demonstrated:** Merchant-owned catalog, experience-scoped recommendation, fit/proportion-oriented metadata, Try-On, Compare, product destination, source/campaign attribution and merchant insight surfaces.
- **What this proves:** VisuTry can turn a specific catalog problem into a hosted, fit-led shopping journey without writing brand-specific runtime code.
- **Evidence:** [`pilot/ello-sunglasses/evidence/public-source-snapshot.md`](../../../pilot/ello-sunglasses/evidence/public-source-snapshot.md), [`pilot/ello-sunglasses/evidence/entry-desktop.png`](../../../pilot/ello-sunglasses/evidence/entry-desktop.png), [`pilot/ello-sunglasses/evidence/entry-mobile.png`](../../../pilot/ello-sunglasses/evidence/entry-mobile.png), [`pilot/ello-sunglasses/delivery-log.md`](../../../pilot/ello-sunglasses/delivery-log.md).
- **Disclaimer:** Reference Pilot / Simulation assembled from public-source catalog facts; not an ello customer implementation or performance claim.

### Lowercase NYC — premium independent product discovery

- **Merchant archetype:** Premium independent / product-led brand.
- **Business problem modeled:** A design-forward catalog needs a way to preserve product character while helping shoppers choose among optical and sun collections.
- **Experience premise:** Combine a persistent premium Store with a “Find Your Frame” Campaign and a focused Sunglasses Edit; let the catalog and campaign presentation do the merchandising work.
- **Capabilities demonstrated:** Curated catalog import, product identity and destination links, Collection/Campaign subsets, recommendation, Try-On, Compare, favorites/inquiry path where enabled, and per-Experience measurement.
- **What this proves:** A premium independent brand can use multiple shopping contexts over one catalog instead of building separate storefront logic for each campaign.
- **Evidence:** [`pilot/lowercase-nyc/evidence/catalog-selection.md`](../../../pilot/lowercase-nyc/evidence/catalog-selection.md), [`pilot/lowercase-nyc/evidence/production-verification.md`](../../../pilot/lowercase-nyc/evidence/production-verification.md), [`pilot/lowercase-nyc/evidence/qa-results.md`](../../../pilot/lowercase-nyc/evidence/qa-results.md), [`pilot/lowercase-nyc/delivery-log.md`](../../../pilot/lowercase-nyc/delivery-log.md).
- **Disclaimer:** Reference Pilot / Simulation using public catalog information; not a Lowercase NYC customer, partner or authorized collaboration.

### AKILA — style-led campaign merchandising

- **Merchant archetype:** Fashion / style / collection-led brand.
- **Business problem modeled:** A collection with strong visual direction needs a campaign-specific discovery path, not only a generic product grid.
- **Experience premise:** Use Statement Frames for point-of-view discovery and Current Edit for a curated collection entry, while the Store remains the broader catalog surface.
- **Capabilities demonstrated:** Style/shape/color/material metadata, selected-frame Campaigns, campaign-specific headline and CTA, recommendation, Try-On, Compare, product click/favorite/inquiry intent and isolated Experience analytics.
- **What this proves:** Collection-led merchandising can be configured through shared Experience data and presentation, with no AKILA-specific runtime branch.
- **Evidence:** [`pilot/akila/evidence/production-verification.md`](../../../pilot/akila/evidence/production-verification.md), [`pilot/akila/evidence/qa-results.md`](../../../pilot/akila/evidence/qa-results.md), [`pilot/akila/evidence/research-snapshot.md`](../../../pilot/akila/evidence/research-snapshot.md), [`pilot/akila/delivery-log.md`](../../../pilot/akila/delivery-log.md).
- **Disclaimer:** Reference Pilot / Simulation based on public AKILA catalog structure; not an AKILA customer implementation or business-performance claim.

### Article One — beyond-VTO technical merchandising

- **Merchant archetype:** Active / technical / function-led eyewear.
- **Business problem modeled:** A merchant that may already have VTO still needs help with frame selection, use-case discovery, comparison and intent measurement.
- **Experience premise:** Active Eyewear connects technical/use-case language to discovery; Find Your Fit uses published dimensions for comparison; the Store provides the broad reference surface.
- **Capabilities demonstrated:** Technical/use-case and measurement metadata, scoped Campaign selection, Recommendation → Try-On → Compare, product intent, and merchant/Experience insight views.
- **What this proves:** VisuTry’s differentiation can be evaluated as a decision layer around VTO; it does not require claiming that VisuTry replaces an existing VTO provider.
- **Evidence:** [`pilot/article-one/evidence/production-verification.md`](../../../pilot/article-one/evidence/production-verification.md), [`pilot/article-one/evidence/qa-results.md`](../../../pilot/article-one/evidence/qa-results.md), [`pilot/article-one/evidence/research-snapshot.md`](../../../pilot/article-one/evidence/research-snapshot.md), [`pilot/article-one/delivery-log.md`](../../../pilot/article-one/delivery-log.md).
- **Disclaimer:** Reference Pilot / Simulation from public Article One catalog facts and operator enrichment; measurements support comparison only and are not a fit or performance guarantee.

### Framed EWE — multi-brand retailer discovery

- **Merchant archetype:** Multi-brand retailer.
- **Business problem modeled:** A retailer needs to help shoppers discover across brands, shapes and proportions while keeping the retailer as the merchant/catalog owner.
- **Experience premise:** The Store exposes the curated multi-brand catalog; Find Your Frames narrows cross-brand discovery; Sunglasses Edit creates a campaign-specific retailer selection.
- **Capabilities demonstrated:** Merchant-owned multi-brand catalog, product brand as metadata rather than tenant boundary, cross-brand recommendation, Experience-scoped frame selection, Try-On, Compare, product destinations, retailer inquiry and per-Campaign intent measurement.
- **What this proves:** VisuTry can model multi-brand discovery without duplicating product identity or leaking frames across merchant tenants.
- **Evidence:** [`pilot/framed-ewe/evidence/production-verification.md`](../../../pilot/framed-ewe/evidence/production-verification.md), [`pilot/framed-ewe/evidence/qa-results.md`](../../../pilot/framed-ewe/evidence/qa-results.md), [`pilot/framed-ewe/evidence/research-snapshot.md`](../../../pilot/framed-ewe/evidence/research-snapshot.md), [`pilot/framed-ewe/delivery-log.md`](../../../pilot/framed-ewe/delivery-log.md).
- **Disclaimer:** Reference Pilot / Simulation assembled from public Framed EWE retailer sources; not a Framed EWE customer implementation, authorized collaboration, live campaign or performance claim.

## 4. Shared capability proof

Across the portfolio, the repeatable proof is:

```text
Merchant catalog
  → Store or Campaign Experience
  → shopper photo + recommendation
  → Try-On + Compare
  → product click / favorite / inquiry
  → source/campaign attribution + merchant insight
```

The factory result is delivery repeatability, not five customer success stories. Sales should use the portfolio to select the closest problem pattern, then ask for the prospect’s own catalog.

## 5. Evidence gaps to close

- Only ello currently has committed entry screenshots in its evidence folder.
- The other four references have production route/QA/read-back evidence but no committed reference-card screenshot set.
- Admin visual evidence is not available for these references because the verification environment did not have an authenticated Admin session; route behavior and workspace data contracts were verified instead.
- A 60–90 second demo video is still a sales-asset task, not a product capability claim.

Until those assets exist, use live links plus the production-verification/QA documents and a prepared shopper-photo demo. Do not imply that a screenshot is merchant-submitted or live customer activity.
