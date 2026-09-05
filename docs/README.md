# VisuTry Documentation Map

**Status:** Active documentation entry point  
**Created:** 2026-07-08  
**Last updated:** 2026-09-04  
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
| Technical reality | `docs/project/architecture.md` + accepted ADRs |
| **Observability / analytics / attribution / data-plane ownership** | **`docs/project/observability-and-analytics-contract.md`** |
| Hosting/runtime ownership | ADR-011 + `docs/operations/hosting-strategy-vercel-cloudflare.md` |
| Technical operations | `docs/operations/README.md` + dated evidence under `docs/ops/` |
| GTM execution | `docs/strategy/analytics/gtm.md` |
| SEO/GEO execution | `docs/project/seo-backlog.md` + current SEO strategy docs |
| Documentation governance | `docs/document-inventory.md` + ADR-012 |

## 3. Source-of-truth rules

1. Commercial strategy decides commercial direction.
2. Product plan decides current product priority.
3. Approved product specs decide bounded feature behavior.
4. Current accepted ADRs decide durable architecture decisions.
5. `docs/project/architecture.md` describes current implementation reality.
6. **`docs/project/observability-and-analytics-contract.md` decides which telemetry/analytics/business-data plane owns a fact and how Consumer / Commerce / Merchant Operator measurement is separated.**
7. Runtime code remains authoritative for exact implemented event names, schema fields and reporting behavior.
8. Dated `docs/ops/` records are evidence snapshots; they do not become permanent architecture authorities.
9. Historical/archive documents never override active authorities.

If two documents conflict, prefer the authority for the specific scope and then current implementation evidence.

## 4. Current observation phase

The current production measurement phase has two distinct evidence clocks:

- Traffic Ready T0: `2026-09-03T13:26:22.008Z`
- Discovery Canary T0: `2026-09-03T16:33:14.812Z`

Read:

1. `docs/project/observability-and-analytics-contract.md`
2. `docs/ops/traffic-ready-t0-2026-09-03.md`
3. `docs/ops/discovery-canary-2026-09-03.md`
4. `docs/product/plans/product-advantage-gate.md`

The first two dated records prove readiness/evidence; the Product Advantage Gate defines the genuine-distribution decision bar.

## 5. Active reading paths

### Product / business

1. `docs/strategy/commercial-strategy.md`
2. `docs/product/product-plan.md`
3. relevant `docs/product/specs/`
4. `docs/product/plans/product-advantage-gate.md` when evaluating current merchant-distribution proof

### Engineering

1. `docs/product/product-plan.md`
2. relevant product spec
3. `docs/project/architecture.md`
4. `docs/project/observability-and-analytics-contract.md` for telemetry/analytics/data questions
5. accepted ADRs
6. `docs/guides/development-guide.md`
7. current implementation/configuration

### Observability / analytics

1. `docs/project/observability-and-analytics-contract.md`
2. current runtime contracts (`src/lib/logger.ts`, `src/lib/analytics-events.ts`, MerchantSession/Event/Intent, distribution report)
3. `docs/product/campaign-intelligence/event-taxonomy.md` for bounded web product-event semantics
4. `docs/product/campaign-intelligence/ga4-console-checklist.md` for GA4 operator work
5. dated `docs/ops/` evidence only when reproducing a specific baseline

Do not start a new analytics architecture from the historical Campaign Intelligence migration files.

### Hosting / Cloudflare / Vercel

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. `docs/operations/hosting-strategy-vercel-cloudflare.md`
3. `docs/operations/README.md`
4. current generated route manifest / implementation
5. incident/archive evidence only when investigating history

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

Run:

```bash
npm run docs:audit
npm run docs:audit:strict
```

for governance or large documentation changes.

See `docs/document-inventory.md` for lifecycle and cleanup governance.
