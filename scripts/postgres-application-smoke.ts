import { assertNonDeployedEnvironment, assertPostgresConnectionString, createReadinessPrismaClient, printJson, redactErrorMessage, redactPostgresConnectionString, requireEnvironmentVariable } from './lib/postgres-readiness'
import { runPostgresReadinessFixture } from './postgres-readiness-fixture'

async function main(): Promise<void> {
  assertNonDeployedEnvironment()
  if (process.env.P3_READINESS_CONFIRM !== '1') {
    throw new Error('Set P3_READINESS_CONFIRM=1 to run the PostgreSQL application smoke.')
  }
  const connectionString = assertPostgresConnectionString(
    'P3_APPLICATION_DATABASE_URL',
    requireEnvironmentVariable('P3_APPLICATION_DATABASE_URL'),
  )
  const client = createReadinessPrismaClient(connectionString)
  try {
    const fixture = await runPostgresReadinessFixture(client, 'application-smoke')
    printJson({
      result: 'PASS',
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
