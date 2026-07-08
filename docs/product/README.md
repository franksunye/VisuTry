# VisuTry Product Documentation

**Status:** Active product documentation guide  
**Created:** 2026-07-08  
**Owner:** Product  
**Review cadence:** Weekly for active plan, monthly for document structure.

---

## 1. Purpose

This folder contains VisuTry's product planning and product specification documents.

The main goal is to make it clear what should be built next, why it matters, and how each initiative should be validated.

---

## 2. Key Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/product/product-plan.md` | Current product operating plan: Now / Next / Later, current sprint, initiatives, backlog, and decisions needed. | Active source of truth for product execution. |
| `docs/product/specs/` | Detailed specs for individual product capabilities. | Created as needed. |

---

## 3. Product Planning Rules

1. `product-plan.md` defines priority and sequencing.
2. Specs define detailed behavior and acceptance criteria.
3. Strategy documents explain why; product documents define what to build next.
4. A feature should not move into engineering execution until it is listed in the product plan or has an approved spec.
5. Product plan should stay short enough to review weekly.

---

## 4. Recommended Spec Template

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

## 5. Current Product Focus

The current product focus is defined in:

- `docs/product/product-plan.md`

Do not infer current product priority only from older dated roadmap documents.
