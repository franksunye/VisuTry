# VisuTry G0 — Merchant Data Trust & Commercial Analytics Isolation

## Decision

`Merchant.classification` is the canonical source for Admin and commercial analysis. The allowed values are:

`REAL`, `POSSIBLE_EXTERNAL`, `INTERNAL`, `TEST`, `AUTOMATION`, `REFERENCE`, `SUSPICIOUS`, and `UNKNOWN`.

Only `REAL` is included in commercial KPIs. A self-service signup is not proof of commercial activation, so a newly created workspace starts as `POSSIBLE_EXTERNAL`. Classification is metadata for Admin/business analysis only; it never grants or removes tenant access.

The additive migration is [20260826170000_add_merchant_classification](../prisma/migrations/20260826170000_add_merchant_classification/migration.sql). It stores a stable audit source and a non-PII reason, preserves all existing rows, and does not rewrite sessions, events, intents, catalog, campaigns, credentials, billing, or published routes.

## Classification rules

- `REAL`: explicit, verified commercial merchant evidence. No current row met this bar in the G0 audit.
- `POSSIBLE_EXTERNAL`: owner-linked workspace or external business signal without verified commercial activation.
- `INTERNAL`: VisuTry-owned demo or internal workspace.
- `TEST`: named or operational test fixture.
- `AUTOMATION`: workspace created or exercised by an automated smoke/reconciliation path.
- `REFERENCE`: seeded reference pilot with reference/simulation traffic.
- `SUSPICIOUS`: placeholder, malformed, or third-party-derived identity requiring provenance review.
- `UNKNOWN`: missing or invalid classification; excluded from commercial KPIs until reviewed.

## G0 backfill mapping

The mapping is keyed by stable Merchant ID. No raw email addresses are stored here or in `classificationReason`.

| Merchant ID | Classification | Evidence summary |
| --- | --- | --- |
| `cmsoere1s0000n5fy1kbvpecs` | `REFERENCE` | Seeded REFERENCE pilot, `referenceData=true`, no ownership membership |
| `cmsor0lvi00006wi81kr12rkw` | `REFERENCE` | Seeded REFERENCE pilot, `referenceData=true`, no ownership membership |
| `cmsos85wx0000goi856lvrqq4` | `REFERENCE` | Seeded REFERENCE pilot, `referenceData=true`, no ownership membership |
| `cmsotuyga0000xzi8ed15j0sk` | `REFERENCE` | Seeded REFERENCE pilot, `referenceData=true`, no ownership membership |
| `cmsovc43q00003ai87qtpyf2r` | `REFERENCE` | Seeded REFERENCE pilot, `referenceData=true`, no ownership membership |
| `cmsq1vcg3000049fy2ngsqplk` | `INTERNAL` | VisuTry-owned internal demo seed and demo activity |
| `cmsrbe9qc000b04jotskfikmz` | `TEST` | Golden Path test fixture, `example.test`, test credential lifecycle |
| `cmsspfn70000704jm5j3z10uk` | `AUTOMATION` | VisuTry-owned source inspection/import/Store automation |
| `adcf6c19-0d1d-4013-8903-4d7a86da0662` | `TEST` | Cloudflare B1 test fixture |
| `60317b20-ed05-42dc-aa71-b7c763e3bc0b` | `TEST` | Cloudflare B1 test fixture with repeated agent audit writes |
| `b8a61016-5811-41a2-b0a6-8252a1551563` | `TEST` | Cloudflare B1 fixture with invalid website marker |
| `3f1d3aff-4dfa-4ff7-a0f8-fc12788a125c` | `TEST` | Staging routing test fixture |
| `b7233205-5856-449b-b710-69bbcabbd859` | `AUTOMATION` | Reconciliation smoke automation fixture |
| `cmsrptoun000704kwepb7ajcu` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `cmsrtj25p000h04lazbei4rbn` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `cmst4djr9000504jzup5jixo8` | `POSSIBLE_EXTERNAL` | Owner-linked workspace with credential audit only |
| `cmstfbgvi000804kwqu1w79v3` | `POSSIBLE_EXTERNAL` | Owner-linked workspace with credential audit only |
| `cmsvf5dqt000b04jrflnt3vcd` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `cmsxcaolm000704lh6tabe15j` | `POSSIBLE_EXTERNAL` | Owner-linked workspace with credential audit only |
| `41545ca7-0649-41a1-a589-cdfedb675e41` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `28c61131-f0af-4250-a3e2-4f5eb651b956` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `40ef9b58-776d-442e-8fa7-126cc2d9de6f` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `fb143c70-0419-4003-a8dd-de0bd8a35464` | `POSSIBLE_EXTERNAL` | Owner-linked self-service workspace; activation not verified |
| `f3b74bbb-ab32-4941-a77f-7a55eabeaeca` | `POSSIBLE_EXTERNAL` | Insights view observed; activation not verified |
| `b36b8d37-9bef-41a9-8095-6661c4d57b5e` | `POSSIBLE_EXTERNAL` | External eyewear URL observed; ownership and activation not verified |
| `4c1a5910-d46a-4f0a-a083-e4ddc5b99f93` | `SUSPICIOUS` | Placeholder identity and VisuTry route URL |
| `7340124d-5f8c-49da-be62-2fc162ea8445` | `SUSPICIOUS` | Third-party product URL-derived slug |
| `ab557de8-79a8-444e-b8a3-b5ca781a3df0` | `SUSPICIOUS` | Placeholder identity and malformed website URL |

Expected post-migration counts for the 28-row G0 snapshot are:

| Classification | Count |
| --- | ---: |
| `REAL` | 0 |
| `POSSIBLE_EXTERNAL` | 12 |
| `INTERNAL` | 1 |
| `TEST` | 5 |
| `AUTOMATION` | 2 |
| `REFERENCE` | 5 |
| `SUSPICIOUS` | 3 |
| `UNKNOWN` | 0 |

## Analytics contract

The Admin Merchant Portfolio loads relation counts through each `Merchant` (`sessions`, `frames`, `intents`, `experiences`) and applies the shared `isCommercialMerchant`/portfolio filter. It defaults to `Commercial`, with separate `Possible external`, `Internal / test`, `Reference`, `Suspicious`, `Unknown`, and `All` views. Session and intent rows do not receive a copied heuristic classification; their merchant relationship remains authoritative.

The acceptance regression model is: a `REAL` merchant with 10 sessions and 2 intents is counted in Commercial; adding 100 sessions/5 intents to Reference and 50 sessions/3 intents to Test/Automation leaves Commercial unchanged; All includes every row.

## Rollout and reclassification

Run the migration before deploying the Admin page and public self-service write-path changes. The first G0 production read should confirm 28 classified rows and the counts above without creating traffic. Promote a row from `POSSIBLE_EXTERNAL` to `REAL` only after an auditable activation signal is verified by an operator; the action should update classification metadata only. Keep tenant membership and all tenant-scoped authorization checks unchanged.
