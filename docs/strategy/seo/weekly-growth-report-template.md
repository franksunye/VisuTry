# VisuTry Consumer Organic Growth — Weekly Scorecard Template

**Status:** Active operating template (not a standalone strategy)  
**Parent strategy:** `docs/strategy/analytics/gtm.md`  
**Week ending (Asia/Shanghai):** TBD  
**Owner / reviewer:** Growth + Product / Lead  
**Data confidence:** VERIFIED / PARTIAL / UNAVAILABLE

## 1. Evidence and time windows

- GA4 property, exported timestamp and latest complete dates:
- GSC canonical property `https://www.visutry.com/`, exported timestamp and latest complete dates:
- GSC Web / Images / Generative AI visibility report availability:
- Current complete 28d vs preceding 28d; supplementary trailing 90d:
- Exclusions: internal / TEST / Reference / bot-like; any unresolved ambiguity:
- Axiom Consumer (`visutry-traffic-pro`) query access and window, if used:
- **Do not report historical numbers as current.** Mark inaccessible sources **UNAVAILABLE** and leave actuals blank. Do not infer attribution joins across GA4/Axiom/Postgres without an identity contract.

## 2. North-star and business quality

| Metric | Current 28d | Previous 28d | Change | Evidence / quality |
| --- | ---: | ---: | ---: | --- |
| Qualified Consumer sessions | — | — | — | Defined by plausible Detector/Advisor/Try-On/Compare/Purchase continuation |
| Organic Search sessions | — | — | — | GA4 source / medium, Consumer only |
| GSC Web clicks / impressions / CTR | — | — | — | Queries, landing pages, countries, devices |
| AI Assistant referral sessions | — | — | — | Source classification; not equal to all Google AI exposure |
| GSC Generative AI impressions | — | — | — | Visibility, not traffic or conversion |
| Detector completions → next decision step | — | — | — | GA4; on-device completion is not a server event |
| Try-On starts / completions | — | — | — | Segment by source and landing |
| Compare starts / completions | — | — | — | Segment by source and landing |
| Verified paid transactions / USD revenue | — | — | — | Stripe/PostgreSQL is payment truth |
| USD revenue / 1,000 qualified sessions | — | — | — | No revenue claim from GA key events alone |

**10× baseline:** approximately 1,824 monthly sessions on 2026-08-03 (historical directional baseline). **Goal:** 15,000–20,000 qualified sessions/month. State the actual current ratio only when source/date/filters are verified.

## 3. Page and search opportunity

| Page / query cluster | GSC impressions / CTR / rank | Organic landing sessions | Decision continuation / paid result | Decision |
| --- | --- | --- | --- | --- |
| Existing winner #1 | — | — | — | refresh / hold / expand |
| Existing winner #2 | — | — | — | refresh / hold / expand |

- Indexing: indexed priority routes, crawled-not-indexed, current 404 patterns; canonical, hreflang, sitemap and robots results:
- Google Images and on-page visual contribution:
- AI search answerability/referrals (separate citation/discovery checks from genuine sessions):
- Country, device and locale quality differences:
- Performance/CPU guardrail for any changed public route:

## 4. Weekly decision

- Highest-leverage existing-page SEO improvement (**at most 1–2**):
- Product continuation / revenue-quality improvement:
- GEO / external authority experiment, if justified by evidence:
- Explicit **SCALE / MODIFY / STOP** decision, owner and review date:
- Known blockers / unavailable reporting inputs:

## 5. Monthly governance checkpoint (on the last review of each month)

- Reconcile completed/backlogged tasks; archive dated snapshots and stale claims without deleting raw GSC/GA evidence.
- Continue Visual SEO/content production only where demand and decision value justify it.
- Preserve Consumer and Merchant attribution boundaries; do not synthesize search or Agent sessions.
