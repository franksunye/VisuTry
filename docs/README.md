# VisuTry Documentation Map

**Status:** Active documentation entry point  
**Created:** 2026-07-08  
**Last updated:** 2026-08-27
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
5. What is the current infrastructure/hosting authority?

---

## 2. Documentation Layers

| Layer | Purpose | Primary documents |
| --- | --- | --- |
| Strategy | Why VisuTry exists commercially and where it should go. | `docs/strategy/commercial-strategy.md` |
| Benchmark / research | External evidence, market references, competitor notes, and commercial inspirations. | `docs/strategy/commercial-benchmarks.md` |
| Product plan | What should be built next, in what order, and with what success criteria. | `docs/product/product-plan.md` |
| Product specs | How a specific product capability should work. | `docs/product/specs/` |
| Growth / SEO / GTM | How VisuTry acquires traffic, demand, and product actions. | `docs/strategy/seo/`, `docs/strategy/growth/`, `docs/strategy/analytics/gtm.md`, `docs/project/seo-backlog.md` |
| Technical architecture | How the current system is built. | `docs/project/architecture.md`, `docs/decisions/`, latest readiness audit `docs/audits/2026-08-27-architecture-platform-saas-audit.md` |
| Technical operations | How production infrastructure is operated and verified. | `docs/operations/README.md`, `docs/operations/hosting-strategy-vercel-cloudflare.md`, `docs/ops/` |
| Archive | Historical/superseded material retained for evidence, not current execution. | `docs/strategy/archive/`, `docs/operations/ARCHIVE.md` |

---

## 3. Source-of-Truth Rules

1. **Commercial direction** lives in `docs/strategy/commercial-strategy.md`.
2. **External references** live in `docs/strategy/commercial-benchmarks.md`.
3. **Current product execution** lives in `docs/product/product-plan.md`.
4. **Detailed feature behavior** lives in `docs/product/specs/`.
5. **GTM execution priority** lives in `docs/strategy/analytics/gtm.md`.
6. **Current production hosting/runtime ownership** is governed by `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md` plus `docs/operations/hosting-strategy-vercel-cloudflare.md`.
7. **Exact Cloudflare production Worker route intent** is governed by `cloudflare-router/b4-production-routes.ts` and its generated JSON manifest.
8. **Historical plans/milestones** must be marked archived/superseded and must not override current ADRs or canonical operating documents.

If two documents conflict:

- Commercial strategy wins over benchmark notes.
- Product plan wins over older roadmap documents for current execution priority.
- Feature specs win over product plan for detailed acceptance criteria after the spec is approved.
- Current accepted ADRs win over historical architecture/migration notes.
- For hosting specifically: **ADR-011 > current hosting strategy > current generated route manifest context > archived migration milestones.**
- Architecture documents describe current technical reality; they do not override product/commercial direction.

---

## 4. Current Active Reading Paths

### Product and business planning

1. `docs/strategy/commercial-strategy.md`
2. `docs/product/product-plan.md`
3. `docs/strategy/commercial-benchmarks.md`
4. `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md`
5. `docs/project/seo-backlog.md`
6. Relevant specs under `docs/product/specs/`

### Engineering work

1. `docs/product/product-plan.md`
2. Relevant spec under `docs/product/specs/`
3. `docs/project/architecture.md`
4. Relevant accepted ADRs under `docs/decisions/`
5. `docs/guides/development-guide.md`
6. `docs/engineering/environment-isolation-contract.md`
7. Current implementation/configuration files.

### Hosting / Cloudflare / Vercel work

Read in this order:

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. `docs/operations/hosting-strategy-vercel-cloudflare.md`
3. `docs/operations/README.md`
4. `cloudflare-router/b4-production-routes.ts` and `cloudflare-router/b4-production-routes.json`
5. `docs/operations/cloudflare-next-static-route-incident-2026-08-19.md` when investigating the dual-build/ChunkLoadError failure class.
6. `docs/operations/ARCHIVE.md` only when historical migration evidence is required.

Do **not** start current hosting work from old B3/B4 phase documents.

### Environment and QA work

1. `docs/engineering/environment-isolation-contract.md`
2. `docs/guides/development-guide.md`
3. `docs/engineering/quality-assurance-strategy.md`
4. `docs/g4c-preview-qa.md` for the fixed Preview QA Merchant pool and bounded fixtures.

### Consumer GTM and paid conversion

1. `docs/strategy/analytics/gtm.md`
2. `docs/ops/consumer-checkout-observation-2026-08-10.md`
3. `docs/product/specs/credits-pack-conversion.md`
4. `docs/product/product-plan.md`

### 2B / Merchant Commerce work

1. `docs/product/product-plan.md`
2. `docs/product/README.md`
3. `docs/product/specs/visutry-store-engineering-foundation.md`
4. `docs/product/specs/merchant-experience-architecture.md`
5. `docs/product/specs/campaign-conversion-policy.md`
6. `docs/product/plans/market-facing-productization-plan.md`
7. `docs/product/plans/agent-native-merchant-self-service.md` and `docs/product/plans/universal-agent-access.md` for agent-native work.
8. `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` for the current merchant-validation loop.
9. Dated D0/Factory plans only when historical acceptance evidence or a durable contract is needed.

---

## 5. Document Governance

Every active planning/operations document should include:

- status;
- owner;
- last updated/reviewed date where applicable;
- scope;
- relationship to the relevant source of truth.

Recommended lifecycle values:

| Status | Meaning |
| --- | --- |
| Active source of truth | Primary authority for its scope. |
| Active operating plan / playbook | Current bounded execution procedure. |
| Living supporting reference | Evidence/research that informs decisions. |
| Resolved incident / permanent guardrail | Closed incident retained because its evidence defines a safety rule. |
| Draft | Under discussion; should not drive execution alone. |
| Superseded | Replaced by newer guidance; must not drive current work. |
| Archived historical reference | Retained for audit/context only. |

Historical operational evidence should normally be retained and classified rather than deleted. Delete only duplicate, empty, or fully incorporated documents that have no remaining audit value.

The inventory is deliberately limited to authoritative entry points and explicit cleanup exceptions. It is not a catalog of every document. Directory lifecycle, creation/close-out rules, and the current cleanup queue live in `docs/document-inventory.md`; the scaling decision is recorded in `docs/decisions/ADR-012-scalable-documentation-governance.md`.

Before adding a new plan, summary, completion report, or audit, prefer updating the existing plan/spec when it can preserve the same facts. If a separate document is necessary, declare its owner, active lifetime, and eventual merge/archive/evidence destination.

---

## 6. Maintenance Notes

- Do not let `commercial-strategy.md` become a research dump.
- Do not let `product-plan.md` become a feature spec dump.
- Do not let benchmark notes decide product priority directly.
- Keep current architecture/operations entry points small and authoritative.
- Archive-by-status old migration milestones as soon as their experiment/cutover phase closes.
- If a new infrastructure decision changes an ownership boundary, create/supersede an ADR before treating phase notes as production authority.
- Run `npm run docs:audit` during the monthly review and at milestone close. Use `npm run docs:audit:strict` before merging governance or large documentation changes.
