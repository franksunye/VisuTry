# VisuTry Reddit + YouTube Community Growth Runbook

Status: active, balanced-promotion rollout
Owner: Growth / Community Ops
Operational branch: `growth/community-ops`
Timezone: project/operator local timezone, currently `Asia/Shanghai`
Daily schedule: every day at 10:00 local time
Scheduler evidence: the Codex automation is verified separately from this repository documentation. Persist the real task ID and status in `growth/community/state/community-state.json`; use `NOT_EXPOSED` for unavailable next-run or run-ID fields.

## Purpose

This system uses Reddit and YouTube for three connected jobs:

1. Help people make eyewear decisions.
2. Capture authentic customer questions and objections.
3. Create qualified awareness and referral potential for VisuTry when product relevance and community rules support it.

The success condition is useful participation plus durable evidence and progressively measurable distribution. Comment count is not a target by itself, but permanent zero-promotion is also not a success condition.

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

These are ceilings, not quotas. Active days should still cover both trust-building and distribution-fit discovery.

## Required execution order

1. Read the previous seven daily logs, current weekly report, interaction index, insight files, recent VisuTry mentions/links, reviewer guidance, and community maps.
2. Open the authenticated browser profile and verify Reddit and YouTube/Google separately.
3. If authentication is missing, record `AUTH_REQUIRED: REDDIT` or `AUTH_REQUIRED: YOUTUBE`; do not bypass security.
4. Check notifications, replies, and existing conversations before discovering new threads or videos.
5. Run two distinct discovery lanes:
   - `TRUST_LANE`: useful community participation where product promotion may be absent or restricted.
   - `DISTRIBUTION_LANE`: high-intent tool/recommendation/virtual-try-on/comparison requests and rule-compatible maker/tool/project communities.
6. Read full context, current community rules, and existing discussion before acting.
7. Publish only standalone-useful, non-duplicative responses. Classify each worthwhile action as `COMMUNITY_VALUE`, `TRANSPARENT_MENTION`, or `DIRECT_SHARE` under `interaction-policy.md`.
8. Do not suppress VisuTry by default when it directly solves the user's request and transparent mention is allowed. Direct links remain stricter than mentions.
9. Decide whether a response is actually needed, then choose `LIGHT`, `CONVERSATIONAL`, `DETAILED`, or `FOLLOW_UP` depth and match the community/user tone. Compare against recent account comments to avoid repeated cadence.
10. Record the execution trigger as `MANUAL`, `SCHEDULED`, `RETRY`, or `UNKNOWN`; record a scheduler run ID only when the platform exposes one.
11. Extract real user questions, growth opportunities, product/merchant signals, and measurement gaps.
12. Update the daily log, insight files, community state, and interaction index.
13. Inspect the diff for secrets and unrelated changes, commit with `growth: community ops YYYY-MM-DD`, and push the operational branch.
14. On the final operating run of the ISO week, update the weekly review and create or update one PR targeting `main`.

## Operational efficiency

Daily community work must be bounded. Do not remain in the browser for hours merely to exhaust possible searches.

- Active-day default research budget: complete a focused pass across both lanes, prioritizing freshness and unresolved high-intent questions.
- If the first search terms are weak, vary query language and surfaces before concluding `NO_HIGH_QUALITY_ACTION_FOUND`.
- Once notifications/follow-ups, both lanes, representative fresh candidates, and evidence logging are complete, finish the run.
- A runtime confirmation boundary or an absence of good candidates is not a reason to keep the session open for extended periods.
- Repeated 2+ hour runs with few searches/actions should be treated as an efficiency defect and diagnosed in review.

## Git evidence in daily logs

Daily logs must distinguish the temporary state at log-write time from the final repository evidence:

- `git_status_at_log_write`: the status observed when the daily log was written. Use an explicit value such as `PENDING_COMMIT` when the evidence files have not yet been committed.
- `git_final_evidence`: operational evidence of branch/primary commit/push. The remote branch HEAD is authoritative; do not create chained commits merely to record the prior commit SHA inside the log.

## Safe output states

- `COMPLETED`: useful work and evidence were recorded.
- `NO_HIGH_QUALITY_ACTION_FOUND`: research happened across the required lanes, but no public interaction was appropriate.
- `AUTH_REQUIRED`: one platform could not be used safely; continue with the other if possible.
- `REPRESENTATIONAL_ACTION_BLOCKED`: a qualified public action reached a runtime confirmation boundary and could not be submitted unattended.
- `PLATFORM_BLOCKED`, `BROWSER_ERROR`, `RATE_LIMITED`, `COMMUNITY_RULE_RESTRICTION`, `GIT_PUSH_FAILED`, or `SCHEDULER_FAILED`: record the exact failure and stop the affected action path.

## Pause and manual run

Pause or resume the Codex automation named `VisuTry Daily Community Growth` from the automation controls. Do not delete the repository system to pause it.

For a manual run, check out `growth/community-ops`, open a Codex task in `/Users/yesun/Code/visutry`, and use the prompt in `automation/community-growth/task-prompt.md`. The manual run must use the same log/state/commit workflow and the same safety policy.

Every run must explicitly record `trigger`: `MANUAL`, `SCHEDULED`, `RETRY`, or `UNKNOWN`. For scheduled runs, record `scheduler_run_id` when exposed, otherwise `NOT_EXPOSED`. Do not manually run the next normal daily cycle to fabricate scheduled evidence.

## Interaction style review

Review whether recent replies vary appropriately in depth and tone, fit local norms and the user's wording, avoid repeated structures, and stop when another answer would add noise. Use `LIGHT` or `FOLLOW_UP` when a mini-essay is unnecessary; reserve `DETAILED` for questions that genuinely need multi-factor reasoning.

## Authentication and privacy

Use the existing authenticated browser session only. Never extract or commit cookies, browser profiles, passwords, tokens, OAuth credentials, auth headers, or private keys. Public URLs and exact public comments may be logged.

## Weekly review and PR

The weekly review is a compact management view, not a raw link dump. Highlight the best 3-5 interactions, strongest 3-5 questions, growth/product findings, risks, and at most three next-week experiments. Explicitly diagnose promotion posture as `UNDER_PROMOTION`, `BALANCED`, or `OVER_PROMOTION`. Detailed evidence remains in daily logs. Use PR title `Community Growth — YYYY Wxx` and update the same weekly PR instead of creating one per day.
