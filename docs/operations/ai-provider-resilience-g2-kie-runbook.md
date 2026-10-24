# G2 / G2-R2 — Kie.ai same-model Try-On secondary (Draft / disabled)

Owner: ChatGPT Lead. Governing issues: #430, #434, #440. Stacked safety foundation: Draft PR #439 exact HEAD `384bb6cbf4772bdb179acc90b982df2021aafe89`.

## Scope and model parity

- Grsai `nano-banana-fast` stays Primary. Kie `nano-banana-2-lite` is the only Secondary. Both vendor notices identify underlying Google `gemini-3.1-flash-lite-image`. This is aggregator redundancy, **not** redundancy against a shared model outage.
- New ordinary **Consumer** and live **Store/Campaign** Grsai-bound Try-On tasks are eligible under the manual `force-all` routing mode added by G2-R2 #442. `auto-definitive` and `force-consumer` remain Consumer-only. Premium direct-Gemini, Store prepared-demo (no generation), Face Analysis and already accepted/UNKNOWN tasks are not rerouted. Store sponsorship, tenant/session access and result-delivery business logic remain separate.
- G1 eight-image comparative quality/price bake-off was waived by the user; live protocol/cost/privacy approval was **not** waived.

## Flags and safety

The Production private-storage cutover has a separate [G2 private Blob preflight](./g2-private-blob-cutover-preflight.md). Complete its OFF-deployment and legacy-media checks before treating any Kie routing flag as releasable.

Kie routing defaults to OFF. It requires all of the following server-only env values:

| Variable | Required to arm | Default |
| --- | --- | --- |
| `KIE_API_KEY` | Kie private bearer token | absent |
| `KIE_MEDIA_EXPORT_APPROVED` | exactly `true`, after separately approved user-photo transfer/privacy review | absent = blocked |
| `TRY_ON_BLOB_ACCESS_MODE` | `private` with existing private Blob store credentials | public = blocked |
| `KIE_TRYON_FALLBACK_MODE` | `off`, `auto-definitive`, `force-consumer` or `force-all` | absent/unknown = off |
| `STORE_ASSET_ACCESS_MODE` | for Kie Store/Campaign routing, private asset storage (`private` or unset) | default private; `public-poc` blocks Store Kie |

Modes:

- **off (default):** existing Grsai/Gemini behavior, no Kie network calls.
- **force-consumer:** operator switches only *new* ordinary Consumer tasks directly to Kie. Existing Grsai task IDs remain Grsai-owned and polled there.
- **force-all (G2-R2):** operator routes *new* ordinary Consumer and live Store/Campaign generation tasks to Kie when all gates pass; **no provider switch for existing task IDs**. A public Store asset mode fails closed for Store. Does not affect Premium Gemini or Store prepared demos. This is the preferred single manual incident setting for both product surfaces.
- **auto-definitive (Consumer only):** new eligible Consumer tasks start at Grsai; switch to Kie once and only once when Grsai returned an explicit negative **business-code** admission without task ID: 400, 401, 403, 422 or 429. A missing/malformed body, HTTP error, provider 503/5xx, timeout, aborted request, lost response or accepted task is **UNKNOWN** and cannot automatically fall back. Kie's ambiguous admission is also UNKNOWN.

The Consumer fallback's second outbound POST is guarded by a durable `dispatchVersion` claim and an UNKNOWN-before-send state. G2-R2 Store Kie dispatch similarly records PROCESSING/UNKNOWN before the one non-idempotent createTask and stores accepted external Kie IDs before best-effort telemetry/sponsored-usage callbacks. Polls identify provider from task metadata and never switch an accepted or UNKNOWN task. Kie polls do **not** enter the Grsai timeout resubmit logic. Consumer credits and Merchant sponsored entitlements remain separate; private image persistence, tenant/session authorization, per-attempt provider/model lineage and exactly-once settlement are required.

Consumer submit has a 60-second function budget. The Kie adapter therefore enforces an overall provider-admission deadline 50 seconds after entry (including earlier Grsai admission in `auto-definitive`), with a further two-second request reserve. If that deadline expires before `createTask` is sent, Kie is provably **NOT_SENT** and the task becomes safely retryable; if the createTask request was sent but acknowledgement is uncertain, it stays **UNKNOWN** for reconciliation. This bounds slow-primary-then-secondary incidents without an unpersisted extra paid generation.

## Operator incident workflow — manual only

This is currently a **server environment-variable routing choice**, **not** an instant administrator UI switch. There is no automatic failure-rate circuit breaker. Vercel environment variable edits apply **only to new deployments**; old function instances keep their snapshot. The site's `scripts/vercel-ignore-build.sh` deliberately skips all Preview builds and docs-only Production pushes. **Do not infer success from updating an env variable or requesting a redeploy.**

**Approved-operator redeploy procedure (only after separate production-change approval):**
1. Record the incident/change ticket, exact known-good READY Production deployment SHA, current `main` SHA, active `visutry.com` and `www.visutry.com` aliases, previous rollback candidate and current route mode.
2. Apply the approved Production-only `KIE_TRYON_FALLBACK_MODE` value. Do not change unrelated keys, private Blob mapping, user data, or preview environments.
3. In Vercel **Project → Deployments**, choose the *approved* deployed code revision, open **… → Redeploy**, and **uncheck “Use project's Ignore Build Step”** to bypass `scripts/vercel-ignore-build.sh`. Confirm the redeploy is targeted to **Production**, not Preview, and will include the new environment snapshot. See [Vercel's Ignored Build Step on redeploy guidance](https://vercel.com/docs/project-configuration/project-settings#ignore-build-step-on-redeploy).
4. Wait for READY. Inspect the new deployment source SHA, Production target and both actual public aliases; confirm fresh synthetic Consumer, Store and Campaign routes. Only **new** tasks should see the changed provider; old accepted/UNKNOWN tasks retain their recorded provider. Measure actual decision-to-confirmed-traffic time rather than assuming the historical 3–5 minute build is a complete switch SLA.
5. If build is skipped/canceled, alias is not reassigned, provider mismatches or safety checks fail, stop the cutover. Revert to the prior approved mode by the same *approved* new-deployment method; confirm active alias and existing tasks remain safe. Keep the previous READY deployment as a rollback candidate.

**No production operation is authorized by this runbook itself.** The skip-build override is only an operator procedure, not a request to alter the project's default cost-optimized build policy.

1. **Normal operation after the separate media/privacy release approval:** configure `KIE_TRYON_FALLBACK_MODE=auto-definitive` to keep Grsai primary and permit Consumer-only clear-rejection fallback. If privacy gates have not been approved, leave Kie disabled (`off`, missing key and missing `KIE_MEDIA_EXPORT_APPROVED`).
2. **Human-confirmed Grsai incident:** record incident/operator/time and target deployment SHA; change mode to `force-all`, apply the runtime configuration and verify fresh **synthetic** ordinary Consumer, live Store and Campaign requests go to Kie once. Confirm the Store asset policy is private. No automated resubmission or migration of preexisting Grsai/UNKNOWN tasks.
3. **Stabilization:** monitor new-task success, failures, latency, vendor charges, quota/sponsorship consumption, and stored-media access separately for Consumer and Store/Campaign. Kie and Grsai share the underlying image model, so a shared model outage may affect both.
4. **Human-confirmed recovery:** restore `auto-definitive` (or `off` if temporarily disabling Kie), apply configuration, verify new tasks route to Grsai and accepted old Kie tasks continue polling Kie. Log rollback time and post-switch checks.
5. **Privacy/security failure:** use `off`, revoke Kie export authorization and key as appropriate, keep previously submitted tasks pinned, and reconcile any UNKNOWN/accepted tasks without reposting original user media. Follow the security incident process.

**Release gate:** `force-all` has not been approved for production. An extra Kie supplier enquiry/DPA letter is **not required** per the product owner's decision. Actual Consumer/Store user-photo export still requires **VisuTry owner approval**, accurate public disclosure (Draft #444), verified private Blob readiness, versioned Production deployment and controlled canary/rollback authorization. Do not interpret passing synthetic E2E or this runbook as permission to enable Kie or send real images.

## G2-R2 local engineering verification (synthetic only)

PR #442 exact code HEAD `77b0cc374b15ddde5a581262ee47c57a9cb2ae84` passed Quality Gate 3/3 (373 Jest suites, 2,647 passed, 1 skipped) and disposable localhost Next.js/PostgreSQL/provider HTTP mock/private-Blob stub verification on the same code commit. Evidence: [Issue #440](https://github.com/franksunye/VisuTry/issues/440#issuecomment-6379754123).

Verified in mock paths: OFF and `auto-definitive` parity; `force-all` Consumer + Store/Campaign routing; provider pinning across manual switches; Store Kie accepted/UNKNOWN/NOT_SENT and idempotent replay; single sponsored settlement; private result delivery; cross-session 401 and cross-merchant 404. No live supplier calls or new spend. UI result mock used a **transparent 1×1 PNG**, so visual composition, eyeglass fit and full output quality are **not proven**; Premium Gemini and prepared-demo were not individually replayed. This is a **local synthetic functional PASS**, not a release approval.

## Kie protocol implemented

Server only. From the request-local person and frame data URIs:

1. Stream-upload each file over TLS to `https://kieai.redpandaai.co/api/file-stream-upload`; accept only HTTP success with JSON `success:true`, `code:200` and allowlisted `https://tempfile.redpandaai.co/...` URL. Uploads occur before billable createTask. Filenames are randomized; never expose the resulting URLs to clients/logs.
2. One `POST https://api.kie.ai/api/v1/jobs/createTask` request with exact model and `input:{prompt,image_urls:[person,frame],aspect_ratio:'auto'}`. Prompt built by the same `buildTryOnPrompt` function/version as Grsai. Require business `code:200` and a syntactically valid `data.taskId`. Every ambiguous create response stays UNKNOWN; do **not** resend.
   If reference staging fails **before** createTask is sent, mark the task FAILED safely and allow an explicit user retry without a Kie generation charge; do not mislabel this provable no-submit case UNKNOWN.
3. Poll `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...`; `waiting/queuing/generating` remain pending; only explicit `fail` is terminal; `success` requires exactly one HTTPS allowlisted result URL in parsed `resultJson.resultUrls`. **One synthetic live Kie task and Kie's official download docs confirmed `tempfile.aiquickdraw.com`** (2026-10-24). This exact output hostname is allowed; HTTP, credentials, nonstandard ports, deceptive suffixes and its subdomains remain rejected. Upload host restrictions are unchanged. Body errors and network failures are transient and back off.
4. Fetch allowlisted result with redirects rejected, image-only MIME and a **stream-enforced** 15 MiB cap even without Content-Length; then persist to private Vercel Blob before marking COMPLETED and settling usage once. Consumer and Store/Campaign now reuse the same bounded Kie reader; Store persists the actual JPEG/PNG/WebP extension and uses its own result lease and sponsored-settlement rules.

## Data/privacy/release HOLD

The Kie File Upload API says inputs remain downloadable via its temporary host and are deleted **24 hours** after upload. Model result files remain available for **14 days** per record-info docs. This is provider-controlled temporary access; neither is evidence of zero-retention, endpoint private ACL, downstream Google retention, immediate purge or data-region compliance. **No real Consumer or Store/Campaign shopper portraits may be routed to Kie** before explicit VisuTry owner approval and the private media controls are validated. The user has waived an additional Kie vendor questionnaire/DPA inquiry as a release prerequisite; do not treat external supplier correspondence as a blocking requirement. Generated URLs may be served by additional hosts; the adapter deliberately fails closed for unverified domains, which must be enumerated in synthetic interoperability evidence before canary.

The user authorized exactly one synthetic live Kie task, completed 2026-10-24: two synthetic reference uploads, one `nano-banana-2-lite` createTask, four credits consumed (confirmed by task details and balance), and one 94,742-byte JPEG output verified in memory. The actual output hostname was `tempfile.aiquickdraw.com`; the allowlist fix is covered by strict positive/negative URL tests. This proves vendor upload/create/poll/download/charging, **not** private Blob end-to-end persistence or sustained availability. **No additional real paid calls are authorized**. This Draft PR does not authorize real consumer photos, production credentials/config, merge, deploy, or flag enablement. To promote:

1. Review G1 #439, G2 #441 and G2-R2 #442 code/CI, the disposable synthetic localhost PostgreSQL + HTTP mock + private Blob/desktop/mobile evidence, and regression gaps; do not claim end-to-end real-image visual quality.
2. **Synthetic provider smoke completed** (one task/four credits). No new live test or vendor letter is required for release preparation. The VisuTry owner must approve actual image transfer and the reviewed public notice (separate Draft PR #444) before any real-user use; preserve the existing `KIE_MEDIA_EXPORT_APPROVED` fail-closed gate until that approval.
3. Confirm Production private Blob store credentials/mapping and active deployment SHA against actual Production aliases; prepare an **OFF-by-default** promotion, then separate controlled `auto-definitive` and incident `force-all` deployments and operator rollback with explicit authorization. Environment flag edits require a **new Vercel deployment**, not an instant admin toggle; see [Release Gate #443](https://github.com/franksunye/VisuTry/issues/443).

References: https://docs.kie.ai/market/google/nano-banana-2-lite ; https://docs.kie.ai/file-upload-api/upload-file-stream ; https://docs.kie.ai/file-upload-api/quickstart ; https://docs.kie.ai/market/common/get-task-detail ; https://docs.kie.ai/common-api/download-url .
