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

### 2026-08-28 — Move from permanent warm-up to balanced promotion

- The current strategy has become too conservative. Reddit and YouTube are not only research surfaces; they are intended distribution channels and must eventually create qualified awareness and traffic for VisuTry.
- Do not preserve `0 VisuTry mentions / 0 links` as an implicit success state indefinitely. Trust and usefulness remain primary, but permanent non-promotion fails the growth objective.
- The interaction policy has been updated to use three modes: `COMMUNITY_VALUE`, `TRANSPARENT_MENTION`, and `DIRECT_SHARE`.
- On active operating days, deliberately search for high-intent promotion-fit opportunities such as tool requests, face-shape help, virtual try-on/comparison requests, online frame-decision questions, and recommendation-tool questions. Do not search only generic or already-saturated threads.
- When VisuTry directly solves the user's request and current community rules allow it, actively consider a transparent product mention. Do not reject a mention merely because a no-product answer is possible.
- Affiliation disclosure is mandatory. Never recreate the legacy pattern of presenting VisuTry as though it were an unrelated third-party tool.
- Direct links remain stricter than mentions and should be used mainly where the user explicitly wants a resource/tool and rules permit it.
- Directional multi-week balance after warm-up: approximately 70-85% community-value interactions, 10-20% transparent VisuTry mentions when genuinely relevant, and 5-10% direct shares at most. These are not daily quotas and must never override community rules or quality judgment.
- Weekly review must explicitly diagnose `UNDER_PROMOTION`, `BALANCED`, or `OVER_PROMOTION`. Repeated weeks at zero mentions despite qualified opportunities should be treated as `UNDER_PROMOTION`.
- Original Reddit posts may be used strategically up to the existing weekly ceiling in communities that permit educational maker posts, project feedback, tools, startups, or self-promotion. Do not use stealth marketing.
- Maintain the human-like interaction rule: sometimes one sentence, sometimes a short discussion, sometimes a careful explanation, sometimes a transparent product mention, and sometimes no reply.

### 2026-08-27 — Evidence model and legacy-promotion classification

- Stop creating chained self-evidence commits merely to record the SHA of the commit that contains the daily log. The repository branch HEAD is already authoritative remote evidence. Prefer one primary ops commit per run. If a post-push evidence field is retained, it may reference the primary ops commit without requiring another state-only or timestamp-only commit; do not create a new commit solely because recording the previous commit SHA changed a file.
- Treat `git_final_evidence` as operational evidence, not as a requirement for the log to contain the eventual branch HEAD. Reviewers may verify the actual remote branch HEAD independently.
- The historical YouTube VisuTry comment currently indexed as `tone: PROMOTIONAL` must also be treated internally as a legacy promotion-risk example because affiliation was not transparently disclosed. Add an explicit non-sensitive classification such as `legacy_promotion_risk: true` and `affiliation_disclosed: false` (or equivalent schema-compatible fields) on a normal future state update. Do not delete or edit the historical public comment solely for this bookkeeping change.
- Never use that legacy YouTube comment as a wording, cadence, or disclosure template. Future VisuTry mentions must remain transparent about affiliation and independently useful even without the product mention.

### 2026-08-26 — GitHub-mediated closed loop

- Codex and reviewer must communicate operational changes through GitHub, not through manual copy/paste by the user.
- Daily Codex execution remains fully automated on its existing schedule.
- Reviewer inspects GitHub independently after execution.
- When review identifies a needed change, the reviewer updates the canonical repository guidance directly.
- Codex must consume those updates on its next run.
- Public interaction style remains adaptive and human-like: sometimes light, sometimes conversational, sometimes detailed, sometimes a follow-up question, and sometimes no reply at all. Community and user tone should determine the minimum useful depth.
