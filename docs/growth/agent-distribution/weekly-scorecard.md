# Agent Distribution Weekly Scorecard

**Week ending:** 2026-08-25  
**Observation window:** 2026-08-12 → 2026-08-25 (rolling 14 days)  
**Status:** Evidence baseline; no production deployment or synthetic traffic is
counted in this scorecard.

## Gate A evidence

| Metric | Current value | Evidence status |
| --- | --- | --- |
| Genuine Agent sessions | UNAVAILABLE | No authenticated current 14-day production report was available. |
| ChatGPT / OpenAI | UNAVAILABLE | Not proven in the current window. |
| Perplexity | UNAVAILABLE | Not proven in the current window. |
| Gemini | UNAVAILABLE | Not proven in the current window. |
| Copilot | UNAVAILABLE | Not proven in the current window. |
| Claude | UNAVAILABLE | Not proven in the current window. |
| Sessions with a meaningful Consumer action | UNAVAILABLE | The new first-party stream is not deployed/queried for this window. |
| Excluded test/internal sessions | UNAVAILABLE | Server-side test-session classification is implemented; no current report was run. |
| L1 Discovery | NOT PROVEN | Requires genuine production Agent referral evidence. |
| L2 Repeatability | NOT PROVEN | Requires the rolling-window report. |
| L3 Quality | NOT PROVEN | Requires at least 3 qualifying referred sessions and the hard threshold. |

## Channel baseline

| Channel | Current evidence | Current action |
| --- | --- | --- |
| Organic | Historical Search Console export through 2026-07-24: 404 clicks / 8,158 impressions for the full 28-day property; current window unavailable. | Re-check current Search Console data before changing page architecture. |
| Agent | Source parsing and the privacy-safe Consumer event contract are implemented; genuine production counts are unavailable. | Deploy and query the first-party event stream; do not synthesize traffic. |
| Reddit | Historical warm-up record only; no current distribution action or traffic evidence. | No posting in this pass. |
| YouTube | Existing research/planning only; no current distribution action or traffic evidence. | No publishing in this pass. |
| Visual SEO | B01–B06 assets are integrated with page semantics and internal links; current image-search performance is unavailable. | Preserve existing intent-linked assets; no page-count expansion. |

## Measurement contract

The production query must use the existing visutry-logs / Vercel log stream and
filter message = consumer_funnel_event. It should exclude
traffic_class = test, group by acquisition_source (and referrer_host where
present), use the server-derived source_class and agent_source fields, count
distinct consumer_funnel_id sessions, and count sessions with at least one
supported action event. The report must retain source, session, action, and
date-range evidence; it must not infer a join to GA4 or MerchantSession where
no shared identifier exists.

## Historical context (not current Gate evidence)

- The 2026-07-27 Search Console analysis covers 2026-06-27 → 2026-07-24 and
  reported 404 clicks / 8,158 impressions. Its strongest visible query cluster
  was “which glasses suit my face ai”; it is not a current rolling-14-day
  result.
- The 2026-08-15 analytics note reported a historical AI Assistant segment for
  2026-08-08 → 2026-08-14, but its separate ChatGPT comparison dimensions are
  inconsistent with that segment. It is retained as historical context only
  and cannot satisfy L1/L2/L3.

## Weekly decision

**Gate A:** PARTIAL. Technical instrumentation is test-covered; current
production source → Consumer-action evidence is not available.  
**Outreach:** GATED under the active Hard Distribution Gate.  
**Next observation required:** deploy the current branch, run the rolling
14-day query, and record only genuine non-test traffic.
