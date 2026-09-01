import {
  createReadinessPrismaClient,
  queryOne,
  redactErrorMessage,
  redactPostgresConnectionString,
  type ReadinessSqlRow,
} from './postgres-readiness'
import { assertSchemaContract, inspectSchemaContract } from './postgres-schema-contract'
import { assertDrDatabaseSafety, type DrProvider } from './postgres-dr'

export const HEALTH_CONNECTION_TIMEOUT_MS = 7_000
export const HEALTH_STATEMENT_TIMEOUT_MS = 7_000
export const HEALTH_LOCK_TIMEOUT_MS = 5_000
export const HEALTH_QUERY_TIMEOUT_MS = 7_000
export const HEALTH_PROVIDER_TIMEOUT_MS = 18_000
const HEALTH_DISCONNECT_TIMEOUT_MS = 500

export const HEALTH_PRISMA_OPTIONS = {
  connectionTimeoutMs: HEALTH_CONNECTION_TIMEOUT_MS,
  statementTimeoutMs: HEALTH_STATEMENT_TIMEOUT_MS,
  lockTimeoutMs: HEALTH_LOCK_TIMEOUT_MS,
  queryTimeoutMs: HEALTH_QUERY_TIMEOUT_MS,
} as const

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

export function withHealthTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`PostgreSQL health check exceeded ${timeoutMs}ms.`)), timeoutMs)
    timer.unref?.()
  })
  return Promise.race([operation, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export function unavailableHealthResult(
  provider: DrProvider,
  url: string,
  identity: string,
  error: unknown,
): HealthResult {
  return {
    provider,
    status: 'UNAVAILABLE',
    database: redactPostgresConnectionString(url),
    databaseIdentity: identity,
    detail: redactErrorMessage(error).slice(0, 240),
  }
}

async function disconnectWithTimeout(client: ReturnType<typeof createReadinessPrismaClient>): Promise<void> {
  try {
    await withHealthTimeout(client.$disconnect(), HEALTH_DISCONNECT_TIMEOUT_MS)
  } catch {
    // The health result is already determined; do not let a stalled cleanup
    // prevent the CLI from failing closed and returning to its caller.
  }
}

export async function checkProviderHealth(
  provider: DrProvider,
  url: string,
  identity: string,
  expectedEnvironment?: string,
  options: { allowUnmarked?: boolean } = {},
): Promise<HealthResult> {
  const client = createReadinessPrismaClient(url, HEALTH_PRISMA_OPTIONS)
  try {
    const snapshot = await withHealthTimeout((async () => {
      await assertDrDatabaseSafety(
        client,
        url,
        identity,
        expectedEnvironment,
        options.allowUnmarked ?? false,
      )
      return client.$transaction(async (tx) => {
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
    })(), HEALTH_PROVIDER_TIMEOUT_MS)
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
    return unavailableHealthResult(provider, url, identity, error)
  } finally {
    await disconnectWithTimeout(client)
  }
}

export { assertDrDatabaseSafety }
