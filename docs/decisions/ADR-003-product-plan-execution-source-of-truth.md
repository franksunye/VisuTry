# ADR-003: Product Plan Is the Execution Source of Truth

**Status:** Accepted  
**Date:** 2026-07-08  
**Owner:** Product

---

## Context

VisuTry now has several useful documents: commercial strategy, benchmark research, SEO/Growth plans, B2B roadmap, product specs, architecture notes, and historical plans.

This creates a risk that contributors infer current priorities from older dated roadmap documents, archived SEO plans, or benchmark notes instead of a single active product execution plan.

The team needs one document that answers:

1. What should be worked on now?
2. What is next?
3. What is intentionally deferred?
4. Which product specs are ready, partially implemented, or only drafts?
5. Which items need measurement, polish, or validation instead of from-scratch development?

---

## Decision

`docs/product/product-plan.md` is the active source of truth for product execution priority.

Commercial strategy explains why VisuTry is moving in a direction. Product specs define how a specific capability should work. The product plan decides what should be worked on next and in what sequence.

Working rules:

1. Do not treat older dated roadmap documents as current execution priority unless the work is promoted into `product-plan.md`.
2. Do not treat benchmark observations as product priority until they are promoted into strategy or the product plan.
3. Do not start engineering work on a meaningful product capability unless it appears in the product plan or has an approved product spec.
4. Product plan statuses should distinguish between `Planned`, `Partially implemented`, `Implemented core`, `Measuring`, `Ready for validation`, and `Deferred`.
5. The product plan should be reviewed weekly and remain short enough to operate.

---

## Consequences

Positive consequences:

- Contributors and agents have one place to check current priority.
- Implemented features are less likely to be mistakenly treated as unbuilt.
- Strategy documents can stay stable without becoming task boards.
- Specs can focus on behavior and acceptance criteria.
- Older plans can remain useful as supporting context without overriding current execution.

Tradeoffs:

- The product plan must be actively maintained.
- When code reality changes, product plan and spec status must be updated.
- The team must resist adding every idea into Now.

---

## Related Documents

- `docs/product/product-plan.md`
- `docs/product/README.md`
- `docs/document-inventory.md`
- `docs/strategy/commercial-strategy.md`
- `docs/product/specs/frame-compare.md`
- `docs/product/specs/credits-pack-conversion.md`
- `docs/product/specs/visutry-store-mvp.md`

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Accepted product plan as the execution source of truth. |
