# VisuTry Discovery Canary — 2026-09-03

Status: **PRODUCTION READY**

This evidence record covers the minimum first-party Discovery Canary built by
reusing the existing `VisuTry Demo`. It does not claim external merchant
adoption, customer endorsement, sales, price, stock, or checkout.

## Baseline

- Starting main SHA: `20ddf18c9029634f7cdb4db22de338c529ab85fc`
- Canary implementation merge SHA: `0acc14e850049b5c0c63d085776d38a2eb9875ae`
- Production deployment: `dpl_CkCGCzML6nhvBQr6FojyPQCpEK9`
- Deployed git SHA: `0acc14e850049b5c0c63d085776d38a2eb9875ae`
- Original Traffic Ready T0: `2026-09-03T13:26:22.008Z`
- Axiom production dataset: `visutry-pro`
- Six canonical Reference Experiences: unchanged and protected

## VisuTry Demo reuse

| Field | Value |
| --- | --- |
| Merchant ID | `cmsq1vcg3000049fy2ngsqplk` |
| Merchant | `VisuTry Demo` (`visutry-demo`) |
| Status | `ACTIVE` |
| Classification before | `INTERNAL` |
| Classification after | `REAL` |
| Pilot type after | `LIVE` |
| Merchant `referenceData` | `false` |
| Classification source | `DISCOVERY_CANARY_2026-09-03` |
| Provenance | VisuTry-owned first-party demo; not an external merchant/customer/partner claim |

`REAL` + `LIVE` is the existing non-excluded production representation for a
real tenant. The explicit classification reason and public disclosure preserve
the first-party provenance boundary; no report exclusion was weakened.

The existing `Luna Optical` merchant is absent from production and all checked
residual records. Its status is `ALREADY_DELETED`. Luna was not reactivated,
modified, or used.

## Canary configuration

Store: `https://www.visutry.com/en/store/visutry-demo`

Campaign: `https://www.visutry.com/en/c/visutry-demo/everyday-fit`

Both existing Experiences remain `ACTIVE`, non-Reference, and use the existing
PUBLIC_INDEX admission path. Six active VisuTry-owned demo frames were given
specific, truthful, non-sale destination pages:

| SKU | Frame | Destination |
| --- | --- | --- |
| `VT-DEMO-ROUND-01` | VisuTry Round | `https://www.visutry.com/en/demo/frames/round` |
| `VT-DEMO-RECT-01` | VisuTry Rectangle | `https://www.visutry.com/en/demo/frames/rectangle` |
| `VT-DEMO-OVAL-01` | VisuTry Oval | `https://www.visutry.com/en/demo/frames/oval` |
| `VT-DEMO-BROW-01` | VisuTry Browline | `https://www.visutry.com/en/demo/frames/browline` |
| `VT-DEMO-AVI-01` | VisuTry Aviator | `https://www.visutry.com/en/demo/frames/aviator` |
| `VT-DEMO-CAT-01` | VisuTry Cat-Eye | `https://www.visutry.com/en/demo/frames/cat-eye` |

Each destination renders the exact frame, states `VisuTry Demo Frame`, uses
existing first-party imagery and metadata, and says the frame is not offered
for sale. No fake price, availability, review, rating, external brand, or
checkout claim was added.

## Indexability and discovery evidence

- Store: HTTP 200, `index, follow`, stable canonical, server-rendered Demo content.
- Campaign: HTTP 200, `index, follow`, stable canonical, server-rendered Demo content.
- All six frame destinations: HTTP 200, `index, follow`, exact canonical, frame-specific server-rendered content.
- Store and Campaign dynamic sitemap: present in `https://www.visutry.com/sitemaps/dynamic.xml`.
- Six frame destinations: present in `https://www.visutry.com/sitemaps/core.xml`.
- Store, Campaign, and frame pages: truthful JSON-LD with Product/Collection/Breadcrumb data where supported; no Offer, price, availability, review, or rating claims.
- `/en/discover`: existing indexable VisuTry-owned surface now has one small, semantically labeled link to the Demo Store.
- `robots.txt`: Googlebot, Bingbot, OAI-SearchBot, and OAI-AdsBot are not globally blocked from public routes. Existing `GPTBot: Disallow: /` training-crawler policy was preserved.
- No login wall or empty server shell was observed on the public routes.
- Six existing first-party image assets all returned HTTP 200.

Search Console was not available for this run because the authenticated Mac
session was locked. No indexing request or indexing claim was made. Readiness
is established; indexing/discovery remains an observation outcome.

## Attribution and reporting

The existing contract remains:

`Source → MerchantSession → Experience → Event → Intent`

A controlled production technical validation created one Demo Campaign session
with a TEST acquisition marker and one frame `PRODUCT_CLICK` Intent. The exact
session and its two events were then marked `referenceData=true`; the report
excluded it. The original 25 Demo sessions, all created while Demo was an
internal validation tenant, were also marked `referenceData=true` after exact
ID readback so historical validation activity cannot become genuine traffic
when the classification changes. No synthetic Agent traffic was counted.

Canonical `report:agent-distribution -- --json` and the explicit rolling
14-day variant both passed with:

- Merchant sessions read: `103`
- Excluded Reference/Internal sessions: `100`
- Excluded TEST/AUTOMATION sessions: `3`
- Qualifying Store/Campaign sessions: `0`
- Consumer Agent sessions: `0`
- Consumer sessions with decision action: `0`

Therefore future genuine, non-Reference, non-Test Demo sessions are eligible
for Gate A reporting, while technical validation and historical internal
activity remain excluded. The report still does not invent a Consumer-to-
MerchantSession join.

## Production verification

- Vercel deployment `dpl_CkCGCzML6nhvBQr6FojyPQCpEK9` is `READY`, production-targeted, and associated with git SHA `0acc14e850049b5c0c63d085776d38a2eb9875ae`.
- Local and GitHub Production Smoke passed, including HTML, Next static assets, RSC responses, and unauthenticated safety guards.
- Store/Campaign/frame route, metadata, sitemap, canonical, robots, and JSON-LD probes passed.
- Controlled Source → Experience → Action → Intent verification passed.
- TEST exclusion passed.
- Consumer critical regression passed.
- Revenue critical regression passed.
- Existing typecheck, lint, focused canary/sitemap/SEO tests, and `build:ci` passed. Existing unrelated full-unit Preview QA environment guard remains unchanged.
- No payment, checkout, merchant inquiry, authenticated AI generation, or synthetic Agent traffic was used.

## Timestamps and Day 0 baseline

- Original Traffic Ready T0: `2026-09-03T13:26:22.008Z` — remains valid.
- Discovery Canary T0: `2026-09-03T16:33:14.812Z`

At Discovery Canary T0:

- Genuine Canary sessions: `0`
- AI/Agent sessions: `0`
- ChatGPT/OpenAI sessions: `0`
- Organic search sessions: `0`
- Meaningful decision sessions: `0`
- Intent sessions: `0`

The zero baseline is genuine; no traffic was manufactured. Direct SEO/GEO/
Agent discovery observation begins at the separate Discovery Canary T0 and
does not redefine the original Traffic Ready clock.

## Non-scope confirmation

- Six canonical Reference Experiences: untouched; noindex policy and Gate A exclusion remain unchanged.
- Luna: untouched; already deleted.
- New Merchant: none created.
- No schema migration, DB migration, DB provider change, Shopify/CRM, checkout, or generalized catalog work.
- No report semantic changes.
- No `#178` or `#179` work.

## Final result

Discovery Canary is production-ready. VisuTry now has a legitimate first-party
PUBLIC_INDEX Store/Campaign and frame destination surface for direct
SEO/GEO/Agent discovery observation. This proves discovery and shopper
decision-system behavior, not external merchant adoption.
