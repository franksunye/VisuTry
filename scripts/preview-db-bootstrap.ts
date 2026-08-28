import 'dotenv/config'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { databaseIdentityFromUrl, requireExplicitAppEnvironment } from '../src/lib/app-environment'

const repoRoot = process.cwd()
const currentMigration = '20260828220000_add_environment_identity'
const migrationRoot = `${repoRoot}/prisma/migrations`

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function runPsql(args: string[], input?: string) {
  const result = spawnSync('psql', ['-X', '-w', '-v', 'ON_ERROR_STOP=1', ...args], {
    cwd: repoRoot,
    env: process.env,
    input,
    encoding: 'utf8',
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) throw new Error(`psql ${args.join(' ')} failed.`)
}

function main() {
  if (requireExplicitAppEnvironment() !== 'preview' || process.env.VERCEL_ENV !== 'preview') throw new Error('Preview bootstrap requires APP_ENV=preview and VERCEL_ENV=preview.')
  if (process.env.VISUTRY_PREVIEW_QA !== '1') throw new Error('Preview bootstrap requires VISUTRY_PREVIEW_QA=1.')
  if (process.env.VISUTRY_DATABASE_IDENTITY !== 'neon:steep-silence-18355430:br-raspy-cake-adwjq4e') throw new Error('Preview bootstrap requires the approved Preview database identity.')
  const databaseIdentity = databaseIdentityFromUrl(process.env.DATABASE_URL)
  if (!databaseIdentity || !databaseIdentity.includes('ep-old-frog-adgzp23w')) throw new Error('Preview bootstrap refuses a database other than the dedicated Preview Neon branch.')

  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Preview bootstrap requires DATABASE_URL or DATABASE_URL_UNPOOLED.')
  process.env.PGCONNECT_TIMEOUT = '30'
  const migrations = readdirSync(migrationRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== currentMigration)
    .map((entry) => entry.name)
    .sort()

  console.log(`→ Marking ${migrations.length} existing schema-only baseline migrations as applied`)
  const ledgerSql = migrations.map((migration) => {
    const checksum = createHash('sha256').update(readFileSync(`${migrationRoot}/${migration}/migration.sql`)).digest('hex')
    return `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      SELECT ${sqlString(randomUUID())}, ${sqlString(checksum)}, CURRENT_TIMESTAMP, ${sqlString(migration)}, NULL, NULL, CURRENT_TIMESTAMP, 1
      WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = ${sqlString(migration)});`
  }).join('\n')
  runPsql([databaseUrl, '-c', ledgerSql])
  console.log(`→ Applying ${currentMigration}`)
  runPsql([databaseUrl, '-f', `${migrationRoot}/${currentMigration}/migration.sql`])
  const checksum = createHash('sha256').update(readFileSync(`${migrationRoot}/${currentMigration}/migration.sql`)).digest('hex')
  runPsql([databaseUrl, '-c', `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
    SELECT ${sqlString(randomUUID())}, ${sqlString(checksum)}, CURRENT_TIMESTAMP, ${sqlString(currentMigration)}, NULL, NULL, CURRENT_TIMESTAMP, 1
    WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = ${sqlString(currentMigration)});`])
  const register = spawnSync('npx', ['tsx', 'scripts/db-environment.ts', 'register'], { cwd: repoRoot, stdio: 'inherit', env: process.env })
  if (register.status !== 0) throw new Error('Preview database marker registration failed.')
  console.log(JSON.stringify({ environment: 'preview', databaseIdentity, migrations: migrations.length + 1, result: 'PASS' }, null, 2))
}

try { main() } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
