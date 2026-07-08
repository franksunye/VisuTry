# ADR-004: Frame Compare Core Is Implemented; Next Work Is Productization

**Status:** Accepted  
**Date:** 2026-07-08  
**Owner:** Product / Engineering

---

## Context

During documentation cleanup, `docs/product/specs/frame-compare.md` was initially treated as a draft feature that still needed to be built.

A later code review confirmed that VisuTry already has a working Frame Compare core experience at:

- `/[locale]/try-on/glasses/compare`
- `src/components/compare/FrameCompareInterface.tsx`
- `src/app/api/try-on/glasses/compare/route.ts`
- `src/app/api/try-on/glasses/compare/frame/route.ts`
- `src/lib/compare-tryon-server.ts`

The implemented core supports authenticated comparison of up to 4 preset glasses frames, credit-constrained selection, batch initialization, per-frame dispatch, polling, side-by-side result display, failed frame retry, and saved generated outputs in Dashboard History.

The remaining work is not to build Frame Compare from scratch. The remaining work is productization.

---

## Decision

Treat Frame Compare as an implemented core feature.

Current product work should focus on:

1. homepage and product-path exposure;
2. dedicated analytics events;
3. Credits Pack conversion after high-intent compare moments;
4. deciding whether custom uploaded frames belong in the consumer compare flow;
5. deciding whether comparison boards need public share URLs;
6. preparing any professional / merchant extensions through Studio or Store specs.

Do not list Frame Compare as a generic `Planned` or `Draft` build item unless the scope is a new enhancement such as custom frames, board sharing, merchant catalog frames, or advisor reports.

---

## Consequences

Positive consequences:

- The product plan now reflects code reality.
- Engineering is not misdirected into rebuilding an existing feature.
- The team can focus on distribution, measurement, conversion, and UX polish.
- Frame Compare can be used as a stronger bridge between consumer usage and future professional / merchant workflows.

Tradeoffs:

- Existing implementation still needs analytics and conversion improvements.
- Some originally imagined spec items remain unimplemented, including custom frame upload, board sharing, and winner/ranking.
- Product and engineering must distinguish core feature status from enhancement status.

---

## Related Documents

- `docs/product/product-plan.md`
- `docs/product/specs/frame-compare.md`
- `docs/product/specs/credits-pack-conversion.md`
- `docs/document-inventory.md`

---

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Accepted Frame Compare as implemented core and moved next work to productization. |
