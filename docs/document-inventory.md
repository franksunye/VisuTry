# VisuTry Document Inventory

**Status:** Active documentation governance registry  
**Created:** 2026-07-08  
**Last updated:** 2026-09-13
**Owner:** Product / Engineering  
**Review cadence:** Monthly, and at every major milestone close  
**Scope:** Authoritative documents, directory lifecycle, exceptions, and cleanup debt. This is intentionally not a file-by-file catalog.

## 1. Operating rule

Start from `docs/README.md`. Current work must be routed through a source of truth, an accepted ADR, or an active plan/spec linked from those entry points.

An unlisted document does not become authoritative merely because it is newer or more detailed. Directory placement and declared status determine its default role.

## 2. Authority registry

| Scope | Authority | Owner | Review trigger |
| --- | --- | --- | --- |
| Documentation navigation | `docs/README.md` | Product / Engineering | Product direction or directory structure changes |
| Documentation governance | `docs/document-inventory.md`, ADR-001, ADR-012 | Product / Engineering | Monthly or governance rule changes |
| Cross-product positioning | `docs/product/product-system.md` | Product / Engineering | Product boundary or positioning changes |
| Product execution priority | `docs/product/product-plan.md` | Product | Milestone, gate, or priority changes |
| Commercial direction | `docs/strategy/commercial-strategy.md` | Product / Strategy | Commercial thesis changes |
| GTM execution | `docs/strategy/analytics/gtm.md` | Growth / Product / Analytics | Experiment or acquisition model changes |
| Observability / analytics / attribution / data-plane ownership | `docs/project/observability-and-analytics-contract.md` | Product / Engineering / Growth | Data-plane, schema, attribution, exclusion, dataset/property, or reporting-authority changes |
| Bounded web event semantics | `docs/product/campaign-intelligence/event-taxonomy.md` + `src/lib/analytics-events.ts` | Product / Engineering / Growth | Product event semantics change |
| GA4 operator configuration | `docs/product/campaign-intelligence/ga4-console-checklist.md` | Growth / Analytics | GA4 configuration or reporting-view changes |
| Technical architecture / system shape | `docs/project/architecture.md` | Engineering | Domain, persistence, runtime, or system ownership changes |
| Hosting/runtime ownership | ADR-011 + `docs/operations/hosting-strategy-vercel-cloudflare.md` | Product / Engineering | Provider, cache, route-class, or frontend ownership changes |
| Operations navigation | `docs/operations/README.md` | Product / Engineering | Runbook or production boundary changes |
| Decision precedence | `docs/decisions/README.md` and accepted ADRs | Product / Engineering | A durable decision is accepted or superseded |

Exact implemented route lists, cache eligibility, telemetry/event fields, package versions, and schema fields remain code/generated-manifest authoritative. Documentation owns semantics, stable boundaries, data-plane responsibilities, and operating rules.

## 3. Architecture documentation contract

Architecture governance follows these rules:

1. `docs/project/architecture.md` describes the current stable system shape and ownership boundaries.
2. Accepted ADRs own durable decisions and cannot be silently rewritten by an architecture overview.
3. `docs/operations/hosting-strategy-vercel-cloudflare.md` owns current production hosting responsibility; route/cache code owns exact volatile configuration.
4. `docs/project/observability-and-analytics-contract.md` owns telemetry/data-plane semantics; architecture docs link to it rather than creating a second analytics model.
5. Architecture boundaries should be provider-neutral where the implementation supports it. Example: PostgreSQL is the persistence contract; Neon is the current provider.
6. Historical audits/migration documents are evidence. Merge durable conclusions into an active authority or ADR; do not make the historical file “current” by continual edits.
7. Avoid file-by-file/page-by-page component inventories in architecture authorities. Those lists drift faster than architectural boundaries and belong in code or generated manifests.
8. The active architecture authorities must describe the stable P0.5A–P0.5D boundaries—Public Web versus Consumer App runtime, public prefetch behavior, image-delivery classes, intentional ISR, and the transitional D1 cache position—without recording a premature P0.5E result.

## 4. Directory lifecycle

| Location | Default role | Close-out rule |
| --- | --- | --- |
| `docs/product/specs/` | Durable product contract | Update in place; supersede explicitly when behavior changes |
| `docs/product/plans/` | Time-bounded execution or validation plan | On completion, update status and merge durable facts into the relevant spec/authority; archive residual history |
| `docs/product/audits/` | Point-in-time evidence | Retain when evidence is reusable; do not treat as current priority |
| `docs/audits/` | Cross-cutting engineering/product audits | Retain as evidence; merge durable conclusions into ADRs / architecture / relevant authority |
| `docs/project/` | Cross-cutting current project/technical authorities | Keep small; update in place; do not duplicate with phase reports |
| `docs/product/sales/` | Sales enablement or validation evidence | Review when offer, pricing, or product boundary changes |
| `docs/strategy/` | Current strategy plus dated supporting research | Dated execution plans expire when their window closes; route durable conclusions into an authority |
| `docs/operations/` | Current runbooks plus migration/incident records | Keep active runbooks small; classify completed migration records through `ARCHIVE.md` |
| `docs/ops/` | Dated release/observation records | Retain as evidence; create a new record for a new observation window |
| `docs/guides/` | Durable how-to guidance | Review against code/config after relevant implementation changes |
| `docs/decisions/` | Durable decisions | Never silently rewrite history; supersede with a newer ADR |
| Any `archive/` directory | Historical context only | Never use as current execution authority |
| Any `evidence/` directory | Raw/summarized verification evidence | Link from the governing plan/incident/audit |

## 5. Required metadata

Every active plan, spec, guide, runbook, or source of truth should include near the top:

- `Status`
- `Owner`
- `Last updated` / `Last reviewed`
- clear scope and authority relationship where not obvious

Recommended lifecycle values:

| Status | Meaning |
| --- | --- |
| Active source of truth | Primary authority for a scope |
| Active plan / playbook | Current bounded work/procedure |
| Measuring / validation | Shipped/prepared; next decision waits on evidence |
| Living supporting reference | Evidence/research informing an authority |
| Draft | Under discussion; not execution authority |
| Resolved incident / permanent guardrail | Closed event retained because it defines a safety rule |
| Superseded | Replaced by named newer guidance |
| Archived historical reference | Context only |

## 6. Creation budget

Before creating a document, answer:

1. Can this update an existing authority/plan/spec instead?
2. What decision or workflow consumes it?
3. Who owns it?
4. What event ends its active life?
5. At close, is it merged, retained as evidence, archived, or deleted?

Avoid parallel “summary / complete / ready / final” documents when the same facts can update an authority or a single dated evidence record.

## 7. Automated audit

Run:

```bash
npm run docs:audit
npm run docs:audit -- --json
npm run docs:audit:strict
```

Use the audit during monthly review and before merging broad documentation-governance changes.

## 8. Current cleanup queue

| Priority | Action | State |
| --- | --- | --- |
| P0 | Replace stale full manual catalog with authority registry and directory lifecycle | Done 2026-08-26 |
| P0 | Add repeatable documentation health audit | Done 2026-08-26 |
| P0 | Establish cross-cutting Observability & Analytics authority | Done 2026-09-04 |
| P0 | Remove stale active Campaign Intelligence/logging authorities absorbed by current contracts | Done 2026-09-04 |
| P0 | Architecture documentation governance: rebuild current architecture authority; reconcile Vercel/Cloudflare ownership; make PostgreSQL boundary provider-neutral; move volatile route/cache detail to code; refresh P0.5A–D decisions | **Done 2026-09-13**; P0.5E remains measurement-only |
| P0 | Reconcile Axiom schema-capacity incident | **Containment done 2026-09-04** — bounded transport allowlist is active; longer-term field ownership/classification and optional Commerce dataset split remain P1/deferred |
| P1 | Axiom post-containment field ownership / optional Commerce dataset decision | Open; evidence/audit-gated, no split authorized by documentation alone |
| P1 | GA4 console reconciliation against observed current events/dimensions/key events | Open; operator task, no code change implied |
| P1 | Add missing metadata to active plans/specs/operations/guides | Open; reduce by area, not mass editing |
| P2 | Review large Markdown files over 30 KB for extraction/consolidation | Open |
| P2 | Convert operations archive-by-status into physical archive folders only when links/forensic workflows remain clear | Deferred |

## 9. Deletion policy

Delete when a document is:

- duplicate;
- empty;
- fully incorporated into a newer authority with no unique evidence;
- an expired progress/checklist/spec that would mislead current execution and whose unique evidence is already retained elsewhere.

Retain/archive when it contains unique incident, migration, production verification, or decision evidence that may be needed for audit/forensics.

Architecture governance should prefer consolidating current authorities and preserving historical evidence over deleting incident/migration records that explain why a guardrail exists.

## 10. Review checklist

At milestone close or monthly review:

1. Run `npm run docs:audit`.
2. Confirm every authority still describes current reality.
3. Close/archive plans whose decision window ended.
4. Merge durable conclusions from audits/completion reports into authorities.
5. Remove duplicate/empty/fully incorporated documents after confirming no unique evidence remains.
6. Check active docs against runtime code/data-plane boundaries.
7. Check architecture docs against accepted ADRs and provider/route/cache ownership.
8. Update this registry only for authorities, lifecycle rules and explicit cleanup debt.

## Change log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created the original file-by-file inventory and cleanup backlog. |
| 2026-08-26 | Replaced the non-scaling catalog with an authority registry, lifecycle, creation budget and focused cleanup queue per ADR-012. |
| 2026-08-27 | Registered cross-cutting audits and platform/SaaS architecture evidence. |
| 2026-09-04 | Registered the Observability & Analytics Contract; narrowed Campaign Intelligence; removed stale analytics/logging active docs; added Axiom governance work. |
| 2026-09-12 | Added the architecture-documentation contract; consolidated active architecture/hosting authorities; reconciled Axiom cleanup status with the active observability contract. |
| 2026-09-13 | Refreshed the active architecture authorities for P0.5A–D; preserved P0.5E as an evidence-gated observation and kept D1 removal undecided. |
