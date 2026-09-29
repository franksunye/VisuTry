# VisuTry Demo Production Provisioning — Read-Only Design

Status: design only. This document does not provision or mutate a Production
Merchant, Store, catalog, route, or billing record.

## Canonical target

| Field | Proposed value |
| --- | --- |
| Merchant name | `VisuTry Demo Optical` |
| Merchant slug | `visutry-demo-optical` |
| Classification | `TEST` |
| Pilot type | `DEMO` |
| Commercial exception | `VISUTRY_DEMO` |
| Plan | none (`planCode = null`) |
| Billing | no BillingAccount; no Stripe customer/subscription |
| Catalog and media | synthetic, VisuTry-owned demo assets only |
| Shopper/customer data | none |

The shared commercial resolver must report `DEMO / DEMO_ACTIVE` before this
tenant is linked publicly. The three marker fields are all required. Existing
`visutry-demo` Discovery Canary data is not a prerequisite and must not be
rewritten, reclassified, expired, deleted, or have its billing/session history
changed.

## Read-only dry-run contract for a later authorized operation

The eventual provisioning tool should default to `--dry-run` and be unable to
write in dry-run mode. Its read-only phase should:

1. Verify Production environment identity and the expected Production database
   marker without printing connection strings or credentials.
2. Read the exact `visutry-demo-optical` slug. If absent, print the proposed
   tenant plan below. If present, print its marker/status summary and refuse to
   infer ownership or repair it automatically.
3. Read-only check that the proposed VisuTry-owned asset manifest is complete
   and that every item is explicitly synthetic and non-sale.
4. Print the prospective rows, references, and post-create verification steps;
   do not create a Merchant, membership, Store, frame, billing record, or
   provider request.
5. Require a separate, explicit Production authorization before any later
   write-capable execution is even introduced. That future operation must be
   reviewed as a separate task.

The future approved provisioning plan is one dedicated `TEST` Merchant with
`pilotType=DEMO` and `commercialExceptionCode=VISUTRY_DEMO`, one active Store,
the approved synthetic catalog and Store selection, and the existing bounded
Demo Try-On usage policy. It must not attach real customer data, a payment
method, a BillingAccount, a Stripe subscription, or a live billing lifecycle.
Provider execution remains subject to the normal router, sponsored-usage
controls where configured, and Store Demo attempt/render limits.

## Public URL compatibility recommendation

Use `/en/store/visutry-demo-optical` as the canonical dedicated Demo URL.
Preserve existing `/en/store/visutry-demo` links with one explicit permanent
redirect to the new slug—but add that redirect only after the canonical target
has been provisioned and its public route has passed an authorized smoke.
This is a single known-slug compatibility rule, not a generic merchant alias
subsystem. Until that later operation is approved, leave the existing route and
the REAL/LIVE Discovery Canary behavior exactly as they are.

The redirect changes public routing only; it does not rewrite or delete the
historical canary row, its classification, plan, billing period, sessions, or
billing records. Update first-party discovery/sitemap links to the canonical
Demo URL in the same later, separately reviewed release.

## Current Phase 1 boundary

Phase 1 implements the shared entitlement and Local fixture only. It performs
no Production reads or writes, Stripe calls, route redirects, deployments, or
sales-material edits.
