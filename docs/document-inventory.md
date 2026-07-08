# VisuTry Document Inventory

**Status:** Active operating plan  
**Created:** 2026-07-08  
**Owner:** Product / Engineering  
**Review cadence:** Weekly during cleanup, monthly after stabilization  
**Scope:** Document status, ownership, current role, and cleanup actions.

---

## 1. Purpose

This document tracks the health and lifecycle status of VisuTry's documentation system.

It should answer:

1. Which documents are active sources of truth?
2. Which documents are operating plans?
3. Which documents are supporting references?
4. Which documents are historical or superseded?
5. Which documents need cleanup, archive, or spec extraction?

---

## 2. Status Definitions

| Status | Meaning |
| --- | --- |
| Active source of truth | Primary decision document for its scope. |
| Active operating plan | Current execution or governance plan for a bounded area. |
| Living supporting reference | Evidence, benchmark, or research reference that informs decisions. |
| Draft | Under discussion; should not yet drive execution alone. |
| Superseded | Replaced by newer guidance. |
| Archived historical reference | Kept for context only; not current guidance. |

---

## 3. Core Document Inventory

| Path | Type | Status | Owner | Last reviewed | Action |
| --- | --- | --- | --- | --- | --- |
| `docs/README.md` | Documentation map | Active source of truth | Product / Engineering | 2026-07-08 | Keep current. |
| `docs/document-inventory.md` | Documentation governance | Active operating plan | Product / Engineering | 2026-07-08 | Review monthly after stabilization. |
| `docs/decisions/README.md` | Decision log guide | Active source of truth | Product / Engineering | 2026-07-08 | Keep current. |
| `docs/strategy/commercial-strategy.md` | Commercial strategy | Active source of truth | Product / Strategy | 2026-07-08 | Keep concise; do not add benchmark detail. |
| `docs/strategy/commercial-benchmarks.md` | Benchmark / market reference | Living supporting reference | Product / Strategy | 2026-07-08 | Add external references here first. |
| `docs/product/README.md` | Product documentation guide | Active source of truth | Product | 2026-07-08 | Keep current. |
| `docs/product/product-plan.md` | Product execution plan | Active source of truth | Product | 2026-07-08 | Review weekly. |
| `docs/project/architecture.md` | Technical architecture | Active source of truth for current technical reality | Engineering | 2026-07-08 | Needs future review against current code. |
| `docs/guides/development-guide.md` | Development guide | Active operating guide | Engineering | 2026-07-08 | Needs future review for current env and workflows. |
| `docs/project/seo-backlog.md` | SEO / growth backlog | Active operating plan | Growth / Product | 2026-07-08 | Keep as SEO/Growth execution backlog. |

---

## 4. Strategy and Growth Documents

| Path | Type | Status | Owner | Last reviewed | Action |
| --- | --- | --- | --- | --- | --- |
| `docs/strategy/legacy-document-audit.md` | Legacy document audit | Active operating audit | Product / Strategy | 2026-07-08 | Use to guide cleanup of dated strategy docs. |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | B2B roadmap | Active supporting roadmap | Product / Strategy | 2026-07-08 | Status header added; use as B2B reference only. |
| `docs/strategy/2026-06-28-free-face-shape-growth-commercialization-plan.md` | Free detector / growth plan | Active supporting plan | Product / Growth | 2026-07-08 | Has status; later normalize header format if editing for content. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | SEO/GEO product architecture | Active source of truth for SEO/GEO page architecture | Product / Growth | 2026-07-08 | Keep active. |
| `docs/strategy/seo/2026-06-12-growth-kpi-operating-plan.md` | Growth KPI plan | Active operating plan | Growth | 2026-07-08 | Keep active; reconcile with product-plan when needed. |
| `docs/strategy/growth/2026-06-18-external-growth-sprint.md` | External growth sprint | Time-boxed operating plan | Growth | 2026-07-08 | Keep until sprint is closed; then archive or mark completed. |
| `docs/strategy/analytics/gtm.md` | GTM / analytics handbook | Execution document | Growth / Analytics | 2026-07-08 | Source-of-truth header added. |
| `docs/strategy/reseller-technical-roadmap.md` | Reseller technical roadmap | Supporting technical roadmap | Product / Engineering | 2026-07-08 | Keep as supporting reference; not current priority unless pulled forward. |
| `docs/strategy/2026-05-25-paid-customer-seo-geo-relaunch-plan.md` | Paid customer / SEO relaunch plan | Historical commercial evidence | Product / Growth | 2026-07-08 | Keep or archive after evidence is reflected in strategy/product plan. |
| `docs/strategy/content/3-month-content-strategy.md` | Q4 2025 content plan | Historical / archive candidate | Growth | 2026-07-08 | Historical notice added; consider moving to archive later. |
| `docs/strategy/archive/seo/programmatic-seo-execution-plan.md` | Old programmatic SEO plan | Archived historical reference | Growth | 2026-07-08 | Keep archived. |

---

## 5. Product Specs Inventory

| Path | Type | Status | Owner | Last reviewed | Action |
| --- | --- | --- | --- | --- | --- |
| `docs/product/specs/frame-compare.md` | Product spec | Draft | Product | 2026-07-08 | First priority spec. |
| `docs/product/specs/credits-pack-conversion.md` | Product spec | Draft | Product | 2026-07-08 | First priority monetization spec. |
| `docs/product/specs/visutry-store-mvp.md` | Product spec | Draft | Product | 2026-07-08 | First B2B MVP spec. |

---

## 6. Decision Records Inventory

| Path | Type | Status | Owner | Last reviewed | Action |
| --- | --- | --- | --- | --- | --- |
| `docs/decisions/ADR-001-documentation-governance.md` | Decision record | Accepted | Product / Engineering | 2026-07-08 | Keep. |
| `docs/decisions/ADR-002-commercial-strategy-benchmark-split.md` | Decision record | Accepted | Product / Strategy | 2026-07-08 | Keep. |

---

## 7. Cleanup Backlog

| Priority | Task | Status |
| --- | --- | --- |
| P0 | Add documentation map and product plan. | Done |
| P0 | Add decisions directory and first ADRs. | Done |
| P0 | Add first product specs. | Done |
| P0 | Add legacy strategy document audit. | Done |
| P1 | Add status headers to active dated strategy documents. | Partially done |
| P1 | Mark or archive expired content strategy documents. | Done: marked historical; archive move later if needed. |
| P1 | Add source-of-truth references to GTM handbook. | Done |
| P1 | Review architecture and development guide against current code. | Planned |
| P2 | Consider moving all historical strategy documents into archive after status review. | Later |

---

## 8. Review Questions

During each documentation review, answer:

1. Does each active document still have a clear owner and status?
2. Does any active document contain content that belongs in another layer?
3. Did a new decision happen that should become an ADR?
4. Did a product plan item become ready for a spec?
5. Did a dated operating plan expire and need archive or completion status?

---

## 9. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created v0.1 document inventory and cleanup backlog. |
| 2026-07-08 | Updated inventory after adding decisions, product specs, and legacy document audit. |
| 2026-07-08 | Updated P1 governance status after adding B2B roadmap header, GTM source-of-truth header, and historical notice to Q4 content plan. |
