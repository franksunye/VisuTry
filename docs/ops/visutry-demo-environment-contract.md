# VisuTry Demo Environment Contract

**Status:** Active operational authority
**Owner:** Product / Engineering / Operations
**Last reviewed:** 2026-10-01
**Scope:** Canonical VisuTry-owned Demo identity, public URL, prepared-result
parity, provider policy, Local/Production Demo operation, and the operational
boundary for the productized Demo capability.

This document is the source of truth for which tenant is the canonical Demo
and what provider-free Demo readiness means. Product ownership, lifecycle, and
sales/marketing reuse are governed by the
[Productized Demo Capability](../product/specs/visutry-demo-capability.md).
This document supersedes phase-specific Demo instructions where they conflict.
It does not authorize Production data changes, billing changes, Provider
requests, or deployments.

## Canonical identity

The only canonical VisuTry Demo tenant is:

| Field | Contract |
| --- | --- |
| Merchant | `VisuTry Demo Optical` |
| Slug | `visutry-demo-optical` |
| Machine-readable slug contract | [`src/config/visutry-demo-identity.json`](../../src/config/visutry-demo-identity.json) |
| Classification | `TEST` |
| Pilot type | `DEMO` |
| Commercial exception | `VISUTRY_DEMO` |
| Commercial state | `DEMO` / `DEMO_ACTIVE` |
| Commercial plan / billing | No commercial plan, BillingAccount, Stripe customer, or subscription is required |
| Store | One active Store |
| Catalog | Ten synthetic, VisuTry-owned, non-sale demo frames from [`visutry-demo-catalog-v1.json`](../assets/local-demo/visutry-demo-catalog-v1.json) |
| Shopper input | The approved synthetic Demo Shopper asset in [`ASSET_PROVENANCE.md`](../assets/local-demo/ASSET_PROVENANCE.md) |
| Purpose | Productized demonstration, product QA, sales/presales walkthroughs, Playbook rehearsal, and reusable marketing/content production |

The three identity markers are conjunctive. `TEST`, `DEMO`, or
`VISUTRY_DEMO` alone does not grant Demo entitlement. Demo is not a commercial
plan and does not inherit paid-plan lifecycle or billing-period expiry.
Try-On entitlement is separate from permission to incur Provider cost: normal
Demo operation does not imply an unrestricted or automatic Provider call.

## Historical Discovery Canary

`VisuTry Demo` at slug `visutry-demo` is a separate historical Production
Discovery Canary: `classification=REAL`, `pilotType=LIVE`, and
`classificationSource=DISCOVERY_CANARY_2026-09-03`. It contains historical
billing and shopper-session records. Its original record is documented in
[`discovery-canary-2026-09-03.md`](./discovery-canary-2026-09-03.md). It is not
the canonical sales or QA Demo tenant; it is retained for audit/history only.

> **DO NOT USE `visutry-demo` AS THE SALES OR QA DEMO. DO NOT rewrite or delete
> its billing or historical records. DO NOT provision new Demo workflows
> against it.**

## Canonical public routes

- Canonical Store: `/{locale}/store/visutry-demo-optical`
- Compatibility: exact `/{locale}/store/visutry-demo` redirects permanently to
  `/{locale}/store/visutry-demo-optical`, preserving the locale and request
  query parameters.
- The redirect is a single known-slug rule. It is not a generic merchant alias
  system. Other merchant Store routes are unchanged.
- First-party Discover, LLM discovery, IndexNow, and Demo frame details point
  to the canonical tenant. The dynamic sitemap omits the historical Canary
  Store/Campaign paths; the canonical Store remains subject to the existing
  public-discovery admission policy (this contract does not bypass that policy).
  The Store compatibility redirect remains available to existing links.
- The existing `/demo/frames/{round,rectangle,oval,browline,aviator,cat-eye}`
  URLs remain stable but resolve their allowlisted SKUs from the canonical
  ten-frame Demo catalog. They link back to the canonical Demo Store; they do
  not depend on the historical Canary rows.

The old `/en/c/visutry-demo/everyday-fit` Campaign is historical Canary
content, not a canonical Demo continuation. Do not promote it as the current
Demo journey. This contract does not delete or mutate it.

## Standard journey and Provider rule

The canonical shopper journey is:

```text
Store
→ consent and synthetic shopper photo
→ on-device Face Intelligence
→ personalized Recommendation
→ Explore all frames
→ select frames
→ prepared Demo result by default (live Try-On only with separate authorization)
→ Compare
→ Decision Result
→ QR / mobile continuation
```

The default `PREPARED_DEMO` path continues from frame selection through
Compare, Decision Result, and QR/mobile without a Provider request. Normal Demo
readiness requires **zero Provider calls**. Local uses approved prepared Demo
assets; Production uses the separately approved private prepared assets, and
missing or mismatched assets fail closed. No Retry, GrsAI, or Gemini request is
part of the default rehearsal. Any live Provider smoke is a separate
cost-bearing operation and requires explicit Lead authorization with a
bounded scope. Meeting readiness must never depend on a live generation.

Real Provider generation is not required for a normal sales demonstration.

### Shared `PREPARED_DEMO` capability and readiness

`PREPARED_DEMO` is a first-class application execution mode shared by the
canonical Local and Production Demo. Both use the same authorization,
selection, prepared-result, Compare, Decision Result, and QR/mobile continuation
contracts. Environment-specific behavior is limited to the media adapter and
which explicitly approved assets it may resolve.

- **Local:** the canonical manifest resolves the two checksum-verified,
  Lead-approved prepared Demo outputs documented in
  [`prepared-results/APPROVED_ASSETS.md`](../assets/local-demo/prepared-results/APPROVED_ASSETS.md).
  They are pre-approved Demo results, not live generations from the current
  shopper session. The canonical full browser/restart E2E has passed with exact
  output-byte verification and a final shopper-state reset. The older
  disclosure-only QA SVG fixtures remain `LOCAL_QA_FIXTURE` and are not
  selected by the canonical journey.
- **Production:** the canonical Demo resolves the two approved private prepared-result
  assets through the Production private-media adapter. The deployed path has
  passed checksum-validated Rowan/Lane reads, Compare, Decision Result, and
  clean mobile continuation. Missing or mismatched allowlisted assets still
  fail closed; Production never falls back to Local QA files or manufactures a
  live `TryOnTask`.
- Prepared results are source-typed and do not create Provider request/attempt
  telemetry or paid Try-On usage. They are not represented as a live generation
  from the current shopper request.
- Default Demo readiness remains **Provider calls = 0**. A live Provider run
  is a separate, bounded smoke path and requires explicit Lead authorization;
  it is not needed for normal Demo readiness. Local `LIVE_PROVIDER` remains
  limited to the existing authorized GrsAI smoke command; any Production live
  Provider smoke requires its own explicit, bounded authorization. No implicit
  Gemini fallback is allowed.

An earlier pre-asset Production smoke reached Rowan/Lane selection and stopped
before Try-On submission. That run is historical evidence only and is
superseded for readiness by the 2026-10-01 provider-free Production Golden
Path, clean mobile continuation, and shortlist-thumbnail validation. It did not
and does not authorize unbounded Provider generation.

## Production Demo parity state

Production and Local use the same explicit Demo identity and shopper product
capabilities; their Merchant/catalog data may differ. Local is the primary
repeatable QA environment. Production must not be used to prove unbounded
generation, seed data, or test retries.

| Concern | Local | Production |
| --- | --- | --- |
| Tenant identity | Canonical `TEST` / `DEMO` / `VISUTRY_DEMO` fixture | Dedicated canonical Demo tenant with the same three markers |
| Database | Guarded Local PostgreSQL | Production database; read-only except a separately authorized, bounded Demo operation |
| Face Intelligence / Recommendation | Real browser inference and canonical deterministic domain path | Same product path |
| Provider default | Zero Provider calls; shared `PREPARED_DEMO` uses the two approved Local result assets | Zero Provider calls; shared `PREPARED_DEMO` uses the approved private Production result assets |
| Result continuation | Full journey validated with the approved prepared Demo outputs; no Try-On task or generation telemetry is created | Full provider-free journey validated through Compare, Decision Result, and clean mobile continuation with approved private prepared assets |
| Paid billing | Local Stripe TEST configuration only when relevant | No BillingAccount or Stripe subscription required for Demo; no payment in Demo QA |

For exact commands, reset boundaries, environment guards, and real-provider
Local authorization, use the [Local Demo Runtime Contract](../engineering/local-demo-runtime-contract.md).
For the original Production tenant dry-run/provisioning decision, see the
[Production Demo Provisioning Design](./visutry-demo-production-provisioning-design.md).

## Change control

- Keep the Local Demo seed and Local QA data inside Local PostgreSQL.
- Production Demo mutations require separate explicit authorization scoped to
  the named tenant and records.
- Do not mutate the historical `visutry-demo` Canary to make the canonical Demo
  work.
- Never use real shopper/customer photos in Demo evidence.
- Environment-parity work must not silently rewrite approved customer material.
  When a product change materially changes the Demo story, route the resulting
  content refresh through the Productized Demo Capability lifecycle rather than
  treating sales assets as infrastructure side effects.
- Any public route, asset, Provider, retention, billing, or entitlement change
  must be reviewed as its own bounded implementation/operations gate.
- Any product release that changes the supported Demo journey must perform the
  Demo impact assessment defined in `docs/product/specs/visutry-demo-capability.md`.
