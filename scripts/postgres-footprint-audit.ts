import {
  assertPostgresConnectionString,
  databaseIdentityFromConnectionString,
  createReadinessPrismaClient,
  isPreviewDatabaseIdentity,
  isProtectedDatabaseIdentity,
  jsonSafe,
  printJson,
  queryOne,
  queryRows,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
  type ReadinessQueryClient,
  type ReadinessSqlRow,
} from './lib/postgres-readiness'

const FOCUS_TABLES = [
  'FaceShapeDetection',
  'TryOnTask',
  'FaceAnalysisTask',
  'GenerationRequest',
  'GenerationAttempt',
  'Payment',
  'Merchant',
  'MerchantFrame',
  'Experience',
  'MerchantSession',
  'MerchantUsageLedger',
  'MerchantSponsoredUsage',
] as const

function requireReadOnlyAuditContext(): void {
  if (process.env.VISUTRY_FOOTPRINT_READ_ONLY !== '1') {
    throw new Error('Set VISUTRY_FOOTPRINT_READ_ONLY=1 to run the read-only footprint audit.')
  }
  const appEnvironment = process.env.APP_ENV?.trim().toLowerCase()
  const vercelEnvironment = process.env.VERCEL_ENV?.trim().toLowerCase()
  if (appEnvironment === 'preview' || vercelEnvironment === 'preview') {
    throw new Error('Footprint audit refuses Preview databases.')
  }
  if (appEnvironment === 'production' || vercelEnvironment === 'production') {
    if (process.env.VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED !== '1') {
      throw new Error('Production footprint audit requires VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED=1.')
    }
  }
}

function numeric(row: ReadinessSqlRow, key: string): number {
  const value = row[key]
  const result = typeof value === 'bigint' ? Number(value) : Number(value)
  if (!Number.isFinite(result)) throw new Error(`Expected numeric value for ${key}.`)
  return result
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

async function relationExists(client: ReadinessQueryClient, relation: string): Promise<boolean> {
  const row = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT to_regclass(${sqlLiteral(`public."${relation}"`)})::text AS relation`,
  )
  return Boolean(row.relation)
}

async function environmentMarker(
  client: ReadinessQueryClient,
  expectedIdentity: string,
): Promise<{ verified: boolean; environment: string | null; databaseIdentity: string | null }> {
  if (!(await relationExists(client, 'EnvironmentMetadata'))) {
    return { verified: false, environment: null, databaseIdentity: null }
  }
  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT "environment", "databaseIdentity"
       FROM "EnvironmentMetadata"
      WHERE "id" = 'primary'`,
  )
  const marker = rows[0]
  if (!marker) return { verified: false, environment: null, databaseIdentity: null }
  const verified =
    String(marker.environment).toUpperCase() === 'PRODUCTION' &&
    String(marker.databaseIdentity) === expectedIdentity
  return {
    verified,
    environment: String(marker.environment),
    databaseIdentity: String(marker.databaseIdentity),
  }
}

async function exactTableStats(
  client: ReadinessQueryClient,
  table: string,
): Promise<ReadinessSqlRow | null> {
  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT relid::oid::bigint AS relation_id,
            relname::text AS table_name,
            n_live_tup::bigint AS estimated_rows,
            pg_table_size(relid)::bigint AS table_bytes,
            pg_indexes_size(relid)::bigint AS index_bytes,
            pg_total_relation_size(relid)::bigint AS total_bytes
       FROM pg_catalog.pg_stat_user_tables
      WHERE schemaname = 'public'
        AND relname = ${sqlLiteral(table)}`,
  )
  const row = rows[0]
  if (!row) return null
  const exactRows = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS exact_rows FROM "${table.replace(/"/g, '""')}"`,
  )
  return { ...row, exact_rows: exactRows.exact_rows }
}

async function main(): Promise<void> {
  requireReadOnlyAuditContext()
  const connectionString = assertPostgresConnectionString(
    'VISUTRY_FOOTPRINT_DATABASE_URL',
    requireEnvironmentVariable('VISUTRY_FOOTPRINT_DATABASE_URL'),
  )
  const expectedIdentity = requireEnvironmentVariable('VISUTRY_FOOTPRINT_EXPECTED_DATABASE_IDENTITY')
  const targetIdentity = databaseIdentityFromConnectionString(connectionString)
  if (isPreviewDatabaseIdentity(targetIdentity)) {
    throw new Error('Footprint audit refuses the known Preview database identity.')
  }
  const knownProductionIdentity = isProtectedDatabaseIdentity(targetIdentity)
  const client = createReadinessPrismaClient(connectionString)
  try {
    const report = await client.$transaction(async (tx) => {
    // Keep every query in one read-only transaction, including the identity
    // and EnvironmentMetadata checks below.
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
    const client = tx as unknown as ReturnType<typeof createReadinessPrismaClient>
    const identity = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT current_database()::text AS database_name,
              current_user::text AS database_user,
              inet_server_addr()::text AS server_address,
              current_setting('server_version') AS postgres_version`,
    )
    const marker = await environmentMarker(client, expectedIdentity)
    const productionContext =
      process.env.APP_ENV?.trim().toLowerCase() === 'production' ||
      process.env.VERCEL_ENV?.trim().toLowerCase() === 'production'
    const markerEnvironment = marker.environment?.trim().toUpperCase()
    if (markerEnvironment === 'PREVIEW') {
      throw new Error('Footprint audit refuses a database marked Preview.')
    }
    const markerKnownPreview = marker.databaseIdentity ? isPreviewDatabaseIdentity(marker.databaseIdentity) : false
    if (markerKnownPreview) {
      throw new Error('Footprint audit refuses a database with the known Preview identity marker.')
    }
    const markerKnownProduction = marker.databaseIdentity
      ? isProtectedDatabaseIdentity(marker.databaseIdentity)
      : false
    const productionDetected = productionContext || markerEnvironment === 'PRODUCTION' || knownProductionIdentity || markerKnownProduction
    if (productionDetected && process.env.VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED !== '1') {
      throw new Error('Production footprint audit requires VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED=1.')
    }
    if (productionDetected && !marker.verified) {
      throw new Error('Production EnvironmentMetadata identity could not be verified; refusing the audit.')
    }

    const databaseSize = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT pg_database_size(current_database())::bigint AS database_bytes,
              pg_size_pretty(pg_database_size(current_database())) AS database_size`,
    )
    const schemaSize = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COALESCE(SUM(pg_total_relation_size(relid)), 0)::bigint AS public_schema_bytes,
              pg_size_pretty(COALESCE(SUM(pg_total_relation_size(relid)), 0)) AS public_schema_size
         FROM pg_catalog.pg_stat_user_tables
        WHERE schemaname = 'public'`,
    )
    const topTables = await queryRows<ReadinessSqlRow>(
      client,
      `SELECT relname::text AS table_name,
              n_live_tup::bigint AS estimated_rows,
              pg_table_size(relid)::bigint AS table_bytes,
              pg_indexes_size(relid)::bigint AS index_bytes,
              pg_total_relation_size(relid)::bigint AS total_bytes
         FROM pg_catalog.pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 20`,
    )
    const focusTables: Record<string, unknown> = {}
    for (const table of FOCUS_TABLES) {
      focusTables[table] = await exactTableStats(client, table)
    }
    const connections = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COUNT(*)::bigint AS total,
              COUNT(*) FILTER (WHERE state = 'active')::bigint AS active,
              COUNT(*) FILTER (WHERE state = 'idle')::bigint AS idle,
              COUNT(*) FILTER (WHERE state = 'idle in transaction')::bigint AS idle_in_transaction,
              COUNT(*) FILTER (WHERE wait_event_type = 'Lock')::bigint AS waiting_on_lock
         FROM pg_catalog.pg_stat_activity
        WHERE datname = current_database()`,
    )
    const longRunning = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COUNT(*)::bigint AS transactions_over_60s
         FROM pg_catalog.pg_stat_activity
        WHERE datname = current_database()
          AND xact_start IS NOT NULL
          AND xact_start < clock_timestamp() - INTERVAL '60 seconds'
          AND state <> 'idle'`,
    )
    const blocked = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COUNT(*) FILTER (WHERE cardinality(pg_blocking_pids(pid)) > 0)::bigint AS blocked_sessions
         FROM pg_catalog.pg_stat_activity
        WHERE datname = current_database()`,
    )
    const advisoryLocks = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COUNT(*)::bigint AS migration_advisory_locks,
              COUNT(*) FILTER (WHERE granted)::bigint AS granted_migration_advisory_locks,
              COUNT(*) FILTER (WHERE NOT granted)::bigint AS waiting_migration_advisory_locks
         FROM pg_catalog.pg_locks
        WHERE locktype = 'advisory'
          AND classid = 0
          AND objid = 72707369`,
    )
    const connectionLimits = await queryRows<ReadinessSqlRow>(
      client,
      `SELECT name::text, setting::bigint AS setting
         FROM pg_catalog.pg_settings
        WHERE name IN ('max_connections', 'superuser_reserved_connections')
        ORDER BY name`,
    )
    const ledgerPresent = await relationExists(client, '_prisma_migrations')
    let ledger: ReadinessSqlRow | null = null
    if (ledgerPresent) {
      ledger = await queryOne<ReadinessSqlRow>(
        client,
        `SELECT COUNT(*)::bigint AS total,
                COUNT(*) FILTER (WHERE "finished_at" IS NOT NULL)::bigint AS finished,
                COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "logs" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS failed,
                COUNT(*) FILTER (WHERE "rolled_back_at" IS NOT NULL)::bigint AS rolled_back,
                COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL)::bigint AS unfinished
           FROM "_prisma_migrations"`,
      )
    }

    return {
      result: 'PASS',
      readOnly: true,
      target: redactPostgresConnectionString(connectionString),
      identity: {
        databaseName: identity.database_name,
        databaseUser: identity.database_user,
        serverAddress: identity.server_address,
        postgresVersion: identity.postgres_version,
        expectedIdentity,
        environmentMarker: marker,
      },
      database: {
        sizeBytes: numeric(databaseSize, 'database_bytes'),
        size: databaseSize.database_size,
        publicSchemaBytes: numeric(schemaSize, 'public_schema_bytes'),
        publicSchemaSize: schemaSize.public_schema_size,
      },
      topTables: jsonSafe(topTables),
      focusTables: jsonSafe(focusTables),
      operations: {
        connections: jsonSafe(connections),
        longRunning,
        blocked,
        migrationAdvisoryLocks: advisoryLocks,
        connectionLimits: jsonSafe(connectionLimits),
      },
      migrationLedger: ledger,
    }
    })
    printJson(report)
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL footprint audit failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
