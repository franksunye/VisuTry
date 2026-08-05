# VisuTry Product Documentation

**Status:** Active product documentation guide  
**Created:** 2026-07-08  
**Last updated:** 2026-08-05  
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
| `docs/product/specs/visutry-store-sales-demo.md` | Working Store Sales Demo: 10-minute merchant story, shopper flow, merchant insights, data/events, and D0 acceptance criteria. | **Approved for engineering.** |
| `docs/product/specs/visutry-store-engineering-foundation.md` | Mandatory Store architecture and engineering constraints: modular boundary, tenancy, actor/usage policy, shared generation, events, assets, idempotency, and tests. | **Approved; required before Store feature work is merge-ready.** |
| `docs/product/specs/visutry-store-mvp.md` | Store M1 product scope for the first 3-5 merchant pilots. | **Approved scope; D0 → M1 gated execution.** |
| `docs/product/plans/visutry-store-implementation-plan.md` | Store execution sequence, engineering epics, gates, validation sprint, and definition of done. | **Active execution plan.** |
| `docs/product/specs/visutry-store-landing-page.md` | Merchant validation landing page and lead-capture surface. | Shipped / measuring. |

---

## 3. Product Planning Rules

1. `product-plan.md` defines priority and sequencing.
2. Specs define detailed behavior and acceptance criteria.
3. Strategy documents explain why; product documents define what to build next.
4. A feature should not move into engineering execution until it is listed in the product plan or has an approved product spec.
5. Product plan should stay short enough to review weekly.
6. When an approved implementation plan exists for a scoped initiative, engineering should follow its gates and work breakdown rather than infer sequencing from older roadmap documents.

---

## 4. Current Store Execution Rule

As of 2026-08-05, VisuTry Store has moved from landing-page-only validation into a gated engineering phase.

Current sequence:

```text
Store LP
  ↓
D0-0 Engineering Foundation
  ↓
D0 Working Sales Demo
  ↓
Merchant demos / own-frame sample requests
  ↓
M1 First-Pilot MVP
  ↓
3-5 active merchant pilots
  ↓
Only then evaluate Shopify / broader integrations
```

Engineering should start with:

1. `docs/product/specs/visutry-store-engineering-foundation.md`
2. `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`
3. `docs/product/specs/visutry-store-sales-demo.md`
4. `docs/product/plans/visutry-store-implementation-plan.md`
5. `docs/product/specs/visutry-store-mvp.md`

The Sales Demo is approved to start now. D0 feature implementation must first satisfy the D0-0 foundation gate. M1 hardening follows the explicit Gate B conditions in the implementation plan or a direct Product decision to operationalize a live pilot.

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

For Store specifically, the 2026-08-05 approved specs and implementation plan above are the current execution authority and supersede older Store sequencing language that treated a working merchant demo as purely backlog work.

Do not infer current product priority only from older dated roadmap documents.
