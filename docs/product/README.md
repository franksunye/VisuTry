# VisuTry Product Documentation

**Status:** Active product documentation guide  
**Created:** 2026-07-08  
**Last updated:** 2026-09-23
**Owner:** Product  
**Review cadence:** Weekly for active plan, monthly for document structure.

---

## 1. Purpose

This folder contains VisuTry's product planning and product specification documents.

The main goal is to make it clear what should be built next, why it matters, how each initiative should be validated, and which documents are approved for engineering execution.

---

## 2. Key Documents

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/product/product-plan.md` | Current product operating plan: Now / Next / Later, current sprint, initiatives, backlog, and decisions needed. | Active source of truth for product execution. |
| `docs/product/specs/` | Detailed specs for individual product capabilities. | Created as needed. |
| `docs/product/specs/merchant-operating-experience.md` | Current Merchant human operating experience, Activation/Operating boundary, IA, lifecycle and Human/Agent responsibility contract. | **Active source of truth for Merchant operating behavior.** |
| `docs/product/plans/market-facing-productization-plan.md` | Historical Reference Factory → Discover/distribution → Business Website sequence. | **Historical; pre-outreach work now follows the Product Advantage Gate.** |
| `docs/product/plans/product-advantage-gate.md` | Consumer Distribution, Merchant Experience, and Agent-Native pre-outreach evidence gate. | **Supporting evidence/gate; not the current engineering phase after P1-M2 closure.** |
| `docs/product/plans/pilot-delivery-factory-plan.md` | Five-brand Reference portfolio and repeatable assisted delivery model. | **Factory core complete; retained as delivery contract.** |
| `docs/product/business-website-ia-and-copy.md` | Business Website product truth, IA, claims, Pilot and CTA baseline. | **Implemented baseline; v1.2 visual brief is current.** |
| `docs/product/business-website-v1.2-layout-and-visual-system.md` | Current `/business` layout and production visual asset contract. | **v1.2 shipped.** |
| `docs/product/plans/agent-native-merchant-self-service.md` | Historical Agent-native implementation plan. | **Implemented historical plan; current UX authority is Merchant Operating Experience spec.** |
| `docs/product/plans/universal-agent-access.md` | Remote MCP OAuth architecture, production evidence, compatibility and external-Pilot limitations. | **Codex Golden Path passed; external hardening remains.** |
| `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` | Controlled founder-led outreach, evidence pack, tracker fields and first-batch operating plan. | **Active merchant-validation operating guide.** |
| `docs/product/specs/visutry-store-engineering-foundation.md` | Mandatory Store/Commerce architecture, tenancy, usage, privacy, idempotency and test constraints. | **Implemented baseline; still mandatory.** |
| `docs/product/specs/visutry-store-mvp.md` | Acceptance contract for a real merchant Pilot. | **Technical core implemented; real merchant acceptance pending.** |
| `docs/ops/store-d0-production-verification-2026-08-05.md` | Immutable historical D0 production evidence. | **Historical evidence, not current execution state.** |
| `docs/product/campaign-intelligence/README.md` | Event contract, implementation ledger, GA4 dashboard spec, and console runbook. | **Phases 1–3 shipped; GA4 observation/configuration pending.** |

---

## 3. Product Planning Rules

1. `product-plan.md` defines priority and sequencing.
2. Specs define detailed behavior and acceptance criteria.
3. Strategy documents explain why; product documents define what to build next.
4. A feature should not move into engineering execution until it is listed in the product plan or has an approved product spec.
5. Product plan should stay short enough to review weekly.
6. When an approved implementation plan exists for a scoped initiative, engineering should follow its gates and work breakdown rather than infer sequencing from older roadmap documents.
7. Store merchant-facing wording, outreach, pilot packaging, and sales claims should follow `docs/product/sales/visutry-store-sales-pitch.md` so Sales does not outrun implemented product boundaries.
8. Do not begin structured merchant outreach while `docs/product/plans/product-advantage-gate.md` is not fully evidenced as PASS for Gates A, B, and C.

---

## 4. Current Merchant execution rule

P1-M2 Merchant Operating Experience is **Product / UX / Production Accepted / Closed** at main SHA `3c29d56cce1c380bef42c3f9e99dd25f95ac8724`.

The production baseline is now:

```text
Activation
first product → Catalog ready → Store draft → private Store Preview (First Value)

Operating
Home | Catalog | Store | Campaigns | Analytics
More: Integrations | Plan & Usage | Settings
```

Current principle:

> **Self-service first. Agent-operable by design. Human-light over time.**

The Human UI and Agent/MCP share canonical application/domain capabilities. Agent connection is optional and consequential actions remain approval-bounded.

**No new product phase is authorized after P1-M2.** Current execution posture is stabilization/observation plus explicit selection of the next bounded gate. Older Product Advantage, D0, Factory and Agent-native plans remain supporting evidence/history unless explicitly reactivated.

Engineering should start with:

1. `docs/product/product-plan.md`
2. `docs/product/specs/merchant-operating-experience.md`
3. the relevant durable Merchant/Commerce spec
4. `docs/project/architecture.md`
5. the scoped plan/gate only after Product/Lead authorizes it.

Do not add generalized Campaign Builder, CRM, Shopify integration, revenue attribution, or another platform layer merely because P1-M2 is complete. Promote only repeated, evidenced merchant pain into new scope.

---

## 5. Recommended Spec Template

Each product spec should include:

```markdown
# Feature Name Spec

**Status:** Draft / Ready / In Progress / Shipped
**Owner:** Product / Engineering
**Created:** YYYY-MM-DD
**Last updated:** YYYY-MM-DD

## 1. Problem
## 2. Goal
## 3. Non-goals
## 4. User flow
## 5. Functional requirements
## 6. Data / events
## 7. UX notes
## 8. Edge cases
## 9. Acceptance criteria
## 10. Open questions
```

---

## 6. Current Product Focus

The broad product focus remains defined in:

- `docs/product/product-plan.md`

For 2B specifically, this README and `product-plan.md` define the current reading path. Approved architecture/spec documents define durable behavior; dated D0 and Factory plans remain useful evidence but do not override the current execution board.

Do not infer current product priority or merchant positioning only from older dated roadmap documents.
