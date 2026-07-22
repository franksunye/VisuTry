# VisuTry Document Inventory

**Status:** Active operating plan  
**Created:** 2026-07-08  
**Last updated:** 2026-07-22  
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
| Partially implemented | Some implementation exists, but planned UX, analytics, acceptance criteria, or edge cases remain incomplete. |
| Implemented core version | Core functionality exists; remaining work is polish, measurement, or enhancement tracking. |
| Ready for validation | Clear enough to pitch, demo, or test with target users, but not yet ready for full engineering build. |
| Superseded | Replaced by newer guidance. |
| Archived historical reference | Kept for context only; not current guidance. |

---

## 3. Core Document Inventory

| Path | Type | Status | Owner | Last reviewed | Action |
| --- | --- | --- | --- | --- | --- |
| `docs/README.md` | Documentation map | Active source of truth | Product / Engineering | 2026-07-08 | Keep current. |
| `docs/document-inventory.md` | Documentation governance | Active operating plan | Product / Engineering | 2026-07-22 | Review monthly after stabilization. |
| `docs/AGENT.md` | Agent instructions | Active source of truth | Engineering | 2026-07-22 | Rewritten as structured agent guide; keep current with architectural rules. |
| `docs/decisions/README.md` | Decision log guide | Active source of truth | Product / Engineering | 2026-07-22 | Keep current. |
| `docs/strategy/commercial-strategy.md` | Commercial strategy | Active source of truth | Product / Strategy | 2026-07-08 | Keep concise; do not add benchmark detail. |
| `docs/strategy/commercial-benchmarks.md` | Benchmark / market reference | Living supporting reference | Product / Strategy | 2026-07-08 | Add external references here first. |
| `docs/product/README.md` | Product documentation guide | Active source of truth | Product | 2026-07-08 | Keep current. |
| `docs/product/product-plan.md` | Product execution plan | Active source of truth | Product | 2026-07-08 | Now prioritizes Store landing page validation before full Store engineering. |
| `docs/project/architecture.md` | Technical architecture | Active source of truth for current technical reality | Engineering | 2026-07-22 | Rewritten with rendering strategy, session data flow, Neon driver, corrected schema. |
| `docs/guides/development-guide.md` | Development guide | Active operating guide | Engineering | 2026-07-08 | Refreshed against `.env.example` and `package.json`. |
| `docs/project/vercel-cpu-governance-spec.md` | CPU governance spec | Active operating plan | Engineering | 2026-07-22 | Updated verified facts: all public pages now SSG, root layout session removed, backlog statuses updated. |
| `docs/operations/vercel-cpu-static-page-pilot.md` | Static page pilot | Active operating plan | Engineering | 2026-07-22 | Updated: Phase 4 (ADR-005) added, excluded pages status corrected. |
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
| `docs/product/specs/frame-compare.md` | Product spec | Implemented core version | Product | 2026-07-08 | Core route exists; track analytics, homepage/product exposure, sharing, and custom-frame enhancements. |
| `docs/product/specs/credits-pack-conversion.md` | Product spec | Partially implemented | Product | 2026-07-08 | Payment/quota foundation exists; complete conversion UX, post-result CTA, and event mapping. |
| `docs/product/specs/visutry-store-landing-page.md` | Product spec / market validation asset | Ready for validation | Product / Growth | 2026-07-08 | First Store validation step before full Store MVP engineering; define landing page, pilot CTA, lead form, and metrics. |
| `docs/product/specs/visutry-store-mvp.md` | Product spec | Ready for validation | Product | 2026-07-08 | Validate hosted merchant workflow after landing page / outreach signals before engineering full Store infrastructure. |

---

## 6. Decision Records Inventory

| Path | Type | Status | Owner | Last reviewed | Action |
| --- | --- | --- | --- | --- | --- |
| `docs/decisions/ADR-001-documentation-governance.md` | Decision record | Accepted | Product / Engineering | 2026-07-08 | Keep. |
| `docs/decisions/ADR-002-commercial-strategy-benchmark-split.md` | Decision record | Accepted | Product / Strategy | 2026-07-08 | Keep. |
| `docs/decisions/ADR-003-product-plan-execution-source-of-truth.md` | Decision record | Accepted | Product | 2026-07-08 | Keep. |
| `docs/decisions/ADR-004-frame-compare-core-implemented.md` | Decision record | Accepted | Product / Engineering | 2026-07-08 | Keep. |
| `docs/decisions/ADR-005-ssr-to-client-gate.md` | Decision record | Accepted | Engineering | 2026-07-22 | Records decision to remove SSR getServerSession from all public pages and adopt client-side gate pattern. |

---

## 7. New Source Files (ADR-005 era, 2026-07-22)

The following source files were created or significantly modified during the rendering strategy migration (commits `011381e` through `48fbce9`):

| File | Purpose |
| --- | --- |
| `src/components/style-explorer/StyleExplorerGate.tsx` | Client gate for style-explorer page |
| `src/components/compare/ComparePageClient.tsx` | Client gate for compare page |
| `src/components/try-on/TryOnGate.tsx` | Client gate for try-on/[type] page |
| `src/components/face-analysis/FaceAnalysisGate.tsx` | Client gate for face-analysis page |
| `src/components/dashboard/DashboardPageClient.tsx` | Client gate for dashboard page |
| `src/components/dashboard/HistoryPageClient.tsx` | Client gate for dashboard/history page |
| `src/components/payments/PaymentsPageClient.tsx` | Client gate for payments page |
| `src/components/debug-images/DebugImagesPageClient.tsx` | Client gate for debug-images page |
| `src/app/api/payment/history/route.ts` | Payment history API endpoint (for PaymentsPageClient) |

---

## 8. Cleanup Backlog

| Priority | Task | Status |
| --- | --- | --- |
| P0 | Add documentation map and product plan. | Done |
| P0 | Add decisions directory and first ADRs. | Done |
| P0 | Add first product specs. | Done |
| P0 | Add legacy strategy document audit. | Done |
| P0 | Create ADR-005 for SSR to client-gate migration. | Done (2026-07-22) |
| P0 | Update architecture.md with rendering strategy and session data flow. | Done (2026-07-22) |
| P0 | Rewrite AGENT.md as structured agent guide. | Done (2026-07-22) |
| P0 | Update cpu-governance-spec.md and static-page-pilot.md verified facts. | Done (2026-07-22) |
| P1 | Add status headers to active dated strategy documents. | Partially done |
| P1 | Mark or archive expired content strategy documents. | Done: marked historical; archive move later if needed. |
| P1 | Add source-of-truth references to GTM handbook. | Done |
| P1 | Review architecture and development guide against current code. | Done (architecture.md refreshed 2026-07-22) |
| P1 | Align first specs with actual implementation state. | Done |
| P1 | Strengthen product plan into execution board. | Done |
| P1 | Advance Store MVP spec to ready for validation. | Done |
| P1 | Add Store landing page validation spec and product-plan alignment. | Done |
| P2 | Consider moving all historical strategy documents into archive after status review. | Later |
| P2 | Fix 3 pre-existing unit test failures (locale URL routing). | Not started |
| P2 | Add E2E tests for authenticated user flows (login → try-on → history). | Not started |
| P2 | Refactor perfLogger to use AsyncLocalStorage for request-scoped state. | Not started |

---

## 9. Review Questions

During each documentation review, answer:

1. Does each active document still have a clear owner and status?
2. Does any active document contain content that belongs in another layer?
3. Did a new decision happen that should become an ADR?
4. Did a product plan item become ready for a spec?
5. Did a dated operating plan expire and need archive or completion status?
6. Did any spec status drift from implementation reality?

---

## 10. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created v0.1 document inventory and cleanup backlog. |
| 2026-07-08 | Updated inventory after adding decisions, product specs, and legacy document audit. |
| 2026-07-08 | Updated P1 governance status after adding B2B roadmap header, GTM source-of-truth header, and historical notice to Q4 content plan. |
| 2026-07-08 | Marked technical documentation review complete after refreshing architecture and development guide. |
| 2026-07-08 | Updated first product spec statuses after code review: Frame Compare implemented core; Credits Pack conversion partially implemented. |
| 2026-07-08 | Updated inventory after adding ADR-003, ADR-004, execution board, and Store MVP validation-ready status. |
| 2026-07-08 | Added Store landing page validation spec and aligned product plan / Store MVP sequence around landing-page-first validation. |
| 2026-07-22 | Major update: Added ADR-005, updated architecture.md (rendering strategy, session data flow, Neon driver, corrected schema), rewrote AGENT.md, updated cpu-governance-spec.md and static-page-pilot.md verified facts, added new source files inventory section. |
