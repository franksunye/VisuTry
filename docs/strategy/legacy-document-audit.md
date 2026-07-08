# VisuTry Legacy Strategy Document Audit

**Status:** Active operating audit  
**Created:** 2026-07-08  
**Owner:** Product / Strategy  
**Review cadence:** Monthly during cleanup  
**Scope:** Status review and cleanup recommendations for dated or legacy strategy documents.

---

## 1. Purpose

This document audits older or dated strategy documents so the team can understand which documents still guide execution and which are historical references.

It avoids rewriting legacy content directly. Instead, it records current interpretation and recommended action.

Working rule:

> Do not delete historical strategy documents only because they are old. First classify them as active, supporting, superseded, or archived.

---

## 2. Audit Summary

| Document | Current role | Status | Recommended action |
| --- | --- | --- | --- |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | B2B merchant/widget roadmap | Active supporting roadmap | Keep. Add status header later if needed. Use `product-plan.md` for current priority. |
| `docs/strategy/2026-06-28-free-face-shape-growth-commercialization-plan.md` | Free detector and growth commercialization plan | Active supporting plan | Keep. Use as supporting reference for Detector → Advisor → Try-On path. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | SEO/GEO product architecture | Active source of truth for SEO/GEO page architecture | Keep active. Align product pages to this unless product strategy changes. |
| `docs/strategy/seo/2026-06-12-growth-kpi-operating-plan.md` | Commercial traffic KPI plan | Active operating plan | Keep active. Reconcile with `product-plan.md` during weekly review. |
| `docs/strategy/growth/2026-06-18-external-growth-sprint.md` | External acquisition sprint | Time-boxed operating plan | Keep until sprint closes. Then mark completed or archive. |
| `docs/strategy/analytics/gtm.md` | GTM / analytics handbook | Execution document | Keep. Add references to `commercial-strategy.md` and `product-plan.md` if needed. |
| `docs/strategy/reseller-technical-roadmap.md` | Reseller/co-branding technical roadmap | Supporting technical roadmap | Keep as supporting reference. Not current priority unless pulled forward by demand. |
| `docs/strategy/2026-05-25-paid-customer-seo-geo-relaunch-plan.md` | Paid customer and SEO relaunch evidence | Historical commercial evidence | Keep or archive after evidence is fully reflected in strategy and benchmarks. |
| `docs/strategy/content/3-month-content-strategy.md` | Q4 2025 content plan | Historical / archive candidate | Archive or mark historical. Time window expired. |
| `docs/strategy/archive/seo/programmatic-seo-execution-plan.md` | Old large-scale programmatic SEO plan | Archived historical reference | Keep archived. Do not use as current execution priority. |

---

## 3. Key Findings

### 3.1 The repo has strategy depth but weak execution routing

There are useful strategy documents, especially around B2B commercialization, free detector growth, SEO/GEO architecture, and external growth. The issue is not lack of thinking.

The issue is that older roadmap documents were too easy to confuse with current execution priority.

Resolution:

- `docs/product/product-plan.md` is now the current product execution source of truth.
- Older dated documents should inform the product plan but should not override it.

### 3.2 B2B roadmap remains valuable but should not directly drive current tasks

The B2B roadmap contains valuable details about merchant widget, design partner pilots, internal merchant API capability, Shopify/Woo wrappers, and deep workflow moat.

Current interpretation:

- Keep it as an active supporting roadmap.
- Pull concrete tasks into `product-plan.md` or specs before engineering execution.
- Do not treat Shopify public app or public API as current priority without validated pull.

### 3.3 Free detector commercialization remains active

The free detector plan is aligned with the current strategy:

> Free consumer tools create demand, then route high-intent users into Advisor, Try-On, Compare, Credits Pack, and later professional / merchant workflows.

Current interpretation:

- Keep as active supporting plan.
- Product execution should be routed through `product-plan.md`.
- SEO/GEO execution should be routed through `seo-backlog.md`.

### 3.4 Q4 2025 content strategy is outdated

The 3-month content plan was useful historically, but the period has expired and product strategy has evolved.

Current interpretation:

- Do not use it as current execution guidance.
- Archive it or add a historical notice later.
- Preserve useful content learnings only if they remain aligned with current product architecture.

### 3.5 Page-count-first programmatic SEO is already archived

The old programmatic SEO plan has been moved to archive. This matches the current strategy that page count should not be the first priority unless pages are intent-specific and connected to product continuation.

---

## 4. Recommended Cleanup Actions

| Priority | Action | Owner | Status |
| --- | --- | --- | --- |
| P0 | Establish product execution source of truth. | Product | Done via `docs/product/product-plan.md`. |
| P0 | Separate benchmark research from commercial strategy. | Product / Strategy | Done via `commercial-benchmarks.md`. |
| P0 | Create decision records for governance changes. | Product / Engineering | Done via `docs/decisions/`. |
| P1 | Add clear status headers to active dated strategy docs. | Product / Strategy | Planned. |
| P1 | Archive or mark `docs/strategy/content/3-month-content-strategy.md` as historical. | Growth / Product | Planned. |
| P1 | Add source-of-truth references to `gtm.md` if missing. | Growth / Analytics | Planned. |
| P2 | Review architecture docs against current code. | Engineering | Later. |

---

## 5. Current Guidance for Contributors

When deciding what to do next:

1. Start with `docs/README.md`.
2. Read `docs/strategy/commercial-strategy.md` for direction.
3. Read `docs/product/product-plan.md` for current execution priority.
4. Read specific specs under `docs/product/specs/` before implementation.
5. Use dated strategy documents as supporting context, not direct task lists.
6. Use this audit to understand whether a legacy document is current or historical.

---

## 6. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created v0.1 legacy strategy document audit. |
