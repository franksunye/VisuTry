import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment, isLoopbackDatabaseUrl, requireExplicitAppEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'
import { resolveMerchantCommercialState } from '../src/modules/store/domain/merchant-commercial-state'
import { resolveLocalDemoDatabaseIdentity } from './lib/local-demo-session-reset-contract'

const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false })

async function main() {
  const env = process.env
  const databaseUrl = env.DATABASE_URL
  if (requireExplicitAppEnvironment(env) !== 'local' || env.VERCEL_ENV || env.NODE_ENV === 'production') {
    throw new Error('Refusing: Demo entitlement preflight is Local-only.')
  }
  if (resolveRuntimePostgresProvider(env) !== 'PRISMA_PG' || !databaseUrl || !isLoopbackDatabaseUrl(databaseUrl)) {
    throw new Error('Refusing: Local PrismaPg and loopback PostgreSQL are required.')
  }
  const expectedDatabaseIdentity = resolveLocalDemoDatabaseIdentity(env)

  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(env) })
  try {
    const marker = await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity,
    })
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'visutry-demo-optical' },
      select: {
        classification: true,
        pilotType: true,
        commercialExceptionCode: true,
        planCode: true,
        commercialStatus: true,
        entitlementEffectiveFrom: true,
        billingPeriodEnd: true,
      },
    })
    if (!merchant) throw new Error('Canonical Local Demo Merchant is missing; run npm run demo:local:bootstrap.')
    const commercial = resolveMerchantCommercialState(merchant)
    const explicitIdentity = merchant.classification === 'TEST'
      && merchant.pilotType === 'DEMO'
      && merchant.commercialExceptionCode === 'VISUTRY_DEMO'
    if (!explicitIdentity || commercial.commercialState !== 'DEMO' || commercial.status !== 'DEMO_ACTIVE' || commercial.planCode !== null) {
      throw new Error('Canonical Local Demo is not using its explicit TEST/DEMO/VISUTRY_DEMO entitlement.')
    }
    console.log('LOCAL DEMO ENTITLEMENT')
    console.log(`DATABASE: ${marker.environment}/${marker.databaseIdentity} · PASS`)
    console.log('MERCHANT: visutry-demo-optical · PASS')
    console.log('IDENTITY: TEST + DEMO + VISUTRY_DEMO · PASS')
    console.log('COMMERCIAL STATE: DEMO / DEMO_ACTIVE · planCode=null · PASS')
    console.log('PRODUCTION / STRIPE / PROVIDER WRITES: NONE')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
