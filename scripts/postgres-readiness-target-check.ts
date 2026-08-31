import {
  assertPostgresConnectionString,
  assertReadinessTargetSafety,
  createReadinessPrismaClient,
  printJson,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
  requireLocalReadinessEnvironment,
} from './lib/postgres-readiness'

/**
 * Read-only preflight used immediately before a readiness migration/import
 * write. It intentionally works against an empty database where the schema
 * marker does not exist yet.
 */
async function main(): Promise<void> {
  if (process.env.P3_READINESS_CONFIRM !== '1') {
    throw new Error('Set P3_READINESS_CONFIRM=1 to run the readiness target preflight.')
  }
  requireLocalReadinessEnvironment()
  const connectionString = assertPostgresConnectionString(
    'P3_TARGET_DATABASE_URL',
    requireEnvironmentVariable('P3_TARGET_DATABASE_URL'),
  )
  const client = createReadinessPrismaClient(connectionString)
  try {
    await assertReadinessTargetSafety(client, connectionString)
    printJson({ result: 'PASS', readOnly: true, target: redactPostgresConnectionString(connectionString) })
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL readiness target check failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
