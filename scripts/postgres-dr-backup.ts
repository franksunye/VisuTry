import fs from 'node:fs/promises'
import path from 'node:path'
import { CANONICAL_BASELINE_SHA256, createReadinessPrismaClient, printJson, queryOne, redactErrorMessage, requireEnvironmentVariable, type ReadinessSqlRow } from './lib/postgres-readiness'
import { assertSchemaContract, inspectSchemaContract, type SchemaContract } from './lib/postgres-schema-contract'
import {
  assertDrDatabaseSafety,
  libpqConnectionString,
  parseProvider,
  redactUrl,
  requireDrAuthorization,
  requireDrConnection,
  requireHaLocalEnvironment,
  requirePgTools,
  resolvePgBinDir,
  runPostgresTool,
  sha256File,
  type DrProvider,
} from './lib/postgres-dr'

type BackupManifest = {
  format: 'postgresql-custom-data-only'
  createdAt: string
  sourceProvider: DrProvider
  sourceDatabaseIdentity: string
  sourceDatabaseName: string
  postgresVersion: string
  canonicalBaselineSha256: string
  applicationTableCount: number
  dumpFile: string
  dumpBytes: number
  dumpSha256: string
  excludes: string[]
  drState: {
    activeProvider: DrProvider
    lastBackupAt: string
    lastBackupChecksum: string
    lastBackupSourceIdentity: string
    lastWarmRestoreAt: string | null
    lastWarmValidationAt: string | null
    lastColdRestoreAt: string | null
    lastColdValidationAt: string | null
    warmRpoSeconds: number
    backupAgeSeconds: number
  }
}

type DatabaseSnapshot = {
  databaseName: string
  postgresVersion: string
  schema: SchemaContract
}

function numberEnv(name: string, fallback: number): number {
  const value = process.env[name]
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer.`)
  return parsed
}

async function snapshotDatabase(
  connectionString: string,
  expectedIdentity: string,
  expectedEnvironment: string | undefined,
): Promise<DatabaseSnapshot> {
  const client = createReadinessPrismaClient(connectionString)
  try {
    await assertDrDatabaseSafety(
      client,
      connectionString,
      expectedIdentity,
      expectedEnvironment,
      process.env.P4_DR_ALLOW_UNMARKED_SOURCE === '1',
    )
    return await client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
      const identity = await queryOne<ReadinessSqlRow>(
        tx,
        `SELECT current_database()::text AS database_name,
                current_setting('server_version')::text AS postgres_version`,
      )
      const schema = await inspectSchemaContract(tx)
      assertSchemaContract(schema, 'DB-P4 backup source')
      return {
        databaseName: String(identity.database_name),
        postgresVersion: String(identity.postgres_version),
        schema,
      }
    })
  } finally {
    await client.$disconnect()
  }
}

async function main(): Promise<void> {
  requireHaLocalEnvironment()
  requireDrAuthorization('P4_DR_BACKUP_ALLOW')

  const sourceProvider = parseProvider(process.env.P4_DR_SOURCE_PROVIDER ?? 'supabase', 'P4_DR_SOURCE_PROVIDER')
  const source = requireDrConnection('P4_DR_SOURCE_DATABASE_URL', 'P4_DR_SOURCE_DATABASE_IDENTITY')
  const outputDir = path.resolve(requireEnvironmentVariable('P4_DR_BACKUP_DIR'))
  if (outputDir === process.cwd() || outputDir.startsWith(`${process.cwd()}${path.sep}`)) {
    throw new Error('P4_DR_BACKUP_DIR must be outside the repository; database dumps must not enter Git.')
  }
  const expectedEnvironment = process.env.P4_DR_EXPECTED_SOURCE_ENVIRONMENT?.trim()
  const snapshot = await snapshotDatabase(source.url, source.identity, expectedEnvironment)
  const sourceMajorMatch = snapshot.postgresVersion.match(/^(\d+)/)
  const sourceMajor = sourceMajorMatch ? Number(sourceMajorMatch[1]) : undefined
  if (sourceMajor === undefined) throw new Error('Could not determine source PostgreSQL major version.')

  const binDir = resolvePgBinDir()
  const toolMajor = await requirePgTools(binDir, ['pg_dump', 'pg_restore'], sourceMajor)
  await fs.mkdir(outputDir, { recursive: true })
  const createdAt = new Date().toISOString()
  const stamp = createdAt.replace(/[:.]/g, '-')
  const dumpFile = `visutry-${sourceProvider}-${stamp}.dump`
  const dumpPath = path.join(outputDir, dumpFile)
  const excludes = [
    'public._prisma_migrations',
    'public."EnvironmentMetadata"',
    'public."DbP3MigrationRehearsalMarker"',
    'auth',
    'storage',
    'vault',
    'supabase_vault',
  ]

  await runPostgresTool(binDir, 'pg_dump', [
    '-w',
    '--format=custom',
    '--compress=6',
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--schema=public',
    '--exclude-table=public._prisma_migrations',
    '--exclude-table=public."EnvironmentMetadata"',
    '--exclude-table=public."DbP3MigrationRehearsalMarker"',
    `--file=${dumpPath}`,
    libpqConnectionString(source.url),
  ])
  const listing = await runPostgresTool(binDir, 'pg_restore', ['--list', dumpPath])
  if (/(^|\s)(pg_catalog|information_schema|pg_toast|auth|storage|vault|supabase_vault|_prisma_migrations|EnvironmentMetadata|DbP3MigrationRehearsalMarker)(\s|$)|EXTENSION/i.test(listing.stdout)) {
    throw new Error('Backup artifact contains a system, provider, migration, or environment/test object.')
  }

  const stat = await fs.stat(dumpPath)
  const dumpSha256 = await sha256File(dumpPath)
  const manifest: BackupManifest = {
    format: 'postgresql-custom-data-only',
    createdAt,
    sourceProvider,
    sourceDatabaseIdentity: source.identity,
    sourceDatabaseName: snapshot.databaseName,
    postgresVersion: snapshot.postgresVersion,
    canonicalBaselineSha256: CANONICAL_BASELINE_SHA256,
    applicationTableCount: snapshot.schema.tableCount,
    dumpFile,
    dumpBytes: stat.size,
    dumpSha256,
    excludes,
    drState: {
      activeProvider: sourceProvider,
      lastBackupAt: createdAt,
      lastBackupChecksum: dumpSha256,
      lastBackupSourceIdentity: source.identity,
      lastWarmRestoreAt: null,
      lastWarmValidationAt: null,
      lastColdRestoreAt: null,
      lastColdValidationAt: null,
      warmRpoSeconds: numberEnv('P4_WARM_RPO_SECONDS', 1800),
      backupAgeSeconds: 0,
    },
  }
  await fs.writeFile(path.join(outputDir, 'dr-state.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  printJson({
    result: 'PASS',
    readOnlySource: true,
    sourceProvider,
    sourceDatabase: redactUrl(source.url),
    sourceDatabaseIdentity: source.identity,
    postgresVersion: snapshot.postgresVersion,
    postgresToolMajor: toolMajor,
    applicationTableCount: snapshot.schema.tableCount,
    rawSqlInvariants: snapshot.schema.rawSqlInvariants,
    dumpFile: dumpFile,
    dumpBytes: stat.size,
    dumpSha256,
    manifest: 'dr-state.json',
  })
}

main().catch((error) => {
  console.error(`PostgreSQL DR backup failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
