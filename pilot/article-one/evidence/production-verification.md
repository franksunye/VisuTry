# Article One production verification

Snapshot date: 2026-08-11. Publish used only the existing merchant-agnostic `db:seed:pilot` importer with `STORE_SEED_CONFIRM=yes`; no manual SQL and no real AI generation.

## Data publish

- Production merchant: `article-one`
- Merchant ID: `cmsotuyga0000xzi8ed15j0sk`
- `referenceData`: `true`
- Store: `default`, `STORE`, `ACTIVE`, 18 frames
- Campaign: `active-eyewear`, `CAMPAIGN`, `ACTIVE`, 9 frames
- Campaign: `find-your-fit`, `CAMPAIGN`, `ACTIVE`, 9 frames
- Seed result: 18 frames imported and 3 Experiences created; no deactivation.

## Public route smoke

The first live production smoke reached all three routes on desktop and mobile with HTTP 200, correct Article One identity, headline, frame count, Experience scope and Reference Pilot / Simulation marker. It exposed four 400 image-optimizer responses caused by the live shared Next image allowlist not yet including the official `cdn11.bigcommerce.com` host. The branch includes a generic allowlist entry. A local production build connected to the same production Neon data passed all six desktop/mobile checks with zero console/page errors. The Vercel Preview deployment passed the same six checks through a temporary protected-deployment share URL; live confirmation awaits the reviewed config deployment.

Routes:

- `/en/store/article-one`
- `/en/c/article-one/active-eyewear`
- `/en/c/article-one/find-your-fit`

## Admin and shopper checks

Production read-back confirms the existing Admin workspace data groups Article One as Store + two Campaigns, exposes Merchant Catalog 18 and selected counts 18/9/9, returns zero newly-seeded metrics, and includes Legacy / Unassigned. Authenticated browser Admin verification remains deployment/reviewer-environment dependent. Shared deterministic tests prove the existing authoritative Experience scope is reused; Campaign A frames are not accepted by Campaign B sessions.
