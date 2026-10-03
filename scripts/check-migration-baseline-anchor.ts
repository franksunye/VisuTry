import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { classifyMigrationBaselineLedger } from './lib/migration-baseline-anchor'

const baselineName = process.argv[2]
const expectedBaselineName = '20261003000000_canonical_schema_baseline'
const directUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DIRECT_DATABASE_URL ??
  process.env.DIRECT_URL

async function main(): Promise<void> {
  if (baselineName !== expectedBaselineName) {
    throw new Error('Unexpected canonical baseline identity; refusing anchor check.')
  }
  if (!directUrl) {
    throw new Error('No direct PostgreSQL URL is configured for the baseline anchor check.')
  }

  const migrationSqlPath = resolve(
    process.cwd(),
    'prisma/migrations',
    baselineName,
    'migration.sql',
  )
  const migrationSql = await readFile(migrationSqlPath)
  const expectedChecksum = createHash('sha256').update(migrationSql).digest('hex')

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: directUrl }),
  })
  try {
    const rows = await prisma.$queryRaw<Array<{
      total: string
      finished: string
      rolled_back: string
      unfinished: string
      checksum_matches: string
    }>>`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (
          WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        )::text AS finished,
        COUNT(*) FILTER (WHERE rolled_back_at IS NOT NULL)::text AS rolled_back,
        COUNT(*) FILTER (
          WHERE finished_at IS NULL AND rolled_back_at IS NULL
        )::text AS unfinished,
        COUNT(*) FILTER (WHERE checksum = ${expectedChecksum})::text AS checksum_matches
      FROM "_prisma_migrations"
      WHERE migration_name = ${baselineName}
    `
    const row = rows[0]

    if (!row) {
      throw new Error('Migration ledger returned no anchor status row.')
    }

    const total = String(row.total)
    const finished = String(row.finished)
    const rolledBack = String(row.rolled_back)
    const unfinished = String(row.unfinished)
    const checksumMatches = String(row.checksum_matches)
    const state = classifyMigrationBaselineLedger({
      total,
      finished,
      rolledBack,
      unfinished,
      checksumMatches,
    })

    if (state === 'absent') {
      console.log('MIGRATION_BASELINE_ANCHOR=absent')
      process.exitCode = 2
      return
    }

    if (state === 'invalid') {
      console.log(
        `MIGRATION_BASELINE_ANCHOR=invalid total=${total} finished=${finished} rolledBack=${rolledBack} unfinished=${unfinished} checksumMatches=${checksumMatches}`,
      )
      process.exitCode = 3
      return
    }

    console.log('MIGRATION_BASELINE_ANCHOR=applied')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`MIGRATION_BASELINE_ANCHOR=check-error ${message}`)
  process.exitCode = 1
})
