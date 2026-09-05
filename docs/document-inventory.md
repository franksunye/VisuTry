# VisuTry Document Inventory

**Status:** Active documentation governance registry  
**Created:** 2026-07-08  
**Last updated:** 2026-09-04  
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
| Cross-repository product positioning | `docs/product/product-system.md` | Product / Engineering | Product boundary or positioning changes |
| Product execution priority | `docs/product/product-plan.md` | Product | Milestone, gate, or priority changes |
| Commercial direction | `docs/strategy/commercial-strategy.md` | Product / Strategy | Commercial thesis changes |
| GTM execution | `docs/strategy/analytics/gtm.md` | Growth / Product / Analytics | Experiment or acquisition model changes |
| **Observability / analytics / attribution / data-plane ownership** | **`docs/project/observability-and-analytics-contract.md`** | Product / Engineering / Growth | Data-plane, schema, attribution, exclusion, dataset/property, or reporting-authority changes |
| Bounded web product-event semantics | `docs/product/campaign-intelligence/event-taxonomy.md` + `src/lib/analytics-events.ts` | Product / Engineering / Growth | Product event semantics change |
| GA4 operator configuration | `docs/product/campaign-intelligence/ga4-console-checklist.md` | Growth / Analytics | GA4 configuration or reporting-view changes |
| Technical reality | `docs/project/architecture.md` | Engineering | Architecture or runtime boundary changes |
| Hosting/runtime ownership | ADR-011, `docs/operations/hosting-strategy-vercel-cloudflare.md` | Product / Engineering | Provider or route ownership changes |
| Operations navigation | `docs/operations/README.md` | Product / Engineering | Runbook or production boundary changes |
| Decision precedence | `docs/decisions/README.md` and accepted ADRs | Product / Engineering | A durable decision is accepted or superseded |

Exact implemented telemetry/event fields remain code-authoritative. Documentation owns semantics, data-plane responsibilities and operating rules; it must not claim planned fields are already emitted.

## 3. Directory lifecycle

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

## 4. Required metadata

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

## 5. Creation budget

Before creating a document, answer:

1. Can this update an existing authority/plan/spec instead?
2. What decision or workflow consumes it?
3. Who owns it?
4. What event ends its active life?
5. At close, is it merged, retained as evidence, archived, or deleted?

Avoid parallel “summary / complete / ready / final” documents when the same facts can update an authority or a single dated evidence record.

## 6. Automated audit

Run:

```bash
npm run docs:audit
npm run docs:audit -- --json
npm run docs:audit:strict
```

Use the audit during monthly review and before merging broad documentation-governance changes.

## 7. Current cleanup queue

| Priority | Action | State |
| --- | --- | --- |
| P0 | Replace stale full manual catalog with authority registry and directory lifecycle | Done 2026-08-26 |
| P0 | Add repeatable documentation health audit | Done 2026-08-26 |
| P0 | Establish cross-cutting Observability & Analytics authority | **Done 2026-09-04** |
| P0 | Remove stale active Campaign Intelligence phase/dashboard authorities that conflicted with the durable MerchantSession/Event/Intent model | **Done 2026-09-04** — removed `implementation-progress.md` and obsolete `ga4-dashboard-spec.md`; retained historical migration evidence under `archive/` |
| P0 | Remove obsolete pre-governance logging migration checklist | **Done 2026-09-04** — removed `docs/project/LOGGING_ROADMAP.md`; current logging/Axiom rules are owned by the Observability & Analytics Contract and runtime logger |
| P0 | Reconcile Campaign Intelligence taxonomy/GA4 runbook with current runtime/data-plane boundaries | **Done 2026-09-04** |
| P0 | Axiom `visutry-pro` field/schema-capacity audit | **Open** — current dataset observed at field capacity; no destructive cleanup or dataset split until read-only inventory/dependency audit |
| P1 | GA4 console reconciliation against observed current events/dimensions/key events | Open; operator task, no code change implied |
| P1 | Add missing metadata to active plans/specs/operations/guides | Open; reduce by area, not mass editing |
| P2 | Review large Markdown files over 30 KB for extraction/consolidation | Open |
| P2 | Convert operations archive-by-status into physical archive folders only when links/forensic workflows remain clear | Deferred |

## 8. Deletion policy

Delete when a document is:

- duplicate;
- empty;
- fully incorporated into a newer authority with no unique evidence;
- an expired progress/checklist/spec that would mislead current execution and whose unique evidence is already retained elsewhere.

Retain/archive when it contains unique incident, migration, production verification or decision evidence that may be needed for audit/forensics.

The 2026-09-04 analytics governance pass intentionally **keeps** `docs/product/campaign-intelligence/archive/` because it contains historical migration/evidence, while deleting stale active-layer documents whose role was fully absorbed by current authorities.

## 9. Review checklist

At milestone close or monthly review:

1. Run `npm run docs:audit`.
2. Confirm every authority still describes current reality.
3. Close/archive plans whose decision window ended.
4. Merge durable conclusions from audits/completion reports into authorities.
5. Remove duplicate/empty/fully incorporated documents after confirming no unique evidence remains.
6. Check active docs against runtime code/data-plane boundaries.
7. Update this registry only for authorities, lifecycle rules and explicit cleanup debt.

## Change log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created the original file-by-file inventory and cleanup backlog. |
| 2026-08-26 | Replaced the non-scaling catalog with an authority registry, lifecycle, creation budget and focused cleanup queue per ADR-012. |
| 2026-08-27 | Registered cross-cutting audits and platform/SaaS architecture evidence. |
| 2026-09-04 | Registered the Observability & Analytics Contract; narrowed Campaign Intelligence; removed stale analytics/logging active docs; added Axiom schema-capacity and GA4 reconciliation cleanup work. |
