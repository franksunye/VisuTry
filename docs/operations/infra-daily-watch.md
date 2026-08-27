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

## 2026-08-27

### Codex Morning Inspection — 11:00

**Window:** GA4 complete prior day **2026-08-26 (+08:00)**; Vercel latest surfaced rolling 12h **2026-08-26 22:20–2026-08-27 10:20 (+08:00)**; Cloudflare previous 24h ending this morning. No prior dated watch entry or ChatGPT Afternoon Review was present.

**Traffic**
- GA Users: **325** (**+22.6%** vs GA4 comparison period).
- GA Sessions: **354**.
- GA Views: **913**.
- Organic / AI referral note: **154 Organic Search sessions** and **44 AI Assistant sessions**; the prior-day session/view deltas were not surfaced, so no unsupported percentage is inferred.

**Vercel**
- ISR Read Units: **14,233 RU** for the project. Dashboard **Count** and **Bytes** breakdowns were not exposed; this is not treated as either of those metrics.
- Important ISR route families: pilot families are `/{locale}/glasses-guide/*`, `/{locale}/style/*`, and `/{locale}/sunglasses-for/*`; route-level ISR attribution was unavailable.
- Fast Origin Transfer: **132.18 MB** total (**7.26 MB incoming**, **124.92 MB outgoing**); route attribution was unavailable.
- Other material usage: production runtime status breakdown showed **605× 200**, **93× 405**, **7× 404**, **6× 401**, and **no 5xx** in the queried 12h window. Latest production deployment is **READY**, main SHA `941a69a`; no failed deployment was surfaced.

**Cloudflare**
- Relevant cache experiment: D1 HTML cache shield pilot unchanged; Smart Tiered Cache is **Active** with **Smart Tiered Cache** selected.
- Cache hit / miss evidence: zone-wide previous-24h HTTP Traffic showed **35.53k total**, **12.61k cached**, **22.92k uncached** (**35.5% cached**); this is not a pilot-route or edge-only ratio.
- Tiered Cache: enabled; no configuration change made during inspection.
- Origin-bound evidence: Cloudflare did not expose a pilot-route origin counterfactual or origin-request reduction metric in the readable view.

**Axiom**
- 4xx/5xx anomalies: Axiom’s current query view did not expose HTTP status fields; the Vercel 12h cross-check showed **no 5xx**, plus **7× 404**, **6× 401**, and **93× 405**.
- New production errors: Axiom `Last 1 day` query returned **81** error/warn events (**80,784** scanned): **6** `Submit API error` + **6** `Analysis failed` (face analysis), **32** face-shape warnings, **14** slow/aborted auth-session warnings, **6** Chat API network warnings, **3** Store try-on warnings, and **1** transient provider warning. No `ChunkLoadError`, hydration, or RSC events. “New vs prior day” cannot be proven without a prior watch entry, but the face-analysis cluster is the material current regression signal; Store-category warnings are outside normal Consumer scope and not material here.

**Change vs prior comparable window**
- Traffic: users materially higher at **+22.6%** on GA4’s surfaced comparison; sessions/views lack a surfaced prior-day delta.
- ISR: **Inconclusive** — **14.233k project RU / rolling 12h** cannot be compared directly with the **2.52k pilot-family RU / 12h** baseline without route attribution.
- FOT: **132.18 MB / rolling 12h**; no comparable pre-change route-level value was exposed.
- Cache efficiency: **35.5% zone-wide cached requests**, not comparable with the prior **1.53% edge-only pilot sample**.

**Current interpretation**
1. Traffic **did materially increase** on the available GA4 users comparison, while session/view change remains unquantified.
2. Vercel resource efficiency and Cloudflare origin reduction are **not proven** at the pilot-route level.
3. The Smart Tiered Cache experiment **remains inconclusive**; keep it under observation until a route-attributed post-change 12h window is available. Axiom shows a current face-analysis error cluster and recurring auth/provider warnings, but no frontend chunk/hydration/RSC regression or surfaced 5xx spike.

**Question for afternoon review**
- Can we obtain pilot-route Cloudflare HIT/MISS plus Vercel **ISR Read Units** (not Count or Bytes) for a complete post-Tiered 12h window, and does the combined pilot RU fall below **2.52k / 12h**?

**Production changes made during inspection:** NONE

### ChatGPT Afternoon Review

**Verdict:** **INVESTIGATE** — Cloudflare pilot-path edge cache data is now obtainable from the existing custom Dashboard Chart, but Smart Tiered Cache's origin-shielding effect remains unproven.

**What the evidence means**
1. In the Cloudflare `HTTP Requests` chart, using `Path contains` plus `Cache status` grouping over the UI's **Last 24 hours**, `/glasses-guide/` returned **597** requests (**Hit 78**, **Revalidated 45**, **Miss 315**, **Expired 122**, **Dynamic 37**); `/style/` returned **405** (**Hit 43**, **Miss 89**, **Dynamic 257**, **None 8**, **Expired 8**); `/sunglasses-for/` returned **114** (**Hit 6**, **Revalidated 1**, **Miss 86**, **Expired 13**, **Dynamic 8**).
2. The combined displayed pilot total is **1,116**; direct `Hit` is **127 (11.4%)**, and `Hit + Revalidated` is **173 (15.5%)**. These are edge cache-status categories, not origin-request or Tiered Cache shield counters.
3. This corrects the earlier feasibility assumption: the custom Dashboard Chart can provide route-family detail even though the standard HTTP Traffic page and paid Cache Analytics/Log Explorer do not. Vercel remains **14,233 project ISR RU / rolling 12h**, without pilot-route attribution or a like-for-like trend.

**Decision**
- **HOLD** the Smart Tiered Cache experiment; do not call it a success or failure from edge HIT alone.

**Next Codex inspection focus**
1. Repeat these three Cloudflare path filters for a fixed complete 12h window.
2. Compare the same window with pilot-attributed Vercel ISR Read Units if Vercel exposes them.
3. Track whether MISS/Expired volumes fall and whether face-analysis errors persist.

**Implementation guidance**
- No production change. The filters were temporary and canceled without saving.

**Production changes made by review:** NONE
