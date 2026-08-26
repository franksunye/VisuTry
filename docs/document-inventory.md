# VisuTry Document Inventory

**Status:** Active documentation governance registry
**Created:** 2026-07-08
**Last updated:** 2026-08-26
**Owner:** Product / Engineering
**Review cadence:** Monthly, and at every major milestone close
**Scope:** Authoritative documents, directory lifecycle, exceptions, and cleanup debt. This is intentionally not a file-by-file catalog.

## 1. Operating Rule

Start from `docs/README.md`. Current work must be routed through a source of truth, an accepted ADR, or an active plan/spec linked from those entry points.

An unlisted document does not become authoritative merely because it is newer or more detailed. Directory placement and its declared status determine its default role.

## 2. Authority Registry

| Scope | Authority | Owner | Review trigger |
| --- | --- | --- | --- |
| Documentation navigation | `docs/README.md` | Product / Engineering | Product direction or directory structure changes |
| Documentation governance | `docs/document-inventory.md`, ADR-001, ADR-012 | Product / Engineering | Monthly or governance rule changes |
| Cross-repository product positioning | `docs/product/product-system.md` | Product / Engineering | Product boundary or positioning changes |
| Product execution priority | `docs/product/product-plan.md` | Product | Milestone, gate, or priority changes |
| Commercial direction | `docs/strategy/commercial-strategy.md` | Product / Strategy | Commercial thesis changes |
| GTM execution | `docs/strategy/analytics/gtm.md` | Growth / Product / Analytics | Experiment or measurement model changes |
| Campaign Intelligence event contract and analytics operations | `docs/product/campaign-intelligence/README.md`, `event-taxonomy.md`, `implementation-progress.md` | Product / Engineering / Growth | Event contract, product boundary, or GA4 measurement model changes |
| Technical reality | `docs/project/architecture.md` | Engineering | Architecture or runtime boundary changes |
| Hosting/runtime ownership | ADR-011, `docs/operations/hosting-strategy-vercel-cloudflare.md` | Product / Engineering | Provider or route ownership changes |
| Operations navigation | `docs/operations/README.md` | Product / Engineering | Runbook or production boundary changes |
| Decision precedence | `docs/decisions/README.md` and accepted ADRs | Product / Engineering | A durable decision is accepted or superseded |

Detailed feature behavior belongs in `docs/product/specs/`. A spec may be authoritative for its bounded feature without being added to this table when it is correctly linked from the product entry point or product plan.

## 3. Directory Lifecycle

| Location | Default role | Close-out rule |
| --- | --- | --- |
| `docs/product/specs/` | Durable product contract | Update in place; supersede explicitly when behavior changes |
| `docs/product/plans/` | Time-bounded execution or validation plan | On completion, update status and merge durable facts into the relevant spec/authority; archive residual history |
| `docs/product/audits/` | Point-in-time evidence | Retain when evidence is reusable; do not treat as current priority |
| `docs/product/sales/` | Current sales enablement or validation evidence | Review when offer, pricing, or product boundary changes |
| `docs/strategy/` | Current strategy plus dated supporting research | Dated execution plans expire when their window closes; route durable conclusions into an authority |
| `docs/operations/` | Current runbooks plus migration/incident records | Keep active runbooks small; classify completed migration records through `ARCHIVE.md` |
| `docs/ops/` | Dated release/observation records | Retain as evidence; create a new record for a new observation window |
| `docs/guides/` | Durable how-to guidance | Review against code/config after relevant implementation changes |
| `docs/decisions/` | Durable decisions | Never silently rewrite history; supersede with a newer ADR |
| Any `archive/` directory | Historical context only | Never use as current execution authority |
| Any `evidence/` directory | Raw or summarized verification evidence | Exempt from manual inventory; link from the governing plan, incident, or audit |

## 4. Required Metadata

Every active plan, spec, guide, runbook, or source of truth must include near the top:

- `Status`
- `Owner`
- `Last updated` or `Last reviewed` for sources of truth
- a clear relationship to the governing authority when that relationship is not obvious from its directory

Recommended lifecycle values:

| Status | Meaning |
| --- | --- |
| Active source of truth | Primary authority for a scope |
| Active plan / playbook | Current, bounded work or procedure |
| Living supporting reference | Evidence or research that informs an authority |
| Draft | Under discussion; must not drive execution alone |
| Measuring / validation | Shipped or prepared, with the next decision waiting on evidence |
| Resolved incident / permanent guardrail | Closed event retained because it defines a safety rule |
| Superseded | Replaced by named newer guidance |
| Archived historical reference | Context only; never current instruction |

## 5. Creation Budget

Before creating a document, answer:

1. Can this update an existing authority, plan, spec, or change log instead?
2. What decision or workflow will consume it?
3. Who owns it?
4. What event ends its active life?
5. When it ends, will it be merged, retained as evidence, archived, or deleted?

Avoid separate “summary”, “complete”, “ready”, and “final” documents when the same facts can update the originating plan or spec. A separate record is appropriate when it preserves reproducible verification, an incident timeline, externally sourced research, or a decision rationale.

## 6. Automated Audit

Run:

```bash
npm run docs:audit
```

The audit reports repository size, missing `Status`/`Owner`, oversized Markdown files, authority metadata, and broken local Markdown links. Use JSON for follow-up tooling:

```bash
npm run docs:audit -- --json
```

`npm run docs:audit:strict` fails only when an authority is missing/under-specified or a local Markdown link is broken. Missing metadata elsewhere remains cleanup debt until the existing backlog is reduced; it is visible but not yet a global CI gate.

## 7. Current Cleanup Queue

| Priority | Action | State |
| --- | --- | --- |
| P0 | Replace the stale full manual catalog with this authority registry and directory lifecycle | Done 2026-08-26 |
| P0 | Add repeatable documentation health audit | Done 2026-08-26 |
| P0 | Move the expired Q4 2025 / 500-page content execution bundle under strategy archive | Done 2026-08-26 |
| P1 | Add missing metadata to active product plans/specs and active operations/guides | Open; reduce by area, not by mass editing |
| P1 | Consolidate Campaign Intelligence phase/completion reports into a durable spec, progress ledger, and evidence set | Done 2026-08-26; historical records retained in `docs/product/campaign-intelligence/archive/` |
| P1 | Review old GA tracking implementation/summary documents; merge durable facts and archive the rest | Done 2026-08-26; current measurement authority is Campaign Intelligence |
| P2 | Review large Markdown files over 30 KB for extraction or consolidation | Open |
| P2 | Convert operations archive-by-status into physical archive folders only when links and forensic workflows remain clear | Deferred |

## 8. Review Checklist

At milestone close or monthly review:

1. Run `npm run docs:audit`.
2. Confirm every authority still describes current reality.
3. Close or archive plans whose decision window ended.
4. Merge durable conclusions from audits and completion reports into specs or authorities.
5. Remove duplicate/empty documents only after confirming they contain no unique evidence.
6. Update this file only for authorities, lifecycle rules, and explicit cleanup exceptions—not for every new document.

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created the original file-by-file inventory and cleanup backlog. |
| 2026-08-26 | Replaced the non-scaling catalog with an authority registry, directory lifecycle, creation budget, automated audit, and focused cleanup queue per ADR-012. |
