# AI Provider Resilience v1 — G1 No-Spend Vendor Protocol Screen

**Date:** 2026-10-22  
**Status:** PUBLIC DOCS SCREEN ONLY; NO ACCOUNTS, CREDENTIALS, PAYMENTS, TEST GENERATIONS OR THIRD-PARTY PHOTO UPLOADS  
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
- OpenRouter publicly documents vision-capable chat requests to `/api/v1/chat/completions` with `image_url` and the need to select a model supporting image input. An *exact non-Gemini economical vision model* must be selected from its current catalog **and tested for schema/MediaPipe parity** before eligibility. Source: [OpenRouter vision guide](https://openrouter.ai/blog/tutorials/send-image-to-llm/).
- Face Analysis quota deduction after success, task creation before provider call, duplicated `clientSubmissionId`, 55s provider budget vs 60s route, and failure text disclosure are separate local mock/test topics under #434.

## 5. Concrete no-spend implementation sequence

1. **Local mock-only safety suite:** reproduce concurrent try-on poll retry dispatch race, ordinary client submit duplicate, 429/5xx transient classification, Face Analysis retry/timeout/quota and Store tenant/lease invariants. Assert one logical billable dispatch in known state; mark unknown accepted-but-no-task-ID as `UNKNOWN` and never blind auto-dispatch a second provider.
2. **Input fixture preparation:** eight synthetic/consented, private images for two-reference Try-On and a separate Face Analysis geometry/schema set; no Production photo exports.
3. **Formal payload compatibility review:** Kie upload vs private media, Comet versioned `generateContent` input references, OpenRouter `input_references` data URL compatibility on exact model endpoint; record limits and source links.
4. **Cost+privacy decision brief:** take account-level prices and deposit floors only through an authorized, non-charging read of a vendor dashboard. If registration/payment authorization is required, stop and ask Lead. Keep proposed **$15 spent / $25 aggregate top-ups** as a *proposal*, not authorization; Face Analysis lane needs an explicit share or separate cap.
5. **Lead trial gate:** after desk/mocks and privacy sign-off, request permission for finite external calls with synthetic/consented inputs and exact model SKUs. Do not merge or enable production routing before verified quality and cost.

## 6. Provisional result

- **G1 no-spend GO:** public API compatibility and local safety mocks.
- **G1 billable/face-photo dispatch NO-GO:** minimum top-up, exact pricing, legal/photo terms, endpoint model support and two-image output fidelity not yet proven.
- **G2 production routing NO-GO:** no tested provider integration or safety claim exists.

This is a **qualification screen**, not a vendor endorsement, reliability benchmark, or deployment plan approval.
