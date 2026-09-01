import { assertPostgresConnectionString, assertReadinessTargetSafety, createReadinessPrismaClient, DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS, printJson, redactErrorMessage, requireEnvironmentVariable, requireLocalReadinessEnvironment } from './lib/postgres-readiness'
import { runPostgresReadinessFixture } from './postgres-readiness-fixture'

async function main(): Promise<void> {
  requireLocalReadinessEnvironment()
  if (process.env.P3_READINESS_CONFIRM !== '1') {
    throw new Error('Set P3_READINESS_CONFIRM=1 to create the synthetic SOURCE_SIM fixture.')
  }
  const connectionString = assertPostgresConnectionString(
    'P3_FIXTURE_DATABASE_URL',
    requireEnvironmentVariable('P3_FIXTURE_DATABASE_URL'),
  )
  const client = createReadinessPrismaClient(connectionString, {
    transactionTimeoutMs: DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS,
  })
  try {
    await assertReadinessTargetSafety(client, connectionString)
    const fixture = await runPostgresReadinessFixture(client, 'source-sim', { retain: true })
    printJson({ result: 'PASS', fixture })
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`Synthetic PostgreSQL fixture failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
