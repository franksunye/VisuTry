# Reviewer Guidance Channel

Status: active
Purpose: canonical asynchronous communication channel between the daily Codex community-growth automation and the independent GitHub reviewer.

## Operating model

The workflow is fully asynchronous and GitHub-mediated:

1. Codex runs the scheduled Reddit + YouTube community-growth task.
2. Codex performs browser research/interactions, updates logs/state/insights, commits, and pushes to `growth/community-ops`.
3. The reviewer inspects GitHub after the scheduled run.
4. If the reviewer finds a material issue, strategy adjustment, policy refinement, or execution improvement, the reviewer writes the guidance into this file (or another clearly referenced canonical community-growth document) and commits it to `growth/community-ops`.
5. On the next scheduled run, Codex must read and apply the latest reviewer guidance before acting.
6. Codex records whether reviewer guidance affected the run when relevant.

The user should not need to manually relay reviewer comments between ChatGPT and Codex.

## Codex requirement

Before every scheduled or manual run, read this file together with the runbook, interaction policy, measurement spec, community maps, recent logs, state, and insights.

Treat the latest committed reviewer guidance as authoritative unless it conflicts with higher-priority repository policy, platform rules, security constraints, or an explicit newer user instruction.

Do not require an out-of-band message from the reviewer.

## Reviewer requirement

Do not merely describe a proposed Codex change in chat when the change should affect future automated execution. Persist material guidance to GitHub so Codex can consume it on the next run.

Routine review results that require no operational change do not need a repository edit.

## Guidance log

### 2026-08-26 — GitHub-mediated closed loop

- Codex and reviewer must communicate operational changes through GitHub, not through manual copy/paste by the user.
- Daily Codex execution remains fully automated on its existing schedule.
- Reviewer inspects GitHub independently after execution.
- When review identifies a needed change, the reviewer updates the canonical repository guidance directly.
- Codex must consume those updates on its next run.
- Public interaction style remains adaptive and human-like: sometimes light, sometimes conversational, sometimes detailed, sometimes a follow-up question, and sometimes no reply at all. Community and user tone should determine the minimum useful depth.
