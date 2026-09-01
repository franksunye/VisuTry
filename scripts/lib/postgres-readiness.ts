import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import type { PoolConfig } from 'pg'

export const CANONICAL_BASELINE_NAME = '00000000000000_canonical_baseline'
export const CANONICAL_BASELINE_SHA256 =
  'f9a2b98a7ec4fc519bbd38edcb95c76d29ecddeacbf4eb55a6eb2d8f01d2326e'

export const RAW_SQL_INVARIANTS = [
  'try_on_task_actor_check',
  'Merchant_maxCompareFrames_check',
  'Experience_one_active_store_per_merchant_idx',
  'StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx',
  'MerchantUsageLedger_merchantId_kind_createdAt_idx',
  'Merchant_commercialStatus_idx',
  'MerchantSession_merchantId_billableAICommerceSession_idx',
] as const

export const EXPECTED_APPLICATION_TABLE_COUNT = 42
export const DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS = 30_000

export type ReadinessPrismaClientOptions = {
  transactionTimeoutMs?: number
  connectionTimeoutMs?: number
  statementTimeoutMs?: number
  lockTimeoutMs?: number
  queryTimeoutMs?: number
}

/**
 * Non-secret identities that are never valid targets for a disposable
 * readiness write. These are checked in addition to APP_ENV/VERCEL_ENV and
 * the database's own EnvironmentMetadata marker.
 */
export const PROTECTED_DATABASE_IDENTITY_MARKERS = [
  'ep-wandering-union-ad43rx1s',
  'ep-old-frog-adgzp23w',
  'neon:steep-silence-18355430:br-raspy-cake-adwjq4e9',
] as const
export const PREVIEW_DATABASE_IDENTITY_MARKERS = [
  'ep-old-frog-adgzp23w',
  'neon:steep-silence-18355430:br-raspy-cake-adwjq4e9',
] as const

export type ReadinessSqlRow = Record<string, unknown>

export type ReadinessQueryClient = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Promise<T>
}

export function requireEnvironmentVariable(
  name: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

export function assertPostgresConnectionString(
  name: string,
  value: string,
): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection string.`)
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(`${name} must use the postgres:// or postgresql:// scheme.`)
  }
  if (!url.hostname) throw new Error(`${name} must include a database host.`)
  return value
}

/** Return a useful target label without ever returning credentials. */
export function redactPostgresConnectionString(value: string): string {
  try {
    const url = new URL(value)
    const database = url.pathname.replace(/^\//, '') || 'default'
    return `${url.protocol}//${url.hostname}/${database}`
  } catch {
    return 'invalid-postgresql-url'
  }
}

export function databaseIdentityFromConnectionString(value: string): string {
  const url = new URL(value)
  const database = url.pathname.replace(/^\//, '') || 'default'
  return `${url.hostname.toLowerCase()}/${database}`
}

export function isProtectedDatabaseIdentity(value: string): boolean {
  const normalized = value.toLowerCase()
  return PROTECTED_DATABASE_IDENTITY_MARKERS.some((marker) => normalized.includes(marker.toLowerCase()))
}

export function isPreviewDatabaseIdentity(value: string): boolean {
  const normalized = value.toLowerCase()
  return PREVIEW_DATABASE_IDENTITY_MARKERS.some((marker) => normalized.includes(marker.toLowerCase()))
}

export function redactErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/postgres(?:ql)?:\/\/[^\s'"`)>]+/gi, '[redacted PostgreSQL URL]')
}

/** Readiness scripts must never be pointed at a deployed Vercel environment. */
export function assertNonDeployedEnvironment(
  env: Record<string, string | undefined> = process.env,
): void {
  const appEnvironment = env.APP_ENV?.trim().toLowerCase()
  const vercelEnvironment = env.VERCEL_ENV?.trim().toLowerCase()
  if (
    appEnvironment === 'production' ||
    appEnvironment === 'preview' ||
    vercelEnvironment === 'production' ||
    vercelEnvironment === 'preview'
  ) {
    throw new Error(
      'PostgreSQL readiness checks require a local/test environment; refusing a deployed environment.',
    )
  }
}

export function requireLocalReadinessEnvironment(
  env: Record<string, string | undefined> = process.env,
): void {
  assertNonDeployedEnvironment(env)
  if (env.APP_ENV?.trim().toLowerCase() !== 'local') {
    throw new Error('PostgreSQL readiness writes require APP_ENV=local.')
  }
}

/**
 * Read-only identity preflight for every readiness operation that can write.
 * A missing marker is allowed for a brand-new local database, but a present
 * Production/Preview marker or a known protected identity always stops the
 * operation before the caller can mutate data.
 */
export async function assertReadinessTargetSafety(
  client: ReadinessQueryClient,
  connectionString: string,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  assertNonDeployedEnvironment(env)
  const identity = databaseIdentityFromConnectionString(connectionString)
  const configuredIdentity = env.VISUTRY_DATABASE_IDENTITY?.trim() ?? ''
  if (isProtectedDatabaseIdentity(identity) || isProtectedDatabaseIdentity(configuredIdentity)) {
    throw new Error('Readiness operation refuses a known Production or Preview database identity.')
  }

  const relation = await queryOne<{ relation: string | null }>(
    client,
    `SELECT to_regclass('public."EnvironmentMetadata"')::text AS relation`,
  )
  if (!relation.relation) return

  const markers = await queryRows<{ environment: string; databaseIdentity: string }>(
    client,
    `SELECT "environment", "databaseIdentity"
       FROM "EnvironmentMetadata"
      WHERE "id" = 'primary'`,
  )
  const marker = markers[0]
  if (!marker) return
  const markerEnvironment = marker.environment.trim().toUpperCase()
  if (markerEnvironment === 'PRODUCTION' || markerEnvironment === 'PREVIEW') {
    throw new Error('Readiness operation refuses a Production or Preview database marker.')
  }
  if (isProtectedDatabaseIdentity(marker.databaseIdentity)) {
    throw new Error('Readiness operation refuses a known protected database identity marker.')
  }
}

export function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

export function jsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return `<${value.length} bytes>`
  if (Array.isArray(value)) return value.map(jsonSafe)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, jsonSafe(nested)]),
    )
  }
  return value
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(jsonSafe(value), null, 2))
}

export function createReadinessPrismaClient(
  connectionString: string,
  options: ReadinessPrismaClientOptions = {},
): PrismaClient {
  const transactionOptions = options.transactionTimeoutMs === undefined
    ? undefined
    : {
        maxWait: options.transactionTimeoutMs,
        timeout: options.transactionTimeoutMs,
      }
  const poolConfig: PoolConfig = {
    connectionString,
    ...(options.connectionTimeoutMs === undefined
      ? {}
      : { connectionTimeoutMillis: options.connectionTimeoutMs }),
    ...(options.statementTimeoutMs === undefined
      ? {}
      : { statement_timeout: options.statementTimeoutMs }),
    ...(options.lockTimeoutMs === undefined
      ? {}
      : { lock_timeout: options.lockTimeoutMs }),
    ...(options.queryTimeoutMs === undefined
      ? {}
      : { query_timeout: options.queryTimeoutMs }),
  }
  return new PrismaClient({
    adapter: new PrismaPg(poolConfig),
    log: [],
    ...(transactionOptions ? { transactionOptions } : {}),
  })
}

export async function queryRows<T extends ReadinessSqlRow>(
  client: ReadinessQueryClient,
  sql: string,
): Promise<T[]> {
  try {
    return await client.$queryRawUnsafe<T[]>(sql)
  } catch {
    const summary = sql.replace(/\s+/g, ' ').trim().slice(0, 180)
    throw new Error(`PostgreSQL readiness query failed: ${summary}`)
  }
}

export async function queryOne<T extends ReadinessSqlRow>(
  client: ReadinessQueryClient,
  sql: string,
): Promise<T> {
  const rows = await queryRows<T>(client, sql)
  if (!rows[0]) throw new Error('Expected one PostgreSQL row, got none.')
  return rows[0]
}

export function countValue(row: ReadinessSqlRow, key: string): number {
  const value = row[key]
  const numeric = typeof value === 'bigint' ? Number(value) : Number(value)
  if (!Number.isFinite(numeric)) throw new Error(`Expected numeric PostgreSQL value for ${key}.`)
  return numeric
}
