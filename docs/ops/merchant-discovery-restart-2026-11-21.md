# Merchant Store / Campaign discovery restart — 2026-11-21

**Status:** Implementation and local verification complete; production release evidence pending.
**Owner:** Product / Engineering / Growth
**Scope:** Merchant shopper acquisition through public Store/Campaign pages.
**Implementation base:** `87b419dc0569f8e00ee56388828f37e0ded820ef`
**Integrated review base:** `ae6259f7fa41b1174ad11a8e05872ac445102764` (intervening changes are unrelated growth evidence documents).

This record resumes the first-party discovery work. It does not change the
commercial Pilot gate or treat Consumer traffic and `/business` merchant leads
as evidence that merchants acquired shoppers.

## Read-only baseline

Observed on 2026-11-21 using public HTML/sitemaps, authenticated Search Console
URL inspection, Search Console page performance, and GA4 landing/page reports.
Performance window: **2026-10-23 through 2026-11-19**.

| Surface | Current evidence before this change |
| --- | --- |
| `/en/store/visutry-demo` | Public `index,follow`, in dynamic sitemap; Search Console reported indexed, last crawl 2026-09-14 |
| `/en/c/visutry-demo/everyday-fit` | Public `index,follow`, in dynamic sitemap; Search Console reported indexed, last crawl 2026-11-02 |
| `/en/store/visutry-demo-optical` | Public `noindex,follow`, absent from dynamic sitemap; Search Console reported URL unknown to Google |
| `/en/demo/frames/rectangle` | Indexed sample detail page; now belongs to the canonical Demo Optical catalog |
| Search Console target page cohort | No returned rows for `/store/`, `/c/`, or `/demo/frames/`; a full-page control returned 428 rows, 6,523 clicks, 170,525 impressions |
| GA4 target landing cohort | 31 sessions across 28 returned rows, all Direct; includes test/reference routes and is not a genuine customer count |
| GA4 target page-view cohort | 47 views: Direct 32, Google organic 10, accounts.google.com referral 1, QA/manual 4; the organic views were on the Reference ello pages, not direct organic landings on the Canary |

No identifiable AI referral was observed in this window. No AI-answer citation
benchmark was run. Missing performance rows are not evidence that the two
Canary URLs are unindexed. Product rich-result warnings for absent
Offer/Review/AggregateRating do not justify fabricated commerce facts.

## Identity and destination decisions

The independent first-party Canary remains `visutry-demo`; the canonical sales
and QA Demo remains `visutry-demo-optical`. The former has a six-frame Store and
a four-frame `everyday-fit` Campaign. Shared image assets do not make their SKUs
or Merchant identities interchangeable.

The six `/en/demo/frames/*` URLs now resolve Demo Optical's catalog. Existing
Canary product URLs still pointed there, while the historical seed and current
public Organization data provide no merchant website. Simply deleting all six
public links would leave the admitted collection without a meaningful
destination. The public discovery view therefore maps the six known legacy
destinations to **`/en/discover/frames/{actual-frame-id}`**, using the same
current MerchantFrame identity as the source collection.

These are bounded first-party read-only details, available only for the exact
non-Reference LIVE Canary's currently admitted default Store or `everyday-fit`
Campaign. A detail page must resolve that ID from a current ACTIVE PUBLIC_INDEX
source and its known legacy destination; arbitrary other Merchant frames are
not exposed. The page shows actual saved frame facts, an available image,
non-sale disclosure, and links back only to its admitted source collections.
It does not claim measurements, physical fit, comfort, price, stock or reviews.

Static catalog links and Product JSON-LD use the same normalized view. The
dynamic sitemap uses the same admitted detail read model. Other merchant links,
actual external destinations, and Demo Optical's own URLs are preserved.
This is a public discovery repair, not a stored-data or interactive-runtime
migration, and it does not introduce a general merchant product-page capability.

## Implemented behavior

### Saved-page search eligibility

Store and Campaign administration show one shared **Search visibility** panel:

- Private.
- Public, not eligible for search, with the applicable reason.
- Public, eligible for search.

The existing server policy remains authoritative: active merchant and page,
readable content, non-Reference provenance, admitted LIVE/VisuTry-owned merchant,
at least four active selected products, and a valid merchant or product
destination. The panel is based on saved data and applies to the English public
page. It does not say that Google has indexed the page. Publication gates and
AI/billing permissions are unchanged.

Both Node/Prisma and Cloudflare read models calculate the same result. Inactive
catalog products do not count merely because an ExperienceFrame row is selected.
Cloudflare's Store selection now follows the existing public/Prisma ordering,
so the panel describes the same Store when historical rows coexist.

### One actual-catalog content example

The existing English `everyday-fit` page gains a round-versus-rectangular
comparison and three visible FAQs. Names, anchors, and shape facts come from
the currently selected public frames. The text explains appearance and the
non-sale demo status; it does not assert measurements, comfort, physical fit,
price, inventory, or customer results.

The editorial is admitted only for the exact ACTIVE, PUBLIC_INDEX,
non-Reference LIVE Canary Campaign with matching merchant identity and actual
round and rectangular frames with usable images. Missing either frame removes
the special editorial rather than leaving unsupported copy. Other Campaigns
retain their own content. The English H1, metadata, Open Graph, and CollectionPage
JSON-LD draw from the same reviewed copy. Other locales keep their existing
noindex policy and do not receive this new English section.

Store metadata and the visible title now honor a saved Store headline, with the
existing fallback for stores that have no headline. Ordinary Campaigns retain
their Campaign name in the image area alongside the saved headline. Merchant
discovery projections live inside the Store module, preserving the ADR-007
Consumer/Merchant import boundary.

### Discovery entry

English Discover adds a separately labeled non-sale comparison example only
when the destination passes the same policy and frame checks. Its existing
Demo Optical entry remains. LLM discovery guidance names the Canary comparison
and canonical product Demo separately. There are no cross-merchant redirects.

The new internal link uses the existing `visutry/internal` attribution contract.
Those visits are internal assists, excluded from genuine external acquisition
proof. A public HTML read does not itself create a MerchantSession or an AI task.

## Verification and release receipt

Focused tests cover privacy/reference precedence, active selected-product
counting, both runtime read models, saved UI state, locale limits, actual-frame
editorial admission, destinations, and consistent metadata/structured data.
The local browser check uses disposable PGlite, real Next SSR and APIs, mock
authentication, TEST-classified fixtures, desktop and 430×932 viewports, and no
provider calls. It is UI/read-contract evidence, not a native PostgreSQL billing
or concurrency gate.

| Verification | Outcome |
| --- | --- |
| Saved-page eligibility and both backend read models | 7 targeted Jest suites, 95 tests passed |
| Editorial, exact-ID destinations, public source readers and detail page | 7 targeted Jest suites, 74 tests passed |
| Domain readiness, SEO metadata, existing sitemap and Campaign-list regression | 4 targeted Jest suites, 42 tests passed |
| ADR-007 Consumer stability and module boundary | 1 targeted Jest suite, 13 tests passed |
| Full TypeScript check | `tsc --noEmit --incremental false` passed |
| Changed source lint and whitespace | Targeted Next ESLint and `git diff --check` passed |
| Documentation audit | No canonical issues or actionable broken local links; existing repository metadata/archive warnings remain |
| Real local browser/API/SSR check | 1 scenario passed in 36.1 seconds; desktop and 430×932 screenshots visually reviewed |

The 19 unit suites contain **224 passing tests**. The final browser run verifies
actual product-link navigation to the same frame ID, image/name/canonical and
non-sale disclosure, return to the same Campaign, six current English detail
URLs in the dynamic sitemap, and HTTP 404 for unknown/other-tenant/non-English
IDs and Reference/private sources. MerchantSession, render reservation and
TryOnTask counts remain zero for the fixture after public browsing.

Reproduce the bounded browser check with:

```sh
VISUTRY_CONTAINER_E2E_SUITE=discovery bash scripts/container-e2e/run-merchant-browser.sh
```

Use a disposable checkout with dependencies installed and no `.env` or
`.env.local`; the runner enforces localhost-only datasource and runtime guards,
applies canonical migrations to a fresh local PGlite database, and creates only
local TEST fixtures. The default existing merchant browser suite is unchanged.

No production records, billing history, merchant classification, or provider
entitlements are changed by this implementation. Production outcome must be
established against the deployed commit and public routes, not inferred from
local tests or a successful build.

## Measurement after release

Use the release time as the new content observation point; preserve the
September Canary T0 and historical counts. Capture a first review after 7 days
and compare a full 28-day window with the baseline when enough data exists.
These are review windows, not a scheduled job or a traffic forecast.

| Question | Measure and boundary |
| --- | --- |
| Can crawlers read the changed pages? | HTTP status, canonical, robots, visible English copy, actual catalog, sitemap; record Store and Campaign separately |
| Did Google recrawl/index them? | Search Console URL inspection and last crawl; keep eligibility separate from indexing |
| Did search acquire shoppers? | Search Console page/query impressions and clicks; GA4 sessions whose landing page is the exact Canary Store or Campaign |
| Did an AI service cite/refer visitors? | Dated answer/citation captures with query and service; identifiable AI referral landings reported separately, without treating missing referrers as proof of zero AI exposure |
| Did visitors take meaningful actions? | Existing MerchantSession → MerchantEvent → MerchantIntent, scoped to the exact Merchant/Experience and excluding Reference/TEST/AUTOMATION/internal activity |
| Did Discover help? | Report its internal campaign separately; do not relabel assisted visits as direct Google/AI acquisition |

Track Demo Optical and its existing `/demo/frames/*` pages, the new Canary
`/discover/frames/{id}` destinations, and Reference merchants as separate
cohorts. The baseline indexing inspection of `/demo/frames/rectangle` is not
indexing evidence for the new Canary detail URLs. A static pageview is not a durable MerchantSession, and a
Google-attributed pageview after a Consumer landing is not a direct merchant
search landing. Existing static product-card links do not establish a complete
Product Click Intent funnel; do not infer absent events from GA4 pageviews.

## Bounded follow-up

- Observe the refreshed sample before claiming merchant acquisition impact.
- The existing manual IndexNow list still targets Demo Optical and its six
  detail pages. It was not submitted in this change. A future submission step
  must use fixed reviewed candidates, verify current robots/canonical/status,
  and include eligible Canary URLs explicitly; do not blindly submit a noindex
  Demo Store.
- A reusable merchant content/FAQ editor, automatic distribution hooks, and
  broader attribution changes remain separate work. This first experiment
  provides a concrete content and eligibility contract for that next decision.

## Authorities

- [Merchant Experience architecture](../product/specs/merchant-experience-architecture.md)
- [Demo environment and identity](./visutry-demo-environment-contract.md)
- [Original Canary evidence](./discovery-canary-2026-09-03.md)
- [Observability and analytics contract](../project/observability-and-analytics-contract.md)
