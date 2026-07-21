# VisuTry Documentation Map

**Status:** Active documentation entry point  
**Created:** 2026-07-08  
**Owner:** Product / Engineering  
**Review cadence:** Monthly, or whenever the product direction materially changes.

---

## 1. Purpose

This file is the entry point for the VisuTry documentation system.

Use it to answer:

1. Where is the current commercial strategy?
2. Where is the current product plan?
3. Where are execution backlogs and specs?
4. Which documents are active source of truth, supporting references, or historical archives?

---

## 2. Documentation Layers

| Layer | Purpose | Primary documents |
| --- | --- | --- |
| Strategy | Why VisuTry exists commercially and where it should go. | `docs/strategy/commercial-strategy.md` |
| Benchmark / research | External evidence, market references, competitor notes, and commercial inspirations. | `docs/strategy/commercial-benchmarks.md` |
| Product plan | What should be built next, in what order, and with what success criteria. | `docs/product/product-plan.md` |
| Product specs | How a specific product capability should work. | `docs/product/specs/` |
| Growth / SEO / GTM | How VisuTry acquires traffic, demand, and product actions. | `docs/strategy/seo/`, `docs/strategy/growth/`, `docs/strategy/analytics/gtm.md`, `docs/project/seo-backlog.md` |
| Technical architecture | How the current system is built and operated. | `docs/project/architecture.md`, `docs/guides/development-guide.md` |
| Technical operations | How bounded engineering governance work is executed and verified. | `docs/project/vercel-cpu-governance-spec.md` |
| Archive | Historical or superseded strategy/planning documents. | `docs/strategy/archive/` |

---

## 3. Source-of-Truth Rules

1. **Commercial direction** lives in `docs/strategy/commercial-strategy.md`.
2. **External references** live in `docs/strategy/commercial-benchmarks.md`.
3. **Current product execution** lives in `docs/product/product-plan.md`.
4. **Detailed feature behavior** lives in `docs/product/specs/`.
5. **SEO/GEO execution tasks** can remain in `docs/project/seo-backlog.md`.
6. **CPU governance execution** lives in `docs/project/vercel-cpu-governance-spec.md`.
7. **Historical plans** should be moved to `docs/strategy/archive/` or clearly marked as historical.

If two documents conflict:

- Commercial strategy wins over benchmark notes.
- Product plan wins over older roadmap documents for current execution priority.
- Feature specs win over product plan for detailed acceptance criteria after the spec is approved.
- Architecture documents win only for current technical reality, not commercial direction.
- The CPU governance spec controls the delivery sequence, safety boundaries, and acceptance criteria for Vercel CPU work; it does not override product behavior or architecture facts.

---

## 4. Current Active Reading Path

For product and business planning, read in this order:

1. `docs/strategy/commercial-strategy.md`
2. `docs/product/product-plan.md`
3. `docs/strategy/commercial-benchmarks.md`
4. `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md`
5. `docs/project/seo-backlog.md`
6. Relevant specs under `docs/product/specs/`

For engineering work, read in this order:

1. `docs/product/product-plan.md`
2. Relevant spec under `docs/product/specs/`
3. `docs/project/architecture.md`
4. `docs/project/vercel-cpu-governance-spec.md` when changing rendering, runtime invocation, polling, caching, image paths, or server-side work
5. `docs/guides/development-guide.md`
6. Current implementation files in `src/`, `prisma/`, and configuration files.

---

## 5. Document Governance

Every active planning document should include:

- status;
- owner;
- last updated date;
- scope;
- review cadence;
- relationship to other source-of-truth documents.

Recommended status values:

| Status | Meaning |
| --- | --- |
| Active source of truth | Primary decision document for its scope. |
| Active operating plan | Current execution plan for a bounded area. |
| Living supporting reference | Evidence, benchmark, or research document that informs strategy. |
| Draft | Under discussion; should not yet drive execution. |
| Superseded | Replaced by newer guidance. |
| Archived historical reference | Kept for context only; not current guidance. |

---

## 6. Maintenance Notes

- Do not let `commercial-strategy.md` become a research dump.
- Do not let `product-plan.md` become a feature spec dump.
- Do not let benchmark notes decide product priority directly; promote conclusions into strategy or product plan first.
- Keep the product plan short enough to review weekly.
- Move outdated dated strategy documents into archive when they stop guiding current decisions.
