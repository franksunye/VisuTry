import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { requireExplicitAppEnvironment } from '../src/lib/app-environment'

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required.')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  if (requireExplicitAppEnvironment() !== 'local') throw new Error('Local seed requires APP_ENV=local.')
  const identities = [
    { id: 'local-consumer', email: 'local-consumer@local.test', name: 'Local Consumer', username: 'local-consumer', role: 'USER' as const },
    { id: 'mock-user-2', email: 'premium@example.com', name: 'Local QA Clean Merchant', username: 'premiumuser', role: 'USER' as const },
    { id: 'mock-user-1', email: 'test@example.com', name: 'Local QA Existing Merchant', username: 'local-qa-existing', role: 'USER' as const },
    { id: 'mock-user-admin', email: 'admin@example.com', name: 'Local QA Admin', username: 'adminuser', role: 'ADMIN' as const },
  ]
  for (const identity of identities) {
    await prisma.user.upsert({
      where: { id: identity.id },
      create: identity,
      update: { email: identity.email, name: identity.name, username: identity.username, role: identity.role },
    })
  }
  const user = await prisma.user.upsert({
    where: { id: 'mock-user-1' },
    create: { id: 'mock-user-1', email: 'test@example.com', name: 'Local QA Existing Merchant', username: 'local-qa-existing' },
    update: { name: 'Local QA Existing Merchant' },
  })
  for (const [alias, planCode] of [['QA-FREE', 'FREE'], ['QA-PILOT', 'FOUNDING_PILOT'], ['QA-SUBSCRIPTION', 'LAUNCH'], ['QA-USAGE', 'GROWTH']] as const) {
    const slug = `local-${alias.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const merchant = await prisma.merchant.upsert({
      where: { slug },
      create: { slug, name: `Local ${alias}`, classification: 'TEST', classificationSource: 'LOCAL_QA_SEED', classificationReason: 'Local deterministic QA data.', planCode, commercialStatus: planCode === 'FREE' ? 'FREE' : null, pricingVersion: planCode === 'FREE' ? 'commercial-v1' : null, entitlementVersion: planCode === 'FREE' ? 'commercial-v1' : null },
      update: { classification: 'TEST', classificationSource: 'LOCAL_QA_SEED', classificationReason: 'Local deterministic QA data.' },
    })
    await prisma.merchantMembership.upsert({
      where: { userId_merchantId: { userId: user.id, merchantId: merchant.id } },
      create: { userId: user.id, merchantId: merchant.id, role: 'OWNER' },
      update: { role: 'OWNER' },
    })
  }
  console.log(JSON.stringify({ environment: 'local', userId: user.id, merchants: 4, classification: 'TEST', result: 'PASS' }, null, 2))
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }).finally(() => prisma.$disconnect())
