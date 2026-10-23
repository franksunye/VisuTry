# G2 — Kie.ai same-model Consumer Try-On secondary (Draft / disabled)

Owner: ChatGPT Lead. Governing issues: #430, #434, #440. Stacked safety foundation: Draft PR #439 exact HEAD `384bb6cbf4772bdb179acc90b982df2021aafe89`.

## Scope and model parity

- Grsai `nano-banana-fast` stays Primary. Kie `nano-banana-2-lite` is the only Secondary. Both vendor notices identify underlying Google `gemini-3.1-flash-lite-image`. This is aggregator redundancy, **not** redundancy against a shared model outage.
- Only new ordinary **Consumer** Grsai-bound Try-On tasks are candidates. Premium Gemini, explicitly forced Grsai batch paths, Store/Campaign, Face Analysis and existing accepted tasks are untouched.
- G1 eight-image comparative quality/price bake-off was waived by the user; live protocol/cost/privacy approval was **not** waived.

## Flags and safety

Kie routing defaults to OFF. It requires all of the following server-only env values:

| Variable | Required to arm | Default |
| --- | --- | --- |
| `KIE_API_KEY` | Kie private bearer token | absent |
| `KIE_MEDIA_EXPORT_APPROVED` | exactly `true`, after separately approved user-photo transfer/privacy review | absent = blocked |
| `TRY_ON_BLOB_ACCESS_MODE` | `private` with existing private Blob store credentials | public = blocked |
| `KIE_TRYON_FALLBACK_MODE` | `force-consumer` or `auto-definitive` | absent/unknown = off |

Modes:

- **off (default):** existing Grsai/Gemini behavior, no Kie network calls.
- **force-consumer:** operator switches only *new* ordinary Consumer tasks directly to Kie. Preferred reversible incident response. Existing Grsai task IDs remain Grsai-owned and polled there.
- **auto-definitive:** new tasks start at Grsai; switch to Kie once and only once when Grsai returned an explicit negative **business-code** admission without task ID: 400, 401, 403, 422 or 429. A missing/malformed body, HTTP error, provider 503/5xx, timeout, aborted request, lost response or accepted task is **UNKNOWN** and cannot automatically fall back. Kie's ambiguous admission is also UNKNOWN.

The second outbound POST is guarded by a Consumer-only durable `dispatchVersion` claim and an UNKNOWN-before-send state. Accepted external Kie IDs are stored before best-effort telemetry. Polls identify provider from task metadata and never switch an already accepted task. Kie polls do **not** enter the Grsai timeout resubmit logic. Owner-scoped auth, private image persistence before settlement, replay ID, per-attempt provider/model lineage and exactly-once quota remain existing #439 contracts.

On an apparent provider outage, prefer **force-consumer for NEW work**, not a mass re-dispatch of accepted or uncertain tasks. Turn mode to `off` to roll back new routing. The switch is environment-controlled and takes effect when the application environment/configuration is applied; an already accepted Kie task must remain pollable after the switch is off.

## Kie protocol implemented

Server only. From the request-local person and frame data URIs:

1. Stream-upload each file over TLS to `https://kieai.redpandaai.co/api/file-stream-upload`; accept only HTTP success with JSON `success:true`, `code:200` and allowlisted `https://tempfile.redpandaai.co/...` URL. Uploads occur before billable createTask. Filenames are randomized; never expose the resulting URLs to clients/logs.
2. One `POST https://api.kie.ai/api/v1/jobs/createTask` request with exact model and `input:{prompt,image_urls:[person,frame],aspect_ratio:'auto'}`. Prompt built by the same `buildTryOnPrompt` function/version as Grsai. Require business `code:200` and a syntactically valid `data.taskId`. Every ambiguous create response stays UNKNOWN; do **not** resend.
   If reference staging fails **before** createTask is sent, mark the task FAILED safely and allow an explicit user retry without a Kie generation charge; do not mislabel this provable no-submit case UNKNOWN.
3. Poll `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...`; `waiting/queuing/generating` remain pending; only explicit `fail` is terminal; `success` requires exactly one HTTPS allowlisted result URL in parsed `resultJson.resultUrls`. Body errors and network failures are treated as transient and back off using the Consumer safety path.
4. Fetch allowlisted result with redirects rejected, image-only MIME and 15 MiB cap, then persist to private Vercel Blob before marking COMPLETED and settling usage once.

## Data/privacy/release HOLD

The Kie File Upload API says inputs remain downloadable via its temporary host and are deleted **24 hours** after upload. Model result files remain available for **14 days** per record-info docs. This is provider-controlled temporary access; neither is evidence of zero-retention, endpoint private ACL, downstream Google retention, immediate purge or data-region compliance. **No real consumer photos may be sent** until privacy and data-transfer obligations are reviewed and explicit Lead approval recorded. Generated URLs may be served by additional hosts; the adapter deliberately fails closed for unverified domains, which must be enumerated in synthetic interoperability evidence before canary.

The stacked Draft PR / GitHub mock CI does not grant permission to register/pay for Kie, store a credential, upload photos, issue real API calls, merge, deploy or enable routing. To promote:

1. Review code/CI and Codex disposable PostgreSQL + local browser 4-image Consumer safety paths, especially concurrent switching, no double charge and sign-out.
2. Lead approves vendor data processing, temporary-URL exposure, exact output CDN host allowlist, and a tiny synthetic two-reference-image paid API interoperability + credit-ledger smoke with cash cap.
3. Reconcile actual Kie task ID, output MIME/image, Kie credit deduction and storage retention; then prepare an OFF-by-default deployment, capped new-Consumer canary and rollback with separate explicit authorization.

References: https://docs.kie.ai/market/google/nano-banana-2-lite ; https://docs.kie.ai/file-upload-api/upload-file-stream ; https://docs.kie.ai/file-upload-api/quickstart ; https://docs.kie.ai/market/common/get-task-detail .
