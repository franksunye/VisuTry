# G2 — Kie.ai same-model Consumer Try-On secondary (Draft / disabled)

Owner: ChatGPT Lead. Governing issues: #430, #434, #440. Stacked safety foundation: Draft PR #439 exact HEAD `384bb6cbf4772bdb179acc90b982df2021aafe89`.

## Scope and model parity

- Grsai `nano-banana-fast` stays Primary. Kie `nano-banana-2-lite` is the only Secondary. Both vendor notices identify underlying Google `gemini-3.1-flash-lite-image`. This is aggregator redundancy, **not** redundancy against a shared model outage.
- Only new ordinary **Consumer** Grsai-bound Try-On tasks are candidates. Premium Gemini, explicitly forced Grsai batch paths, Store/Campaign, Face Analysis and existing accepted tasks are untouched.
- G1 eight-image comparative quality/price bake-off was waived by the user; live protocol/cost/privacy approval was **not** waived.

## Flags and safety

Kie routing defaults to OFF. Only the key and an explicit non-OFF server mode arm Kie routing. Actual use of customer media requires separate VisuTry owner approval before an operator changes the mode:

| Variable | Required to arm | Default |
| --- | --- | --- |
| `KIE_API_KEY` | Kie private bearer token | absent |
| `KIE_TRYON_FALLBACK_MODE` | `force-consumer` or `auto-definitive` | absent/unknown = off |

Modes:

- **off (default):** existing Grsai/Gemini behavior, no Kie network calls.
- **force-consumer:** operator switches only *new* ordinary Consumer tasks directly to Kie. Preferred reversible incident response. Existing Grsai task IDs remain Grsai-owned and polled there.
- **auto-definitive:** new tasks start at Grsai; switch to Kie once and only once when Grsai returned an explicit negative **business-code** admission without task ID: 400, 401, 403, 422 or 429. A missing/malformed body, HTTP error, provider 503/5xx, timeout, aborted request, lost response or accepted task is **UNKNOWN** and cannot automatically fall back. Kie's ambiguous admission is also UNKNOWN.

The second outbound POST is guarded by a Consumer-only durable `dispatchVersion` claim and an UNKNOWN-before-send state. Accepted external Kie IDs are stored before best-effort telemetry. Polls identify provider from task metadata and never switch an already accepted task. Kie polls do **not** enter the Grsai timeout resubmit logic. Owner-scoped auth, persistence using the existing Consumer Blob access policy before settlement, replay ID, per-attempt provider/model lineage and exactly-once quota remain existing #439 contracts.

Consumer submit has a 60-second function budget. The Kie adapter therefore enforces an overall provider-admission deadline 50 seconds after entry (including earlier Grsai admission in `auto-definitive`), with a further two-second request reserve. If that deadline expires before `createTask` is sent, Kie is provably **NOT_SENT** and the task becomes safely retryable; if the createTask request was sent but acknowledgement is uncertain, it stays **UNKNOWN** for reconciliation. This bounds slow-primary-then-secondary incidents without an unpersisted extra paid generation.

On an apparent provider outage, prefer **force-consumer for NEW work**, not a mass re-dispatch of accepted or uncertain tasks. Turn mode to `off` to roll back new routing. The switch is environment-controlled and takes effect when the application environment/configuration is applied; an already accepted Kie task must remain pollable after the switch is off.

## Kie protocol implemented

Server only. From the request-local person and frame data URIs:

1. Stream-upload each file over TLS to `https://kieai.redpandaai.co/api/file-stream-upload`; accept only HTTP success with JSON `success:true`, `code:200` and allowlisted `https://tempfile.redpandaai.co/...` URL. Uploads occur before billable createTask. Filenames are randomized; never expose the resulting URLs to clients/logs.
2. One `POST https://api.kie.ai/api/v1/jobs/createTask` request with exact model and `input:{prompt,image_urls:[person,frame],aspect_ratio:'auto'}`. Prompt built by the same `buildTryOnPrompt` function/version as Grsai. Require business `code:200` and a syntactically valid `data.taskId`. Every ambiguous create response stays UNKNOWN; do **not** resend.
   If reference staging fails **before** createTask is sent, mark the task FAILED safely and allow an explicit user retry without a Kie generation charge; do not mislabel this provable no-submit case UNKNOWN.
3. Poll `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...`; `waiting/queuing/generating` remain pending; only explicit `fail` is terminal; `success` requires exactly one HTTPS allowlisted result URL in parsed `resultJson.resultUrls`. **One synthetic live Kie task and Kie's official download docs confirmed `tempfile.aiquickdraw.com`** (2026-10-24). This exact output hostname is allowed; HTTP, credentials, nonstandard ports, deceptive suffixes and its subdomains remain rejected. Upload host restrictions are unchanged. Body errors and network failures are transient and back off.
4. Fetch allowlisted result with redirects rejected, image-only MIME and a **stream-enforced** 15 MiB cap even without Content-Length; then persist to the existing Consumer Vercel Blob store/access policy before marking COMPLETED and settling usage once.

## Data/privacy/release HOLD

The Kie File Upload API says inputs remain downloadable via its temporary host and are deleted **24 hours** after upload. Model result files remain available for **14 days** per record-info docs. This is provider-controlled temporary access; neither is evidence of zero-retention, endpoint private ACL, downstream Google retention, immediate purge or data-region compliance. **No real consumer photos may be sent** until privacy and data-transfer obligations are reviewed and explicit Lead approval recorded. Generated URLs may be served by additional hosts; the adapter deliberately fails closed for unverified domains, which must be enumerated in synthetic interoperability evidence before canary.

The user authorized exactly one synthetic live Kie task, completed 2026-10-24: two synthetic reference uploads, one `nano-banana-2-lite` createTask, four credits consumed (confirmed by task details and balance), and one 94,742-byte JPEG output verified in memory. The actual output hostname was `tempfile.aiquickdraw.com`; the allowlist fix is covered by strict positive/negative URL tests. This proves vendor upload/create/poll/download/charging, **not** production Blob end-to-end persistence or sustained availability. **No additional real paid calls are authorized**. This Draft PR does not authorize real consumer photos, production credentials/config, merge, deploy, or flag enablement. To promote:

1. Review code/CI and Codex disposable PostgreSQL + local browser 4-image Consumer safety paths, especially concurrent switching, no double charge and sign-out.
2. **Synthetic provider smoke completed** (one task/four credits); require separate review/approval of user-photo data processing, temporary URL exposure and privacy obligations before real-user use.
3. Reconcile actual Kie task ID, output MIME/image, Kie credit deduction and storage retention; then prepare an OFF-by-default deployment, capped new-Consumer canary and rollback with separate explicit authorization.

References: https://docs.kie.ai/market/google/nano-banana-2-lite ; https://docs.kie.ai/file-upload-api/upload-file-stream ; https://docs.kie.ai/file-upload-api/quickstart ; https://docs.kie.ai/market/common/get-task-detail ; https://docs.kie.ai/common-api/download-url .
