# VisuTry Productized Demo Capability

**Status:** Active source of truth
**Owner:** Product / Engineering / Growth / Sales
**Created:** 2026-10-01
**Last updated:** 2026-10-01
**Review cadence:** On every material Demo-path product change and before major customer-facing use
**Scope:** Product ownership, lifecycle, repeatability, Local/Production parity, and sales/marketing use of the canonical VisuTry Demo capability.

## 1. Decision

VisuTry Demo is a **first-class product capability**, not a temporary sales fixture or one-off QA environment.

The canonical Demo must evolve with the product. When VisuTry changes a capability that is part of the supported Demo journey, the change must include a Demo impact assessment and, where required, an update to the Demo data, assets, automated journey, documentation, or customer-facing material.

Working rule:

> **Product upgrades should keep the Demo representative of the product; the Demo should not become a parallel product fork.**

The Demo serves three equally valid purposes:

1. **Product / QA:** repeatable validation of the shopper decision journey and selected Merchant surfaces.
2. **Sales / presales:** reliable live walkthroughs, customer discovery, pilot scoping, and objection handling.
3. **Marketing / enablement:** screenshots, video, white-paper visuals, training material, product announcements, and reusable proof of product behavior.

The Demo is not customer proof, not a substitute for a real Pilot, and not permission to make claims beyond implemented behavior.

## 2. Canonical Demo

The canonical Demo tenant is **VisuTry Demo Optical** at:

`/{locale}/store/visutry-demo-optical`

Its identity and operational safety boundaries are owned by
[`docs/ops/visutry-demo-environment-contract.md`](../../ops/visutry-demo-environment-contract.md).

The canonical shopper journey is:

```text
Store
→ consent + approved synthetic shopper
→ Face Intelligence
→ personalized Recommendation
→ shortlist / Explore
→ frame selection
→ PREPARED_DEMO result
→ Compare
→ Decision Result
→ QR / clean mobile continuation
```

The Demo uses the same application/domain contracts as the corresponding product capabilities. Demo-specific code must be limited to explicit entitlement, deterministic fixture/provenance, prepared-result resolution, bounded reset/QA tooling, and other controls required to make the capability safe and repeatable.

Do not introduce a second recommendation algorithm, second Compare flow, second Decision Result model, or demo-only merchant business-rule stack.

## 3. Execution modes

### PREPARED_DEMO — default

`PREPARED_DEMO` is the default mode for normal product demos, meeting rehearsal, screenshots, video capture, and repeatable QA.

It is intentionally:

- deterministic;
- provider-free;
- bounded to the canonical Demo identity;
- source-typed;
- compatible with Compare, Decision Result, and QR/mobile continuation;
- independent of live Provider latency or availability.

Prepared visuals are approved Demo assets. They are not represented as a live generation from the current shopper request and are not evidence of guaranteed physical fit.

### LIVE_PROVIDER — separate validation

Live Provider generation is a separate reliability/product test and is **not required** for sales-demo readiness.

A live Provider run requires its own explicit authorization and bounded execution contract. A customer meeting must not depend on waiting for live generation.

## 4. Local and Production roles

### Local

Local is the repeatable development, regression, rehearsal, and content-production environment.

Use the
[`Local Demo Runtime Contract`](../../engineering/local-demo-runtime-contract.md)
for exact bootstrap, E2E, reset, MediaPipe, prepared-result, and Provider-smoke commands.

Local must be able to rebuild the canonical Demo fixture and reset shopper/session state without changing the stable merchant/catalog fixture.

### Production

Production is the canonical customer-facing Demo surface.

Production uses the explicitly entitled Demo tenant and approved private prepared-result assets. It is suitable for bounded sales walkthroughs and final meeting-readiness checks.

Production is not a sandbox for unbounded QA, catalog experiments, retries, billing tests, or live Provider experimentation.

### Parity principle

Local and Production may use different storage adapters and environment-specific data provisioning, but the customer-visible Demo journey and its application contracts should remain materially aligned.

A Local-only success is not sufficient evidence for a Production customer walkthrough when the changed capability has a Production-specific runtime, private-media, routing, or entitlement boundary.

## 5. Product lifecycle contract

Every material product change that touches the supported Demo journey must answer:

1. **Does this change affect what a prospect/customer sees or can do in the canonical Demo?**
2. **Does it change a shared contract used by the Demo?**
3. **Does the Demo fixture, prepared asset, copy, evidence, E2E, or sales material need to change?**

Classify the result as:

| Classification | Meaning |
| --- | --- |
| No Demo impact | Change is outside supported Demo scope. |
| Inherited parity | Demo automatically receives the product change through shared contracts; existing validation remains sufficient. |
| Demo update required | Fixture, UI path, asset, E2E, documentation, or sales material must be updated before the Demo is considered current. |

For Demo-relevant releases, Definition of Done should include the appropriate subset of:

- Local canonical Demo journey PASS;
- relevant focused unit/component tests;
- Demo fixture/provenance compatibility;
- Production bounded UI smoke when Production behavior changes;
- Provider-free assertion for the normal Demo path;
- desktop/mobile validation for customer-facing UI changes;
- update of this spec or the relevant runtime/ops contract when the operating model changes;
- review of reusable screenshots/video/playbook only when externally visible behavior materially changes.

A product release does not need to refresh every marketing asset. It does need to make the Demo impact explicit so customer-facing material does not silently drift.

## 6. Sales and presales operating model

Use the productized Demo as the default reusable working environment for:

- first-call and follow-up product walkthroughs;
- discovery meetings and customer requirement mapping;
- Pilot configuration discussions;
- objection handling;
- internal sales rehearsal;
- handoff from sales to Pilot implementation;
- repeat demonstrations across multiple prospects without rebuilding a custom environment each time.

Preferred live narrative:

```text
Store
→ Face Intelligence
→ Recommendation
→ shortlist
→ select Rowan / Lane
→ Prepared Demo
→ Compare
→ Decision Result
→ QR / mobile
```

The Demo should prove the decision journey clearly before discussing internal architecture or Provider details.

For a prospect-specific discussion, map their needs onto the canonical capability first. Do not create a bespoke code branch merely to make a sales call look customized.

When the prospect requires their own catalog, custom rules, kiosk configuration, integration, or operational workflow, move from **Demo** to a scoped **Pilot configuration** rather than mutating the canonical Demo into a customer tenant.

## 7. Marketing and content-production model

The canonical Demo is also the preferred source for reusable product material:

- product screenshots;
- short demo videos;
- white-paper product visuals;
- website proof sections;
- sales decks and meeting playbooks;
- release/change visuals;
- internal onboarding and training.

Use Local when repeatability, capture control, or fixture reset is important. Use Production when the material must prove the current public customer-facing surface.

Content rules:

- use the approved synthetic shopper only for canonical Demo evidence;
- keep product/frame identity and prepared-result provenance truthful;
- do not describe prepared visuals as current-session live Provider output;
- do not present Demo activity as real customer performance;
- do not expose private result/share tokens;
- do not use real shopper photos merely to make sales material look more authentic.

The Demo can be reused to produce new material after product upgrades; content does not need a new implementation project unless the product itself changed.

## 8. Demo, Reference Experience, and Pilot are different

| Surface | Purpose | Data / identity | What it proves |
| --- | --- | --- | --- |
| Canonical Productized Demo | Repeatable product walkthrough, QA, sales and content production | VisuTry-owned synthetic Demo tenant/assets | Current product behavior and supported journey |
| Reference Experience | Show how the product pattern maps to a merchant archetype | Public-source / simulation data with explicit disclaimers | Configurability and merchant-pattern applicability |
| Customer Pilot | Validate value with a real prospect/customer context | Approved customer catalog/configuration and scoped commercial agreement | Customer-specific usability, operational fit, and commercial evidence |

Never promote a Reference Experience or Demo to a customer success story.

## 9. Product and commercial boundaries

The Demo may demonstrate implemented:

- Face Intelligence;
- personalized recommendation;
- merchant catalog shortlist;
- frame selection;
- prepared Try-On representation;
- Compare;
- Decision Result;
- QR/mobile continuation;
- supported Merchant operating surfaces where relevant.

It must not imply:

- medical diagnosis;
- guaranteed physical fit or sizing accuracy;
- unimplemented WhatsApp automation;
- unverified checkout/revenue attribution;
- autonomous consequential actions;
- customer performance, conversion uplift, or revenue proof;
- that a prepared result was generated live when it was not.

Commercial packaging and customer-specific Pilot pricing are governed by current commercial/sales authorities, not by the Demo entitlement.

## 10. Ownership

- **Product** owns which capabilities the canonical Demo should represent and whether a product release requires Demo refresh.
- **Engineering** owns shared-contract parity, deterministic QA, entitlement safety, and the Local/Production execution path.
- **Growth / Marketing** owns truthful reuse of the Demo for public and internal content.
- **Sales** owns consistent walkthrough use and the boundary between reusable Demo and customer-specific Pilot.
- **Operations** owns Production identity, private asset/runtime safety, and bounded Production validation.

## 11. Current acceptance baseline

As of 2026-10-01:

- canonical Local and Production Demo use the same product journey and `PREPARED_DEMO` application contract;
- Production private Rowan/Lane prepared assets are checksum-validated;
- Production provider-free Golden Path has passed;
- clean mobile continuation has passed;
- recommendation shortlist product thumbnails have passed desktop/mobile Production validation;
- the canonical Production Demo has passed final Meeting Readiness.

Historical acceptance evidence is retained in GitHub Issues #288, #290, and #303. Those issues are evidence, not the long-term product authority; this document owns the durable product rule.

## 12. Related authorities

- Demo identity / Production operation: [`docs/ops/visutry-demo-environment-contract.md`](../../ops/visutry-demo-environment-contract.md)
- Local runtime / repeatable QA: [`docs/engineering/local-demo-runtime-contract.md`](../../engineering/local-demo-runtime-contract.md)
- Product system: [`docs/product/product-system.md`](../product-system.md)
- Product execution: [`docs/product/product-plan.md`](../product-plan.md)
- Sales playbook: [`docs/product/sales/visutry-store-sales-pitch.md`](../sales/visutry-store-sales-pitch.md)
- Reference portfolio: [`docs/product/sales/visutry-reference-portfolio-index.md`](../sales/visutry-reference-portfolio-index.md)
- Merchant operating behavior: [`docs/product/specs/merchant-operating-experience.md`](./merchant-operating-experience.md)

## Change log

| Date | Change |
| --- | --- |
| 2026-10-01 | Established Demo as a productized, reusable product capability with explicit Local/Production parity, product-upgrade obligations, and sales/marketing reuse rules after the Production Golden Path and shortlist readiness gates passed. |
