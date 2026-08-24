# Community Growth Automation

This is the repository-side contract for the Codex task named `VisuTry Daily Community Growth`.

## Scheduler

- Task name: `VisuTry Daily Community Growth`
- Task ID: persist the actual Codex automation ID in community state; do not invent one
- Schedule: every day at 10:00
- Timezone: operator/project local timezone, currently `Asia/Shanghai`
- Status and verification: persist the actual status, verification timestamp, and `CODEX_SCHEDULER` source in community state
- Unavailable metadata: use `NOT_EXPOSED` for `next_run_at` and scheduler run IDs when the platform does not expose them
- Execution entry point: `automation/community-growth/task-prompt.md`
- Working directory: `/Users/yesun/Code/visutry`
- Branch: `growth/community-ops`
- Browser dependency: existing authenticated browser profile; no credential extraction
- Daily log: `growth/community/daily/YYYY-MM-DD.md`
- Weekly review: `growth/community/weekly/YYYY-Wxx.md`

## Manual run

Check out `growth/community-ops` and run the prompt in `task-prompt.md` as a Codex task in the repository. It must use the same browser, state, log, commit, and push rules as the scheduler.

## Trigger identity

Record the trigger on every execution as one of `MANUAL`, `SCHEDULED`, `RETRY`, or `UNKNOWN`. Never label a manual run as scheduled. Do not manually trigger the next normal daily run after a hardening pass; wait for the active scheduler.

## Pause

Pause/resume the Codex automation by name. Pausing is preferred to deleting files or disabling unrelated project cron routes.

## Troubleshooting

- Authentication: record the platform-specific `AUTH_REQUIRED` state and continue only with the other safe platform.
- Browser errors or platform blocks: record the exact state and do not retry aggressively.
- Git push failures: retain the local evidence, record `GIT_PUSH_FAILED`, and retry only on a later controlled run.
- Secrets: inspect staged diff and remove any credential material before committing.

## Weekly PR

At the end of each ISO week, update the weekly review, commit it, push the branch, and create or update one PR targeting `main` with title `Community Growth — YYYY Wxx`. Do not create a PR per day.
