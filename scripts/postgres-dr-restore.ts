import fs from 'node:fs/promises'
import path from 'node:path'
import { CANONICAL_BASELINE_SHA256, createReadinessPrismaClient, printJson, redactErrorMessage, requireEnvironmentVariable } from './lib/postgres-readiness'
import { assertSchemaContract, inspectSchemaContract } from './lib/postgres-schema-contract'
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
} from './lib/postgres-dr'

type BackupManifest = {
  format: string
  sourceProvider: string
  sourceDatabaseIdentity: string
  postgresVersion: string
  canonicalBaselineSha256: string
  applicationTableCount: number
  dumpFile: string
  dumpBytes: number
  dumpSha256: string
}

function isSafeManifest(manifest: BackupManifest): boolean {
  return manifest.format === 'postgresql-custom-data-only'
    && manifest.sourceProvider.length > 0
    && manifest.sourceDatabaseIdentity.length > 0
    && /^\d+\.\d+/.test(manifest.postgresVersion)
    && manifest.canonicalBaselineSha256 === CANONICAL_BASELINE_SHA256
    && manifest.applicationTableCount === 42
    && path.basename(manifest.dumpFile) === manifest.dumpFile
    && manifest.dumpFile.endsWith('.dump')
    && /^[a-f0-9]{64}$/.test(manifest.dumpSha256)
}

async function main(): Promise<void> {
  requireHaLocalEnvironment()
  requireDrAuthorization('P4_DR_RESTORE_ALLOW')

  const targetProvider = parseProvider(
    process.env.P4_DR_TARGET_PROVIDER ?? 'neon_a',
    'P4_DR_TARGET_PROVIDER',
  )
  const target = requireDrConnection('P4_DR_TARGET_DATABASE_URL', 'P4_DR_TARGET_DATABASE_IDENTITY')
  const manifestPath = path.resolve(requireEnvironmentVariable('P4_DR_BACKUP_MANIFEST'))
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as BackupManifest
  if (!isSafeManifest(manifest)) throw new Error('Backup manifest is invalid or not from the approved canonical baseline.')

  const manifestDir = path.dirname(manifestPath)
  const dumpPath = path.join(manifestDir, manifest.dumpFile)
  const actualChecksum = await sha256File(dumpPath)
  if (actualChecksum !== manifest.dumpSha256) throw new Error('Backup checksum mismatch; refusing restore.')

  const targetClient = createReadinessPrismaClient(target.url)
  try {
    await assertDrDatabaseSafety(
      targetClient,
      target.url,
      target.identity,
      process.env.P4_DR_EXPECTED_TARGET_ENVIRONMENT?.trim(),
      process.env.P4_DR_ALLOW_UNMARKED_TARGET === '1',
    )
    const targetSchema = await targetClient.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
      return inspectSchemaContract(tx)
    })
    assertSchemaContract(targetSchema, 'DB-P4 restore target')
  } finally {
    await targetClient.$disconnect()
  }

  const binDir = resolvePgBinDir()
  const sourceMajorMatch = manifest.postgresVersion.match(/^(\d+)/)
  const sourceMajor = Number(process.env.P4_SOURCE_POSTGRES_MAJOR ?? sourceMajorMatch?.[1] ?? 0)
  const toolMajor = await requirePgTools(
    binDir,
    ['pg_restore'],
    sourceMajor > 0 ? sourceMajor : undefined,
  )
  const listing = await runPostgresTool(binDir, 'pg_restore', ['--list', dumpPath])
  if (/(^|\s)(pg_catalog|information_schema|pg_toast|auth|storage|vault|supabase_vault|_prisma_migrations|EnvironmentMetadata|DbP3MigrationRehearsalMarker)(\s|$)|EXTENSION/i.test(listing.stdout)) {
    throw new Error('Backup artifact contains a system, provider, migration, or environment/test object.')
  }

  await runPostgresTool(binDir, 'pg_restore', [
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--exit-on-error',
    `--dbname=${libpqConnectionString(target.url)}`,
    dumpPath,
  ])

  printJson({
    result: 'PASS',
    targetProvider,
    targetDatabase: redactUrl(target.url),
    targetDatabaseIdentity: target.identity,
    sourceProvider: manifest.sourceProvider,
    sourceDatabaseIdentity: manifest.sourceDatabaseIdentity,
    postgresToolMajor: toolMajor,
    dumpSha256: manifest.dumpSha256,
    ledgerMutation: false,
    schemaMutation: false,
    dataRestore: true,
  })
}

main().catch((error) => {
  console.error(`PostgreSQL DR restore failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
