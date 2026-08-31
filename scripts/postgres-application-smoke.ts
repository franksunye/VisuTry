import { assertPostgresConnectionString, assertReadinessTargetSafety, createReadinessPrismaClient, printJson, queryRows, redactErrorMessage, redactPostgresConnectionString, requireEnvironmentVariable, requireLocalReadinessEnvironment, type ReadinessSqlRow } from './lib/postgres-readiness'
import { runPostgresReadinessFixture } from './postgres-readiness-fixture'

async function sequenceDefinitionSnapshot(client: ReturnType<typeof createReadinessPrismaClient>): Promise<string[]> {
  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT schemaname::text, sequencename::text, data_type::text,
            start_value::text, increment_by::text, min_value::text,
            max_value::text, cycle::text, cache_size::text
       FROM pg_catalog.pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename`,
  )
  return rows.map((row) => JSON.stringify(row))
}

async function main(): Promise<void> {
  requireLocalReadinessEnvironment()
  if (process.env.P3_READINESS_CONFIRM !== '1') {
    throw new Error('Set P3_READINESS_CONFIRM=1 to run the PostgreSQL application smoke.')
  }
  const connectionString = assertPostgresConnectionString(
    'P3_APPLICATION_DATABASE_URL',
    requireEnvironmentVariable('P3_APPLICATION_DATABASE_URL'),
  )
  const client = createReadinessPrismaClient(connectionString)
  try {
    await assertReadinessTargetSafety(client, connectionString)
    const sequencesBefore = await sequenceDefinitionSnapshot(client)
    const fixture = await runPostgresReadinessFixture(client, 'application-smoke')
    const sequencesAfter = await sequenceDefinitionSnapshot(client)
    if (JSON.stringify(sequencesBefore) !== JSON.stringify(sequencesAfter)) {
      throw new Error('Post-import write smoke changed PostgreSQL sequence definitions.')
    }
    printJson({
      result: 'PASS',
      postImportWriteSmoke: true,
      sequenceBackedObjects: sequencesBefore.length,
      database: redactPostgresConnectionString(connectionString),
      fixture,
    })
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL application smoke failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
