import {
  createReadinessPrismaClient,
  printJson,
  redactErrorMessage,
} from './lib/postgres-readiness'
import {
  assertDrDatabaseSafety,
  requireDrAuthorization,
  requireDrConnection,
  requireHaLocalEnvironment,
  redactUrl,
} from './lib/postgres-dr'

/**
 * Commits one harmless synthetic counter update on a disposable authority.
 * This is deliberately separate from the transactional portability smoke so
 * a DR rehearsal proves that sequences/defaults and durable writes work after
 * a restore. It can never be used without local environment and identity
 * checks plus an explicit operator authorization.
 */
async function main(): Promise<void> {
  requireHaLocalEnvironment()
  requireDrAuthorization('P4_DR_WRITE_ALLOW')
  const connection = requireDrConnection('P4_DR_WRITE_DATABASE_URL', 'P4_DR_WRITE_DATABASE_IDENTITY')
  const expectedEnvironment = process.env.P4_DR_WRITE_EXPECTED_ENVIRONMENT?.trim()
  const client = createReadinessPrismaClient(connection.url)
  try {
    await assertDrDatabaseSafety(
      client,
      connection.url,
      connection.identity,
      expectedEnvironment,
      process.env.P4_DR_ALLOW_UNMARKED_TARGET === '1',
    )
    const result = await client.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, creditsUsed: true },
      })
      if (!user) throw new Error('No synthetic user exists for the DR write smoke.')
      const before = user.creditsUsed
      const updated = await tx.user.updateMany({
        where: { id: user.id, creditsUsed: before },
        data: { creditsUsed: { increment: 1 } },
      })
      if (updated.count !== 1) throw new Error('DR write smoke did not update exactly one synthetic row.')
      const after = await tx.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { creditsUsed: true },
      })
      if (!after || after.creditsUsed !== before + 1) {
        throw new Error('DR write smoke could not read back the committed counter update.')
      }
      return { before, after: after.creditsUsed }
    })
    printJson({
      result: 'PASS',
      durableWrite: true,
      database: redactUrl(connection.url),
      databaseIdentity: connection.identity,
      creditsUsed: result,
    })
  } finally {
    await client.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL DR write smoke failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
