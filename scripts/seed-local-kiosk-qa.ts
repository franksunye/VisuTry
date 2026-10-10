import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

/** Only the ephemeral, exact-identity LOCAL CI PostgreSQL is allowed. */
const identity = 'local:127.0.0.1:5432/visutry_merchant_rc'
if (process.env.CI !== 'true' || process.env.APP_ENV !== 'local'
  || process.env.NODE_ENV !== 'test' || process.env.TEST_MODE !== 'true'
  || process.env.ENABLE_MOCKS !== 'true'
  || process.env.VISUTRY_DATABASE_IDENTITY !== identity
  || process.env.VERCEL || process.env.VERCEL_ENV) {
  throw new Error('KIOSK_FIXTURE_BLOCKED: requires isolated LOCAL CI with mocks')
}
const url = new URL(process.env.DATABASE_URL_UNPOOLED || '')
if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1'
  || url.port !== '5432' || url.pathname !== '/visutry_merchant_rc') {
  throw new Error('KIOSK_FIXTURE_BLOCKED: wrong database endpoint')
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) })
async function main() {
  const metadata = await prisma.environmentMetadata.findUnique({ where: { id: 'primary' } })
  if (metadata?.environment !== 'LOCAL' || metadata.databaseIdentity !== identity) {
    throw new Error('KIOSK_FIXTURE_BLOCKED: actual PostgreSQL metadata mismatch')
  }
  const merchant = await prisma.merchant.findUnique({ where: { slug: 'local-qa-pilot' } })
  const owner = await prisma.user.findUnique({ where: { id: 'mock-user-1' } })
  if (!merchant || merchant.classification !== 'TEST' || merchant.planCode !== 'FOUNDING_PILOT' || !owner) {
    throw new Error('KIOSK_FIXTURE_BLOCKED: expected TEST pilot and seeded owner missing')
  }
  const membership = await prisma.merchantMembership.findUnique({
    where: { userId_merchantId: { userId: owner.id, merchantId: merchant.id } },
  })
  if (!membership || membership.role !== 'OWNER') throw new Error('KIOSK_FIXTURE_BLOCKED: owner membership missing')
  const frame = await prisma.merchantFrame.upsert({
    where: { merchantId_sku: { merchantId: merchant.id, sku: 'LOCAL-P1-M6-KIOSK-SEED' } },
    update: {
      status: 'ACTIVE', enrichmentStatus: 'APPROVED',
      imageUrl: '/assets/glasses-presets/large-round-classic.jpg',
      shape: 'round', price: 12900, currency: 'usd',
    },
    create: {
      merchantId: merchant.id, sku: 'LOCAL-P1-M6-KIOSK-SEED',
      name: 'Local Kiosk Round QA Frame', brand: 'Local QA',
      imageUrl: '/assets/glasses-presets/large-round-classic.jpg',
      productUrl: 'https://merchant.example.test/local-kiosk-frame',
      shape: 'round', price: 12900, currency: 'usd', source: 'SEED',
      status: 'ACTIVE', enrichmentStatus: 'APPROVED',
    },
  })
  const store = await prisma.experience.upsert({
    where: { merchantId_slug: { merchantId: merchant.id, slug: 'store' } },
    update: { status: 'ACTIVE', type: 'STORE' },
    create: {
      merchantId: merchant.id, slug: 'store', type: 'STORE', status: 'ACTIVE',
      name: 'Local QA-PILOT Kiosk Store', headline: 'Choose your next pair',
    },
  })
  await prisma.experienceFrame.upsert({
    where: { experienceId_merchantFrameId: { experienceId: store.id, merchantFrameId: frame.id } },
    update: { active: true, sortOrder: 0 },
    create: { merchantId: merchant.id, experienceId: store.id, merchantFrameId: frame.id, active: true, sortOrder: 0 },
  })
  const count = await prisma.experienceFrame.count({ where: { merchantId: merchant.id, experienceId: store.id, active: true } })
  if (count < 1) throw new Error('KIOSK_FIXTURE_BLOCKED: Store has no selected product')
  console.log(JSON.stringify({ fixture: 'G1F_KIOSK_LOCAL',
    databaseIdentity: metadata.databaseIdentity, classification: merchant.classification,
    storeStatus: store.status, storeFrames: count, source: 'EPHEMERAL_POSTGRES', result: 'READY' }))
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
