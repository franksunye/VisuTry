# G1-R1-B — Kie Two-Model Offline Protocol Contract

**Date:** 2026-10-22  
**Status:** Source and deterministic fake-client tests only; NOT provider qualification, production integration, or spend authorization.  
**Issues:** #430 / #434 / #435 / #437. **Independent of:** Draft PR #432 baseline fixtures and Draft PR #436 Consumer safety implementation.

## Scope and intent

This PR is a test-only contract lab under tests/support/, consumed by tests/unit/lib/generation/. No import from src/, no production route, feature flag, schema or provider credential. No HTTP implementation, fetch, media upload, callback listener, or real output download. No account registration, purchase, API call or production routing changes.

Kie documentation checked on 2026-10-22:

- Nano Banana 2 Lite: https://docs.kie.ai/market/google/nano-banana-2-lite
- FLUX.2 Pro Image-to-Image: https://docs.kie.ai/market/flux2/pro-image-to-image
- Task status: https://docs.kie.ai/market/common/get-task-detail

| Contract | Nano Banana 2 Lite | FLUX.2 Pro image-to-image |
| --- | --- | --- |
| Model | nano-banana-2-lite | flux-2/pro-image-to-image |
| Submit | POST /api/v1/jobs/createTask | Same |
| Reference inputs | input.image_urls, face first / frame second, max 10 | input.input_urls, face first / frame second |
| Prompt | input.prompt | input.prompt |
| Aspect / resolution | aspect_ratio auto; vendor public price assumes 1K, but no explicit resolution field in sampled documented payload | aspect_ratio 1:1; resolution 1K; nsfw_checker false |
| Expected output | 1 JPEG | 1 JPEG or PNG; do not infer MIME from URL suffix |
| Task read | GET /api/v1/jobs/recordInfo?taskId=... | Same |

Request media strings are deliberately synthetic **non-routable** https://g1-fixtures.invalid/... URL placeholders. The unit suite uses exactly the 8 logical IDs G1-TRYON-01..08 with face-01..08 and frame-01..08 naming in Draft PR #432, but the image files are **not** copied or uploaded on this branch. This does not assert that these input URLs are suitable for a paid production provider. No real personal data may enter this harness.

## Safety contract

1. HTTP 200 is not task acceptance: require business code 200 AND a nonempty data.taskId. Missing task IDs, connection exceptions, 408, 429, 5xx and uncertain business codes => UNKNOWN. Do not automatically resubmit from UNKNOWN.
2. Documented 400/401/403/404/422 may be classified as REJECTED, but this *does not authorize a charged alternative attempt*: Kie failure charging, routing, and per-code non-billing guarantees have not been validated.
3. The fake harness caches logical fixture/model submission promises *before* any awaited transport step. Two concurrent/replayed calls in the synthetic lab trigger one fake outbound request. This is not a production distributed lease; actual protection of billable requests remains under #436 and later provider integration gates.
4. State reads require a matching task ID and business code 200. waiting / queuing / generating remain PENDING. fail remains FAILED with reason. success requires parseable resultJson with exactly one HTTPS resultUrls entry. Invalid/mismatched/malformed result => UNKNOWN; no fallback.
5. creditsConsumed, when returned, is preserved as a nonnegative finite number. It is **not** a guarantee of price, customer charge, reference-image fee or settlement. Unrecognized charge values remain UNKNOWN.
6. Check output MIME by bytes only in a later explicitly approved test; URLs are not trusted as image format evidence. Generated media's documented ~14-day retention does not imply user image consent or safe retention.

## Evidence and next gate

Automated Jest cases exercise both model request shapes, 8 × 2 = **16** offline createTask calls, repeat deduplication, concurrent calls, simulated transport timeouts, 401/422/429/5xx and malformed response handling, recordInfo transitions, and synthetic-only URL enforcement. GitHub CI and local Codex validation still have to be observed on the exact PR head before marking this gate PASS.

Not proven by this mock lab:

- Real model availability; image fidelity, identity and exact frame geometry in try-on.
- p95 latency, provider stability, independent upstream fault domain, provider task lookup or idempotency semantics.
- Actual 1K pricing, reference image fees, retries, failed-task charges, currency, top-up minimum or balance.
- Vendor-side retention/deletion, legal/private face input transport, signed URLs or callbacks.
- Real API schema validation beyond documented examples; approval to call Kie or OpenRouter.

**Release gate:** Keep Grsai as the only currently operating production generation route. Do not merge this qualification as a production adapter or turn on candidate dispatch. A separate Lead decision and limited prepaid test budget will be needed *after* zero-spend gates are reviewed.
