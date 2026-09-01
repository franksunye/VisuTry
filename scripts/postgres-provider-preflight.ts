import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { PrismaClient } from '@prisma/client'
import {
  assertPostgresConnectionString,
  createReadinessPrismaClient,
  databaseIdentityFromConnectionString,
  printJson,
  queryOne,
  queryRows,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
  type ReadinessQueryClient,
  type ReadinessSqlRow,
} from './lib/postgres-readiness'
import {
  assertSchemaContract,
  inspectSchemaContract,
  type SchemaContract,
} from './lib/postgres-schema-contract'
import {
  resolvePrismaCliDatasourceUrl,
} from '../prisma/resolve-cli-datasource-url'
import {
  createRuntimePostgresAdapter,
  resolveRuntimePostgresProvider,
  type RuntimePostgresProvider,
} from '../src/lib/postgres-runtime'

const execFileAsync = promisify(execFile)
const PREFLIGHT_TRANSACTION_TIMEOUT_MS = 30_000

type DatabaseIdentity = {
  databaseName: string
  postgresVersion: string
  environment: string | null
  databaseIdentity: string | null
  schema: SchemaContract
}

function appEnvironment(): string {
  const explicit = process.env.APP_ENV?.trim().toLowerCase()
  const deployed = process.env.VERCEL_ENV?.trim().toLowerCase()
  if (explicit === 'production' || deployed === 'production') return 'production'
  if (explicit === 'preview' || deployed === 'preview') return 'preview'
  return explicit || 'local'
}

function requirePreflightAuthorization(): void {
  const environment = appEnvironment()
  if (environment === 'preview') {
    throw new Error('Provider preflight refuses Preview databases.')
  }
  if (environment === 'production') {
    if (process.env.VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED !== '1') {
      throw new Error(
        'Production provider preflight requires VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED=1.',
      )
    }
    return
  }
  if (process.env.P3_PROVIDER_PREFLIGHT_ALLOW !== '1') {
    throw new Error(
      'Set P3_PROVIDER_PREFLIGHT_ALLOW=1 for an explicitly approved local provider preflight.',
    )
  }
}

async function environmentMarker(
  client: ReadinessQueryClient,
): Promise<{ environment: string | null; databaseIdentity: string | null }> {
  const relation = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT to_regclass('public."EnvironmentMetadata"')::text AS relation`,
  )
  if (!relation.relation) return { environment: null, databaseIdentity: null }

  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT "environment", "databaseIdentity"
       FROM "EnvironmentMetadata"
      WHERE "id" = 'primary'`,
  )
  const marker = rows[0]
  if (!marker) return { environment: null, databaseIdentity: null }
  return {
    environment: String(marker.environment),
    databaseIdentity: String(marker.databaseIdentity),
  }
}

function verifyEnvironmentMarker(marker: {
  environment: string | null
  databaseIdentity: string | null
}): void {
  const environment = appEnvironment().toUpperCase()
  if (marker.environment?.trim().toUpperCase() === 'PRODUCTION' && environment !== 'PRODUCTION') {
    throw new Error('Provider preflight found a Production database marker in a non-Production run.')
  }
  if (marker.environment?.trim().toUpperCase() === 'PREVIEW') {
    throw new Error('Provider preflight found a Preview database marker; refusing the operation.')
  }

  const expectedEnvironment = process.env.P3_PROVIDER_PREFLIGHT_EXPECTED_ENVIRONMENT?.trim().toUpperCase()
  if (appEnvironment() === 'production' && !expectedEnvironment) {
    throw new Error('Production provider preflight requires P3_PROVIDER_PREFLIGHT_EXPECTED_ENVIRONMENT.')
  }
  if (expectedEnvironment && marker.environment?.trim().toUpperCase() !== expectedEnvironment) {
    throw new Error('EnvironmentMetadata environment does not match the expected preflight environment.')
  }

  const expectedIdentity = process.env.P3_PROVIDER_PREFLIGHT_EXPECTED_DATABASE_IDENTITY?.trim()
  if (appEnvironment() === 'production' && !expectedIdentity) {
    throw new Error('Production provider preflight requires P3_PROVIDER_PREFLIGHT_EXPECTED_DATABASE_IDENTITY.')
  }
  if (expectedIdentity && marker.databaseIdentity !== expectedIdentity) {
    throw new Error('EnvironmentMetadata database identity does not match the expected preflight identity.')
  }

  if (
    (!marker.environment || !marker.databaseIdentity) &&
    (appEnvironment() === 'production' || process.env.P3_PROVIDER_PREFLIGHT_ALLOW_UNMARKED !== '1')
  ) {
    throw new Error(
      'EnvironmentMetadata identity is missing; provide the expected identity or explicitly allow an unmarked local database.',
    )
  }
}

function createRuntimePreflightClient(
  provider: RuntimePostgresProvider,
  connectionString: string,
): PrismaClient {
  return new PrismaClient({
    adapter: createRuntimePostgresAdapter({
      DATABASE_URL: connectionString,
      POSTGRES_RUNTIME_PROVIDER: provider,
    }),
    log: [],
    transactionOptions: {
      maxWait: PREFLIGHT_TRANSACTION_TIMEOUT_MS,
      timeout: PREFLIGHT_TRANSACTION_TIMEOUT_MS,
    },
  })
}

async function inspectDatabase(
  client: PrismaClient,
  label: string,
): Promise<DatabaseIdentity> {
  return client.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
    const readOnlyClient = tx as unknown as ReadinessQueryClient
    const identity = await queryOne<ReadinessSqlRow>(
      readOnlyClient,
      `SELECT current_database()::text AS database_name,
              current_setting('server_version')::text AS postgres_version`,
    )
    const marker = await environmentMarker(readOnlyClient)
    verifyEnvironmentMarker(marker)
    const schema = await inspectSchemaContract(readOnlyClient as PrismaClient)
    assertSchemaContract(schema, label)
    return {
      databaseName: String(identity.database_name),
      postgresVersion: String(identity.postgres_version),
      environment: marker.environment,
      databaseIdentity: marker.databaseIdentity,
      schema,
    }
  })
}

async function inspectMigrationDatabase(
  connectionString: string,
): Promise<{
  databaseName: string
  postgresVersion: string
  environment: string | null
  databaseIdentity: string | null
}> {
  const client = createReadinessPrismaClient(connectionString, {
    transactionTimeoutMs: PREFLIGHT_TRANSACTION_TIMEOUT_MS,
  })
  try {
    return await client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
      const identity = await queryOne<ReadinessSqlRow>(
        tx as unknown as ReadinessQueryClient,
        `SELECT current_database()::text AS database_name,
                current_setting('server_version')::text AS postgres_version`,
      )
      const marker = await environmentMarker(tx as unknown as ReadinessQueryClient)
      verifyEnvironmentMarker(marker)
      return {
        databaseName: String(identity.database_name),
        postgresVersion: String(identity.postgres_version),
        environment: marker.environment,
        databaseIdentity: marker.databaseIdentity,
      }
    })
  } finally {
    await client.$disconnect()
  }
}

async function runCleanMigrationStatus(migrationUrl: string): Promise<string> {
  const migrationPath = process.env.P3_PROVIDER_PREFLIGHT_MIGRATIONS_PATH?.trim()
  const env = {
    ...process.env,
    APP_ENV: 'local',
    DATABASE_MIGRATION_URL: migrationUrl,
    P3_TEST_DATABASE_URL: migrationUrl,
    P3_TEST_SCHEMA_PATH: path.join(process.cwd(), 'prisma/schema.prisma'),
  } as NodeJS.ProcessEnv
  const args = ['--no-install', 'prisma', 'migrate', 'status']
  if (migrationPath) {
    args.push('--config', 'tests/fixtures/prisma-p3-test-config.ts')
    env.P3_TEST_MIGRATIONS_PATH = migrationPath
  }

  let stdout = ''
  let stderr = ''
  let statusExit = 0
  try {
    const result = await execFileAsync('npx', args, {
      cwd: process.cwd(),
      env,
      maxBuffer: 1024 * 1024,
    })
    stdout = result.stdout
    stderr = result.stderr
  } catch (error) {
    const result = error as { code?: number | string; stdout?: string; stderr?: string }
    statusExit = typeof result.code === 'number' ? result.code : 1
    stdout = result.stdout ?? ''
    stderr = result.stderr ?? ''
  }

  const output = `${stdout}\n${stderr}`
  const unsafePattern = /(error|failed|failure|divergen|drift|not in sync|missing|rolled back)/i
  if (
    statusExit !== 0 ||
    !/database schema is up to date/i.test(output) ||
    unsafePattern.test(output)
  ) {
    throw new Error(
      `Migration status is not clean (exit ${statusExit}): ${redactErrorMessage(output).replace(/\s+/g, ' ').trim().slice(0, 300)}`,
    )
  }
  return 'CLEAN'
}

async function main(): Promise<void> {
  requirePreflightAuthorization()

  const runtimeUrl = assertPostgresConnectionString(
    'DATABASE_URL',
    requireEnvironmentVariable('DATABASE_URL'),
  )
  const migrationUrl = assertPostgresConnectionString(
    'DATABASE_MIGRATION_URL',
    resolvePrismaCliDatasourceUrl({
      DATABASE_MIGRATION_URL: process.env.DATABASE_MIGRATION_URL,
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
      DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      DATABASE_URL: process.env.DATABASE_URL,
    }, ['node', 'prisma', 'migrate', 'status']).url,
  )
  const provider = resolveRuntimePostgresProvider(process.env)
  const runtimeClient = createRuntimePreflightClient(provider, runtimeUrl)
  const runtimeIdentity = databaseIdentityFromConnectionString(runtimeUrl)

  try {
    const runtime = await inspectDatabase(runtimeClient, 'Runtime PostgreSQL database')
    const migration = await inspectMigrationDatabase(migrationUrl)
    if (runtime.databaseName !== migration.databaseName) {
      throw new Error('Runtime and migration connections resolve to different PostgreSQL databases.')
    }
    if (
      runtime.databaseIdentity &&
      migration.databaseIdentity &&
      runtime.databaseIdentity !== migration.databaseIdentity
    ) {
      throw new Error('Runtime and migration connections have different EnvironmentMetadata identities.')
    }
    const migrationStatus = await runCleanMigrationStatus(migrationUrl)
    printJson({
      result: 'PASS',
      readOnly: true,
      provider,
      runtimeDatabase: redactPostgresConnectionString(runtimeUrl),
      migrationDatabase: redactPostgresConnectionString(migrationUrl),
      configuredRuntimeIdentity: runtimeIdentity,
      runtime: {
        databaseName: runtime.databaseName,
        postgresVersion: runtime.postgresVersion,
        environment: runtime.environment,
        databaseIdentity: runtime.databaseIdentity,
        schema: {
          tableCount: runtime.schema.tableCount,
          enumCount: Object.keys(runtime.schema.enumLabels).length,
          primaryKeyCount: runtime.schema.primaryKeyCount,
          foreignKeyCount: runtime.schema.foreignKeyCount,
          uniqueConstraintCount: runtime.schema.uniqueConstraintCount,
          uniqueIndexCount: runtime.schema.uniqueIndexCount,
          checkConstraintCount: runtime.schema.checkConstraintCount,
          rawSqlInvariants: runtime.schema.rawSqlInvariants,
        },
      },
      migration: {
        databaseName: migration.databaseName,
        postgresVersion: migration.postgresVersion,
        environment: migration.environment,
        databaseIdentity: migration.databaseIdentity,
        status: migrationStatus,
      },
      identity: {
        environmentMarkerRequired: process.env.P3_PROVIDER_PREFLIGHT_ALLOW_UNMARKED !== '1',
        configuredExpectedIdentity: Boolean(process.env.P3_PROVIDER_PREFLIGHT_EXPECTED_DATABASE_IDENTITY),
      },
    })
  } finally {
    await runtimeClient.$disconnect()
  }
}

main().catch((error) => {
  console.error(`PostgreSQL provider preflight failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
