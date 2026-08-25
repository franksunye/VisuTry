# VisuTry Product Documentation

**Status:** Active product documentation guide  
**Created:** 2026-07-08  
**Last updated:** 2026-08-24
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
| `docs/product/plans/market-facing-productization-plan.md` | Historical Reference Factory → Discover/distribution → Business Website sequence. | **Historical; pre-outreach work now follows the Product Advantage Gate.** |
| `docs/product/plans/product-advantage-gate.md` | Active Consumer Distribution, Merchant Experience, and Agent-Native pre-outreach gate. | **Active source of truth; outreach gated until A/B/C PASS.** |
| `docs/product/plans/pilot-delivery-factory-plan.md` | Five-brand Reference portfolio and repeatable assisted delivery model. | **Factory core complete; retained as delivery contract.** |
| `docs/product/business-website-ia-and-copy.md` | Business Website product truth, IA, claims, Pilot and CTA baseline. | **Implemented baseline; v1.2 visual brief is current.** |
| `docs/product/business-website-v1.2-layout-and-visual-system.md` | Current `/business` layout and production visual asset contract. | **v1.2 shipped.** |
| `docs/product/plans/agent-native-merchant-self-service.md` | Merchant Workspace, Agent Keys, MCP Store/Campaign operations and Commerce Intelligence plan. | **Core through Phase D implemented.** |
| `docs/product/plans/universal-agent-access.md` | Remote MCP OAuth architecture, production evidence, compatibility and external-Pilot limitations. | **Codex Golden Path passed; external hardening remains.** |
| `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` | Controlled founder-led outreach, evidence pack, tracker fields and first-batch operating plan. | **Active merchant-validation operating guide.** |
| `docs/product/specs/visutry-store-engineering-foundation.md` | Mandatory Store/Commerce architecture, tenancy, usage, privacy, idempotency and test constraints. | **Implemented baseline; still mandatory.** |
| `docs/product/specs/visutry-store-mvp.md` | Acceptance contract for a real merchant Pilot. | **Technical core implemented; real merchant acceptance pending.** |
| `docs/ops/store-d0-production-verification-2026-08-05.md` | Immutable historical D0 production evidence. | **Historical evidence, not current execution state.** |

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

## 4. Current 2B Execution Rule

As of 2026-08-24, VisuTry has moved beyond the D0-only phase. The shared Merchant → Catalog → Store/Campaign → shopper decision journey → Commerce Intelligence product is implemented, the five-brand Reference Factory is complete, Discover and Business Website v1.2 are live, and the agent-native core is production-deployed. The active gate is real merchant evidence, not another architecture layer.

Current sequence:

```text
Store / Campaign architecture + D0 [complete]
  ↓
Five-brand Reference Factory [complete]
  ↓
Discover / attribution / market-facing hardening [complete]
  ↓
Business Website v1.2 + Founding Merchant Pilot offer [shipped]
  ↓
Durable assisted Pilot intake [production write verified]
  ↓
Product Advantage Gate A/B/C [current]
  ↓
Controlled Founding Merchant outreach [only after all three gates pass]
  ↓
First real merchant catalog + declared traffic source + intent review [gate evidence]
  ↓
Only then promote repeated pain into integrations or broader platform work
```

Store product hierarchy:

```text
Storefront = first SaaS delivery surface
Campaign Engine = scalable merchant growth / usage layer
Commerce Intelligence = optimization layer
Agent-Ready Commerce = future distribution foundation
```

Engineering should start with:

1. `docs/product/product-plan.md`
2. `docs/product/specs/visutry-store-engineering-foundation.md`
3. `docs/product/specs/merchant-experience-architecture.md`
4. `docs/product/specs/campaign-conversion-policy.md`
5. the scoped implementation plan for the selected current task.

Growth / Sales should start with:

1. `docs/product/business-website-ia-and-copy.md`
2. `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md`
3. `docs/product/sales/visutry-store-sales-pitch.md`
4. `docs/product/specs/visutry-store-mvp.md`

Do not add another Reference Brand, generalized Campaign Builder, CRM, Shopify integration, or revenue attribution before the first real merchant learning loop. An assisted Pilot may proceed with the current Store/Campaign runtime; agent-native access is optional unless it is explicitly part of that Pilot promise. If agent-native access is included, close the bounded OAuth authorization UI, cleanup and selected-client Golden Path requirements in `universal-agent-access.md` first.

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
