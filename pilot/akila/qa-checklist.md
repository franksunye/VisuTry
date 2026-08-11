# AKILA QA checklist

Reference Pilot / Simulation only. No real AI provider calls are required for routine QA.

## Pre-publish

- [x] Delivery Kit parses with the existing merchant-agnostic importer.
- [x] Catalog has 18 unique active external IDs and SKUs.
- [x] Every selected variant is available in the official public snapshot.
- [x] Product URLs and image URLs resolve.
- [x] Source facts and operator enrichment remain distinct.
- [x] All Experience selections resolve to existing catalog external IDs.
- [x] No brand-specific runtime code or manual SQL is used.

## Production data

- [x] Required Experience migrations are applied before seed; historical Prisma status caveat is recorded in evidence.
- [x] Production merchant identity is `akila`.
- [x] Store is ACTIVE with 18 frames.
- [x] `statement-frames` is ACTIVE with 9 frames.
- [x] `current-edit` is ACTIVE with 9 frames.
- [x] All rows are marked reference/synthetic.

## Shopper routes

- [x] `/en/store/akila` works on desktop and mobile.
- [x] `/en/c/akila/statement-frames` works on desktop and mobile.
- [x] `/en/c/akila/current-edit` works on desktop and mobile.
- [x] Headline, frame count, subset, Experience scope, attribution, and Reference Pilot / Simulation label are correct.
- [x] Anonymous session owns the expected `experienceId`.
- [x] Shared deterministic tests prove recommendation, select, Try-On/Compare authorization, Favorite, and Product Click stay within the current Experience catalog.
- [x] No Consumer Credits prompt appears.
- [x] Routine smoke uses no real AI provider.

## Admin

- [x] Merchant Catalog count is correct.
- [x] Store and both Campaign Experiences are visible.
- [x] Experience metrics and Legacy / Unassigned grouping load.
- [x] Catalog subset and configuration views load via the production workspace data contract.
- [x] Reference labeling is visible.
