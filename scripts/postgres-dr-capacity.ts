import { createReadinessPrismaClient, printJson, queryOne, queryRows, redactErrorMessage, requireEnvironmentVariable, type ReadinessSqlRow } from './lib/postgres-readiness'
import {
  assertDrDatabaseSafety,
  requireDrAuthorization,
  requireDrConnection,
  requireHaLocalEnvironment,
  redactUrl,
} from './lib/postgres-dr'

export type CapacityStatus = 'HEALTHY' | 'WARNING' | 'ELEVATED' | 'ACTION' | 'CRITICAL'

export function classifyCapacity(usedBytes: number, limitBytes: number): CapacityStatus {
  const ratio = usedBytes / limitBytes
  if (ratio >= 0.9) return 'CRITICAL'
  if (ratio >= 0.85) return 'ACTION'
  if (ratio >= 0.75) return 'ELEVATED'
  if (ratio >= 0.6) return 'WARNING'
  return 'HEALTHY'
}

function positiveInteger(name: string): number {
  const value = Number(requireEnvironmentVariable(name))
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer.`)
  return value
}

async function main(): Promise<void> {
  requireHaLocalEnvironment()
  requireDrAuthorization('P4_CAPACITY_ALLOW')
  const connection = requireDrConnection('P4_CAPACITY_DATABASE_URL', 'P4_CAPACITY_DATABASE_IDENTITY')
  const expectedEnvironment = process.env.P4_CAPACITY_EXPECTED_ENVIRONMENT?.trim()
  const limitBytes = positiveInteger('P4_CAPACITY_LIMIT_BYTES')
  const client = createReadinessPrismaClient(connection.url)
  try {
    await assertDrDatabaseSafety(
      client,
      connection.url,
      connection.identity,
      expectedEnvironment,
      process.env.P4_DR_ALLOW_UNMARKED_TARGET === '1',
    )
    const snapshot = await client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
      const database = await queryOne<ReadinessSqlRow>(
        tx,
        `SELECT current_database()::text AS database_name,
                pg_database_size(current_database())::bigint AS database_size_bytes,
                pg_size_pretty(pg_database_size(current_database()))::text AS database_size_pretty,
                current_setting('max_connections')::int AS max_connections`,
      )
      const schema = await queryOne<ReadinessSqlRow>(
        tx,
        `SELECT COALESCE(SUM(pg_total_relation_size(c.oid)), 0)::bigint AS schema_size_bytes
           FROM pg_catalog.pg_class c
           JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'`,
      )
      const connections = await queryOne<ReadinessSqlRow>(
        tx,
        `SELECT COUNT(*)::int AS active_connections,
                COUNT(*) FILTER (WHERE state = 'idle')::int AS idle_connections,
                COUNT(*) FILTER (WHERE state <> 'idle')::int AS busy_connections,
                COUNT(*) FILTER (WHERE state <> 'idle' AND now() - COALESCE(xact_start, query_start, now()) > interval '5 minutes')::int AS long_transactions
           FROM pg_catalog.pg_stat_activity`,
      )
      const largestTables = await queryRows<ReadinessSqlRow>(
        tx,
        `SELECT c.relname::text AS table_name,
                GREATEST(c.reltuples, 0)::bigint AS estimated_rows,
                pg_table_size(c.oid)::bigint AS table_size_bytes,
                pg_indexes_size(c.oid)::bigint AS index_size_bytes,
                pg_total_relation_size(c.oid)::bigint AS total_size_bytes
           FROM pg_catalog.pg_class c
           JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relkind = 'r'
            AND c.relname <> '_prisma_migrations'
          ORDER BY pg_total_relation_size(c.oid) DESC
          LIMIT 20`,
      )
      return { database, schema, connections, largestTables }
    })
    const usedBytes = Number(snapshot.database.database_size_bytes)
    const status = classifyCapacity(usedBytes, limitBytes)
    printJson({
      result: 'PASS',
      readOnly: true,
      database: redactUrl(connection.url),
      databaseIdentity: connection.identity,
      databaseName: snapshot.database.database_name,
      postgresDatabaseSizeBytes: usedBytes,
      postgresDatabaseSize: snapshot.database.database_size_pretty,
      configuredCapacityLimitBytes: limitBytes,
      capacityUtilization: usedBytes / limitBytes,
      capacityStatus: status,
      thresholds: { warning: 0.6, elevated: 0.75, action: 0.85, critical: 0.9 },
      schemaSizeBytes: Number(snapshot.schema.schema_size_bytes),
      connections: snapshot.connections,
      largestTables: snapshot.largestTables.map((row) => ({
        table: row.table_name,
        estimatedRows: Number(row.estimated_rows),
        tableSizeBytes: Number(row.table_size_bytes),
        indexSizeBytes: Number(row.index_size_bytes),
        totalSizeBytes: Number(row.total_size_bytes),
      })),
    })
    if (status === 'CRITICAL') process.exitCode = 2
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL DR capacity audit failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
