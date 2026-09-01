import { createReadinessPrismaClient, queryOne, redactErrorMessage, type ReadinessSqlRow } from './postgres-readiness'
import { assertSchemaContract, inspectSchemaContract } from './postgres-schema-contract'
import { assertDrDatabaseSafety, redactUrl, type DrProvider } from './postgres-dr'

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN'

export type HealthResult = {
  provider: DrProvider
  status: HealthStatus
  database?: string
  databaseIdentity?: string
  postgresVersion?: string
  migrationStatus?: 'CLEAN' | 'UNSAFE'
  applicationTableCount?: number
  rawSqlInvariants?: string[]
  ledger?: { total: number; finished: number; failed: number; rolledBack: number; unfinished: number }
  detail?: string
}

export async function checkProviderHealth(
  provider: DrProvider,
  url: string,
  identity: string,
  expectedEnvironment?: string,
): Promise<HealthResult> {
  const client = createReadinessPrismaClient(url)
  try {
    const snapshot = await client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
      await queryOne<{ ok: number }>(tx, 'SELECT 1::int AS ok')
      const database = await queryOne<ReadinessSqlRow>(
        tx,
        `SELECT current_database()::text AS database_name,
                current_setting('server_version')::text AS postgres_version`,
      )
      const schema = await inspectSchemaContract(tx)
      assertSchemaContract(schema, `${provider} PostgreSQL database`)
      const ledger = await queryOne<ReadinessSqlRow>(
        tx,
        `SELECT COUNT(*)::bigint AS total,
                COUNT(*) FILTER (WHERE finished_at IS NOT NULL)::bigint AS finished,
                COUNT(*) FILTER (WHERE logs IS NOT NULL AND finished_at IS NULL AND rolled_back_at IS NULL)::bigint AS failed,
                COUNT(*) FILTER (WHERE rolled_back_at IS NOT NULL)::bigint AS rolled_back,
                COUNT(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL)::bigint AS unfinished
           FROM "_prisma_migrations"`,
      )
      return {
        database: String(database.database_name),
        postgresVersion: String(database.postgres_version),
        schema,
        ledger: {
          total: Number(ledger.total),
          finished: Number(ledger.finished),
          failed: Number(ledger.failed),
          rolledBack: Number(ledger.rolled_back),
          unfinished: Number(ledger.unfinished),
        },
      }
    })
    const migrationStatus = snapshot.ledger.failed === 0
      && snapshot.ledger.rolledBack === 0
      && snapshot.ledger.unfinished === 0
      ? 'CLEAN'
      : 'UNSAFE'
    return {
      provider,
      status: migrationStatus === 'CLEAN' ? 'HEALTHY' : 'DEGRADED',
      database: snapshot.database,
      databaseIdentity: identity,
      postgresVersion: snapshot.postgresVersion,
      migrationStatus,
      applicationTableCount: snapshot.schema.tableCount,
      rawSqlInvariants: snapshot.schema.rawSqlInvariants,
      ledger: snapshot.ledger,
    }
  } catch (error) {
    return {
      provider,
      status: 'UNAVAILABLE',
      database: redactUrl(url),
      databaseIdentity: identity,
      detail: redactErrorMessage(error).slice(0, 240),
    }
  } finally {
    await client.$disconnect()
  }
}

export { assertDrDatabaseSafety }
