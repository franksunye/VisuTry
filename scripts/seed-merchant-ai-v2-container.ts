/**
 * M1b ONLY: disposable local browser fixture, never a production entitlement.
 * Requires the existing container-only local DB marker and no Vercel runtime.
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { requireExplicitAppEnvironment } from '../src/lib/app-environment'

async function main() {
  if (
    requireExplicitAppEnvironment() !== 'local'
    || process.env.VERCEL || process.env.VERCEL_ENV
    || process.env.VISUTRY_DATABASE_IDENTITY !== 'local:127.0.0.1:5439/visutry_local_container_e2e'
    || !process.env.DATABASE_URL?.includes('127.0.0.1:5439/visutry_local_container_e2e')
  ) throw new Error('Merchant usage fixture requires a disposable local-only database')

  const merchant = await prisma.merchant.findUnique({
    where: { slug: 'ello-sunglasses' }, select: { id: true, pilotType: true, referenceData: true },
  })
  if (!merchant || merchant.pilotType !== 'REFERENCE' || !merchant.referenceData) {
    throw new Error('Expected seeded local reference merchant; refusing to enroll another merchant')
  }
  const now = Date.now()
  await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE',
      entitlementVersion: 'v2', pricingVersion: 'v2-container-e2e',
      standardRenderAllowance: 2, commerceSessionAllowance: 10,
      entitlementEffectiveFrom: new Date(now - 3600_000),
      billingPeriodEnd: new Date(now + 30 * 86400_000),
      sponsoredUsagePolicyKey: 'DISABLED',
    },
  })
  const localFrameImage = '/assets/glasses-presets/large-round-classic.jpg'
  const updated = await prisma.merchantFrame.updateMany({
    where: { merchantId: merchant.id, status: 'ACTIVE' },
    data: { imageUrl: localFrameImage },
  })
  if (updated.count < 2) throw new Error('Expected at least two valid local fixture frames')
  const qa = await prisma.merchant.findUnique({
    where: { slug: 'local-qa-usage' },
    select: { id: true, classification: true },
  })
  if (!qa || qa.classification !== 'TEST') throw new Error('Expected local TEST merchant for M2')
  await prisma.merchant.update({
    where: { id: qa.id },
    data: {
      planCode: 'GROWTH',
      commercialStatus: 'PAID_ACTIVE',
      entitlementVersion: 'v2',
      pricingVersion: 'v2-container-e2e',
      standardRenderAllowance: 20,
      commerceSessionAllowance: 50,
      entitlementEffectiveFrom: new Date(now - 3600000),
      billingPeriodEnd: new Date(now + 30 * 86400000),
      sponsoredUsagePolicyKey: 'DISABLED',
    },
  })
  console.log(JSON.stringify({ localOnly: true, merchant: 'reference-fixture',
    renderLimit: 2, frameCount: updated.count, m2TestMerchantLimit: 20, result: 'PASS' }))
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
