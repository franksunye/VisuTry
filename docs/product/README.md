# VisuTry Product Documentation

**Status:** Active product documentation guide  
**Created:** 2026-07-08  
**Last updated:** 2026-08-06  
**Owner:** Product  
**Review cadence:** Weekly for active plan, monthly for document structure.

---

## 1. Purpose

This folder contains VisuTry's product planning and product specification documents.

The main goal is to make it clear what should be built next, why it matters, how each initiative should be validated, and which documents are approved for engineering execution.

---

## 2. Key Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/product/product-plan.md` | Current product operating plan: Now / Next / Later, current sprint, initiatives, backlog, and decisions needed. | Active source of truth for product execution. |
| `docs/product/specs/` | Detailed specs for individual product capabilities. | Created as needed. |
| `docs/product/sales/visutry-store-sales-pitch.md` | Store sales pitch, outreach copy, qualification, demo talk track, pilot offer, objection handling, claims boundary, and validation targets. | **Active sales-validation source of truth.** |
| `docs/product/specs/visutry-store-sales-demo.md` | Working Store Sales Demo: 10-minute merchant story, shopper flow, merchant insights, data/events, and D0 acceptance criteria. | **D0 implemented; controlled merchant validation active.** |
| `docs/product/specs/visutry-store-engineering-foundation.md` | Mandatory Store architecture and engineering constraints: modular boundary, tenancy, actor/usage policy, shared generation, events, assets, idempotency, and tests. | **Implemented for D0; mandatory for all later Store work.** |
| `docs/product/specs/visutry-store-mvp.md` | Store M1 product scope for the first 3-5 merchant pilots. | **D0 implemented; M1 approved but gated.** |
| `docs/product/plans/visutry-store-implementation-plan.md` | Store execution sequence, engineering epics, gates, validation sprint, and definition of done. | **D0 shipped; positioning realignment and merchant validation active; M1 gated.** |
| `docs/product/specs/visutry-store-landing-page.md` | Merchant validation landing page and lead-capture surface. | Shipped / repositioning required. |
| `docs/ops/store-d0-production-verification-2026-08-05.md` | Immutable evidence record for the D0 production deployment, seed, API flow, generation, usage, retention, and remaining gate work. | **Production verification passed; Gate A1 remains closed.** |

---

## 3. Product Planning Rules

1. `product-plan.md` defines priority and sequencing.
2. Specs define detailed behavior and acceptance criteria.
3. Strategy documents explain why; product documents define what to build next.
4. A feature should not move into engineering execution until it is listed in the product plan or has an approved product spec.
5. Product plan should stay short enough to review weekly.
6. When an approved implementation plan exists for a scoped initiative, engineering should follow its gates and work breakdown rather than infer sequencing from older roadmap documents.
7. Store merchant-facing wording, outreach, pilot packaging, and sales claims should follow `docs/product/sales/visutry-store-sales-pitch.md` so Sales does not outrun implemented product boundaries.

---

## 4. Current Store Execution Rule

As of 2026-08-06, VisuTry Store D0 is implemented and production-verified for controlled, team-operated merchant demonstrations. Merchant validation and positioning realignment are active; M1 and independent external shopper traffic remain gated.

Current sequence:

```text
Store LP [shipped; reposition now]
  ↓
D0-0 Engineering Foundation [complete]
  ↓
D0 Working Sales Demo [complete; narrative realignment active]
  ↓
Sales pitch + merchant demos / own-frame sample requests [current]
  ↓
M1 First-Pilot MVP [Gate B]
  ↓
3-5 active merchant pilots
  ↓
Only then evaluate Shopify / broader integrations
```

Store product hierarchy:

```text
Storefront = first SaaS delivery surface
Campaign Engine = scalable merchant growth / usage layer
Commerce Intelligence = optimization layer
Agent-Ready Commerce = future distribution foundation
```

Engineering should start with:

1. `docs/product/specs/visutry-store-engineering-foundation.md`
2. `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`
3. `docs/product/specs/visutry-store-sales-demo.md`
4. `docs/product/plans/visutry-store-implementation-plan.md`
5. `docs/product/specs/visutry-store-mvp.md`

Growth / Sales should start with:

1. `docs/product/sales/visutry-store-sales-pitch.md`
2. `docs/product/specs/visutry-store-landing-page.md`
3. `docs/product/specs/visutry-store-sales-demo.md`
4. `docs/product/plans/visutry-store-implementation-plan.md`

D0 engineering and its controlled production smoke are complete. Team-operated merchant demos may proceed under `docs/ops/store-d0-operator-note.md`; Gate A1 remains closed, so the URL must not be distributed for independent non-team shopper use. M1 hardening starts only after the explicit Gate B conditions in the implementation plan or a direct Product decision to operationalize a live pilot.

---

## 5. Recommended Spec Template

Each product spec should include:

```markdown
# Feature Name Spec

**Status:** Draft / Ready / In Progress / Shipped
**Owner:** Product / Engineering
**Created:** YYYY-MM-DD
**Last updated:** YYYY-MM-DD

## 1. Problem
## 2. Goal
## 3. Non-goals
## 4. User flow
## 5. Functional requirements
## 6. Data / events
## 7. UX notes
## 8. Edge cases
## 9. Acceptance criteria
## 10. Open questions
```

---

## 6. Current Product Focus

The broad product focus remains defined in:

- `docs/product/product-plan.md`

For Store specifically, the approved Store specs, implementation plan, and sales pitch playbook above are the current execution authority. They supersede older Store sequencing or sales wording that treated Store as only a merchant storefront / generic VTO workflow.

Do not infer current product priority or merchant positioning only from older dated roadmap documents.
