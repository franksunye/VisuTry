# AI Provider Resilience — G1-R1 Zero-Spend Integration Review

**Date:** 2026-10-22  
**Purpose:** Review-only integration of isolated evidence and code. **Do not merge or deploy without Lead approval.**
**Tracked:** #430, #434, #435, #437; source Draft PRs #432, #436, #438.

## Immutable source snapshots and precedence

| Source | Exact source HEAD | Imported contents | Treatment |
| --- | --- | --- | --- |
| #432 baseline | e780ad63fb972e6539aa76bd64279bc30af352ed | G0 audit, vendor screen, synthetic fixture manifest and 16 JPEG images, Face Analysis/Grsai characterization tests, product-plan updates | Historical evidence from pre-fix code; never rewrite its results as current deployed behavior |
| #436 Consumer safety | b714ca2f13e441b282a5cc1a999f230a9b16325e | All seven code/test/runbook changes; integration branch is its child | Authoritative implementation for Consumer dispatch CAS, uncertain acceptance, one-owner timeout retry, polling backoff, replay and quotas |
| #438 Kie offline | ed5685d61c306c107a35b0f810960557c78648da | Test-only Kie contract helper, unit suite and runbook | Reserved .invalid URLs, no real transport or paid calls |

The old tests/unit/lib/tryon-service.test.ts blob from #432 is intentionally **NOT imported**, because its "expected old bug" assertions conflict with #436's fixed behavior:

1. Ordinary Consumer repeated clientSubmissionId now returns the original task, including unique-race recovery, rather than a 500-shaped conflict.
2. Polling 429/503 now preserves processing state with a bounded Consumer-only backoff rather than treating transient HTTP failures as terminal.
3. Concurrent Consumer timeout pollers now claim a single fenced provider retry, and unknown acceptances are not retried.

These are behavior changes, not omissions: #436 contains positive versions of the three scenarios plus additional regression cases. The #432 audit/fixture documents describe the condition of the earlier snapshot and must not be cited as evidence that the same bugs remain on this integration branch.

## Test gates

- #436 exact-head remote Quality Gate #1274: three jobs SUCCESS; 2,532 passed, one skipped.
- #436 local Codex at b714ca2f: three Jest suites / 49 tests PASS; real disposable PostgreSQL CAS probes for first dispatch vs stale reconciliation (30), competing timeout retry (30) and stale poll write fencing (30), all PASS. These are local database-level proofs, **not browser end-to-end proof**.
- #438 exact-head remote Quality Gate #1275: three jobs SUCCESS; 362 suites / 2,543 tests passed, one skipped, including Kie fake-client suite.
- **Combined exact-head Quality Gate:** Pending; must pass on the integration commit before signoff. Combined CI cannot be inferred solely from the separate branch checks.

## Guardrails

- No vendor account registration, funding, API key, URL upload, billable provider call, real user photo, schema migration, feature flag activation, production routing or deployment.
- All Consumer replay, unknown outcome, idempotency and quota invariants remain enforceable; Store remains separate and not altered by Consumer-only backoff.
- Synthesized test assets are not consent to send face media externally. The Kie fake client uses reserved *.invalid strings, never the JPEG bytes.
- G1-R1 does not prove provider availability, billable model routing, 4/4 paid-user image experience, quality, pricing, retention or private photo transport. All such gates require independent approval/evidence.

**Next decision:** Lead can review the combined Draft PR and its exact-head CI. Any deployment of Consumer safety needs a separate production release/rollback decision. Actual Kie routing remains out of scope.
