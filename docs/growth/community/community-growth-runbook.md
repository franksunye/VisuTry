# VisuTry Reddit Community Growth Runbook

**Status:** Current Reddit execution contract; publishing prerequisites remain explicit  
**Owner:** Growth / Community Ops  
**Last reviewed:** 2026-11-21  
**Strategy:** `docs/strategy/analytics/gtm.md`

## Purpose

1. Help people make eyewear decisions.
2. Capture authentic customer questions and objections.
3. Create qualified awareness of VisuTry when the product and community context fit.
4. Close the loop from a useful draft to a real publication, follow-up and outcome.

Comment count is not a target by itself. Repeated research-only reports do not
establish a working distribution channel.

## Authorization and current capability

The user's 2026-11-21 request authorizes sustained useful Reddit participation
and relevant VisuTry promotion. Do not repeatedly seek the same authorization.

Current capability states are `HUMAN_PUBLISHING_AVAILABLE` and
`AUTOMATED_PUBLISHING_NOT_VERIFIED`. They describe current evidence, not an
agreed permanent human-only workflow. Verify the actual publishing method's
platform/account/community requirements before transmission. User authorization
does not establish app registration, and human review does not exempt an
agent-operated account from Reddit rules.

A logged-in session is not proof of permission for automated publishing.
Registration alone does not permit continuous product promotion. If a concrete
capability or rule prevents publication, deliver the exact target, final text
and blocker while the opportunity is current.

## Canonical locations

- Policy and community evidence: `docs/growth/community/`
- Execution entry point: `automation/community-growth/task-prompt.md`
- Daily evidence: `growth/community/daily/YYYY-MM-DD.md`
- Weekly outcome review: `growth/community/weekly/YYYY-Wxx.md`
- Customer insights: `growth/community/insights/`
- Interaction index and state: `growth/community/state/`

Read the current authorized checkout. Do not require the historical
`growth/community-ops` branch or fixed local machine path. Old state timestamps
and `ACTIVE` fields remain historical until real scheduler evidence is rechecked.

## Execution loop

1. Read recent actual publications, pending drafts, follow-ups and current rules.
2. Verify the selected session's account/auth state without extracting secrets.
3. Check relevant replies before discovering new threads.
4. Search several distinct eyewear decision intents and rule-compatible formats.
5. Read the full context and current community rules. Assess product mentions,
   links and AI content independently; no extra rule shown is not moderator approval.
6. Decide whether a contribution is useful. Choose `COMMUNITY_VALUE`,
   `TRANSPARENT_MENTION` or `DIRECT_SHARE` and the minimum helpful depth:
   `LIGHT`, `CONVERSATIONAL`, `DETAILED` or `FOLLOW_UP`.
7. Produce a complete packet: exact target, final text, relevance, disclosures,
   rule evidence/date, any link and a freshness condition. Do not use a generic
   monitoring summary when a useful concrete draft can be delivered.
8. Verify the intended publishing method's requirements, recheck context and
   submit only when those requirements are satisfied. If blocked, record the
   precise boundary and deliver the packet; do not wait indefinitely.
9. Verify actual publication through a live permalink and visible content.
   Check public visibility when the author view could conceal filtering or
   moderation; otherwise record `PUBLIC_VISIBILITY_UNVERIFIED`. Record drafts
   and submit attempts separately. Recheck removal status and replies on the
   next run; do not claim a post survives moderation from a submit response.
10. Save concise evidence, evidence-backed insights and an outcome review through
    the current authorized repository workflow. Do not automatically restore an
    old branch, create weekly PRs or fabricate scheduled-run evidence.

Keep the pending queue small and current. Expire removed, locked, answered or
stale candidates instead of mechanically recycling them. No forced daily
promotion quota or volume increase to compensate for missed runs.

## Outcome states

| State | Meaning |
| --- | --- |
| `DRAFT_READY` | Complete target-specific text is ready for review or a permitted publishing method. |
| `PUBLISHED_VERIFIED` | A live permalink and visible published text were observed. |
| `PUBLIC_VISIBILITY_UNVERIFIED` | Submission or author-visible text exists, but public availability is not verified. |
| `FOLLOW_UP_READY` | A real conversation needs a specific next reply. |
| `AUTH_REQUIRED` | The selected account session cannot be used. |
| `PUBLISHING_METHOD_NOT_VERIFIED` | Requirements for the intended publishing method are not verified. |
| `PLATFORM_RULE_BLOCKED` | The intended content or method is not permitted. |
| `RUNTIME_CONFIRMATION_REQUIRED` | The current runtime requires an unavailable action-time confirmation. |
| `NO_RELEVANT_OPPORTUNITY` | A bounded, varied search found no worthwhile candidate. |
| `EXPIRED` | Context changed; the draft must not be reused unchanged. |

Record `MANUAL`, `SCHEDULED`, `RETRY` or `UNKNOWN` truthfully. Use
`NOT_EXPOSED` for unavailable scheduler run IDs. Repository edits, old task IDs
and a separate review automation do not prove that the publishing workflow runs.

Repeated zero-publication runs require a specific correction to access,
community coverage or format. Do not confuse a relevant blocked draft with a
relevance rejection, or declare the channel unsuccessful from drafts alone.

## Writing, privacy and measurement

Match the question's tone and required detail without impersonation or invented
experience. Avoid repeated openings, generic praise and landing-page copy.
Commercial affiliation and required AI disclosure remain explicit.

Use the existing authorized session only. Never extract or commit credentials,
cookies, profiles, tokens, auth headers or private keys. Log only the public
content needed for follow-up and evidence. Respect removed/deleted content.

Review actual publications, useful replies, moderation outcomes, qualified
referrals and completed VisuTry decisions. Keep drafts and research separate
from published actions. Do not infer a causal conversion lift from sparse or
unjoinable data. Follow the GTM expand / modify / stop review discipline.

## 2026-11-21 verification checkpoint

- Live browser check observed Reddit account `u/ZISO_Frank` signed in.
- Automated app registration/permission was not verified.
- `r/glassesadvice` still displayed restrictions on advertising and AI posts.
- `r/glasses` displayed a rule to follow Reddit Rules; no additional rule was
  observed in this check.
- `r/SideProject` described project sharing and constructive feedback; its rules
  page displayed no additional rules. This is not a guarantee of moderator acceptance.
- One SideProject product-introduction draft was saved in Reddit; the UI
  confirmed `Draft saved`. Full text and the draft link are recorded in
  `growth/community/daily/2026-11-21.md`. No public submission was made.

These are dated observations, not permanent permissions or proof of a scheduler.
Recheck the account, content and rules when taking a real action.

## Historical record

The August/September Reddit + YouTube cadence, local Codex task, operational
branch and closed-unmerged PR #156 remain historical evidence. This contract
does not restart YouTube, old warm-up quotas or the fixed-branch weekly PR loop.
Preserve old logs and unique evidence without merging stale operational state.
