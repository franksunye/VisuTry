# Merchant Delivery Factory v1 — Canonical Manifest / Read-only Diff

**Release dependency:** [#358](https://github.com/franksunye/VisuTry/issues/358), [#356](https://github.com/franksunye/VisuTry/issues/356). **Status: code-level prepare contract, not executable apply, not G3/G4 PASS.**

## Purpose

`merchantDeliveryManifestV1Schema` is a versioned, strict **proposal** shared by assisted delivery and future self-service configuration. `buildMerchantFactoryDryRunV1(manifest, authorizedSnapshot)` is a **pure and deterministic** difference planner. It does not read a database, authenticate a merchant, import URLs, upload media, update subscriptions, create sessions, or persist any change. It always returns `canApply:false`, `releaseReady:false`.

Manifest v1 includes: identity/tenant slug and canonical `MERCHANT_CLASSIFICATIONS` classification (e.g. `TEST`, `REFERENCE`, `POSSIBLE_EXTERNAL`, `REAL`; this is not the Pilot package `pilotType`); source method and **existing resource IDs** for a previously approved Catalog; brand display name, optional canonical accessible accentColor palette value and optional HTTPS logo URL; Store Draft configuration (copy, presentation, canonical Journey stage policy, bounded Web/Kiosk delivery policy, selected frame IDs); and up to 20 distinct Campaign Draft proposals with the same config shape.

**Example (TEST only):**

```json
{
  "version": 1,
  "merchantSlug": "demo-store",
  "classification": "TEST",
  "catalog": { "sourceMethod": "CSV", "expectedFrameIds": ["frame-owned-1"] },
  "brand": { "displayName": "Demo Store", "accentColor": "#1F4B5A", "logoAssetUrl": null },
  "store": {
    "name": "Demo Store", "headline": "Explore frames",
    "presentationMode": "PRODUCT_FIRST",
    "journeyPolicy": { "enabledStages": ["FACE_ANALYSIS", "RECOMMENDATION", "TRY_ON"] },
    "deliveryPolicy": { "kioskEnabled": false, "kioskIdleTimeoutSeconds": 120 },
    "selectedFrameIds": ["frame-owned-1"]
  },
  "campaigns": []
}
```


## Authenticated read-only Plan endpoint

`POST /api/merchant/:merchantId/delivery-factory/plan` accepts the **strict manifest itself** as JSON and requires a signed-in Human OWNER/ADMIN of the same merchant. It reads the current merchant classification, Brand (including canonical accentColor), ACTIVE Catalog frame IDs, and Store/Campaign Experience and selection state using canonical tenant-scoped Prisma reads, then returns the computed proposal with `Cache-Control: private, no-store`. The requested `merchantId` is checked against membership, and manifest merchant slug must match the stored tenant identity. A non-member/foreign resource is reported as 404; invalid versions/fields result in 400.

The endpoint is **not** `/apply`, and does not recognize a client-provided `approved:true` as consent. It does not upload assets, trigger marketing, persist rows, or use Stripe. If there are multiple ACTIVE Stores, it returns an explicit blocker rather than selecting one silently. A future authorized Apply must independently re-read and lock actual rows before touching any business state.

## Safety / honesty

The caller must first obtain a tenant-bound, authenticated, **fresh** snapshot through existing canonical reads. The builder rejects a mismatched tenant slug; checks expected/selected IDs against that tenant's **ACTIVE** Catalog and additionally requires Store-selected IDs to pass canonical Store display eligibility (usable identity, name, safe image URL and source URL where required; shape enrichment can remain pending); fails closed on unknown fields, duplicate slugs/IDs, impossible Journey/Kiosk policy, and incomplete resource references. Extra existing Catalog or Campaign resources are never silently removed.

Changes to an **ACTIVE** Experience, brand/media or classification are marked `HUMAN_REVIEW_REQUIRED` and remain blocked. New Experiences are **DRAFT-only** proposals. Repeated input/snapshot returns the same step plan and a no-change state after the intended Draft values are already present.

**Do not interpret `CREATE_DRAFT` or `UPDATE_DRAFT` as a write permit.** A future independent, explicitly authorized Apply must re-fetch tenant state under access controls, compare against this exact proposal and commit through canonical Merchant application commands. It must implement concurrency conflict handling, idempotency, rollback scope, audit, verification against actual public views, portable receipt, and >=2 isolated Local TEST merchant E2E. Until then the module cannot be used to provision any real merchant.

Owner's full general SaaS scope remains required; this is the first non-mutating Factory v1 building block.
