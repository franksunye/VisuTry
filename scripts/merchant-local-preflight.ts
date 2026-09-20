import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment, databaseIdentityFromUrl, isLoopbackDatabaseUrl } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'
import { mockModeEnabled } from '../src/lib/mocks'

const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false })

type Check = { label: string; ok: boolean; detail: string }
const checks: Check[] = []
const check = (label: string, ok: boolean, detail: string) => checks.push({ label, ok, detail })

async function main() {
  const env = process.env
  const databaseUrl = env.DATABASE_URL
  const expectedIdentity = env.VISUTRY_DATABASE_IDENTITY || 'local:127.0.0.1:5433/visutry_local'
  const productionHostnames = ['www.visutry.com', 'visutry-pre.vercel.app']
  const nextAuthUrl = env.NEXTAUTH_URL || ''
  const nextAuthHost = (() => { try { return new URL(nextAuthUrl).hostname } catch { return '' } })()

  check('APP_ENV', env.APP_ENV === 'local' && !env.VERCEL_ENV, env.APP_ENV || '(missing)')
  check('DATABASE', isLoopbackDatabaseUrl(databaseUrl), databaseIdentityFromUrl(databaseUrl) || '(missing)')
  check('DATABASE MARKER CONFIG', /^local:(127\.0\.0\.1|localhost|::1):\d+\/[A-Za-z0-9_-]+$/.test(expectedIdentity), expectedIdentity)
  check('RUNTIME ADAPTER', resolveRuntimePostgresProvider(env) === 'PRISMA_PG', resolveRuntimePostgresProvider(env))
  check('AUTH MODE', mockModeEnabled(env), mockModeEnabled(env) ? 'LOCAL MOCK' : 'not enabled')
  check('NEXTAUTH_URL', ['127.0.0.1', 'localhost', '::1'].includes(nextAuthHost), nextAuthUrl || '(missing)')
  check('STRIPE MODE', env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase() === 'test', env.STRIPE_MERCHANT_BILLING_MODE || '(missing)')
  check('STRIPE KEY', !env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.startsWith('sk_test_'), env.STRIPE_SECRET_KEY ? 'TEST key' : 'mock/no key')
  check('PRODUCTION REFERENCES', ![env.NEXTAUTH_URL, env.NEXT_PUBLIC_SITE_URL, env.MCP_RESOURCE_URL].some((value) => productionHostnames.some((host) => value?.includes(host))), 'none')
  check('REMOTE ANALYTICS', env.APP_ENV === 'local', 'Local telemetry guard disables Production destinations')

  if (checks.every((item) => item.ok)) {
    const client = new PrismaClient({ adapter: createRuntimePostgresAdapter(env) })
    try {
      await client.$queryRaw`SELECT 1`
      check('POSTGRES REACHABLE', true, 'loopback PostgreSQL responded')
      const marker = await assertDatabaseEnvironment({ client, expectedEnvironment: 'local', expectedDatabaseIdentity: expectedIdentity })
      check('DATABASE MARKER', true, `${marker.environment}/${marker.databaseIdentity}`)
    } catch (error) {
      check('POSTGRES REACHABLE', false, error instanceof Error ? error.message : String(error))
      check('DATABASE MARKER', false, 'unavailable')
    } finally {
      await client.$disconnect()
    }
  } else {
    check('POSTGRES REACHABLE', false, 'skipped after failed safety checks')
    check('DATABASE MARKER', false, 'skipped after failed safety checks')
  }

  console.log('\nLOCAL MERCHANT LAB')
  for (const item of checks) console.log(`${item.label}: ${item.ok ? 'PASS' : 'FAIL'}${item.detail ? ` — ${item.detail}` : ''}`)
  const ready = checks.every((item) => item.ok)
  console.log(`\nREADY: ${ready ? 'YES' : 'NO'}`)
  if (!ready) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
