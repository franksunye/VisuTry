# Article One QA checklist

Reference Pilot / Simulation only. Routine QA uses no real AI provider and makes no claim of customer authorization, live traffic, or performance uplift.

## Pre-publish

- [ ] Delivery Kit parses with the existing merchant-agnostic importer.
- [ ] Catalog contains 18 unique active rows and 18 unique internal catalog keys.
- [ ] Every selected product is listed as InStock on the official public product page at the research snapshot.
- [ ] Product and image URLs resolve.
- [ ] Source facts and operator enrichment remain distinct.
- [ ] All Experience selections resolve to catalog external IDs.
- [ ] No brand-specific runtime code or manual SQL is used.
- [ ] Official optical collection was checked; no active optical product links were included rather than inferred.

## Production data

- [ ] Required Experience migrations are applied before seed; any historical Prisma status caveat is recorded in evidence.
- [ ] Production merchant identity is `article-one`.
- [ ] Store is ACTIVE with 18 frames.
- [ ] `active-eyewear` is ACTIVE with 9 frames.
- [ ] `find-your-fit` is ACTIVE with 9 frames.
- [ ] All rows and Experience configs are marked reference/synthetic.

## Shopper routes

- [ ] `/en/store/article-one` works on desktop and mobile.
- [ ] `/en/c/article-one/active-eyewear` works on desktop and mobile.
- [ ] `/en/c/article-one/find-your-fit` works on desktop and mobile.
- [ ] Headline, frame count, subset, Experience scope, attribution, and Reference Pilot / Simulation label are correct.
- [ ] Anonymous session owns the expected `experienceId`.
- [ ] Shared deterministic tests prove recommendation, selection, Try-On/Compare authorization, Favorite, Product Click, and attribution remain within the current Experience catalog.
- [ ] No Consumer Credits prompt appears.
- [ ] Routine smoke uses no real AI provider.

## Admin

- [ ] Merchant Catalog count is correct.
- [ ] Store and both Campaign Experiences are visible.
- [ ] Experience metrics and Legacy / Unassigned grouping load.
- [ ] Catalog subset and configuration views load through the existing Admin workspace contract.
- [ ] Reference labeling is visible.
