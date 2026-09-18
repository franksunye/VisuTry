import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { databaseIdentityFromUrl, requireExplicitAppEnvironment } from '../src/lib/app-environment'

const repoRoot = process.cwd()

function redactDatabaseUrls(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s'\")]+/gi, '[redacted database URL]')
}

function runCanonicalMigrations(databaseUrl: string): void {
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL_UNPOOLED: databaseUrl,
      PGCONNECT_TIMEOUT: '30',
    },
    encoding: 'utf8',
  })
  if (result.stdout) process.stdout.write(redactDatabaseUrls(result.stdout))
  if (result.stderr) process.stderr.write(redactDatabaseUrls(result.stderr))
  if (result.status !== 0) throw new Error('Canonical Preview migration deploy failed.')
}

function main() {
  if (requireExplicitAppEnvironment() !== 'preview' || process.env.VERCEL_ENV !== 'preview') throw new Error('Preview bootstrap requires APP_ENV=preview and VERCEL_ENV=preview.')
  if (process.env.VISUTRY_PREVIEW_QA !== '1') throw new Error('Preview bootstrap requires VISUTRY_PREVIEW_QA=1.')
  if (process.env.VISUTRY_DATABASE_IDENTITY !== 'neon:steep-silence-18355430:br-raspy-cake-adwjq4e9') throw new Error('Preview bootstrap requires the approved Preview database identity.')

  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Preview bootstrap requires DATABASE_URL_UNPOOLED, DIRECT_DATABASE_URL, DIRECT_URL, or DATABASE_URL.')
  const databaseIdentity = databaseIdentityFromUrl(databaseUrl)
  if (!databaseIdentity || !databaseIdentity.includes('ep-old-frog-adgzp23w')) throw new Error('Preview bootstrap refuses a database other than the dedicated Preview Neon branch.')

  console.log('→ Applying the canonical active migration path')
  runCanonicalMigrations(databaseUrl)

  process.env.DATABASE_URL_UNPOOLED = databaseUrl
  const register = spawnSync('npx', ['tsx', 'scripts/db-environment.ts', 'register'], { cwd: repoRoot, stdio: 'inherit', env: process.env })
  if (register.status !== 0) throw new Error('Preview database marker registration failed.')
  console.log(JSON.stringify({ environment: 'preview', databaseIdentity, migrationPath: 'prisma/migrations', result: 'PASS' }, null, 2))
}

try { main() } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
