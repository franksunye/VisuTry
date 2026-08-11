# Framed EWE QA checklist

Reference Pilot / Simulation only. This package is a retailer-architecture proof, not an authorized Framed EWE collaboration, live campaign, customer dataset, inventory promise, or performance claim. Routine QA must not call a real AI provider.

## Source and package

- [ ] Official Framed EWE pages/Shopify product JSON are the only public product sources.
- [ ] Catalog has 20 unique ACTIVE rows across five product brands: Akila, RIGARDS, LOOL, Kuboraum and AHLEM.
- [ ] `brand` is source metadata for the product brand and is not treated as the merchant identity.
- [ ] Price, variant, URL, image, product type and published dimensions are preserved only where publicly stated.
- [ ] Unstated values remain blank; no inventory quantity, authorization, exclusivity, popularity, or fit guarantee is claimed.
- [ ] Shape, relative width and style tags are clearly operator enrichment in `enrichment-review.csv`.
- [ ] All product destinations remain `framedewe.com` retailer URLs.
- [ ] All selected Experience IDs resolve to the catalog external IDs.

## Delivery Factory

- [ ] `pilot:preflight` passes with 20 active rows, one Store and two Campaigns.
- [ ] `pilot:check-urls` passes for every product and image URL.
- [ ] `db:seed:pilot --dry-run` shows no unexpected destructive diff and no deactivation for a new merchant.
- [ ] Production seed uses the merchant-agnostic importer and production confirmation guard.
- [ ] No manual SQL, merchant-specific branch, component, API, or runtime condition is introduced.

## Shopper routes and boundary

- [ ] `/en/store/framed-ewe` resolves the STORE with all 20 frames.
- [ ] `/en/c/framed-ewe/find-your-frames` resolves 11 frames across multiple product brands.
- [ ] `/en/c/framed-ewe/sunglasses-edit` resolves 12 sunglasses across multiple product brands.
- [ ] Anonymous session owns the expected Experience ID and reference attribution.
- [ ] Shared recommendation, frame selection, Try-On, Compare, Favorite, Product Click and Intent paths remain Experience-scoped.
- [ ] Same-merchant frames from different product brands are allowed; frames from another Merchant are rejected.
- [ ] Reference Pilot / Simulation marker is visible and no Consumer Credits prompt appears.
- [ ] Desktop and mobile smoke checks pass with no console/page errors; no real AI generation is used.

## Admin

- [ ] One merchant shows a 20-frame Merchant Catalog, one Store and two Campaign Experiences.
- [ ] Campaign subset counts are 11 and 12; product brands remain distinguishable in catalog/product context without creating fake merchants.
- [ ] Experience metrics and Legacy / Unassigned grouping load through the existing Admin workspace.
- [ ] Catalog selection and configuration views load through existing shared contracts.

## Post-publish evidence

- [ ] Production read-back confirms Framed EWE identity, 20 active frames and all three ACTIVE Experiences.
- [ ] Route smoke confirms Store and both Campaigns on desktop and mobile.
- [ ] Five-brand retrospective and reusable gaps are recorded in the delivery log.
