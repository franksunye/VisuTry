# Framed EWE production verification

Reference Pilot / Simulation only. No live Experience configuration was edited outside the standard production-safe Delivery Factory importer. No real AI Try-On generation was used.

Snapshot date: 2026-08-12

## Production data

- Migration verification: PASS by direct read of `_prisma_migrations`; both required Experience migrations are finished and not rolled back. The repository's historical `prisma migrate status` blank schema-engine error remains documented and did not block the safe seed.
- Merchant ID: `cmsovc43q00003ai87qtpyf2r`.
- Store `default`: PASS; ACTIVE, `referenceData=true`, 20 ExperienceFrames.
- Campaign `find-your-frames`: PASS; ACTIVE, `referenceData=true`, 11 ExperienceFrames.
- Campaign `sunglasses-edit`: PASS; ACTIVE, `referenceData=true`, 12 ExperienceFrames.
- Merchant catalog: PASS; 20 ACTIVE MerchantFrames across Akila, RIGARDS, LOOL, Kuboraum and AHLEM source brands.

## Routes

- `/en/store/framed-ewe`: PASS on desktop and mobile.
- `/en/c/framed-ewe/find-your-frames`: PASS on desktop and mobile.
- `/en/c/framed-ewe/sunglasses-edit`: PASS on desktop and mobile.

All six smoke runs showed the correct subset, retailer product destinations, Reference Pilot / Simulation semantics and no console/page errors. Six lightweight anonymous verification sessions were created in production; all were `referenceData=true` and mapped to the correct Experience/campaign. The UI shows an informational “no consumer credits are used” note and no credit consumption prompt; no AI provider was called.

## Admin and boundary

- Existing Experience Admin workspace: PASS through the existing workspace contract; one Framed EWE merchant with Merchant Catalog 20, Store 20, Find Your Frames 11 and Sunglasses Edit 12, correct public paths and zero metrics for the newly seeded pilot.
- Legacy / Unassigned visibility: PASS; returned by the All Experiences workspace contract.
- Same-merchant/different-product-brand authorization: PASS through existing merchant-scoped recommendation contract; product brand does not narrow the Framed EWE tenant.
- Different-merchant frame authorization: PASS through existing merchant/Experience boundary tests; a frame from another merchant is excluded.
- Authenticated Admin browser route: anonymous request correctly redirects to Auth0; a logged-in Admin browser session was not available in this environment, so UI pixels were not asserted.
