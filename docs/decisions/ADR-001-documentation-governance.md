# ADR-001: Documentation Governance Structure

**Status:** Accepted  
**Date:** 2026-07-08  
**Owner:** Product / Engineering

---

## Context

VisuTry's documentation had accumulated strategy documents, growth plans, SEO backlogs, technical notes, and commercialization roadmaps without a single clear entry point or lifecycle model.

The result was that contributors could not reliably answer:

1. Which document is the current source of truth?
2. Which document defines next product work?
3. Which documents are historical references?
4. Where should new research, decisions, product specs, and execution tasks go?

This created a risk of duplicate guidance, outdated plans being treated as current instructions, and important decisions remaining only in chat discussions.

---

## Decision

Create a documentation governance structure with clear layers:

1. `docs/README.md` is the documentation entry point.
2. `docs/document-inventory.md` tracks document status, owner, role, and cleanup action.
3. `docs/strategy/commercial-strategy.md` remains the commercial source of truth.
4. `docs/strategy/commercial-benchmarks.md` stores external benchmark and market reference notes.
5. `docs/product/product-plan.md` becomes the active source of truth for product execution priority.
6. `docs/product/specs/` stores detailed product specs.
7. `docs/decisions/` stores accepted product, commercial, technical, and documentation decisions.
8. `docs/strategy/archive/` stores historical or superseded strategy documents.

---

## Consequences

This decision creates a clearer operating model for both humans and agents.

Positive consequences:

- Contributors can start from `docs/README.md`.
- Product priority is no longer inferred from older roadmap documents.
- Benchmark research can grow without bloating the commercial strategy.
- Decisions can be reviewed later instead of being rediscovered from chat history.
- Old documents can be archived without deleting historical context.

Tradeoffs:

- The documentation system now requires periodic maintenance.
- Active documents need consistent status headers and review cadence.
- Product plan and specs must be kept current to remain useful.

---

## Related Documents

- `docs/README.md`
- `docs/document-inventory.md`
- `docs/product/product-plan.md`
- `docs/strategy/commercial-strategy.md`
- `docs/strategy/commercial-benchmarks.md`

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Accepted documentation governance structure. |
