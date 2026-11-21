# Community Growth Automation

**Status:** Reddit execution contract refreshed; live scheduling and automated publishing not verified  
**Last reviewed:** 2026-11-21

This is the repository-side entry point for VisuTry's Reddit participation work.
The current strategy remains `docs/strategy/analytics/gtm.md`; this workflow does
not create a separate GTM plan or restart historical YouTube/outreach work.

## Authorization and publishing capability

The user's 2026-11-21 request authorizes sustained, useful Reddit participation
and relevant VisuTry promotion. Do not repeatedly ask for authorization already
given within that scope.

Current capability observations:

- `HUMAN_PUBLISHING_AVAILABLE`: the existing Reddit account can be used by its
  human owner; the current session's account evidence belongs in the dated log.
- `AUTOMATED_PUBLISHING_NOT_VERIFIED`: Reddit app registration and the permission
  required for agent-operated publishing have not been verified.

These are capability states, not a user decision to adopt a permanent
human-only workflow. Verify the actual publishing method against current Reddit
and community rules before submitting. A logged-in browser, user authorization,
or human approval does not establish Reddit app registration or exempt an agent
from platform rules. Registration does not permit continuous product promotion.

## Current execution

- Entry point: the current `automation/community-growth/task-prompt.md`.
- Read the current runbook, interaction policy, community map and recent actual
  evidence before acting.
- Use the current authorized checkout and repository workflow. Do not require
  the historical `growth/community-ops` branch or a fixed local filesystem path.
- Prepare complete, context-specific publishing packets and follow up on actual
  conversations. When publication cannot proceed, deliver the exact text,
  target and blocker while the opportunity is still current.
- Record a task ID, schedule, enabled state and actual run evidence only when
  exposed by the real scheduler. Editing these documents does not schedule work.
- The historical Codex task and the separate ChatGPT review task are different
  systems. Do not claim that enabling a review task enables publication.

## Evidence and review

Use daily evidence under `growth/community/daily/` and the existing state/index
where appropriate. Preserve historical timestamps and records; old `ACTIVE`
fields are not current scheduler verification.

Only a verified live permalink and visible published text count as
`PUBLISHED_VERIFIED`. A completed draft is `DRAFT_READY`.

Inspect any repository diff for unrelated changes and secrets. Follow the
current authorized repository workflow for evidence writes; do not automatically
push a stale branch or create a weekly PR. Never fabricate a scheduled run or a
publication to satisfy an output target.

## Historical reference

The August/September setup, dated logs and closed-unmerged PR #156 are historical
evidence. Do not restore the old branch, daily schedule, warm-up period or weekly
PR workflow from these references. Preserve the records without treating them
as current operational configuration.
