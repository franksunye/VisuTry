/**
 * Clears stale Prisma migration advisory locks on PostgreSQL.
 *
 * Prisma Migrate serializes migrations with `pg_advisory_lock(72707369)`.
 * On a transaction-pooled connection this session-level
 * lock can be orphaned — held by an idle backend whose client has already
 * disconnected. The orphaned lock blocks every subsequent `migrate deploy`
 * until Prisma's hardcoded 10s timeout fires (P1002).
 *
 * This script only terminates backends that are BOTH:
 *   - holding the Prisma advisory lock (granted = true), AND
 *   - idle for more than 60 seconds
 * A healthy migration never satisfies both conditions, so this is safe to
 * run right before `prisma migrate deploy`. It is also non-fatal: any error
 * exits 0 so the build proceeds to `migrate deploy` (which has its own retries).
 *
 * Usage:  npx tsx scripts/clear-stale-migration-locks.ts
 */
import {
  createReadinessPrismaClient,
  redactErrorMessage,
} from './lib/postgres-readiness';

/** Prisma's fixed advisory-lock key (see prisma migrate source). */
const PRISMA_ADVISORY_LOCK_KEY = 72707369;

const DIRECT_URL =
  process.env.DATABASE_MIGRATION_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DIRECT_DATABASE_URL ??
  process.env.DIRECT_URL;

async function main(): Promise<void> {
  if (!DIRECT_URL) {
    console.warn("  ⚠️  no direct URL configured — skipping stale lock cleanup");
    return;
  }

  const client = createReadinessPrismaClient(DIRECT_URL);
  try {
    // Use the provider-neutral PostgreSQL adapter instead of the Neon HTTP
    // driver so this migration safety check also works after a provider switch.
    const stale = await client.$queryRawUnsafe<Array<{
      pid: number
      state: string
      idle_since: string
    }>>(`
      SELECT l.pid, a.state, a.state_change::text AS idle_since
      FROM pg_locks l
      JOIN pg_stat_activity a ON a.pid = l.pid
      WHERE l.locktype  = 'advisory'
        AND l.classid   = 0
        AND l.objid     = ${PRISMA_ADVISORY_LOCK_KEY}
        AND l.granted   = true
        AND a.state     = 'idle'
        AND a.state_change < NOW() - INTERVAL '60 seconds'
    `);

    if (stale.length === 0) {
      console.log("  ✓ no stale advisory locks found");
      return;
    }

    console.log(`  ⚠️  found ${stale.length} stale lock holder(s):`);
    for (const row of stale) {
      console.log(
        `     pid=${row.pid}  state=${row.state}  idle_since=${row.idle_since}`
      );
    }

    const result = await client.$queryRawUnsafe<Array<{ killed: boolean }>>(`
      SELECT pg_terminate_backend(l.pid) AS killed
      FROM pg_locks l
      JOIN pg_stat_activity a ON a.pid = l.pid
      WHERE l.locktype  = 'advisory'
        AND l.classid   = 0
        AND l.objid     = ${PRISMA_ADVISORY_LOCK_KEY}
        AND l.granted   = true
        AND a.state     = 'idle'
        AND a.state_change < NOW() - INTERVAL '60 seconds'
    `);
    const killed = result.filter((r) => Boolean(r.killed)).length;
    console.log(`  ✓ terminated ${killed} stale backend(s)`);
  } finally {
    await client.$disconnect();
  }
}

main().catch((err: unknown) => {
  // Non-fatal — let migrate-deploy.sh proceed to `prisma migrate deploy`.
  const msg = redactErrorMessage(err);
  console.warn(`  ⚠️  stale lock cleanup failed (non-fatal): ${msg}`);
});
