# AI Provider Resilience v1 — G0 Static Audit & G1 Decision Brief

**Date:** 2026-10-22  
**Status:** G0 PARTIAL — PRODUCTION DEPLOYED-CODE EQUIVALENCE + BOUNDED INCIDENT LOG VERIFIED; LONGITUDINAL PRODUCTION METRICS OPEN  
**Tracking:** [Project #430](https://github.com/franksunye/VisuTry/issues/430) · [G0 Try-On #431](https://github.com/franksunye/VisuTry/issues/431) · [Face Analysis #433](https://github.com/franksunye/VisuTry/issues/433)  
**Code snapshot:** `main` `cbf21014a7ac371226475d692dbf0a5f0dc270ff`; live Vercel Production READY `75ff01e232b6317a3dae1ec509cf63179ffa550d`. Twelve generation-critical files were fetched at both SHAs and compared byte-for-byte identical; this is **deployed-code equivalence for those files**, not proof of current effective environment variables or job outcomes.  
**Constraints:** No provider purchase, paid API call, secret modification, production routing change, migration or deploy. Google Direct/Vertex are excluded as **newly funded** candidates; audit existing Direct code only.

## 1. Summary and evidence grades

- **CODE-CONFIRMED:** Active Premium Consumer uses synchronous Google Gemini when `ENABLE_SERVICE_TIERING` is not `false`; other Consumer users use async Grsai; specific Top Picks/Compare callers force Grsai; Store/Campaign module submits Grsai. The 12-file deployed-code equivalence is verified; effective Production environment settings and individual journey outcomes remain unknown.
- **PRODUCTION-OBSERVED INCIDENT:** On 2026-10-22 at 05:53 UTC, `/api/face-analysis/submit` logged a Grsai chat HTTP 400 with provider payload `rix_api_error` and Chinese message `该模型正在修复` (model under repair). A first-attempt transient warning preceded final failure. This is a **real Face Analysis failure**, not a Try-On failure-rate statistic. The Face Analysis path invokes `gemini-3.1-flash-lite` via Grsai `/v1/chat/completions`, different from Try-On image generation; candidate qualification must be separate.
- **CODE-CONFIRMED:** One Grsai async submission uses two inline/data-URI images and `nano-banana-fast`; it obtains an external task ID, then polls. A single explicit timeout resubmission is available, but not cross-provider failover.
- **CODE-CONFIRMED RISK:** Consumer poll-based timeout resubmission does not claim a task/attempt retry atomically before the new external provider dispatch. Concurrent pollers can plausibly create multiple costly submissions for one logical task. Reproduce with mocks before touching code. This is a risk hypothesis from control flow, not an observed incident.
- **CODE-CONFIRMED RISK:** The ordinary Consumer submit route accepts `clientSubmissionId` but does not set `enforceIdempotency: true`, unlike Top Picks. Duplicated client requests may generate separate provider tasks. Verify the intended product semantics before a fix.
- **CODE-CONFIRMED RISK:** Grsai poll HTTP failures are normalized to `failed`; common `Polling failed: 429/5xx` text is not currently in `shouldTreatPollFailureAsTransient`, so a temporary response can become a user-visible failure. The poll fetch also has no explicit timeout/abort in its call site.
- **CODE-CONFIRMED MITIGATION:** Consumer and Store quota settlement already use serializable/claim-based once-only completion settlement. Store also uses dispatch/persist leases. Do not bypass these when introducing fallback.
- **DOC-DEFINED / PROD-UNVERIFIED:** `GenerationRequest`/`GenerationAttempt` schema and CLI/admin/Axiom correlation exist in code/docs, but a current 24h/7d/14d Production cohort or Day-0 baseline has **not** been collected in this G0 audit. No success-rate, 4/4 journey-rate, spend or SLO value is asserted.
- **MODEL LIFECYCLE CORRECTION:** Google's latest official deprecations page (updated 2026-10-20) lists the **earliest** shutdown of `gemini-2.5-flash-image` as **2027-03-15**, *not* 2026-10-02. Existing code depends on a legacy model but must not be called already shut down. Current Production availability and effective account access remain unverified.

## 2. Routing matrix (deployed-code equivalent; effective env conditional)

| Journey / entitlement | Entry point / implementation | Static provider | Critical detail |
| --- | --- | --- | --- |
| Face Analysis (authenticated) | `src/app/api/face-analysis/submit/route.ts` → `src/lib/face-analysis-service.ts` → `src/lib/grsai-face-analysis.ts` | Grsai chat (`gemini-3.1-flash-lite`) | Vision + structured analysis, **not image generation**. Two attempts only for 400 `rix_api_error`; observed first transient retry and terminal 400 on 2026-10-22. No cross-vendor fallback in inspected face-provider path. |
| Consumer Free/trial (authenticated) | `src/app/api/try-on/submit/route.ts` → `src/lib/tryon-service.ts` | Grsai | Quota checked before submit; settled only after task completion by poll. |
| Consumer $2.99 Credits Pack, no active Premium subscription | Same | Grsai | Credits are a quota bucket, **not** a provider tier. Default pack 30 credits; promo 60 and env overrides; user-reported four-image journey is a **journey**, not pack capacity. |
| Consumer active Premium subscription | Same | Google Gemini Direct | `ENABLE_SERVICE_TIERING` defaults on; sync model ID `gemini-2.5-flash-image`; depends on runtime key and deployment. |
| Consumer Top Picks (4 presets) | `src/app/api/face-analysis/top-picks-try-on/route.ts` | Grsai | `forceServiceType: 'grsai'`, client batch idempotency true. |
| Consumer Frame Compare | `src/app/api/try-on/glasses/compare/frame/route.ts` + compare service | Grsai | Forced Grsai path according to submitted frame metadata/implementation; verify complete compare handler at local audit. |
| Merchant Store / Campaign Guest | `src/modules/store/infrastructure/generation/submit-store-tryon-task.ts` | Grsai | Independent Store actor, sponsored/merchant/consumer usage policies, lease/fencing and private result storage; Local Demo may intentionally use prepared fixtures. |

Evidence paths: [`src/lib/generation/providers.ts`](../../src/lib/generation/providers.ts), [`src/lib/tryon-service.ts`](../../src/lib/tryon-service.ts), [`src/lib/grsai.ts`](../../src/lib/grsai.ts), [`src/lib/gemini.ts`](../../src/lib/gemini.ts), [`src/lib/quota.ts`](../../src/lib/quota.ts), [`src/config/pricing.ts`](../../src/config/pricing.ts), [`src/modules/store/infrastructure/generation/store-generation-adapter.ts`](../../src/modules/store/infrastructure/generation/store-generation-adapter.ts).

### Verified live Production deployment and bounded incident evidence (2026-10-22)

| Observation | Evidence and limit |
| --- | --- |
| Canonical Production deployment | `dpl_37Lm1mQD2g26LFyjkyLco1mJEun7` READY at `75ff01e232b6317a3dae1ec509cf63179ffa550d`; Vercel aliases include `www.visutry.com`, `visutry.com`, `visutry.vercel.app` and main alias. |
| Newer main commit | `cbf21014a7ac371226475d692dbf0a5f0dc270ff` deployment `dpl_FGpmQ8AnHREqRLFNCruXsJ1uFftU` is CANCELED with no Production aliases; **do not equate repository main SHA to the live deploy**. |
| Source equivalence | Twelve generation-critical files, including Consumer/Store try-on, `grsai.ts`, `gemini.ts`, generation telemetry and quota, are content-identical at both SHAs. Separately fetched live `face-analysis-service.ts`, `grsai-face-analysis.ts` and `config/face-analysis.ts`. |
| Grsai Face Analysis incident | Vercel function logs for `POST /api/face-analysis/submit` on **2026-10-22 05:53:11–05:53:12 UTC** show retry warning followed by `Chat API failed: 400`, `rix_api_error`, `该模型正在修复`, and request-level `Analysis failed` / `Submit API error`. A single request can emit multiple log entries; **do not count these as multiple affected users or image generations**. |
| Retention / measurement | The Vercel runtime-log API rejected attempted 1h/24h/7d queries due available retention; the 30m window is too narrow to infer service success rate. Separate `get_runtime_errors(since:24h)` **pre-aggregated error clusters** included events with first-seen dates as early as June 2026 (98 total in one group, 16 affected users reported), so those counts are **historical groups, not valid 24h denominators or 24h incident totals**. Samples from Oct 21–22 include both Grsai model-repair 400 and Face Analysis timeouts. Use authorized Production Postgres, Axiom, existing report CLI and explicit batch linkage. |
| Configuration | Production effective `ENABLE_SERVICE_TIERING`, API key presence, Grsai base URL and actual upstream routing are **not verified** by the deployment or logs. No secrets were retrieved. |

## 3. Failure timeline and safety boundaries

1. Consumer submit creates `TryOnTask` and telemetry request, then Grsai `POST /v1/draw/nano-banana` with default 25s submit abort (cap 45s) and in-memory two-image payload. If submit times out **without task ID**, local flow marks FAILED. Whether the provider accepted/billed it cannot be inferred from the client timeout.
2. After task ID is persisted, poll uses Grsai and attempts to resolve provider status. Network-like errors are treated transient by string patterns; HTTP errors such as 429/5xx can be classified as failed. Client/poll/cron concurrency must be analyzed as one workflow.
3. On provider-reported timeout, `getTryOnResult()` may submit **one** additional Grsai invocation (`MAX_GRSAI_TIMEOUT_RETRIES=1`). The retryCount guard is read from old metadata; no atomic retry claim precedes the external call. `startGenerationAttempt()` is telemetry and fail-open, **not** a payment/dispatch lock.
4. On result, Consumer uses a versioned result-persistence lease to save to configured Blob. Private Blob outage leaves task PROCESSING rather than exposing a provider URL; Store has a separate result lease implementation. A second provider must preserve these invariants and never expose source face photographs.
5. Consumer quota settles only on usable completion via `settleTryOnTaskQuota` in a serializable transaction. Store has separate `settleStoreTryOnUsage` / consumer-quota branch, plus render-attempt ledger. Failover must retain **one logical TryOnTask and one quota settlement** independent of provider attempts.

### Prioritized engineering risks

| Severity | Risk | Evidence / expected response |
| --- | --- | --- |
| P0 | Live Grsai Face Analysis outage, separate from image generation | Vercel function log at 05:53 UTC: `gemini-3.1-flash-lite` chat returned HTTP 400 `rix_api_error` / `该模型正在修复`. Existing retry handles two `rix_api_error` attempts but no alternate vendor; verify model/provider alternatives and structured-output parity separately. |
| P0 | One-provider outage on normal Credits Pack / Store try-on | No cross-provider router in inspected try-on paths. Secondary capability needed, but **disabled by default** until proof. |
| P0 | Duplicate provider dispatch on concurrent timeout polling | `tryon-service.ts` approx. 1016–1100: external resubmission occurs without CAS lease; create deterministic concurrency tests and a cost-safe claim before any fallback. |
| P0 | Unknown-submit outcome billed but marked failure | Grsai timeout may occur after upstream acceptance; **do not auto-submit to fallback** until status resolved / provider idempotency proven. |
| P1 | Ordinary Consumer client submission lacks enforced dedupe | `api/try-on/submit/route.ts` passes only `{ clientSubmissionId }`; verify client retry behavior and business semantics. |
| P1 | Poll HTTP 429/5xx and hung reads | `grsai.ts` normalizes poll HTTP status to FAILED; `tryon-service.ts` transient classifier excludes many HTTP status strings; add test-first categorization + bounded timeout. |
| P1 | Premium Direct legacy-model dependency | Legacy model earliest shutdown 2027-03-15 per updated Google page; do not purchase Google Direct/Vertex for this initiative; verify existing runtime success separately. |
| P1 | Input privacy/transport mismatch | Grsai accepts data URIs; Kie Nano Banana 2 Lite documents hosted `image_urls`, not raw bytes; needs consented/expiring delivery or secure upload approach before test. |
| P1 | Missing measured paid-user four-image outcome | Existing report is per request; batch/payment-to-four-output join must be defined and code-/data-verified, not inferred from success-per-image. |

**Face Analysis flow-specific safety:** The authenticated submit creates a private Blob and `FaceAnalysisTask` before the synchronous Grsai call; success marks completed and then route deducts quota, while provider failure marks FAILED and returns HTTP 500. `clientSubmissionId` is metadata, not an enforced dedupe claim in this path. A provider timeout can consume much of the route's 60s maximum (Grsai handler budgets 55s, plus Blob/DB overhead), so inspect stuck tasks and concurrent re-submits with **mocks**. The quota is only deducted after a returned success, but failure between task completion and deduction can create accounting ambiguity; audit rather than assert impact.

**Separate Face Analysis lane:** Its `gemini-3.1-flash-lite` vision-to-text/JSON prompt path needs a chat/vision endpoint capable of inline face input, equivalent shape/landmark contract, schema validation and privacy handling. Kie Nano Banana 2 Lite is an **image-generation candidate**, not a proven drop-in replacement for Face Analysis. Do not attempt a failover from Face Analysis to an image generator. Prefer stable, affordable multimodal chat from a provider with demonstrably independent serving failure domain; compare live pricing and strict output compatibility under a separate budget gate.

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

**Lane A — Try-On image output:** Start with **8 synthetic or consented face/frame fixture pairs** across occlusion, head pose, lighting, frame types, photo format and sizes. Do not copy genuine user photos or Production media to vendors for testing. Run Grsai baseline (8) plus one candidate at a time (8 each; at most 32 provider outputs for the first 4-lane comparison). Hold prompts/input photos constant and evaluate blind.

**Qualitative admission:** valid output and two-reference support in every tested pair; identity/face geometry, exact frame silhouette and color, lens placement, no doubled frames, believable nose/temple fit, no unacceptable artifacts. Every rejected result is recorded with an evidence artifact on authorized storage. An 8-case run is a compatibility/quality screen, **not** statistical reliability proof.

**Lane B — Face Analysis, independent qualification:** First inspect structured result/schema prompts, quota semantics, and current failure/retry metrics read-only. Then propose separate synthetic/consented fixture tests for Grsai chat versus at least one independent multimodal vision/chat endpoint. Measure analysis field coverage, parse/schema success, grounding to MediaPipe geometry, timeout, privacy and cost. No candidate is pre-approved and no additional spend is authorized.

**Operational measurement:** task acceptance, usable final image, P50/P95 observed latency, timeouts and 429/5xx, explicit charged/failed/retried cost, secure input/output retention. For a 4-image journey, measure a **batch** as successful only when all four usable outputs are delivered and charges settled correctly. The baseline requires real batch linkage or an acknowledged proxy.

**Proposed not-yet-approved cap:** up to **US$15 consumed** across G1 paid tests with separate **US$25 maximum cumulative cash top-up**. If vendor minimums exceed that cap, stop and return for decision. Prefer legitimate free trial credits when eligible. Never begin paid tests or sign up for accounts on this document alone.

**G1 GO to G2 requires:** a selected actual SKU, two-image fidelity proof, verified safe face-photo transport/deletion, acceptable real cost, fallback classification safety, and Lead acceptance of identified tradeoffs. Production reliability/SLO requires subsequent larger, controlled observation, not extrapolation from eight fixtures.

## 7. G0-LIVE local Codex read-only evidence task (OPEN)

Run in the existing local VisuTry repo and configured Production-connected environment **read-only** after verifying the authorized account/project. Do not echo secrets, upload face images, run generation, trigger smoke requiring provider spend, or modify Production DB.

1. Record local repo HEAD, origin, dirty-worktree inventory and current `origin/main` without resetting/rebasing/overwriting. Vercel aliases confirm Production READY SHA `75ff01e232b6317a3dae1ec509cf63179ffa550d` and canceled main SHA `cbf21014a7ac371226475d692dbf0a5f0dc270ff`; **independently cross-check** linked Vercel project and effective environment-specific routing without printing secrets. Do not promote/rollback.
2. Using the **existing** safe report tooling, obtain `npm run report:generation-reliability -- --period 24h --environment production`, then 7d and 14d, excluding test data by default. Confirm CLI options against actual script first. If read-only DB access is absent or ambiguous, mark BLOCKED; do not seek secrets from the user in chat.
3. Cross-check admin read-only API and CLI totals, sample only **redacted** request/attempt/providerTaskId correlations with Axiom. Audit `isTest`, origin, model alias, attempt count and stage classification. Never export image URLs, auth headers, photos, raw prompts or user identity.
4. Collect **Face Analysis** submissions/success/failure by model, HTTP error type and observed request groups separately from Try-On generations, including the 2026-10-22 `rix_api_error` failure. Never count multiple logs from one request as multiple users. Independently classify 4-of-4 paid journey denominator and any missing payment/batch identifiers. Show raw counts/time range and coverage, not unsupported SLO percentages; label samples sparse when applicable.
5. Test concurrency/idempotency/timeout classification using **mocks only** (no actual provider calls) and document reproducible race paths, API and Store isolation, quota settlement invariants.
6. Append redacted evidence plus GO/NO-GO to #431 and optionally a report-only Draft PR update; do not merge, deploy, add secrets, top up, contact vendors or bill API calls.

## 8. Remaining G0 blockers / next gate

- [x] Current static routing and failure-path inventory, including Face Analysis provider and limited live deployment code equivalence.
- [x] Vercel Production READY SHA/aliases verified; current main newer deployment canceled; live Face Analysis `rix_api_error` incident captured (not Try-On-rate evidence).
- [x] Current official Google lifecycle and initial vendor capability/docs review; earlier sunset date corrected.
- [x] Proposed cost/quality gates and safe multi-provider design.
- [ ] Effective environment-specific routing and runtime config safely verified (deployed SHA already verified).
- [ ] 24h/7d/14d Production Postgres/Admin/Axiom report reconciled, Face Analysis failures isolated from image generation, and Day-0 evidence status clarified.
- [ ] Consumer and Store concurrency/error-reproduction test artifacts from local full repository; Face Analysis 60s/55s timeout and client-submit idempotency reviewed with mocks.
- [ ] Separate Face Analysis vision/chat candidate and output-contract parity checked; no image-generation candidate assumed suitable.
- [ ] Face-photo vendor handling policy, upstream independence and precise candidate SKU/billing verified.
- [ ] Lead GO/NO-GO on capped G1 tests (separate decision).

**Status verdict:** **G0 PARTIAL / G1 NO-GO** until Production evidence and a reviewed capped test authorization exist. This report deliberately does not claim live VisuTry failure rate or a completed fallback integration.
