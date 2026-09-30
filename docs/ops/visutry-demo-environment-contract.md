# VisuTry Demo Environment Contract

**Status:** Active operational authority
**Last reviewed:** 2026-09-30
**Scope:** Canonical VisuTry-owned Demo identity, public URL, provider policy,
and Local/Production Demo operation.

This document is the source of truth for which tenant is the canonical Demo
and what “provider-free Demo” currently means. It supersedes phase-specific
Demo instructions where they conflict. It does not authorize Production data
changes, billing changes, Provider requests, or deployments.

## Canonical identity

The only canonical VisuTry Demo tenant is:

| Field | Contract |
| --- | --- |
| Merchant | `VisuTry Demo Optical` |
| Slug | `visutry-demo-optical` |
| Classification | `TEST` |
| Pilot type | `DEMO` |
| Commercial exception | `VISUTRY_DEMO` |
| Commercial state | `DEMO` / `DEMO_ACTIVE` |
| Commercial plan / billing | No commercial plan, BillingAccount, Stripe customer, or subscription is required |
| Store | One active Store |
| Catalog | Ten synthetic, VisuTry-owned, non-sale demo frames from [`visutry-demo-catalog-v1.json`](../assets/local-demo/visutry-demo-catalog-v1.json) |
| Shopper input | The approved synthetic Demo Shopper asset in [`ASSET_PROVENANCE.md`](../assets/local-demo/ASSET_PROVENANCE.md) |
| Purpose | Sales demonstration, product QA, and Playbook rehearsal |

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
→ Try-On
→ Compare
→ Decision Result
→ QR / mobile continuation
```

The normal Demo readiness check must require **zero Provider calls**. A
walkthrough may validate Store, Face Intelligence, Recommendation, catalog
selection, and reach the Try-On submission boundary without submitting. No
Retry, GrsAI, or Gemini request is part of the default rehearsal. Any live
Provider smoke is a separate cost-bearing operation and requires explicit
Lead authorization with a bounded scope. Meeting readiness must never depend
on making a live generation request.

Real Provider generation is not required for a normal sales demonstration.

### Current provider-free continuation limitation

The Production Try-On submission point is available under the explicit Demo
entitlement, but the normal production application does not currently have an
approved prepared-result path that continues from that point to a genuine
Compare / Decision Result / mobile result without a Provider request.

The existing result flow represents completed images through completed
`TryOnTask` records. A Decision Result stores references to those task IDs and
the result reader verifies tenant, session, frame, completion, retention, and
asset ownership before serving media. There is no current first-class
`prepared-demo-result` source in this contract or runtime. Therefore:

- Do not manufacture `TryOnTask`, `GenerationRequest`, or `GenerationAttempt`
  rows to make a prepared image look like a live generation.
- The Local no-provider E2E fixture is test-only. Its deterministic placeholder
  and fixture metadata prove application continuity, not production image
  quality or a genuine Try-On result. Never present it as a customer-facing
  prepared result.
- The Local real-provider smoke completed two GrsAI generations (Rowan and
  Lane), zero Gemini submissions, and verified the result after app restart.
  The canonical runner then performed its scoped final reset. The run's
  screenshots/audit remain QA evidence under ignored `.local/`; the Try-On
  database rows and Local media bytes are not a durable reusable product
  asset set.
- The prior Production bounded smoke reached the Rowan + Lane Try-On submit
  point and stopped before submission. It therefore did not validate
  Production Compare, Decision Result, or mobile result continuation.

The observed Production labels were `Try on your photo`, `I understand — continue`,
`Fit profile detected`, `Recommended for you`, `Explore all frames`,
`Selected 2 of 2`, and `Try on selected frames`. The Y2K walkthrough describes
the same broad decision stages and explicitly calls for prepared real Try-On /
Compare states instead of depending on a fresh generation during the meeting.
The observed Store-to-selection interaction aligns; provider-free continuation
after selection is the unresolved gap. The Playbook's Decision Result and
QR/mobile stages were not demonstrated by that Production smoke. Use its
existing approved video fallback if a meeting requires those later screens
before prepared-result capability is separately approved. This is an
operational finding, not an instruction to edit the Playbook or other approved
sales material.

If provider-free continuation is later required in Production, create a
separate approved implementation gate. It should use explicitly approved,
durable prepared output assets with a discriminated provenance such as
`PREPARED_DEMO`, restricted to the canonical Demo tenant and allowlisted frame
identities. The user-facing experience must disclose that these are prepared
Demo results, not a live generation from the current request. It must not
create provider telemetry or masquerade as a completed `TryOnTask`. The
existing compare/result contracts need a deliberate extension or a separate
prepared-result read path; a fake Try-On task is not an acceptable shortcut.
Asset rights, input/output provenance, retention, and visual quality require
explicit review before those assets are promoted.

This is a design boundary only; this document does not implement prepared
results or approve reusing the prior GrsAI outputs as shipped assets.

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
| Provider default | Blocked; deterministic Try-On only inside the dedicated Local E2E fixture | No Provider call by default |
| Result continuation | Local E2E validates app plumbing with a test fixture; not a presentation asset | No prepared-result continuation is currently approved/available without a Provider request |
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
- Do not edit the Y2K Playbook, White Paper, Demo Video, Pilot Configuration,
  Commercial Proposal, or other approved sales material as part of an
  environment-parity task.
- Any public route, asset, Provider, retention, billing, or entitlement change
  must be reviewed as its own bounded implementation/operations gate.
