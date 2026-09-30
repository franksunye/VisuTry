# VisuTry Demo Production Provisioning — Read-Only Design

Status: historical provisioning design. The dedicated tenant was provisioned
under a separately approved Production operation. This document records the
original plan; the active identity and operating boundary is the
[VisuTry Demo Environment Contract](./visutry-demo-environment-contract.md).

## Canonical target

| Field | Approved plan value |
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

The shared commercial resolver must report `DEMO / DEMO_ACTIVE`. The three
marker fields are all required. Existing
`visutry-demo` Discovery Canary data is not a prerequisite and must not be
rewritten, reclassified, expired, deleted, or have its billing/session history
changed.

## Original read-only dry-run contract

The provisioning review used a dry-run-first contract. Its read-only phase was
required to:

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
5. Require separate, explicit Production authorization before any write-capable
   execution. Provisioning was later authorized and completed as a separate
   operation; this historical design document does not assert current row
   state or replace the active Demo Environment Contract.

The approved provisioning plan was one dedicated `TEST` Merchant with
`pilotType=DEMO` and `commercialExceptionCode=VISUTRY_DEMO`, one active Store,
the approved synthetic catalog and Store selection, and the existing bounded
Demo Try-On usage policy. It must not attach real customer data, a payment
method, a BillingAccount, a Stripe subscription, or a live billing lifecycle.
Provider execution remains subject to the normal router, sponsored-usage
controls where configured, and Store Demo attempt/render limits.

## Public URL compatibility decision

Use `/en/store/visutry-demo-optical` as the canonical dedicated Demo URL.
Preserve existing `/en/store/visutry-demo` links with one explicit permanent
redirect to the new slug, now that the target has been provisioned and its
public route passed the authorized smoke. The implementation is an exact
known-slug compatibility rule, not a generic merchant alias subsystem.

The redirect changes public routing only; it does not rewrite or delete the
historical canary row, its classification, plan, billing period, sessions, or
billing records. First-party discovery and sitemap links should resolve to the
canonical Demo URL. Current implementation status is recorded in the active
Demo Environment Contract.

## Original Phase 1 boundary

Phase 1 implemented the shared entitlement and Local fixture without
Production reads/writes, Stripe calls, route redirects, deployments, or
sales-material edits. Later Production provisioning and cache revalidation
were separately authorized. Current route/operation boundaries are in the
active Demo Environment Contract.
