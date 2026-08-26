# ADR-012: Govern Documentation by Authority and Lifecycle, Not a Full Manual Catalog

**Status:** Accepted
**Date:** 2026-08-26
**Owner:** Product / Engineering

## Context

The first documentation-governance pass established entry points, source-of-truth documents, ADRs, and archives. Since then, the repository has grown to more than 200 Markdown files, especially around B-side productization, audits, delivery plans, analytics migrations, and infrastructure evidence.

The existing file-by-file inventory no longer scales. It becomes stale whenever a plan, audit, or completion report is added, while giving the misleading impression that unlisted documents are unmanaged. Completed milestones also remain beside active plans, making search results noisier and old instructions easier to mistake for current work.

## Decision

1. `docs/document-inventory.md` is a registry of **authoritative entry points and explicit exceptions**, not a catalog of every file.
2. Directories define the default role of ordinary documents. Individual rows are required only for sources of truth, special guardrails, or known cleanup exceptions.
3. Every active plan, specification, guide, or runbook must declare `Status` and `Owner`. A current source of truth must also declare `Last updated` or `Last reviewed`.
4. A new document must have a lifecycle exit: merge into an authority, become durable evidence, or move to an archive after its decision window or milestone closes.
5. Completion should normally update the original plan/spec and its change log. A separate completion report is justified only when it contains durable verification or audit evidence.
6. Historical evidence is retained when it supports incident analysis, verification, compliance, or future design. Duplicate summaries and fully incorporated task notes may be deleted.
7. `npm run docs:audit` reports inventory size, authority health, missing metadata, large Markdown files, and broken local links. The strict mode gates only authority health and link integrity until the metadata backlog is reduced.

## Consequences

- The small set of source-of-truth documents remains human-curated.
- Ordinary documents can grow without expanding a central table line by line.
- Metadata and link drift become measurable instead of relying on memory.
- Archiving becomes a normal milestone-close action rather than an occasional cleanup project.
- Existing metadata debt is visible but does not immediately block unrelated engineering work.

## Related Documents

- `docs/README.md`
- `docs/document-inventory.md`
- `docs/decisions/ADR-001-documentation-governance.md`
- `scripts/audit-docs.mjs`
