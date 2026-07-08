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

---

## 5. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created decision record guide and initial ADR index. |
