# AI Provider Resilience — G1 Mock and Fixture Readiness

**Date:** 2026-10-22

**Status:** LOCAL MOCKS AND SYNTHETIC MEDIA FIXTURES; NO CANDIDATE-PROVIDER CALLS OR PHOTO TRANSFERS

**Tracking:** [G1 #434](https://github.com/franksunye/VisuTry/issues/434) · [G1 vendor protocol screen](./ai-provider-resilience-g1-vendor-screen-2026-10-22.md) · [Draft PR #432](https://github.com/franksunye/VisuTry/pull/432)
**Decision boundary:** This work prepares evidence for a later limited API-test decision. The proposed spend and top-up ceilings below remain **unapproved**. No vendor registration, recharge, API dispatch, secret/config change, schema migration, production routing change, deploy or merge is authorized.

## 1. Local test-media inventory

- `tests/` contains mock request bytes and non-personal catalog/markup fixtures, but no approved face-photo + exact frame-reference pairs suitable for external model evaluation.
- Existing tests use tiny placeholder buffers (for example `tests/utils/test-helpers.js`); these can validate request handling, not eyewear fidelity.
- Public marketing/catalog images are not treated as consented model-evaluation fixtures. No Production image export was searched, copied or used.
- The eight cases in [`tests/fixtures/ai-provider-resilience/try-on-cases.v1.json`](../../tests/fixtures/ai-provider-resilience/try-on-cases.v1.json) now have local synthetic image assets: eight fictional adult face portraits and eight synthetic frame references in `tests/fixtures/ai-provider-resilience/media/`. The face crops are 384×512; frame crops are 443–444px square. The source contact sheets were cropped and re-encoded as JPEGs, removing source metadata. The manifest records each asset and its test-only design target.
- The images are **local-only**. The manifest keeps `externalProviderTransferApproved: false`; no image bytes have been sent to any candidate. The face-shape design targets are not clinical or landmark ground truth. Before Face Analysis parity scoring, keep any MediaPipe `landmark-v1` input/expected values separate and verify those vectors from the local pipeline.
- Frame references are synthetic, so no catalog-photo rights are needed. Do not replace these with actual user media unless a separately approved, consented fixture is deliberately added.

## 2. Mock-only findings

All new scenarios replace persistence, provider polling/submission, image fetch and blob operations with Jest mocks. They do not read credentials or contact external services.

| Scenario | Mock result on current code | Safety meaning |
| --- | --- | --- |
| Two Consumer pollers observe the same Grsai timeout (`tests/unit/lib/tryon-service.test.ts`) | Both calls read the same `retryCount: 0`, both pass the timeout branch and invoke `submitAsyncTask`; the characterization expects **two retries for one logical task**. | Confirmed control-flow race. GenerationAttempt telemetry is not an atomic dispatch claim. One resulting task ID can overwrite the other in task metadata. A failover or retry must remain disabled until a fenced claim and durable unknown-outcome handling exist. |
| Ordinary Consumer submit is replayed with the same `clientSubmissionId` (`tests/unit/lib/tryon-service.test.ts`) | The route passes the ID but omits `enforceIdempotency`. With the database unique constraint represented, the second create rejects with `P2002`; the service does not read/reuse the winner. Only the first request dispatches. | This is a replay/error-recovery gap, not evidence of a second provider charge when the same ID is present. A repeated request without an ID can still create a distinct task. Return the original task on a legitimate same-key replay before enabling any fallback. |
| Concurrent Face Analysis replay with the same `clientSubmissionId` (`tests/unit/api/face-analysis-submit-critical.test.ts`) | The route invokes the analysis service twice and deducts quota twice. The ID is passed as metadata; `FaceAnalysisTask` has no unique request key or reuse lookup. | Confirmed duplicate-cost and quota risk for Face Analysis. This lane needs its own atomic idempotency claim before any second vision provider is enabled. |
| Provider poll returns HTTP 429 / 503 (`tests/unit/lib/grsai.test.ts`, `tests/unit/lib/tryon-service.test.ts`) | `pollTaskResult` normalizes non-2xx HTTP responses to `failed`; the Consumer classifier does not recognize `Polling failed: 429/503` as transient and marks the logical task failed. | Temporary poll transport errors can appear terminal. Provider status polling must be retried within bounded policy; it must never launch a second generation merely because a poll failed. |
| Initial Try-On submit returns a timeout without an external task ID (`tests/unit/lib/tryon-service.test.ts`) | Current code records the failed submit and does not call a second provider. It does not persist an explicit durable `UNKNOWN` state. | Current behavior avoids blind fallback, but a user retry can create a new logical task while provider acceptance/billing remains unknown. Preserve the no-fallback invariant and add reconciliation/idempotency before exposing a candidate. |
| Face Analysis request timeout (`tests/unit/lib/grsai-face-analysis.test.ts`) | The mock aborts after the current 45-second attempt cap; the service returns timeout and performs **one** request because acceptance may be ambiguous. | Preserve this no-blind-resubmit behavior. Current whole chat budget is 55s vs the route's 60s maximum, leaving only 5s nominal headroom for all other route work; pre/post-call storage and DB operations consume part of it. |
| Consumer quota and Store isolation | Existing Consumer settlement and Store dispatch/persistence lease suites remain the regression boundary. | Any future provider attempt must stay under the same logical task and preserve once-only Consumer/Store settlement and tenant separation. |

These tests intentionally characterize unsafe/current behavior where marked. They do **not** pass the dispatch-safety gate. When a dispatch fence is implemented in a separately authorized code change, invert the concurrent test to require exactly one provider request and add an ambiguous-submit recovery test before enabling any fallback.

## 3. Required dispatch and unknown-outcome guard before billable fallback

The current schema already contains `TryOnTask.dispatchLeaseOwner`, `dispatchLeaseUntil`, and monotonic `dispatchVersion`, used by Store dispatch; the mock run confirms Consumer timeout retries do not use an equivalent claim. A future Consumer/provider-router change should prove all of the following before a billable candidate is reachable:

1. Atomically acquire a task-scoped compare-and-set claim before contacting any provider. A losing poller returns the current task state without dispatching.
2. Persist the attempt as `SUBMITTING` before the outbound request and correlate it to the logical task, attempt number and provider request/idempotency key where supported.
3. If the request times out, the connection closes, or a success response cannot be durably recorded, persist an `UNKNOWN` outcome. Never dispatch the fallback or retry the same generation while acceptance/billing is unknown.
4. Resolve an unknown result only through a documented provider task lookup/idempotency mechanism or an explicit operator decision. An expiring lease alone is not permission to spend again.
5. Persist a provider task ID before releasing the claim; fence stale pollers from overwriting a newer attempt. Keep one logical task, one result-persistence owner, and once-only quota settlement.
6. Treat only a response with documented non-acceptance and non-billing semantics as a safe pre-dispatch fallback condition. HTTP status alone is insufficient; inspect the vendor's response body and task state.
7. Cover redaction and retention for face URLs/data URIs, callbacks, task logs and result media. Never expose the source face photo or provider URL through a public result path.

This is a **design requirement**, not an implemented safeguard. Current code remains Grsai-primary and has no automatic cross-vendor Try-On fallback.

## 4. Blind scoring and separate Face Analysis parity

For each exact SKU, run the eight cases once with synthetic/consented test inputs after approval. Store provider results under randomized labels so the reviewer does not see the vendor name while scoring.

Try-On score per pair:

- usable full four-image session outcome and whether any fixture failed;
- identity and face-geometry preservation;
- exact reference-frame silhouette, SKU, material and color;
- bridge, lens placement and temple fit;
- visible defects, reflection handling and unintended facial edits;
- completion latency, retries, timeout/unknown state and charge for every attempt;
- cost per **usable** output, including failed or retried calls;
- private input/output handling, retention and verified deletion.

Face Analysis is an independent G1-B lane. The first desk-screen candidate is **Alibaba Cloud Model Studio direct API, `qwen3.8-flash`**. Its official model page lists image input, text output and structured outputs; the published International-scope rates are US$0.15 per million input tokens and US$0.47 per million output tokens. Actual image-token usage depends on image dimensions and must be read from the response/account meter. This is a protocol and cost candidate, not a quality or production endorsement. Sources: [model capabilities and price](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/qwen3-8-flash), [image input API](https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions), [structured output support](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output).

Alibaba's current [Model Studio Data Retention Policy](https://www.alibabacloud.com/help/en/model-studio/data-retention-policy) says standard prompts and responses are retained for up to 30 days. ZDR is available only to eligible enterprise customers after an account-manager assessment; Qwen-Flash models from `qwen3.8-flash` are in the listed ZDR-supported series for direct Alibaba inference. A ZDR workspace does not itself protect unsupported models or excluded stateful paths; operational/billing metadata and moderation exceptions are outside the ZDR promise. Before any real-user photo transfer, confirm the target account, region, endpoint, actual ZDR status and stateless request path. External transfer of the synthetic fixtures still needs the finite API-test approval and a recorded endpoint/retention review. Production user-photo use remains **NO-GO** until the organization confirms the applicable terms and controls.

Compare its vision/chat output against the VisuTry contract in `src/types/face-analysis.ts` and geometry contract in `src/types/face-analysis.ts` / `src/lib/face-landmark-metrics.ts`: valid canonical `faceShape`, bounded confidence, required summary/features/recommendations, and preservation of `landmark-v1` status, source, ratios, quality score and warnings. Reject malformed JSON, invented geometry, schema drift or an output that silently loses measured MediaPipe values. Score quota-once behavior, same-key replay, 55s/60s budget, bounded error UX and provider request idempotency separately. No image-generation candidate is eligible for this lane by implication.

## 5. Proposed billable smoke decision brief — **not approved**

The public-document screen in the linked vendor report supports these exact initial Try-On SKU names; it does not prove account price, private-photo handling or image quality:

| Candidate | Proposed order | Proposed per-provider hard cap | Current blocker |
| --- | ---: | ---: | --- |
| Kie.ai `nano-banana-2-lite` | 1 | US$5 actual API consumption | Hosted/private photo transfer, retention/legal terms, exact account price and minimum recharge still require approval and confirmation. |
| CometAPI — exact model/SKU **must be named before purchase** | 2, conditional | US$5 actual API consumption | Model alias, final per-image price, privacy/retention and upstream independence remain unresolved. Do not register/recharge or test until these are documented. |
| OpenRouter `black-forest-labs/flux.2-pro` | 3 | US$5 actual API consumption | Confirm exact live image-edit endpoint, reference-image transport, routed provider and privacy settings before the run. Published price is illustrative only. |
| Alibaba Cloud Model Studio `qwen3.8-flash` — Face Analysis only | Separate G1-B lane | US$3 actual API consumption | Direct-provider route and model are named; confirm region/account rate, token metering, ZDR eligibility and enabled state, endpoint, retention terms and minimum recharge. No production face-photo use without privacy clearance. |

**Aggregate proposal:** Try-On remains capped at **US$15 actual API consumption / US$25 cash top-ups**; Face Analysis has a separate proposed **US$3 actual consumption / US$5 cash top-up** cap. If both lanes are approved, their combined ceiling is **US$18 actual API consumption / US$30 total cash top-ups**. The candidate-specific actual caps and lane totals stop the run, whichever is reached first. If any provider minimum deposit would exceed the remaining total top-up ceiling, stop before payment and request a new decision. These are caps to approve or revise, not authorization to spend.

Sample and stop rules to approve before the first call:

- Eight paired cases (`G1-TRYON-01` … `G1-TRYON-08`) per tested exact SKU; one planned output per pair, no unbounded automatic retry. Report every attempt and its charge.
- Face Analysis: at most one `qwen3.8-flash` call per synthetic face portrait (eight calls total), no retry after ambiguous timeout, and stop at US$3. Record response token usage and the selected region. The image-generation fixtures remain separate from the geometry ground-truth set.
- Proposed blind quality bar: at least **7/8 usable** outputs per candidate, with zero critical face-identity, exact-frame, user-photo privacy or duplicate/unknown-charge failures. A candidate failing any hard condition is a no-go regardless of price.
- Enforce each provider/lane cap and the US$15 Try-On / US$3 Face Analysis actual-consumption ceilings at dispatch/account level where possible; stop immediately on billing ambiguity, unpriced SKU, unexpected request count, or top-up threshold. Never use actual consumer photos.
- Report median/p95 latency, raw success and usable rates, charge per attempt and per usable image, provider/upstream path, error semantics, retries, deletion evidence and privacy exceptions. Eight fixtures are a compatibility screen, not an uptime/SLO claim.

## 6. Gate result

- **G1 no-spend desk + mock work:** documented. Mock tests confirm a current duplicate-retry risk and the other cases above; they do not certify dispatch safety.
- **Real-image transfer / billable calls:** not approved and not performed.
- **Production failover / provider code:** not implemented or enabled.
- **Next Lead decision:** approve or revise the Try-On caps ($15 actual / $25 top-ups), the separate Face Analysis cap ($3 actual / $5 top-ups), or both, plus the hard-stop/quality criteria. No funds are spent until approved.
