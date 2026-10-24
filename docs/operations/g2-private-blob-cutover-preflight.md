# G2 private Blob cutover preflight (Draft / Production HOLD)

This checklist prepares an **OFF-by-default** release of Draft PRs #439 → #441 → #442 → #446, with the separate privacy notice in #444. It does not authorize a merge, Production environment change, deployment, user-photo export, or Kie routing. Release gate: [#443](https://github.com/franksunye/VisuTry/issues/443); private storage gate: [#445](https://github.com/franksunye/VisuTry/issues/445).

## Evidence already available

- #446 exact HEAD `2acfe3da12163236f6be8488fc222216b3c08f47` passed its three GitHub Quality Gate jobs. The [Development-only real private Blob recheck](https://github.com/franksunye/VisuTry/issues/445#issuecomment-6385922748) accepted the matching RW token/Store ID, rejected wrong pairs before any SDK call, and deleted both synthetic test objects.
- The earlier [local HTTP/PostgreSQL/Blob proof](https://github.com/franksunye/VisuTry/issues/445#issuecomment-6385587147) covered Consumer and Store media authorization, signed reads, historical public records, and cleanup. The identity mismatch found there was fixed and rechecked on the newer SHA.
- Read-only Vercel metadata on 2026-10-24 shows one available **private** Blob Store connected to `visutry` for Production with the existing `RPIVATE_BLOB` prefix. The Production `RPIVATE_BLOB_STORE_ID` equals that Store's ID. The complete project environment-variable inventory shows `FACE_ANALYSIS_BLOB_ACCESS_MODE` and `FACE_ANALYSIS_BLOB_STORE_ID` configured as sensitive values; their values are **not verified** through the read-only interface. `STORE_ASSET_ACCESS_MODE` is `public-poc`. Explicit `TRY_ON_BLOB_*` and Kie variables are absent. Store IDs, credentials and customer object details are intentionally omitted here.

The Development QA result does **not** prove Production's sensitive variable values, RW token validity, deployed runtime identity, or Merchant parity after a private cutover.

## Before requesting Production changes

1. Identify the exact source revision, current Production deployment and both active aliases. Confirm the stacked ancestry of #439 → #441 → #442 → #446 against current `main`; review #444 separately. A local merge rehearsal on 2026-10-24 found no tree conflict between #446 and #444, but this is not code-review approval.
2. In an authorized, secret-safe Production administration context, compare `FACE_ANALYSIS_BLOB_STORE_ID`, `RPIVATE_BLOB_STORE_ID`, and the actual private Store connection. Check `FACE_ANALYSIS_BLOB_ACCESS_MODE`. Do not copy, print or send RW tokens. The ordinary CLI environment listing is incomplete for this project, and Vercel does not export seven sensitive Production values to local `env run`; absence from those outputs is not evidence of absence in the deployment.
3. Approve the public privacy notice for both Consumer and Store/Campaign photo processing. Obtain a separate owner decision for code merge, OFF deployment, any Production Blob configuration change, and later real customer media export to Kie. Define canary volume, acceptable spend/loss and stop thresholds before enabling Kie.
4. Select **one** existing verified private Production Store for new Try-On media. Configure the complete, matching `TRY_ON_BLOB_STORE_ID` + `TRY_ON_BLOB_READ_WRITE_TOKEN` pair explicitly for Production, with `TRY_ON_BLOB_ACCESS_MODE=private`. The application validates the RW token's embedded Store ID. Do not use the public `BLOB_READ_WRITE_TOKEN` as a fallback or silently rename the deployed `RPIVATE_BLOB_*` variables. Preserve Face Analysis behavior independently.

## Approved OFF deployment sequence (future operation)

These are proposed steps for a separately approved change, not instructions to execute now.

1. Snapshot the approved previous READY deployment, its alias mapping, and the current Production variable names/targets. Keep historical public objects and their recorded `PUBLIC_TEMPORARY` metadata untouched.
2. Apply the approved private Try-On pair and `STORE_ASSET_ACCESS_MODE=private` to a **new** Production deployment while setting `KIE_TRYON_FALLBACK_MODE=off` and leaving `KIE_MEDIA_EXPORT_APPROVED` false/absent. Vercel environment edits do not change running deployments. Keep the private pair available for reads and cleanup throughout rollback and retention.
3. Run `npx tsx scripts/preflight-g2-private-blob.ts` only in a secured process with that deployment's exact environment. It emits Boolean checks and reason codes, never values. `CONFIG_PASS` proves local application configuration consistency **only**; separately verify the live Production Store connection and a bounded synthetic private `put/head/get/del` against the approved Store.
4. Before any Kie enablement, use synthetic Consumer and Store/Campaign requests through the new Production alias to prove ordinary **Grsai** upload, private source/result delivery, session/tenant denial, cleanup, and single quota/sponsorship settlement. Confirm historical public Store assets still resolve through their recorded access mode. Do not use customer photos for this check.
5. Compare the two actual public aliases and deployed SHA to the approved revision. If the build was skipped, alias unchanged, private read fails, or old public assets break, stop and return new requests to the prior approved mode/deployment. Do not replay accepted or UNKNOWN generation tasks.

## Later Kie enablement and rollback

Only after the OFF private-storage deployment passes, the privacy notice is approved, and the owner authorizes customer-media export may an operator set `KIE_MEDIA_EXPORT_APPROVED=true`, supply `KIE_API_KEY`, and deploy an approved `auto-definitive` or incident `force-all` mode. Record the new deployment SHA and aliases. Accepted and UNKNOWN Grsai/Kie tasks remain pinned to their original provider and are polled; no blind resubmit is permitted. Compare provider creates with quota/sponsorship settlements.

For a routing rollback, deploy `KIE_TRYON_FALLBACK_MODE=off` or the prior approved mode for **new** tasks. Keep the Kie credential as needed to poll already accepted Kie tasks, and retain private Blob credentials while any private assets or cleanup jobs remain. A privacy incident may require key revocation and manual reconciliation; it does not authorize repeating uncertain provider submissions. Reverting `STORE_ASSET_ACCESS_MODE` to `public-poc` affects only new Store writes and does not make existing private objects public or historical public URLs private. Handle any such rollback as a separate approved storage change.

## Current blockers

- Production sensitive Face Analysis mode/Store ID and actual token binding are not yet independently verified; the configured private Store connection alone is insufficient.
- Production Merchant is still `public-poc`; explicit private Try-On variables and Kie configuration are absent.
- #444 privacy notice, stacked PR merges, Production cutover and later customer-media export require their own owner approvals. Until then, **Production HOLD**.
