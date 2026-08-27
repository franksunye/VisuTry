# VisuTry Infrastructure Daily Watch

**Status:** Active  
**Scope:** Consumer production infrastructure and traffic efficiency  
**Cadence:** Daily  

## Purpose

Create one lightweight, persistent operating log for daily production-resource review without creating a new document every day.

The loop is:

1. **11:00 — Desktop Codex** uses the already-authenticated local Chrome profile to inspect production dashboards and writes the morning evidence into this file.
2. **Afternoon — ChatGPT review** reads the morning entry from GitHub, compares it with recent history, and appends a concise decision / next-step section to this same file.
3. The next morning, Codex reads the latest ChatGPT guidance before starting its inspection.

This file is the canonical handoff between the local Codex inspection and the afternoon ChatGPT review.

## Operating boundaries

Primary scope:

- Consumer traffic and acquisition
- Vercel ISR / resource usage
- Cloudflare cache / cache status / Tiered Cache
- GA4 traffic and acquisition quality
- Axiom production errors / regressions
- Vercel deployment / runtime anomalies when relevant
- Cloudflare security or bot activity only when it materially affects origin/resource usage

B2B Store / Campaign is not part of the daily optimization scope until formally launched. Record it only if it unexpectedly represents a material share of production resource usage or causes an incident.

### Safety

The daily inspection is **read-only by default**.

Do not change production configuration, code, DNS, WAF, Cache Rules, Vercel settings, or deployment state as part of this routine.

If evidence suggests a change is needed, record the recommendation and wait for an explicit implementation decision.

Never commit screenshots containing private account information, session tokens, cookies, API keys, or other secrets.

## Morning Codex checklist

Before inspecting dashboards, read the most recent `ChatGPT Afternoon Review` section in this file.

Use authenticated local Chrome to inspect, where available:

- Vercel Observability / Usage
- Cloudflare Analytics / Cache / Tiered Cache
- GA4
- Axiom logs

Focus on trend and change, not exhaustive dashboard capture.

### Minimum daily metrics

Record the most useful available values for the latest complete comparable window:

- GA users / sessions / views
- Organic / AI referral direction if materially changed
- Vercel ISR Read Units, with important route families when available
- Vercel Fast Origin Transfer daily trend when visible
- Cloudflare cache status / hit ratio for any active cache experiment
- Current Tiered Cache state if relevant
- Axiom 4xx/5xx / production error anomalies
- Current production deployment SHA only when it materially affects interpretation

### Morning decision questions

Answer:

1. Did traffic materially change?
2. Did resource efficiency materially change?
3. Did any active experiment improve or regress the target metric?
4. Is there a production error/regression that changes priority?
5. What is the single most important question for the afternoon review?

## Daily entry format

Append one new dated section. Keep entries concise.

```markdown
## YYYY-MM-DD

### Codex Morning Inspection — 11:00

**Window:**

**Traffic**
- GA Users:
- GA Sessions:
- GA Views:
- Organic / AI referral note:

**Vercel**
- ISR Read Units:
- Important ISR route families:
- Fast Origin Transfer:
- Other material usage:

**Cloudflare**
- Relevant cache experiment:
- Cache hit / miss evidence:
- Tiered Cache:
- Origin-bound evidence:

**Axiom**
- 4xx/5xx anomalies:
- New production errors:

**Change vs prior comparable window**
- Traffic:
- ISR:
- FOT:
- Cache efficiency:

**Current interpretation**
1.
2.
3.

**Question for afternoon review**
-

**Production changes made during inspection:** NONE

### ChatGPT Afternoon Review

**Verdict:**

**What the evidence means**
1.
2.
3.

**Decision**
- CONTINUE / HOLD / INVESTIGATE / PREPARE CHANGE

**Next Codex inspection focus**
1.
2.
3.

**Implementation guidance**
- None unless explicitly approved.

**Production changes made by review:** NONE
```

## Current experiment context

As of 2026-08-26, the active infrastructure experiment is the D1 Cloudflare HTML Cache Shield for three Consumer SEO route families:

- `/{locale}/glasses-guide/*`
- `/{locale}/style/*`
- `/{locale}/sunglasses-for/*`

The HTML cache safety gates passed, including authenticated bypass and real RSC / Flight bypass.

Observed Edge-only cache reuse was low: approximately **1.53% combined HIT ratio** in a 12-hour sample, so Smart Tiered Cache was enabled on 2026-08-26 at approximately **14:55 +08:00** while keeping the existing D1 rule and 2-hour Edge TTL unchanged.

The key economic metric is whether the three pilot route families' Vercel ISR Read Units materially decline after a complete post-change window.

Reference pre-Tiered combined baseline for the three families: approximately **2.52k ISR RU / 12h**.

## Review discipline

- Compare like-for-like windows whenever possible.
- Do not interpret partial current-day values as complete-day values.
- Distinguish `Count`, `Units`, and `Bytes` in Vercel ISR Observability.
- Do not infer route-level FOT attribution when Vercel does not expose it.
- Prefer measured production evidence over code-only hypotheses.
- Change one infrastructure variable at a time when running experiments.
- Do not expand a successful-looking experiment until both safety and economic gates pass.
