# VisuTry Reddit + YouTube Community Growth Runbook

Status: active, conservative Week 1 rollout
Owner: Growth / Community Ops
Operational branch: `growth/community-ops`
Timezone: project/operator local timezone, currently `Asia/Shanghai`
Daily schedule: every day at 10:00 local time
Scheduler evidence: the Codex automation is verified separately from this repository documentation. Persist the real task ID and status in `growth/community/state/community-state.json`; use `NOT_EXPOSED` for unavailable next-run or run-ID fields.

## Purpose

This system uses Reddit and YouTube for three connected jobs:

1. Help people make eyewear decisions.
2. Capture authentic customer questions and objections.
3. Create qualified awareness of VisuTry only when a product mention is genuinely relevant.

The success condition is useful participation plus durable evidence. Comment count is not a target by itself.

## Canonical locations

- Policy: `docs/growth/community/`
- Daily evidence: `growth/community/daily/YYYY-MM-DD.md`
- Weekly review: `growth/community/weekly/YYYY-Wxx.md`
- Accumulated insights: `growth/community/insights/`
- Persistent state: `growth/community/state/`
- Scheduler notes and manual entry point: `automation/community-growth/`

## Daily cadence

| Day | Mode | Default new activity ceiling |
| --- | --- | --- |
| Monday | Active discovery and participation | Reddit 2-4, YouTube 2-4 |
| Tuesday | Follow-up and light discovery | Reddit 0-2, YouTube 0-2 |
| Wednesday | Active participation | Reddit 2-4, YouTube 2-4 |
| Thursday | Research and follow-up | Reddit 0-2, YouTube 0-2 |
| Friday | Active participation and optional post evaluation | Reddit 2-3, YouTube 2-3, max 1 Reddit post |
| Saturday/Sunday | Maintenance and exceptional opportunities | Follow-ups first; avoid aggressive discovery |

Week 1 is intentionally below these ceilings while account history, rules, authentication, and logging are validated.

## Required execution order

1. Read the previous seven daily logs, current weekly report, interaction index, insight files, recent VisuTry mentions/links, and community maps.
2. Open the authenticated browser profile and verify Reddit and YouTube/Google separately.
3. If authentication is missing, record `AUTH_REQUIRED: REDDIT` or `AUTH_REQUIRED: YOUTUBE`; do not bypass security.
4. Check notifications, replies, and existing conversations before discovering new threads or videos.
5. Search broad eyewear decision intent using the query pools in the platform maps.
6. Read full context, community rules, and existing discussion before acting.
7. Publish only standalone-useful, non-duplicative responses. Default to no VisuTry mention and no link.
8. Decide whether a response is actually needed, then choose `LIGHT`, `CONVERSATIONAL`, `DETAILED`, or `FOLLOW_UP` depth and match the community/user tone. Compare against recent account comments to avoid repeated cadence.
9. Record the execution trigger as `MANUAL`, `SCHEDULED`, `RETRY`, or `UNKNOWN`; record a scheduler run ID only when the platform exposes one.
10. Extract real user questions, growth opportunities, product/merchant signals, and measurement gaps.
11. Update the daily log, insight files, community state, and interaction index.
12. Inspect the diff for secrets and unrelated changes, commit with `growth: community ops YYYY-MM-DD`, and push the operational branch.
13. On the final operating run of the ISO week, update the weekly review and create or update one PR targeting `main`.

## Safe output states

- `COMPLETED`: useful work and evidence were recorded.
- `NO_HIGH_QUALITY_ACTION_FOUND`: research happened, but no public interaction was appropriate.
- `AUTH_REQUIRED`: one platform could not be used safely; continue with the other if possible.
- `PLATFORM_BLOCKED`, `BROWSER_ERROR`, `RATE_LIMITED`, `COMMUNITY_RULE_RESTRICTION`, `GIT_PUSH_FAILED`, or `SCHEDULER_FAILED`: record the exact failure and stop the affected action path.

## Pause and manual run

Pause or resume the Codex automation named `VisuTry Daily Community Growth` from the automation controls. Do not delete the repository system to pause it.

For a manual run, check out `growth/community-ops`, open a Codex task in `/Users/yesun/Code/visutry`, and use the prompt in `automation/community-growth/task-prompt.md`. The manual run must use the same log/state/commit workflow and the same safety policy. Do not run a separate shell-only implementation that pretends to have performed browser actions.

Every run must explicitly record `trigger`: `MANUAL`, `SCHEDULED`, `RETRY`, or `UNKNOWN`. For scheduled runs, record `scheduler_run_id` when exposed, otherwise `NOT_EXPOSED`. Do not manually run the next normal daily cycle to fabricate scheduled evidence; allow the active Codex automation to produce the next scheduled log and commit.

## Interaction style review

Review whether recent replies vary appropriately in depth and tone, fit local norms and the user's wording, avoid repeated structures, and stop when another answer would add noise. Use `LIGHT` or `FOLLOW_UP` when a mini-essay is unnecessary; reserve `DETAILED` for questions that genuinely need multi-factor reasoning.

## Authentication and privacy

Use the existing authenticated browser session only. Never extract or commit cookies, browser profiles, passwords, tokens, OAuth credentials, auth headers, or private keys. Public URLs and exact public comments may be logged.

## Weekly review and PR

The weekly review is a compact management view, not a raw link dump. Highlight the best 3-5 interactions, strongest 3-5 questions, growth/product findings, risks, and at most three next-week experiments. Detailed evidence remains in daily logs. Use PR title `Community Growth — YYYY Wxx` and update the same weekly PR instead of creating one per day.
