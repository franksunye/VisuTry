# Storage & Cron operations (Hobby)

## Contract

- **Admin Storage** is a read-only inventory of the production Public and Private
  Vercel Blob stores. It is not a Vercel billing meter, an orphan classifier or a
  replacement for platform deployment storage metrics.
- No arbitrary Blob deletion from the Admin UI/API. A database URL mismatch is
  not sufficient evidence for deletion: Try-On, Face Analysis, Merchant media,
  StoreAsset and in-flight uploads have different ownership/retention lifecycles.
- Actual deletion remains in the bounded, retryable business-specific jobs:
  `cleanup-expired-tasks` and `cleanup-store-assets`.
- A scan stops at 10,000 objects per store. The UI explicitly shows incomplete
  results; do not treat its displayed count as an exhaustive total in that case.
- Development-only QA Blob is excluded. Private paths are visible to Admin, but
  no direct private download URL is exposed.

## Vercel Cron

Five production jobs are declared in `vercel.json` (UTC):

| Job | Schedule | Responsibility |
| --- | --- | --- |
| `cleanup-expired-tasks` | `0 2 * * *` | Consumer + Store Try-On retention |
| `cleanup-store-assets` | `30 2 * * *` | StoreAsset + recorded orphan retries |
| `sync-pending-consumer-tasks` | `15 3 * * *` | Consumer fallback reconciliation |
| `sync-pending-store-tasks` | `45 3 * * *` | Store fallback reconciliation |
| `retention-notifications` | `0 9 * * *` | 3-day and 24-hour email reminders |

Both pending-task jobs query GrsAi **and Kie** PROCESSING tasks; excluding Kie
would silently strand the current provider's tasks from daily reconciliation.

Hobby allows daily schedules with an **hour-wide invocation window**; the
minute values are not precise delivery promises. Vercel does not automatically
retry a failed Cron invocation. The active customer flow must not depend on
minute-accurate daily recovery. Client polling and existing task fencing remain
the immediate recovery mechanisms.

All jobs require `CRON_SECRET`, fail closed if missing, and emit a bounded
`event=cron_run` log with `route`, `status` and `durationMs` through the
existing logger/Axiom stream. A partial cleanup or send failure returns HTTP
500. For sync jobs, a business task reaching FAILED is not a Cron transport
failure; unhandled per-task processing exceptions are.

## Operator check

1. Vercel > VisuTry > Settings > Cron Jobs: verify **Enabled** and all five jobs.
2. Vercel > Environment Variables: verify `CRON_SECRET` applies to Production;
   verify Public `BLOB_READ_WRITE_TOKEN` and private legacy-named
   `RPIVATE_BLOB_READ_WRITE_TOKEN` separately, without exposing values.
3. Query the Axiom `visutry-pro` stream for `data.event == "cron_run"`,
   grouped by `data.route` / `data.status`; investigate gaps or
   `partial_failure` / `failed`. Hobby's Vercel runtime logs retain only
   about one hour, so do not use them to certify yesterday's jobs.
4. If a job failed, inspect its business-specific retention/settlement counters
   before a controlled manual retry. **Never** run destructive Cron jobs as a
   casual production smoke test; keep retry safety and mail idempotency in scope.
5. Verify Storage summary per store and its `complete` flag. It reports file
   inventory, not orphan count or live Vercel quota/price.

Do not upgrade the Vercel plan solely to make these daily maintenance jobs work.
