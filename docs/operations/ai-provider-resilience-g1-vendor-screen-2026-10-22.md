# AI Provider Resilience v1 — G1 No-Spend Vendor Protocol Screen

**Date:** 2026-10-22  
**Status:** PUBLIC DOCS + LOCAL MOCKS + SYNTHETIC FIXTURES; NO CANDIDATE-PROVIDER API CALLS, ACCOUNTS, CREDENTIALS, PAYMENTS OR THIRD-PARTY PHOTO UPLOADS
**Decision context:** Lead accepted Grsai instability; the 24h/7d/14d incident-baseline verification under G0 was explicitly waived. This does **not** waive implementation correctness, user-image privacy, or per-vendor quality tests.  
**Tracking:** [Project #430](https://github.com/franksunye/VisuTry/issues/430), [G1 #434](https://github.com/franksunye/VisuTry/issues/434), [Face Analysis #433](https://github.com/franksunye/VisuTry/issues/433), [G0 audit](./ai-provider-resilience-g0-audit-2026-10-22.md).

## 1. Decision: two distinct jobs and two kinds of independence

- **Try-On** = exact person face + eyewear frame photo + prompt → an edited image, with 4-of-4 session integrity. Gemini/Nano Banana-style reference editing is one model family.
- **Face Analysis** = one face photo + MediaPipe geometry prompt → structured text/JSON, not an edited photograph. Existing Grsai service is a synchronous multimodal chat route using `gemini-3.1-flash-lite`.
- Different vendor API keys do **not** necessarily establish independent **upstream model service**. Kie and Comet Gemini aliases may protect against one aggregator outage but share Google/model-family failure risks. A genuinely non-Gemini image editing model is necessary for an *emergency* lane.

## 2. Try-On candidates — documented versus still unverified

| Candidate | Verified first-party request contract | Input/output and operational evidence | Pricing / open blocker | Desk verdict |
| --- | --- | --- | --- | --- |
| **Kie.ai / `nano-banana-2-lite`** | `POST https://api.kie.ai/api/v1/jobs/createTask`; model `nano-banana-2-lite`; async task ID + status query or callback | `input.image_urls` supports up to 10 **hosted URLs**, one **JPEG** output; optional `callBackUrl`; **HTTP status 200 may contain business `code` 429/401**—inspect JSON, not status alone. Supports two references structurally; quality on VisuTry photos **untested**. | Official pricing page is dynamic; exact signed-in USD/credits/1K SKU, minimum recharge, failed-request billing **not independently verified**. Hosted photo transport and retention require review. | **Conditional first Secondary for a tightly capped trial**, *not production-ready*. |
| **CometAPI / Gemini image aliases** | Vendor examples: `POST https://api.cometapi.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`. | Gemini-style `contents.parts` with `inlineData` is a possible transport; published examples are primarily text-to-image; two real image-reference edit fidelity and exact Lite alias compatibility **untested**. | Vendor pricing tables mix tokens/image/resolution and examples are not a directly comparable final 1K two-reference price. Need SKU-level quote from authenticated billing panel, request contract and failed-cost semantics. | **Alternate under documentation verification**, not an automatic second independent model. |
| **OpenRouter / `black-forest-labs/flux.2-pro`** | `POST https://openrouter.ai/api/v1/images`; image editing adds `input_references` to the image request; model slug from live catalog. | Non-Gemini model family; OpenRouter's vendor comparison lists FLUX.2 Pro among models accepting up to 8 reference images. Responses may return `data[].b64_json` plus `usage.cost`; exact endpoint-capability record must be checked immediately before testing. | Published indication: **$0.015/input megapixel**, **$0.03 for first output megapixel**; illustrative 2×1MP refs + 1×1MP output ≈ **$0.06** *before any other applicable charges*. Not an actual VisuTry bill. Exact model endpoint and seller must be checked. | **First genuinely non-Gemini Emergency candidate** for two-reference quality screening. |

Primary sources:
- Kie [Nano Banana 2 Lite API](https://docs.kie.ai/market/google/nano-banana-2-lite), [Getting Started and retention](https://docs.kie.ai/getting-started), [upload method and 24h file expiration](https://docs.kie.ai/file-upload-api/quickstart), [current pricing](https://kie.ai/pricing).
- CometAPI [Gemini image API example](https://www.cometapi.com/models/google/gemini-3-1-flash-image-preview/), [pricing index](https://www.cometapi.com/pricing/).
- OpenRouter [image API tutorial](https://openrouter.ai/blog/tutorials/image-generation/), [image models guide](https://openrouter.ai/blog/insights/image-generation-models-compared/), [FLUX.2 Pro pricing](https://openrouter.ai/black-forest-labs/flux.2-pro/pricing), [per-endpoint capability API](https://openrouter.ai/docs/api/api-reference/images/list-image-model-endpoints).

## 3. Input-privacy and protocol findings: **not yet cleared for real-user media**

1. **Kie private photo transport:** Current VisuTry Grsai takes data URIs. Kie generation consumes hosted `image_urls` and separately offers binary or base64 **file upload → downloadUrl**. This might avoid exposing our own private Vercel Blob URLs; however, it creates an extra copy at the vendor. The vendor says uploaded files are deleted after **24h**, generated media retained **14 days**, task log text/metadata retained **2 months**. Need contract/terms/DPA and consent review; no production face photos in test set.
2. **Kie result lifecycle:** Immediate submission success confirms task accepted, **not output usable**. Poll/callback must handle status, missing JPEG, media download/persist, duplicate webhook, provider error-code-in-HTTP-200 and service-side quota exactly once.
3. **CometAPI:** Both billing interpretation and retention/deletion policy for face/photo payloads remain open. Do not infer privacy guarantees from an aggregator's marketing.
4. **OpenRouter:** Privacy statement says submitted multimedia is generally not held beyond routing except abuse/security/billing/legal exceptions; underlying model provider terms may differ, and separately uploaded Files API objects persist until deleted. Evaluate exact routed endpoint and privacy/zero-retention options rather than assuming all providers equivalent.
5. None of these public documents prove actual *upstream uptime independence*, eyewear identity preservation, frame shape fidelity, or successful 4-image paid session.

References: [Kie upload](https://docs.kie.ai/file-upload-api/quickstart), [Kie retention](https://docs.kie.ai/getting-started), [OpenRouter privacy](https://openrouter.ai/privacy/).

## 4. Face Analysis is a separate G1-B qualification

- Existing Grsai image-containing request uses `/v1/chat/completions`, `messages[].content` with text + `image_url` data URI, model `gemini-3.1-flash-lite`; the output is parsed into a VisuTry face-analysis schema. A Kie image-generation task produces JPEG and **cannot replace this route**.
- **Provisional first candidate: Alibaba Cloud Model Studio direct API, `qwen3.8-flash`.** Its official model page lists image input, text output and structured outputs. Published International-scope pricing is US$0.15 per million input tokens and US$0.47 per million output tokens; image resolution affects token usage, so the actual rate must be recorded from each response and the account meter. Sources: [model capability and pricing](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/qwen3-8-flash), [image input protocol](https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions), [structured output support](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output).
- This provides a direct Alibaba inference path outside the Google/Gemini family and OpenRouter gateway; that reduces one common-upstream concern but does not prove independent uptime or equivalent Face Analysis quality. The official [Data Retention Policy](https://www.alibabacloud.com/help/en/model-studio/data-retention-policy) states standard prompts/responses are retained up to 30 days. ZDR requires eligible enterprise status and account-manager assessment. The listed supported series includes Qwen-Flash from `qwen3.8-flash`, but account, region, model, and ZDR enabled state must be verified before any real-user photo use. ZDR does not cover all stateful paths or service metadata.
- The local fixture now contains eight synthetic fictional adult portraits. They remain local until the limited API-test decision is approved. Visual face-shape tags are test design targets, not landmark ground truth; generate/verify the `landmark-v1` geometry separately for parity scoring.
- Face Analysis quota deduction after success, task creation before provider call, duplicated `clientSubmissionId`, 55s provider budget vs 60s route, and failure text disclosure are separate local mock/test topics under #434.

## 5. Concrete no-spend implementation sequence

1. **Local mock-only safety suite:** reproduce the concurrent Consumer timeout-poll race, ordinary same-key submit replay, 429/5xx poll classification and ambiguous Face Analysis timeout. Current code confirms two retry dispatches in the concurrent race; no dispatch-safety fix is included in this no-spend evidence change. See [G1 mock and fixture readiness](./ai-provider-resilience-g1-mock-and-fixture-readiness-2026-10-22.md). A future separately authorized code change must add the task-scoped dispatch fence and durable `UNKNOWN` outcome before any candidate can be dispatched.
2. **Input fixture preparation:** eight local synthetic face + frame pairs now exist in `tests/fixtures/ai-provider-resilience/media/`; the manifest contains their paths and test design targets. No Production photo exports are present, and external transfer is not approved. Verify MediaPipe geometry separately for Face Analysis parity.
3. **Formal payload compatibility review:** Kie upload vs private media, Comet versioned `generateContent` input references, OpenRouter `input_references` data URL compatibility on exact model endpoint; record limits and source links.
4. **Cost + privacy decision brief:** the readiness report preserves Try-On at **$15 actual spend / $25 top-ups** and proposes a separate Face Analysis limit of **$3 actual spend / $5 top-ups**. If both lanes are approved, their combined ceiling is **$18 actual / $30 total top-ups**. All caps are unapproved. No vendor registration, account funding or API dispatch is part of this stage.
5. **Lead trial gate:** after dispatch-safety design, exact SKU pricing, privacy review and fixture asset creation, request permission for finite external calls with synthetic/consented inputs. Do not merge or enable production routing before verified quality and cost.

## 6. Provisional result

- **G1 no-spend GO:** public API compatibility review, mock-only characterization and eight local synthetic pairs. The observed concurrent retry race remains open.
- **G1 billable dispatch NO-GO:** synthetic assets exist but external transfer is unapproved; exact account pricing/minimum top-ups and endpoint behavior still need confirmation. Face Analysis has a named candidate, but no schema/landmark parity result and no verified ZDR account state. Real-user photo transfer remains NO-GO.
- **G2 production routing NO-GO:** no tested provider integration or safety claim exists.

This is a **qualification screen**, not a vendor endorsement, reliability benchmark, or deployment plan approval.
