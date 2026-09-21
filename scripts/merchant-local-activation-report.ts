import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { requireExplicitAppEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter } from '../src/lib/postgres-runtime'

const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false })

async function main() {
  if (requireExplicitAppEnvironment() !== 'local') throw new Error('Activation report requires APP_ENV=local.')
  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter() })
  try {
    const merchant = await prisma.merchant.findFirst({
      where: { memberships: { some: { userId: 'mock-user-2' } } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, classification: true },
    })
    if (!merchant) throw new Error('No Local Clean Merchant workspace found. Run the Local golden path first.')
    const events = await prisma.merchantActivationEvent.findMany({ where: { merchantId: merchant.id }, orderBy: { occurredAt: 'asc' }, select: { eventType: true } })
    const required = ['merchant_workspace_created', 'merchant_first_item_added', 'merchant_catalog_ready', 'merchant_store_configured', 'merchant_store_previewed']
    const observed = new Set(events.map((event) => event.eventType))
    const missing = required.filter((eventType) => !observed.has(eventType))
    const result = missing.length === 0 && merchant.classification === 'TEST' ? 'PASS' : 'FAIL'
    console.log(JSON.stringify({ environment: 'local', merchantId: merchant.id, slug: merchant.slug, classification: merchant.classification, events: [...observed], missing, result }, null, 2))
    if (result === 'FAIL') process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
