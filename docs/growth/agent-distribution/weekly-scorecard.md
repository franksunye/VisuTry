# Agent Distribution Weekly Scorecard

**Week ending:** 2026-08-25  
**Observation window:** 2026-08-11T02:47Z → 2026-08-25T02:47Z (rolling 14 days)
**Status:** Current production evidence update; no synthetic traffic is counted.

The current PR head was deployed to a Vercel preview equivalent at
`https://visutry-dgsjbhy18-sunye.vercel.app` (`dpl_DFhwoDZRHp2YPKNAyj3S8V1QrEHB`).
The production domain was also checked read-only. Reference Store/Campaign
pages remain intentionally `noindex, follow`.

## Gate A evidence

| Metric | Current value | Evidence status |
| --- | --- | --- |
| Genuine Agent sessions | 0 observed in eligible Store/Campaign sessions; Consumer stream not queryable | Read-only Neon aggregate found no `aiAgentSource` in the 14-day Store/Campaign-eligible set. Axiom query returned `token does not have access to resource: query with action: read`; Vercel retention does not cover 14 days. |
| ChatGPT / OpenAI | 0 observed in eligible Store/Campaign sessions | Consumer stream remains unobserved until a query-capable Axiom credential is supplied. |
| Perplexity | 0 observed in eligible Store/Campaign sessions | Same boundary as above. |
| Gemini | 0 observed in eligible Store/Campaign sessions | Same boundary as above. |
| Copilot | 0 observed in eligible Store/Campaign sessions | Same boundary as above. |
| Claude | 0 observed in eligible Store/Campaign sessions | Same boundary as above. |
| Sessions with a meaningful Store/Campaign or standalone Consumer action | 0 Agent Store/Campaign sessions; Consumer count unavailable | Store/Campaign actions are durable in MerchantEvent/MerchantIntent; Consumer actions are separately reported and not joined. |
| Excluded Reference/Internal/unassigned sessions | 77 Reference, 14 Internal, 16 Live/Luna without an Experience | These are excluded from genuine Agent → Store/Campaign proof; the current eligible live Store/Campaign count is 0. |
| L1 Discovery | NOT PROVEN | No genuine Agent referral is observed in the eligible Store/Campaign report, and the Consumer report cannot currently be queried. |
| L2 Repeatability | NOT PROVEN | Requires the rolling-window report. |
| L3 Quality | NOT PROVEN | Requires at least 3 qualifying referred sessions and the hard threshold. |

## Channel baseline

| Channel | Current evidence | Current action |
| --- | --- | --- |
| Organic | Historical Search Console export through 2026-07-24: 404 clicks / 8,158 impressions for the full 28-day property; current window unavailable. | Re-check current Search Console data before changing page architecture. |
| Agent | Source parsing, Merchant Store/Campaign reporting, and the read-only report command are implemented; current Consumer query access is blocked by an ingest-only Axiom credential. | Provide a query-capable Axiom token, run the explicit 14-day command, and do not synthesize traffic. |
| Reddit | Public search found no VisuTry Reddit result in the checked queries; no current distribution action or referral evidence. | No posting in this pass. |
| YouTube | Public search found no VisuTry YouTube result in the checked query; no current distribution action or referral evidence. | No publishing in this pass. |
| Visual SEO | Existing B01–B06 assets are integrated with page semantics and internal links; current image-search performance is unavailable. | Preserve existing intent-linked assets; no page-count expansion. |

## Public discovery / answerability diagnostic

This was a public web-search diagnostic, not a production referral and not a
self-prompted assistant result. No authenticated ChatGPT/Perplexity/Gemini/
Copilot/Claude client session was available in this environment.

| Query / interface | VisuTry result | Interpretation |
| --- | --- | --- |
| `site:visutry.com "what glasses suit a smaller face"` · public search | `/en/face-analysis`, `/en/blog/ai-face-analysis-for-glasses-guide`, and face-shape guides | Consumer entity and answerability are present; links lead to Detector/Advisor/Try-On/Compare, not a merchant Experience. |
| `site:visutry.com "glasses for petite faces"` · public search | No reliable VisuTry Store/Campaign result | The petite Reference Campaign is correctly noindex; a public search result cannot be expected under current policy. |
| `site:visutry.com "statement eyeglasses"` · public search | No reliable VisuTry Campaign result | The AKILA Reference Campaign is correctly noindex; no indexability defect was found. |
| `site:reddit.com VisuTry eyewear` and `site:youtube.com VisuTry eyewear` · public search | No reliable VisuTry result; unrelated eyewear results returned | External distribution/reference coverage is not proven. No posting or publishing was performed. |

The strongest legitimate public handoff is the indexable `/en/discover` page,
which links to Reference Store/Campaign routes with internal source context.
Those Reference routes remain `noindex, follow`, and the dynamic Experience
sitemap is empty as intended. The missing signal is external discovery and
eventual eligible live Experience evidence, not permission to index Reference
fixtures.

## Measurement contract

The production query is now implemented as
`npm run report:agent-distribution -- --from <ISO> --to <ISO> --json`. It reads
the existing `visutry-logs` / Axiom stream for `consumer_funnel_event`, excludes
`traffic_class = test`, groups by the server-derived source class and agent
source, counts distinct anonymous `consumer_funnel_id` sessions and supported
decision actions, and separately reads the durable MerchantSession /
MerchantEvent / MerchantIntent Store-Campaign report. It must not infer a join
to GA4 or MerchantSession where no shared identifier exists. The current
credential has ingest permission but not Axiom query permission, so the
Consumer side is implementation-ready but not currently observable.

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

**Gate A:** PARTIAL. Technical classification and the separate durable
Store/Campaign report are implemented; report access for the Consumer stream
and genuine Agent source → action evidence remain incomplete.
**Outreach:** GATED under the active Hard Distribution Gate.  
**Next observation required:** provision a query-capable Axiom credential, run
the rolling 14-day command, and record only genuine non-test traffic.
