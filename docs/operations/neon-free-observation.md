# Neon Free Observation Runbook

**Status:** Prepared; starts only after the detector telemetry change and the
Turso analytics event plane are deployed and verified.

**Scope:** Seven complete calendar days of observation. This is an operating
decision aid, not a guarantee that Neon Free has enough capacity for future
growth. Use the existing Neon, Vercel, Axiom, and Turso dashboards/metrics;
do not add a new polling or keep-alive job.

## Operating boundary

PostgreSQL remains the authoritative Core Transaction Plane for auth, users,
payments, credits, tasks, generation, merchant/store/campaign state, catalog,
usage, quota, entitlement, billing, authorization, idempotency, leases, and
fencing.

Turso is limited to the rebuildable `merchant_page_viewed` analytics event
slice. Its absence or failure is fail-open and must not change a successful
request. Axiom remains the log, error, latency, and detector telemetry plane.

The event classification for this change is explicit: `merchant_page_viewed` is
`ANALYTICS_ONLY` and is emitted after the PostgreSQL session and authoritative
`MerchantUsageLedger` write complete. `merchant_photo_uploaded`, all
`merchant_tryon_*` events, recommendation/compare events, MerchantIntent, and
all usage, quota, payment, and billing records remain PostgreSQL-backed because
they are either used by current merchant reporting or carry business-state
semantics.

The existing `FaceShapeDetection` PostgreSQL table is retained for schema and
historical compatibility; the browser detector endpoint no longer writes a
row solely to record free-detector telemetry.

## Wakeup audit

| Source | Classification | Decision |
| --- | --- | --- |
| User/auth/payment/task/merchant API traffic | CORE_REQUIRED | Keep |
| Vercel retention, cleanup, and pending-task sync crons | OPERATIONAL_REQUIRED | Keep; they settle or clean authoritative PostgreSQL state |
| Scheduled Production route smoke | OPERATIONAL_REQUIRED | Keep; it is a health signal, not a database keep-alive |
| GitHub Browser Smoke scheduled run | NONESSENTIAL | Removed; `workflow_dispatch` remains available for deliberate checks |
| `db:local:*`, migration, seed, audit, and report scripts | LOCAL_ADMIN | Manual only; never schedule as a production keep-alive |
| Cloudflare route checks and CI PostgreSQL services | OPERATIONAL_REQUIRED / LOCAL_ADMIN | Keep in their existing environments; no Production database target |

No nonessential Vercel cron, Cloudflare schedule, package script, or
operational keep-alive was found that could be removed without changing core
behavior. Logical-replication/CDC assets, if present, must be inspected
read-only and not dropped based on an ambiguous name or state.

## Day 0 baseline

Capture the dashboard date/time, release identifier, and the following values
before the observation clock starts:

- Neon CU-hours/day, active compute time/day, CPU, connection count, database
  query volume, and database write volume.
- Application p95 latency and error rate from existing Axiom/Vercel metrics.
- Axiom free face-detector event count and Turso analytics event count.
- Any current Neon suspend/wake or connection-error signal.

Do not print database URLs, tokens, payloads, images, biometric geometry, or
user data in the observation record.

## Daily record

Record one row for each complete day, using the same dashboard definitions
throughout the seven-day window:

| Day | CU-hours | Active time | CPU | Connections | DB queries | DB writes | App p95 | Errors | Detector Axiom events | Turso events | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 |  |  |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |  |  |

Annotate deploys, incidents, traffic anomalies, scheduled jobs, and any
provider outage instead of silently treating those days as representative.

## Decision thresholds

Use average CU-hours/day as the primary Neon Free sustainability signal:

- **IDEAL:** `< 2.0` CU-hours/day
- **ACCEPTABLE:** `2.0` to `< 2.5` CU-hours/day
- **WARNING:** `2.5` to `3.0` CU-hours/day
- **NOT SUSTAINABLE:** consistently `> 3.0` CU-hours/day

The decision also requires no unexplained increase in application p95/error
rate, no recurring connection saturation, and no correctness regression in the
PostgreSQL Core Transaction Plane. A low CU average does not override an
incident or a material latency/error regression.

## Closeout

At the end of seven complete days, publish:

1. the seven daily rows and the average/peak CU-hours;
2. the number and impact of any detector telemetry or Turso sink failures;
3. application p95/error observations and any Neon wake/suspend pattern;
4. a verdict: IDEAL, ACCEPTABLE, WARNING, or NOT SUSTAINABLE;
5. the next action, if any, limited to measured evidence.

If both changes are deployed and verified, stop feature expansion during this
window. Do not add a new keep-alive, dual-write, queue, cross-database
transaction, schema change, or provider abstraction to improve the score.
