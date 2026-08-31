import { assertPostgresConnectionString, assertReadinessTargetSafety, createReadinessPrismaClient, printJson, redactErrorMessage, redactPostgresConnectionString, requireEnvironmentVariable, requireLocalReadinessEnvironment } from './lib/postgres-readiness'
import { assertSchemaContract, inspectSchemaContract } from './lib/postgres-schema-contract'
import { runPostgresReadinessFixture } from './postgres-readiness-fixture'

async function main(): Promise<void> {
  requireLocalReadinessEnvironment()
  if (process.env.P3_SECONDARY_POSTGRES_ALLOW !== '1') {
    throw new Error('Set P3_SECONDARY_POSTGRES_ALLOW=1 for an explicitly approved non-production provider smoke.')
  }
  const connectionString = assertPostgresConnectionString(
    'P3_SECONDARY_POSTGRES_URL',
    requireEnvironmentVariable('P3_SECONDARY_POSTGRES_URL'),
  )
  const client = createReadinessPrismaClient(connectionString)
  try {
    await assertReadinessTargetSafety(client, connectionString)
    const schema = await inspectSchemaContract(client)
    assertSchemaContract(schema, 'Secondary PostgreSQL database')
    const fixture = await runPostgresReadinessFixture(client, 'secondary-provider')
    printJson({
      result: 'PASS',
      provider: process.env.P3_SECONDARY_POSTGRES_PROVIDER ?? 'postgresql',
      database: redactPostgresConnectionString(connectionString),
      schema: {
        tableCount: schema.tableCount,
        enumCount: Object.keys(schema.enumLabels).length,
        primaryKeyCount: schema.primaryKeyCount,
        foreignKeyCount: schema.foreignKeyCount,
        uniqueConstraintCount: schema.uniqueConstraintCount,
        uniqueIndexCount: schema.uniqueIndexCount,
        rawSqlInvariants: schema.rawSqlInvariants,
      },
      applicationSmoke: fixture,
    })
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`Secondary PostgreSQL smoke failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
