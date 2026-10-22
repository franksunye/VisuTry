# AI Provider Resilience v1 — G0 Static Audit & G1 Decision Brief

**Date:** 2026-10-22  
**Status:** G0 PARTIAL — STATIC CODE / PRIMARY DOCS REVIEWED; PRODUCTION EVIDENCE OPEN  
**Tracking:** [Project #430](https://github.com/franksunye/VisuTry/issues/430) · [G0 #431](https://github.com/franksunye/VisuTry/issues/431)  
**Code snapshot:** `main` `cbf21014a7ac371226475d692dbf0a5f0dc270ff`. This is a **repository snapshot**, not a proven deployed Production SHA.  
**Constraints:** No provider purchase, paid API call, secret modification, production routing change, migration or deploy. Google Direct/Vertex are excluded as **newly funded** candidates; audit existing Direct code only.

## 1. Summary and evidence grades

- **CODE-CONFIRMED:** Active Premium Consumer uses synchronous Google Gemini when `ENABLE_SERVICE_TIERING` is not `false`; other Consumer users use async Grsai; specific Top Picks/Compare callers force Grsai; Store/Campaign module submits Grsai. This is conditional on the inspected code actually being deployed and effective Production configuration.
- **CODE-CONFIRMED:** One Grsai async submission uses two inline/data-URI images and `nano-banana-fast`; it obtains an external task ID, then polls. A single explicit timeout resubmission is available, but not cross-provider failover.
- **CODE-CONFIRMED RISK:** Consumer poll-based timeout resubmission does not claim a task/attempt retry atomically before the new external provider dispatch. Concurrent pollers can plausibly create multiple costly submissions for one logical task. Reproduce with mocks before touching code. This is a risk hypothesis from control flow, not an observed incident.
- **CODE-CONFIRMED RISK:** The ordinary Consumer submit route accepts `clientSubmissionId` but does not set `enforceIdempotency: true`, unlike Top Picks. Duplicated client requests may generate separate provider tasks. Verify the intended product semantics before a fix.
- **CODE-CONFIRMED RISK:** Grsai poll HTTP failures are normalized to `failed`; common `Polling failed: 429/5xx` text is not currently in `shouldTreatPollFailureAsTransient`, so a temporary response can become a user-visible failure. The poll fetch also has no explicit timeout/abort in its call site.
- **CODE-CONFIRMED MITIGATION:** Consumer and Store quota settlement already use serializable/claim-based once-only completion settlement. Store also uses dispatch/persist leases. Do not bypass these when introducing fallback.
- **DOC-DEFINED / PROD-UNVERIFIED:** `GenerationRequest`/`GenerationAttempt` schema and CLI/admin/Axiom correlation exist in code/docs, but a current 24h/7d/14d Production cohort or Day-0 baseline has **not** been collected in this G0 audit. No success-rate, 4/4 journey-rate, spend or SLO value is asserted.
- **MODEL LIFECYCLE CORRECTION:** Google's latest official deprecations page (updated 2026-10-20) lists the **earliest** shutdown of `gemini-2.5-flash-image` as **2027-03-15**, *not* 2026-10-02. Existing code depends on a legacy model but must not be called already shut down. Current Production availability and effective account access remain unverified.

## 2. Routing matrix (static, conditional)

| Journey / entitlement | Entry point / implementation | Static provider | Critical detail |
| --- | --- | --- | --- |
| Consumer Free/trial (authenticated) | `src/app/api/try-on/submit/route.ts` → `src/lib/tryon-service.ts` | Grsai | Quota checked before submit; settled only after task completion by poll. |
| Consumer $2.99 Credits Pack, no active Premium subscription | Same | Grsai | Credits are a quota bucket, **not** a provider tier. Default pack 30 credits; promo 60 and env overrides; user-reported four-image journey is a **journey**, not pack capacity. |
| Consumer active Premium subscription | Same | Google Gemini Direct | `ENABLE_SERVICE_TIERING` defaults on; sync model ID `gemini-2.5-flash-image`; depends on runtime key and deployment. |
| Consumer Top Picks (4 presets) | `src/app/api/face-analysis/top-picks-try-on/route.ts` | Grsai | `forceServiceType: 'grsai'`, client batch idempotency true. |
| Consumer Frame Compare | `src/app/api/try-on/glasses/compare/frame/route.ts` + compare service | Grsai | Forced Grsai path according to submitted frame metadata/implementation; verify complete compare handler at local audit. |
| Merchant Store / Campaign Guest | `src/modules/store/infrastructure/generation/submit-store-tryon-task.ts` | Grsai | Independent Store actor, sponsored/merchant/consumer usage policies, lease/fencing and private result storage; Local Demo may intentionally use prepared fixtures. |

Evidence paths: [`src/lib/generation/providers.ts`](../../src/lib/generation/providers.ts), [`src/lib/tryon-service.ts`](../../src/lib/tryon-service.ts), [`src/lib/grsai.ts`](../../src/lib/grsai.ts), [`src/lib/gemini.ts`](../../src/lib/gemini.ts), [`src/lib/quota.ts`](../../src/lib/quota.ts), [`src/config/pricing.ts`](../../src/config/pricing.ts), [`src/modules/store/infrastructure/generation/store-generation-adapter.ts`](../../src/modules/store/infrastructure/generation/store-generation-adapter.ts).

## 3. Failure timeline and safety boundaries

1. Consumer submit creates `TryOnTask` and telemetry request, then Grsai `POST /v1/draw/nano-banana` with default 25s submit abort (cap 45s) and in-memory two-image payload. If submit times out **without task ID**, local flow marks FAILED. Whether the provider accepted/billed it cannot be inferred from the client timeout.
2. After task ID is persisted, poll uses Grsai and attempts to resolve provider status. Network-like errors are treated transient by string patterns; HTTP errors such as 429/5xx can be classified as failed. Client/poll/cron concurrency must be analyzed as one workflow.
3. On provider-reported timeout, `getTryOnResult()` may submit **one** additional Grsai invocation (`MAX_GRSAI_TIMEOUT_RETRIES=1`). The retryCount guard is read from old metadata; no atomic retry claim precedes the external call. `startGenerationAttempt()` is telemetry and fail-open, **not** a payment/dispatch lock.
4. On result, Consumer uses a versioned result-persistence lease to save to configured Blob. Private Blob outage leaves task PROCESSING rather than exposing a provider URL; Store has a separate result lease implementation. A second provider must preserve these invariants and never expose source face photographs.
5. Consumer quota settles only on usable completion via `settleTryOnTaskQuota` in a serializable transaction. Store has separate `settleStoreTryOnUsage` / consumer-quota branch, plus render-attempt ledger. Failover must retain **one logical TryOnTask and one quota settlement** independent of provider attempts.

### Prioritized engineering risks

| Severity | Risk | Evidence / expected response |
| --- | --- | --- |
| P0 | One-provider outage on normal Credits Pack / Store try-on | No cross-provider router in inspected try-on paths. Secondary capability needed, but **disabled by default** until proof. |
| P0 | Duplicate provider dispatch on concurrent timeout polling | `tryon-service.ts` approx. 1016–1100: external resubmission occurs without CAS lease; create deterministic concurrency tests and a cost-safe claim before any fallback. |
| P0 | Unknown-submit outcome billed but marked failure | Grsai timeout may occur after upstream acceptance; **do not auto-submit to fallback** until status resolved / provider idempotency proven. |
| P1 | Ordinary Consumer client submission lacks enforced dedupe | `api/try-on/submit/route.ts` passes only `{ clientSubmissionId }`; verify client retry behavior and business semantics. |
| P1 | Poll HTTP 429/5xx and hung reads | `grsai.ts` normalizes poll HTTP status to FAILED; `tryon-service.ts` transient classifier excludes many HTTP status strings; add test-first categorization + bounded timeout. |
| P1 | Premium Direct legacy-model dependency | Legacy model earliest shutdown 2027-03-15 per updated Google page; do not purchase Google Direct/Vertex for this initiative; verify existing runtime success separately. |
| P1 | Input privacy/transport mismatch | Grsai accepts data URIs; Kie Nano Banana 2 Lite documents hosted `image_urls`, not raw bytes; needs consented/expiring delivery or secure upload approach before test. |
| P1 | Missing measured paid-user four-image outcome | Existing report is per request; batch/payment-to-four-output join must be defined and code-/data-verified, not inferred from success-per-image. |

## 4. Secondary / alternate / emergency qualification

| Candidate | Verified public protocol signal | Validation blockers |
| --- | --- | --- |
| **Kie.ai** `nano-banana-2-lite` (first Secondary) | `POST /api/v1/jobs/createTask` async, `image_urls` up to 10 reference URLs, single JPEG 1K output; vendor lists ~$0.02 per 1K image and says new users may get 80 credits. | Test **two-image face + frame fidelity**; cannot feed private data URI directly per documented contract; confirm secure upload/temporary URL, HMAC callback, retention/deletion, true balance/min top-up, error billing and p95. |
| **CometAPI** `gemini-3.1-flash-lite-image` (alternate) | Provider catalog lists Lite model on Gemini-style `/v1beta/models/{model}:generateContent`; advertised token pricing (input/output), not directly comparable per image. | Confirm SKU alias, inline two-image input, response normalization, bill per usable 1K image, routing/upstream independence from Grsai, limits and data policy. **Do not compare Nano Banana 2 non-Lite pricing as if same SKU.** |
| **OpenRouter** with an explicitly **non-Gemini** two-image edit model (Emergency) | Unified Image API `POST /api/v1/images`, model/endpoint capability and price discovery via `/api/v1/images/models`; reference count varies by model. Documentation notes `$1` minimum available balance for image requests. | Select and prove an actual independent model/end-point (e.g. candidate Seedream family only if 2 refs confirmed). Test frame accuracy and privacy; no unconditional image model fallback. |

Official vendor references (research as of 2026-10-22):
- Kie API: https://docs.kie.ai/market/google/nano-banana-2-lite ; protocol/price: https://kie.ai/nano-banana-2-lite
- Comet model comparison: https://www.cometapi.com/compare/gemini-3-1-flash-image-preview-vs-gemini-3-1-flash-lite-image/
- OpenRouter Image API: https://openrouter.ai/blog/announcements/image-api/ and https://openrouter.ai/blog/tutorials/image-generation/
- Google lifecycle (for **existing** Direct path only): https://ai.google.dev/gemini-api/docs/deprecations/

**Not yet verified:** Provider legal/retention/DPA terms for face photos; true paid-account SKU/price; upstream shared-failure domains; model adherence on VisuTry prompts; callback signing; usable output durability. Public pricing is only a planning signal.

## 5. Proposed target architecture (G2 design, not approved implementation)

- Introduce a bounded **provider adapter contract**: `submit(input, requestId, attemptId)`, `getStatus(providerTaskId)`, `normalizeOutcome()`, `supportsTwoImages`, `safeInputTransport`, `costPolicy`. Keep Consumer and Merchant Store adapters separate at their existing domain boundary; share only generation/provider orchestration.
- Persist routing decision and an **attempt-level dispatch claim** before making any billable call. A telemetry row is insufficient for mutual exclusion. Use a CAS/versioned lease and an explicit UNKNOWN outcome state when submission might have reached the upstream but task ID is absent. No second provider invocation on UNKNOWN unless provider status/idempotency/reconciliation proves safety or an operator explicitly chooses the cost risk.
- Retry/fallback only for **classified transient terminal failure** or a verified upstream-unavailable condition; never retry solely on a frontend timeout. Per-job total dispatch ceiling, per-provider daily spend/budget ceiling, circuit breaker, cooldown, manual kill switch, fail-closed policy if no eligible provider.
- Winner selection is fenced by attempt generation/version: first **usable and persisted** output wins; late callbacks from losing attempts never replace the image or settle quota again. Idempotent event/API handlers, bounded polling and backoff, private media and tenant boundaries remain intact.
- Collect `provider`, `model`, `attemptNumber`, `providerTaskId`, `requested/actual cost`, `errorStage`, `origin`, `isTest`, `logicalRequestId`, and `final usable result` without image/raw prompt/PII. Preserve existing Postgres/Axiom logs and clarify attribution of fallback attempts.
- Feature flags: `DISABLED` → `SHADOW_QUALIFIED` (no billable duplicate shadow dispatch) → `MANUAL_CANARY` → `BOUNDED_AUTO_FAILOVER` only after explicit lead sign-off; instant global disable and per-provider disable.

## 6. G1 controlled experiment proposal — requires separate Lead authorization

Start with **8 synthetic or consented face/frame fixture pairs** across occlusion, head pose, lighting, frame types, photo format and sizes. Do not copy genuine user photos or Production media to vendors for testing. Run Grsai baseline (8) plus one candidate at a time (8 each; at most 32 provider outputs for the first 4-lane comparison). Hold prompts/input photos constant and evaluate blind.

**Qualitative admission:** valid output and two-reference support in every tested pair; identity/face geometry, exact frame silhouette and color, lens placement, no doubled frames, believable nose/temple fit, no unacceptable artifacts. Every rejected result is recorded with an evidence artifact on authorized storage. An 8-case run is a compatibility/quality screen, **not** statistical reliability proof.

**Operational measurement:** task acceptance, usable final image, P50/P95 observed latency, timeouts and 429/5xx, explicit charged/failed/retried cost, secure input/output retention. For a 4-image journey, measure a **batch** as successful only when all four usable outputs are delivered and charges settled correctly. The baseline requires real batch linkage or an acknowledged proxy.

**Proposed not-yet-approved cap:** up to **US$15 consumed** across G1 paid tests with separate **US$25 maximum cumulative cash top-up**. If vendor minimums exceed that cap, stop and return for decision. Prefer legitimate free trial credits when eligible. Never begin paid tests or sign up for accounts on this document alone.

**G1 GO to G2 requires:** a selected actual SKU, two-image fidelity proof, verified safe face-photo transport/deletion, acceptable real cost, fallback classification safety, and Lead acceptance of identified tradeoffs. Production reliability/SLO requires subsequent larger, controlled observation, not extrapolation from eight fixtures.

## 7. G0-LIVE local Codex read-only evidence task (OPEN)

Run in the existing local VisuTry repo and configured Production-connected environment **read-only** after verifying the authorized account/project. Do not echo secrets, upload face images, run generation, trigger smoke requiring provider spend, or modify Production DB.

1. Record local repo HEAD, origin, dirty-worktree inventory and current `origin/main` without resetting/rebasing/overwriting. Record exact deployed Vercel Production SHA and environment name; verify if this audited commit is deployed. Do not promote/rollback.
2. Using the **existing** safe report tooling, obtain `npm run report:generation-reliability -- --period 24h --environment production`, then 7d and 14d, excluding test data by default. Confirm CLI options against actual script first. If read-only DB access is absent or ambiguous, mark BLOCKED; do not seek secrets from the user in chat.
3. Cross-check admin read-only API and CLI totals, sample only **redacted** request/attempt/providerTaskId correlations with Axiom. Audit `isTest`, origin, model alias, attempt count and stage classification. Never export image URLs, auth headers, photos, raw prompts or user identity.
4. Independently classify 4-of-4 paid journey denominator and any missing payment/batch identifiers. Show raw counts/time range and coverage, not unsupported SLO percentages; label samples sparse when applicable.
5. Test concurrency/idempotency/timeout classification using **mocks only** (no actual provider calls) and document reproducible race paths, API and Store isolation, quota settlement invariants.
6. Append redacted evidence plus GO/NO-GO to #431 and optionally a report-only Draft PR update; do not merge, deploy, add secrets, top up, contact vendors or bill API calls.

## 8. Remaining G0 blockers / next gate

- [x] Current static routing and failure-path inventory (bounded, snapshot only).
- [x] Current official Google lifecycle and initial vendor capability/docs review; earlier sunset date corrected.
- [x] Proposed cost/quality gates and safe multi-provider design.
- [ ] Production deployed SHA + effective environment-specific routing verified.
- [ ] 24h/7d/14d Production Postgres/Admin/Axiom report reconciled and Day-0 evidence status clarified.
- [ ] Consumer and Store concurrency/error-reproduction test artifacts from local full repository.
- [ ] Face-photo vendor handling policy, upstream independence and precise candidate SKU/billing verified.
- [ ] Lead GO/NO-GO on capped G1 tests (separate decision).

**Status verdict:** **G0 PARTIAL / G1 NO-GO** until Production evidence and a reviewed capped test authorization exist. This report deliberately does not claim live VisuTry failure rate or a completed fallback integration.
