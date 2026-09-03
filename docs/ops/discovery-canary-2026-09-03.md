# VisuTry Discovery Canary — 2026-09-03

Status: **STOPPED BEFORE PROVISIONING**

This is a read-only production audit of the existing `VisuTry Demo` and the
retired `Luna Optical` tenant. No production data, code, schema, or product
behavior was changed.

## Baseline

- Current production/main SHA: `20ddf18c9029634f7cdb4db22de338c529ab85fc`
- Original Traffic Ready T0: `2026-09-03T13:26:22.008Z`
- Axiom production dataset: `visutry-pro`
- Six canonical Reference Experiences: unchanged
- Discovery Canary T0: **NOT STARTED**

## VisuTry Demo audit

### Existing record

The current production database contains exactly one matching merchant:

| Field | Value |
| --- | --- |
| Merchant ID | `cmsq1vcg3000049fy2ngsqplk` |
| Name | `VisuTry Demo` |
| Slug | `visutry-demo` |
| Status | `ACTIVE` |
| Classification | `INTERNAL` |
| Pilot type | `INTERNAL` |
| `referenceData` | `false` |
| `sponsoredUsagePolicyKey` | `VISUTRY_OWNED` |
| Classification source | `G0_AUDIT_2026-08-26` |
| Website URL | `null` |

The identity is truthful and first-party. The seed and stored metadata describe
it as a VisuTry-owned internal validation experience. It does not claim an
external merchant, customer, partner, or brand endorsement.

### Store and Campaign

| Surface | Record | Status | Active selected frames | Current visibility |
| --- | --- | --- | ---: | --- |
| Store | `VisuTry Demo Store` / `store` | `ACTIVE` | 6 | `PUBLIC_NOINDEX` |
| Campaign | `Everyday Fit` / `everyday-fit` | `ACTIVE` | 4 | `PUBLIC_NOINDEX` |

Routes:

- Store: `https://www.visutry.com/en/store/visutry-demo`
- Campaign: `https://www.visutry.com/en/c/visutry-demo/everyday-fit`

Both routes currently render HTTP 200 guest-readable HTML. Both currently
return `noindex, follow`, expose a stable canonical URL, and include the
Store/Campaign JSON-LD read model. Neither route currently exposes a product
link because the catalog has no product destinations.

### Catalog

The six active frames are generic VisuTry-owned catalog records:

| Catalog | Count | Review/readiness evidence | Product destination |
| --- | ---: | --- | --- |
| Store catalog | 6 | Active, stable SKU/external ID, local VisuTry image, complete shape/material/color/width metadata, `NOT_REQUIRED` enrichment | 0 |
| Campaign selection | 4 | Same records; active and recommendation-ready under current validation | 0 |

The local images are the existing first-party assets under
`public/assets/glasses-presets/`. No external brand catalog is involved. Every
stored `MerchantFrame.productUrl` is `null`.

### Eligibility decision

The server-authoritative policy in
`src/modules/store/domain/experience-search-visibility.ts` requires an active,
non-Reference Experience with a meaningful title, at least four selected
catalog frames, an indexable merchant state, and either a valid merchant URL or
an HTTP product destination. The current Demo fails the last condition and is
also excluded from the Agent Distribution report because both its merchant
classification and pilot type are `INTERNAL`.

The existing first-party alternatives were checked:

- `https://www.visutry.com/en/try-on/glasses` is a valid public generic tool
  landing page, not a frame-level product page or purchase destination.
- `https://www.visutry.com/en/business` is a business landing page, not a
  frame-level product destination; it is not used.
- `/en/try/<global-frame-id>` is not a usable current production destination:
  the current Vercel production route returns 404 while programmatic product
  SEO is closed.
- No existing first-party, frame-specific product destination was found in
  the project or current production data.

Using a generic tool or business page as every frame's `productUrl` would make
the visible “View product” action misleading and would not satisfy the current
product-destination contract. Setting only `websiteUrl` would make the
indexability resolver pass, but would not provide a legitimate Product Click
path and would bypass the required canary shape.

**Reuse verdict: `REUSE_NOT_ELIGIBLE`.**

Per the task stop condition, provisioning stops here. No classification,
pilot-type, visibility, catalog, or destination values were changed.

## Luna audit

No current `Merchant` row exists for `luna-optical`, and the historical
merchant ID `cmsfv079x0000fps6mrokbs8v` has zero residual rows in the current
production database across Merchant, MerchantFrame, Experience,
MerchantSession, MerchantEvent, MerchantIntent, StoreAsset,
MerchantUsageLedger, StoreAbuseCounter, TryOnTask, membership, agent
credential, OAuth, sponsored-usage, orphan-blob, billing, and operation-audit
tables.

The existing retirement record `reports/luna-optical-retirement-2026-08-26.md`
records that Luna was an obsolete fictional demo tenant, was changed to
`INACTIVE`, deleted in an FK-safe transaction, and verified absent. Its
replacement `visutry-demo` remained active.

**Luna status: `ALREADY_DELETED`.**

Luna was not reactivated, modified, or used as a canary.

## Canary configuration

No canary was provisioned.

| Field | Result |
| --- | --- |
| Merchant | Existing `VisuTry Demo` only; not promoted |
| Store URL | Present/readable, but not indexable |
| Campaign URL | Present/readable, but not indexable |
| Classification | Remains `INTERNAL` |
| Indexability | `PUBLIC_NOINDEX` |
| Catalog | 6 Store / 4 Campaign active frames |
| Product destinations | 0; P0 blocker |
| Sitemap admission | Not admitted; dynamic sitemap remains empty |
| New Merchant | None |

## Reporting and Gate A

The current `report:agent-distribution` merchant contract excludes sessions
when any of the following applies: session or merchant `referenceData`,
merchant or Experience `pilotType=REFERENCE/INTERNAL`, merchant
classification `REFERENCE/INTERNAL/TEST/AUTOMATION/SUSPICIOUS`, or an
unscoped session. `UNKNOWN` and `POSSIBLE_EXTERNAL` are not equivalent to a
truthful first-party canary identity; `REAL` is the commercial classification
used by commercial KPI computation. No reclassification was made while the
required product destination is absent.

The current report was run read-only for the rolling 14-day window available at
verification time:

- Consumer events read: 0
- Consumer Agent sessions: 0
- Merchant sessions read: 102
- Excluded Reference/Internal sessions: 99
- Excluded TEST/AUTOMATION sessions: 3
- Qualifying Store/Campaign sessions: 0

The Demo's existing sessions therefore remain excluded under the current
internal-validation policy. No synthetic Agent traffic was manufactured.

## Production verification performed before stop

Read-only route and metadata probes were run against current production:

| Check | Result |
| --- | --- |
| Demo Store route | HTTP 200; guest-readable |
| Demo Campaign route | HTTP 200; guest-readable |
| Demo Store/Campaign current robots | `noindex, follow` |
| Demo Store/Campaign canonical | Stable canonical route present |
| Demo Store/Campaign structured data | JSON-LD present |
| Dynamic sitemap | HTTP 200; no Demo entry, no current entries |
| Generic `/en/try-on/glasses` | HTTP 200; public generic tool landing |
| Frame product page probe | `/en/try/<global-frame-id>` returns HTTP 404 |
| Luna Store route | HTTP 404 |
| Production smoke baseline | Root and `/en` HTML/assets passed |

The shopper session/recommendation/Try-On/Compare/Intent flow was not executed
against Demo because doing so would validate an `INTERNAL` tenant that cannot
be promoted to a truthful public canary without a legitimate product
destination. No production MerchantSession/Event/Intent rows were created by
this task.

## Experiment conclusion

The existing Demo proves that the Store/Campaign runtime can render a
first-party catalog, but it cannot yet close the requested discovery loop:

```text
direct discovery → Store/Campaign → decision → product destination → Intent
```

The exact P0 blocker is the absence of an existing legitimate first-party
product destination. The current system can expose static catalog facts and
support Favorite/other non-product interactions, but a Product Click Intent
requires a valid `MerchantFrame.productUrl`, and the server resolves that URL
from the stored frame rather than accepting a client-supplied substitute.

No new Merchant is created as a workaround. No Reference Experience is
promoted. No report exclusion is changed.

## Timestamps

- Original Traffic Ready T0: `2026-09-03T13:26:22.008Z` — remains valid.
- Discovery Canary T0: `NOT STARTED` — no eligible PUBLIC_INDEX canary reached
  production readiness.

## Non-scope confirmation

- Six canonical Reference Experiences: untouched.
- Luna: untouched during this task; already deleted before this audit.
- New Merchant: not created.
- Product or architecture features: none.
- Schema or migration: none.
- Reporting semantics: unchanged.
- Search/indexability modes: unchanged.
- Real payments, checkout, or merchant inquiries: none.
- `#178` / `#179`: no work performed.

## Required next approval before any implementation

The product owner must supply or explicitly authorize a truthful VisuTry-owned
frame-level product destination (or an already-existing authorized destination
that is genuinely a product page). Once that P0 input exists, the existing
Demo can be reassessed for the smallest data-only transition; this document
does not authorize creating a new Merchant or changing the Reference policy.
