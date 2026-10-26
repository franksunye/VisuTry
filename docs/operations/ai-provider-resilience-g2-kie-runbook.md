# VisuTry — unified Grsai / Kie.ai provider switch

Status: Active (code shipping Grsai-default; Kie cutover gated). Owner: ChatGPT Lead. Background: #430, #434, #440, #443 and merged G1/G2 PRs #439, #441, #442.

## Scope and supported models

| Business flow | `AI_PROVIDER=grsai` (default) | `AI_PROVIDER=kie` |
| --- | --- | --- |
| Face Analysis (vision chat) | `gemini-3.1-flash-lite` via Grsai | `gemini-3-8-flash-openai` via Kie (comparable multimodal chat, **not identical**) |
| Consumer ordinary Try-On | `nano-banana-fast` via Grsai | `nano-banana-2-lite` via Kie |
| Merchant Store / Campaign live Try-On | `nano-banana-fast` via Grsai | `nano-banana-2-lite` via Kie |

Both Try-On aggregators advertise Google's `gemini-3.1-flash-lite-image` underneath their named offerings. Switching aggregators does **not** protect against an outage of the underlying Google model. Kie's Face Analysis substitute is a documented vision-chat model with similar purpose, selected for economical backup use; **model-output equivalence has not been claimed or tested**. The owner waived model-output comparison and further live provider checks for this release; this is an interface/documentation-based implementation.

**Boundary:** The existing Premium **direct Gemini** implementation is not a Grsai call and remains unchanged. Store prepared-demo paths do not create generation tasks. Face Analysis and Try-On continue to store images in their current Vercel Blob stores and follow existing policies, including the Merchant `public-poc` configuration. There is **no** Blob migration.

## Configuration: one operator switch

| Variable | Value | Effect |
| --- | --- | --- |
| `AI_PROVIDER` | `grsai` (or absent) | Default: all Grsai-backed work uses Grsai; no new Kie traffic |
| `AI_PROVIDER` | `kie` | New Face Analysis and ordinary Consumer / Merchant Try-On work uses Kie |
| `KIE_API_KEY` | Private server-side token | Required only when `AI_PROVIDER=kie` |

Only the two explicit values are supported. Unknown values or choosing Kie without a key fail closed, rather than accidentally submitting to another provider. Do not prefix these settings with `NEXT_PUBLIC_` or expose the key to clients.

`KIE_TRYON_FALLBACK_MODE` (`off`, `force-consumer`, `force-all`, `auto-definitive`) is **deprecated and ignored**. Do not set it to control traffic. There is **no automatic fallback, circuit breaker or cross-provider retry**. One operator choice applies to all Grsai-backed routes; a non-provider `forceServiceType` override in legacy Consumer batch flows is preserved for compatibility.

**Task pinning and charges:** A provider is selected when a new task is created. Consumer and Merchant Try-On continue polling the *persisted* task's provider and external ID, including if the operator changes `AI_PROVIDER` meanwhile. If admission has an unknown outcome, never start a second image generation; retain the existing idempotency keys, dispatch leases, tenant ownership, quota and sponsored-settlement rules. Face Analysis is synchronous and uses its chosen provider for that request, with the provider/model recorded in task metadata. **Existing Face Analysis concurrent `clientSubmissionId` requests are not durably deduplicated**; do not claim exactly-once provider usage on that path.

## Server-side protocol and privacy

- Grsai Face Analysis: existing multimodal chat `gemini-3.1-flash-lite` with in-request `data:` image URI.
- Kie Face Analysis: reuse the existing Kie stream-upload endpoint (`https://kieai.redpandaai.co/api/file-stream-upload`); obtain its allowlisted HTTPS temporary URL in server memory, then make a *single* POST to `https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions` with OpenAI-style `messages` containing prompt text and `image_url`, `stream:false`, low reasoning and the Kie bearer token. Consume `choices[0].message.content` with the existing Face Analysis parser. No automatic retry on ambiguous chat response.
- Kie Try-On: existing upload of two source images, one `nano-banana-2-lite` `createTask`, provider-aware poll, bounded validated output fetch and existing Blob persistence. UNKNOWN submit remains UNKNOWN (no duplicate POST); accepted tasks remain pinned to Kie.
- Kie temporary upload and model-result URLs are not returned to the browser, persisted in task metadata or logged. Uploaded media is provider-hosted during processing; the existing public/private **VisuTry** Blob access setting does not govern access to those temporary provider files. Kie's file-upload docs describe a 24-hour upload lifetime, and its task-result docs describe a 14-day file lifetime. Do not characterize these URLs as private, short-lived ACL-protected, or zero-retention without independent evidence.

Documents: [Kie vision chat](https://docs.kie.ai/market/gemini/gemini-3-8-flash-openai), [Kie Nano Banana 2 Lite](https://docs.kie.ai/market/google/nano-banana-2-lite), [Kie stream upload](https://docs.kie.ai/file-upload-api/upload-file-stream), [Kie task details](https://docs.kie.ai/market/common/get-task-detail). Keep the public privacy notice accurate about transfer to an additional processor; the corresponding notice update was tracked in Draft PR #444, **not automatically published by this code change**.

## Production release and incident operation

**Release default:** `AI_PROVIDER=grsai` (or unset). The availability of `KIE_API_KEY` alone does not generate Kie traffic. Changing environment variables on Vercel is not an instant switch: **deploy a new Production revision** to snapshot the configuration. The repository's `scripts/vercel-ignore-build.sh` can skip deployments; an approved redeploy should disable the project's Ignore Build Step for that redeploy, verify READY and the actual Production aliases (`visutry.com` and `www.visutry.com`).

1. Record the incident/change ID, operator, current Production SHA, environment choice, known-good READY deployment, and rollback target.
2. **After explicit owner approval for real photo transfer and the published privacy notice**, set Production `AI_PROVIDER=kie`; do not modify Blob policy, merchant data or unrelated credentials. Redeploy the approved code revision as Production and verify the alias and the active environment selection using safe operational evidence.
3. Observe new-task provider attribution, submission success/UNKNOWNs, duration, consumer quota, merchant sponsored settlements and media access; ensure existing Grsai tasks still poll Grsai. The model-output / live-provider verification steps were intentionally waived by the owner; do not invent PASS results.
4. To roll back, set `AI_PROVIDER=grsai` (or remove it) and **redeploy**. Previously submitted Kie tasks must continue to be polled at Kie, never resubmitted at Grsai. Preserve the previous READY deployment as an alternative rollback path.

**Authorization boundary:** Shipping the new code with `AI_PROVIDER=grsai` is distinct from permitting real user photo transfer to Kie. A code release does **not** authorize changing the Production provider to `kie`; that requires the owner's separate go-ahead and accurate public privacy disclosure. No synthetic comparison, paid live Kie task or vendor questionnaire is required as a release prerequisite per the owner's 2026-10-26 decision.

## Earlier engineering evidence (historical)

PR #442 exact functional HEAD `cf624208` was locally rechecked on Consumer and public-poc Store/Campaign synthetic paths, with submit idempotency, UNKNOWN replay and quota/sponsored settlement controls. Evidence: [Issue #440](https://github.com/franksunye/VisuTry/issues/440#issuecomment-6399206221). A prior isolated live **synthetic** Kie Try-On task confirmed upload/create/poll and that image outputs may use `tempfile.aiquickdraw.com`, now on the existing strict output allowlist. The synthetic workflow did not verify real Blob or Face Analysis Kie response quality. The current change adds the unified selector and documented Kie vision chat; no additional live Kie calls are included.
