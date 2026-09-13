# VisuTry Documentation Map

**Status:** Active documentation entry point  
**Created:** 2026-07-08  
**Last updated:** 2026-09-13
**Owner:** Product / Engineering  
**Review cadence:** Monthly, or whenever product direction / production architecture materially changes.

## 1. Purpose

This is the entry point for current VisuTry documentation. It distinguishes active authorities from bounded runbooks and dated evidence so old phase documents do not silently drive current work.

## 2. Current authorities

| Scope | Primary authority |
| --- | --- |
| Commercial direction | `docs/strategy/commercial-strategy.md` |
| Product execution priority | `docs/product/product-plan.md` |
| Cross-product positioning / boundaries | `docs/product/product-system.md` |
| Detailed product behavior | `docs/product/specs/` |
| Technical architecture / current system shape | `docs/project/architecture.md` + accepted ADRs |
| Observability / analytics / attribution / data-plane ownership | `docs/project/observability-and-analytics-contract.md` |
| Hosting/runtime ownership | ADR-011 + `docs/operations/hosting-strategy-vercel-cloudflare.md` |
| Technical operations | `docs/operations/README.md` + dated evidence under `docs/ops/` |
| GTM execution | `docs/strategy/analytics/gtm.md` |
| SEO/GEO execution | `docs/project/seo-backlog.md` + current SEO strategy docs |
| Documentation governance | `docs/document-inventory.md` + ADR-012 |

## 3. Source-of-truth rules

1. Commercial strategy decides commercial direction.
2. Product plan decides current product priority.
3. Approved product specs decide bounded feature behavior.
4. Accepted ADRs decide durable architecture decisions until explicitly superseded.
5. `docs/project/architecture.md` describes current architecture/system ownership and must remain consistent with accepted ADRs.
6. `docs/project/observability-and-analytics-contract.md` decides telemetry/analytics/business-data-plane ownership and Consumer/Commerce measurement separation.
7. Hosting details follow ADR-011 and the canonical hosting strategy; generated route/cache contracts own volatile implementation details.
8. Runtime code remains authoritative for exact implemented route lists, event names, schema fields, package versions, and generated manifests.
9. Dated `docs/ops/` records are evidence snapshots; they do not become permanent architecture authorities.
10. Historical/archive documents never override active authorities.

If two documents conflict, prefer the authority for the specific scope, then accepted ADRs, then current implementation evidence. Fix the active document rather than carrying a known conflict forward.

### Architecture-document rule

Active architecture docs should describe **stable ownership and contracts**, not copy volatile inventories from code.

- Prefer `PostgreSQL` as the architecture boundary; document Neon only where current provider/deployment behavior matters.
- Prefer “Vercel owns Next / Cloudflare owns governed edge capabilities” over phase-specific routing diagrams.
- Link to generated route/cache/event/schema contracts instead of copying lists that are expected to drift.
- Historical audits/migrations stay immutable unless a factual correction is required; durable conclusions move into an active authority or ADR.
- The Public Web / Consumer App layout boundary is an active runtime contract: public pages use a deterministic anonymous shell, while Consumer App pages retain the session-aware runtime. Exact route membership remains code-authoritative.
- Public prefetch and image-delivery rules are architectural guardrails, not a copied implementation inventory: public navigation defaults to no speculative prefetch, fixed sufficiently large editorial assets may use direct delivery, and responsive or dynamic assets remain on optimized/runtime paths.
- Public content is static-first; intentional runtime ISR remains limited to runtime-mutable discovery surfaces. The active D1 cache shield remains transitional while the P0.5E observation window collects evidence.

## 4. Dated evidence is not a phase tracker

Production baselines such as Traffic Ready T0 and Discovery Canary T0 remain useful point-in-time evidence, but this documentation index does not declare a dated measurement window to be perpetually “current.”

For those specific baselines, read:

- `docs/ops/traffic-ready-t0-2026-09-03.md`
- `docs/ops/discovery-canary-2026-09-03.md`
- the governing plan/authority that explicitly references the baseline

A newer gate or observation record supersedes “current phase” wording without rewriting the historical evidence file.

## 5. Active reading paths

### Product / business

1. `docs/strategy/commercial-strategy.md`
2. `docs/product/product-plan.md`
3. relevant `docs/product/specs/`
4. the current product gate/plan when a decision is evidence-bound

### Engineering

1. `docs/product/product-plan.md`
2. relevant product spec
3. `docs/project/architecture.md`
4. relevant accepted ADRs
5. `docs/project/observability-and-analytics-contract.md` for telemetry/analytics/data questions
6. `docs/operations/hosting-strategy-vercel-cloudflare.md` for deployment/runtime ownership
7. `docs/guides/development-guide.md`
8. current implementation/configuration

### Observability / analytics

1. `docs/project/observability-and-analytics-contract.md`
2. current runtime contracts (`src/lib/logger.ts`, `src/lib/analytics-events.ts`, MerchantSession/Event/Intent, distribution report)
3. bounded event/runbook docs when needed
4. dated `docs/ops/` evidence only when reproducing a specific baseline

Do not start a new analytics architecture from historical Campaign Intelligence migration files.

### Hosting / Cloudflare / Vercel

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. `docs/operations/hosting-strategy-vercel-cloudflare.md`
3. `cloudflare-router/b4-production-routes.ts` / generated manifest for exact Worker routes
4. `cloudflare-router/d1-cache-governance.ts` for exact D1 cache behavior
5. `docs/operations/README.md`
6. incident/archive evidence only when investigating history

### Environment / QA

1. `docs/engineering/environment-isolation-contract.md`
2. `docs/guides/development-guide.md`
3. `docs/engineering/quality-assurance-strategy.md`
4. current QA fixtures and implementation

## 6. Documentation lifecycle

Every active authority/plan/spec/runbook should state Status, Owner, review/update date and scope.

| Status | Meaning |
| --- | --- |
| Active source of truth | Primary authority for its scope |
| Active plan / playbook | Current bounded execution procedure |
| Measuring / validation | Shipped/prepared; next decision waits on evidence |
| Living supporting reference | Useful supporting research/evidence |
| Resolved incident / permanent guardrail | Closed evidence retained because it defines safety |
| Draft | Under discussion; not execution authority |
| Superseded | Replaced by named newer guidance |
| Archived historical reference | Context only |

Delete documents only when they are duplicate, empty, fully incorporated elsewhere, or an expired progress/spec file whose unique evidence is already retained. Preserve dated production/incident evidence when it has forensic value.

## 7. Creation / cleanup rules

Before adding a document, prefer updating an existing authority/spec. Avoid separate “summary”, “complete”, “ready”, and “final” files when the originating document can hold the durable state.

When a bounded migration/progress document closes:

- merge durable rules into the relevant authority;
- retain unique reproducible evidence under archive/evidence/ops when useful;
- delete the closed duplicate/ledger when it has no unique remaining value.

For architecture governance specifically:

- do not promote a vendor SDK/package to an architecture dependency when the application contract is provider-neutral;
- do not duplicate exact route counts, cache rules, event fields, or model fields across active docs when code/generated manifests already own them;
- update an accepted ADR only through its supersession mechanism, not by silently rewriting history.

Run:

```bash
npm run docs:audit
npm run docs:audit:strict
```

for governance or large documentation changes.

See `docs/document-inventory.md` for lifecycle and cleanup governance.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-12 | Tightened architecture documentation precedence; made volatile routing/cache/schema detail code-authoritative; removed the documentation index as a perpetual observation-phase tracker. |
| 2026-09-13 | Refreshed the active documentation contract for the P0.5A Public Web / Consumer App boundary, P0.5B prefetch guardrail, P0.5C image-delivery boundary, P0.5D intentional ISR boundary, and transitional D1 position; no P0.5E conclusion was added. |
