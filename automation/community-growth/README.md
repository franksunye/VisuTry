# Community Growth Automation

**Status:** HUMAN_REVIEW_AND_PUBLISH approved; preparation/follow-up scheduling recorded separately  
**Last reviewed:** 2026-11-21

This is the repository-side entry point for VisuTry's Reddit participation work.
The current strategy remains `docs/strategy/analytics/gtm.md`; this workflow does
not create a separate GTM plan or restart historical YouTube/outreach work.

## Approved operating mechanism

The user's 2026-11-21 request authorizes sustained, useful Reddit participation
and relevant VisuTry promotion. Do not repeatedly ask for authorization already
given within that scope.

On 2026-11-21 the user explicitly selected `HUMAN_REVIEW_AND_PUBLISH`:

- The assistant selects topics, checks rules, writes complete English drafts,
  prepares follow-up replies and reviews actual outcomes.
- The user reviews each final text and personally clicks Post or Comment.
- All public follow-up replies use the same review-and-publish division.

The assistant may prepare or save drafts, but does not submit public posts or
comments. Agent-operated app registration is not a prerequisite for this
drafting workflow and must not become a recurring blocker. Automatic public
submission is outside the selected mechanism. Current community rules and
commercial/AI disclosure still apply to the final content.

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

## Preparation and follow-up task — verified 2026-11-21

- Task: `VisuTry Reddit 选题与跟进`
- ID: `Automation_950003f090788191a770a7fa7063ad3c`
- Enabled: `true`
- Schedule: daily around 10:00, `Asia/Shanghai`, `flexible_schedule`.
- Next scheduled run: `2026-11-22T10:00:00+08:00`.
- Last run: `null`; first execution is pending. Configuration is not run evidence.
- Saturday: add the weekly outcome review to the same daily packet.
- One task handles preparation and follow-up; the old paused review task is not restarted.

Prioritize actual replies and existing pending drafts. Deliver one primary
recommendation with at most one useful backup, and retain at most two unresolved
new drafts. This task prepares work for human review/publication; it does not
submit public posts or comments.

## Evidence and review

Use daily evidence under `growth/community/daily/` and the existing state/index
where appropriate. Preserve historical timestamps and records; old `ACTIVE`
fields are not current scheduler verification.

Only a verified live permalink and publicly visible published text count as
`PUBLISHED_VERIFIED`. A completed draft is `DRAFT_READY`; a user-reported
submission with public visibility still unchecked is
`PUBLIC_VISIBILITY_UNVERIFIED`.

Inspect any repository diff for unrelated changes and secrets. Follow the
current authorized repository workflow for evidence writes; do not automatically
push a stale branch or create a weekly PR. Never fabricate a scheduled run or a
publication to satisfy an output target.

## Historical reference

The August/September setup, dated logs and closed-unmerged PR #156 are historical
evidence. Do not restore the old branch, daily schedule, warm-up period or weekly
PR workflow from these references. Preserve the records without treating them
as current operational configuration.
