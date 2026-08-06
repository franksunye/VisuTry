# VisuTry Decision Records

**Status:** Active decision log entry point  
**Created:** 2026-07-08  
**Owner:** Product / Engineering  
**Review cadence:** Monthly, or whenever major product / strategy decisions are made.

---

## 1. Purpose

This folder records important product, commercial, technical, and documentation governance decisions.

Use decision records when a decision changes how VisuTry should be built, positioned, documented, or operated.

The goal is to prevent important decisions from living only in chats, meetings, or scattered roadmap notes.

---

## 2. When to Create a Decision Record

Create a decision record when:

1. A commercial direction changes.
2. A product priority changes.
3. A major document source-of-truth rule changes.
4. A technical architecture choice becomes hard to reverse.
5. A feature is intentionally deferred or removed.
6. A benchmark or market insight materially changes strategy.

Do not create a decision record for small copy edits, ordinary implementation tasks, or temporary experiments that do not affect strategy.

---

## 3. Format

Use this template:

```markdown
# ADR-XXX: Decision title

**Status:** Proposed / Accepted / Superseded
**Date:** YYYY-MM-DD
**Owner:** Product / Engineering

## Context

What situation or problem led to this decision?

## Decision

What did we decide?

## Consequences

What becomes easier, harder, required, or deferred because of this decision?

## Related Documents

- `path/to/doc.md`
```

---

## 4. Current Decision Records

| ID | Title | Status | Date |
| --- | --- | --- | --- |
| ADR-001 | Documentation Governance Structure | Accepted | 2026-07-08 |
| ADR-002 | Separate Commercial Benchmarks from Commercial Strategy | Accepted | 2026-07-08 |
| ADR-003 | Product Plan Is the Execution Source of Truth | Accepted | 2026-07-08 |
| ADR-004 | Frame Compare Core Is Implemented; Next Work Is Productization | Accepted | 2026-07-08 |
| ADR-005 | Remove SSR getServerSession from All Public Pages — Client-Side Gate Pattern | Accepted | 2026-07-22 |
| ADR-006 | Store Uses a Modular, Multi-Tenant Foundation on the Existing Generation Core | Accepted | 2026-08-05 |
| ADR-007 | Store May Evolve Without Disrupting Stable Consumer Workflows | Accepted | 2026-08-06 |

---

## 5. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created decision record guide and initial ADR index. |
| 2026-07-08 | Added ADR-003 and ADR-004 to the index. |
| 2026-07-22 | Added ADR-005: SSR to client-side gate pattern. |
| 2026-08-05 | Added ADR-006: modular, multi-tenant Store foundation on the existing generation core. |
| 2026-08-06 | Added ADR-007: Store / Consumer stability boundary and dependency direction. |
