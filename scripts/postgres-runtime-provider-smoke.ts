import {
  assertPostgresConnectionString,
  assertReadinessTargetSafety,
  DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
} from './lib/postgres-readiness'
import {
  resolveRuntimePostgresProvider,
} from '../src/lib/postgres-runtime'

/**
 * Exercises the application singleton, not a separate readiness PrismaClient.
 * The smoke is read-only so it can be repeated against the disposable
 * secondary-provider database after the write-oriented portability fixture.
 */
async function main(): Promise<void> {
  if (process.env.APP_ENV?.trim().toLowerCase() !== 'local') {
    throw new Error('Runtime provider smoke requires APP_ENV=local.')
  }
  if (process.env.P3_RUNTIME_PROVIDER_ALLOW !== '1') {
    throw new Error('Set P3_RUNTIME_PROVIDER_ALLOW=1 for an explicitly approved runtime provider smoke.')
  }

  const connectionString = assertPostgresConnectionString(
    'P3_RUNTIME_PROVIDER_DATABASE_URL',
    requireEnvironmentVariable('P3_RUNTIME_PROVIDER_DATABASE_URL'),
  )
  const provider = resolveRuntimePostgresProvider({
    DATABASE_URL: connectionString,
    POSTGRES_RUNTIME_PROVIDER: requireEnvironmentVariable('P3_RUNTIME_PROVIDER'),
  })
  if (provider !== 'pg' && provider !== 'neon') {
    throw new Error('Runtime provider smoke requires POSTGRES_RUNTIME_PROVIDER=pg or neon.')
  }

  // Set the same variables consumed by src/lib/postgres-runtime.ts before the
  // application singleton is imported. No URL is printed by this script.
  process.env.DATABASE_URL = connectionString
  process.env.POSTGRES_RUNTIME_PROVIDER = provider
  const { prisma } = await import('../src/lib/prisma')

  try {
    await assertReadinessTargetSafety(prisma, connectionString)
    const counts = await prisma.$transaction(async (tx) => Promise.all([
      tx.user.count(),
      tx.account.count(),
      tx.session.count(),
      tx.tryOnTask.count(),
      tx.faceAnalysisTask.count(),
      tx.payment.count(),
      tx.merchant.count(),
      tx.merchantMembership.count(),
      tx.experience.count(),
      tx.merchantFrame.count(),
      tx.merchantUsageLedger.count(),
      tx.merchantSponsoredUsage.count(),
      tx.generationRequest.count(),
      tx.generationAttempt.count(),
    ]), {
      maxWait: DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS,
      timeout: DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS,
    })
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`
    })

    console.log(JSON.stringify({
      result: 'PASS',
      provider,
      database: redactPostgresConnectionString(connectionString),
      applicationSingleton: 'src/lib/prisma.ts',
      transaction: 'PASS',
      modelCounts: {
        users: counts[0],
        accounts: counts[1],
        sessions: counts[2],
        tryOnTasks: counts[3],
        faceAnalysisTasks: counts[4],
        payments: counts[5],
        merchants: counts[6],
        merchantMemberships: counts[7],
        experiences: counts[8],
        merchantFrames: counts[9],
        merchantUsageRows: counts[10],
        sponsoredUsageRows: counts[11],
        generationRequests: counts[12],
        generationAttempts: counts[13],
      },
    }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL runtime provider smoke failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
