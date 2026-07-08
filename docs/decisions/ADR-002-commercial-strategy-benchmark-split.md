# ADR-002: Separate Commercial Benchmarks from Commercial Strategy

**Status:** Accepted  
**Date:** 2026-07-08  
**Owner:** Product / Strategy

---

## Context

VisuTry's commercial strategy depends on external references such as Optify, OGI / The Optical Foundry, eyewear VTO infrastructure providers, DTC eyewear retailers, and consumer free face-shape tools.

These references are valuable, but putting all benchmark details, revenue hypotheses, competitor notes, and market observations into `docs/strategy/commercial-strategy.md` would make the strategy document too large and unstable.

The commercial strategy should stay focused on durable decisions:

- target customer layers;
- product packaging direction;
- pricing direction;
- near-term roadmap;
- relationship between consumer, prosumer, and B2B strategy.

---

## Decision

Separate commercial strategy from commercial benchmark research.

1. `docs/strategy/commercial-strategy.md` remains the top-level commercial source of truth.
2. `docs/strategy/commercial-benchmarks.md` becomes the living reference for external benchmarks, competitor observations, revenue hypotheses, and market notes.
3. New benchmark findings should be added to `commercial-benchmarks.md` first.
4. Only mature, durable conclusions should be promoted into `commercial-strategy.md`.

Working rule:

> Benchmarks collect evidence. Commercial strategy makes decisions.

---

## Consequences

Positive consequences:

- `commercial-strategy.md` stays readable and stable.
- Benchmark research can grow over time without disrupting strategy.
- New market observations can be recorded quickly without over-claiming strategic certainty.
- The team can distinguish evidence from decision.

Tradeoffs:

- Strategy updates require discipline: not every benchmark note should immediately change strategy.
- Contributors must know which document to update when they find a new reference product.

---

## Related Documents

- `docs/strategy/commercial-strategy.md`
- `docs/strategy/commercial-benchmarks.md`
- `docs/document-inventory.md`

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Accepted split between commercial strategy and benchmark research. |
