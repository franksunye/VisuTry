/**
 * Seed the VisuTry-owned first-party discovery canary.
 *
 * Safety:
 * - Uses one fixed merchant slug and tenant-scoped upserts only.
 * - Never deletes shared rows or touches another merchant.
 * - Uses generic local VisuTry assets with first-party frame destinations.
 * - Requires VISUTRY_DEMO_SEED_CONFIRM=yes when targeting production.
 *
 * Usage:
 *   npx tsx scripts/seed-store-visutry-demo.ts --dry-run
 *   VISUTRY_DEMO_SEED_CONFIRM=yes npx tsx scripts/seed-store-visutry-demo.ts
 */

const MERCHANT_SLUG = 'visutry-demo'
const MERCHANT_NAME = 'VisuTry Demo'
const SPONSORED_POLICY_KEY = 'VISUTRY_OWNED'
const DISCOVERY_CANARY_SOURCE = 'DISCOVERY_CANARY_2026-09-03'
const DISCOVERY_CANARY_REASON = 'VisuTry-owned first-party Discovery Canary; not an external merchant, customer, or partner claim.'

const FRAME_DEFINITIONS = [
  {
    sku: 'VT-DEMO-ROUND-01',
    slug: 'round',
    name: 'VisuTry Round',
    imageUrl: '/assets/glasses-presets/round-classic.jpg',
    shape: 'round',
    material: 'acetate',
    color: 'graphite',
    widthClass: 'medium',
    styleTags: ['classic', 'soft'],
  },
  {
    sku: 'VT-DEMO-RECT-01',
    slug: 'rectangle',
    name: 'VisuTry Rectangle',
    imageUrl: '/assets/glasses-presets/rectangle-classic.jpg',
    shape: 'rectangle',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['structured', 'everyday'],
  },
  {
    sku: 'VT-DEMO-OVAL-01',
    slug: 'oval',
    name: 'VisuTry Oval',
    imageUrl: '/assets/glasses-presets/oval-classic.jpg',
    shape: 'oval',
    material: 'acetate',
    color: 'smoke',
    widthClass: 'wide',
    styleTags: ['minimal', 'soft'],
  },
  {
    sku: 'VT-DEMO-BROW-01',
    slug: 'browline',
    name: 'VisuTry Browline',
    imageUrl: '/assets/glasses-presets/browline-classic.jpg',
    shape: 'browline',
    material: 'mixed',
    color: 'black-gold',
    widthClass: 'medium',
    styleTags: ['defined', 'classic'],
  },
  {
    sku: 'VT-DEMO-AVI-01',
    slug: 'aviator',
    name: 'VisuTry Aviator',
    imageUrl: '/assets/glasses-presets/aviator-classic.jpg',
    shape: 'aviator',
    material: 'metal',
    color: 'silver',
    widthClass: 'wide',
    styleTags: ['balanced', 'light'],
  },
  {
    sku: 'VT-DEMO-CAT-01',
    slug: 'cat-eye',
    name: 'VisuTry Cat-Eye',
    imageUrl: '/assets/glasses-presets/cat-eye-classic.jpg',
    shape: 'cat-eye',
    material: 'acetate',
    color: 'tortoise',
    widthClass: 'narrow',
    styleTags: ['lifted', 'expressive'],
  },
] as const

const EXPERIENCE_DEFINITIONS = [
  {
    slug: 'store',
    type: 'STORE' as const,
    name: 'VisuTry Demo Store',
    headline: 'Find frames for your everyday style',
    description: 'VisuTry-owned demo experience for evaluating frame discovery, virtual try-on, and shopper decisions.',
    campaign: 'visutry-demo-store',
    frameCount: FRAME_DEFINITIONS.length,
  },
  {
    slug: 'everyday-fit',
    type: 'CAMPAIGN' as const,
    name: 'Everyday Fit',
    headline: 'Find frames that fit your everyday style',
    description: 'VisuTry-owned demo campaign for evaluating guided frame discovery and shopper decisions.',
    campaign: 'visutry-demo-everyday-fit',
    frameCount: 4,
  },
] as const

const CANARY_METADATA = {
  ownership: 'VISUTRY',
  purpose: 'DISCOVERY_CANARY',
  disclosure: 'VisuTry-owned first-party discovery canary; not an external merchant or customer storefront.',
}

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
}

function assertSeedEnvironment(): void {
  if (isProductionEnvironment() && process.env.VISUTRY_DEMO_SEED_CONFIRM !== 'yes') {
    throw new Error(
      'Refusing to seed VisuTry Demo in production without VISUTRY_DEMO_SEED_CONFIRM=yes',
    )
  }
}

function printDryRun(): void {
  console.log(JSON.stringify({
    merchant: {
      slug: MERCHANT_SLUG,
      name: MERCHANT_NAME,
      pilotType: 'LIVE',
      referenceData: false,
      classification: 'REAL',
      sponsoredUsagePolicyKey: SPONSORED_POLICY_KEY,
      metadata: CANARY_METADATA,
    },
    frames: FRAME_DEFINITIONS.map(({ sku, slug, name, imageUrl, shape, widthClass }) => ({
      sku,
      name,
      imageUrl,
      shape,
      widthClass,
      productUrl: `https://www.visutry.com/en/demo/frames/${slug}`,
    })),
    experiences: EXPERIENCE_DEFINITIONS,
    writes: 'tenant-scoped upserts only',
  }, null, 2))
}

async function main(): Promise<void> {
  if (process.argv.includes('--dry-run')) {
    printDryRun()
    return
  }

  assertSeedEnvironment()
  const { prisma } = await import('../src/lib/prisma')

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingMerchant = await tx.merchant.findUnique({
        where: { slug: MERCHANT_SLUG },
        select: {
          id: true,
          name: true,
          websiteUrl: true,
          pilotType: true,
          classification: true,
          referenceData: true,
        },
      })

      if (existingMerchant && (
        existingMerchant.name !== MERCHANT_NAME ||
        existingMerchant.websiteUrl !== null ||
        existingMerchant.pilotType !== 'LIVE' ||
        existingMerchant.classification !== 'REAL' ||
        existingMerchant.referenceData
      )) {
        throw new Error(
          `Refusing to reuse ${MERCHANT_SLUG}: existing row is not the expected VisuTry-owned discovery canary`,
        )
      }

      const merchant = await tx.merchant.upsert({
        where: { slug: MERCHANT_SLUG },
        create: {
          slug: MERCHANT_SLUG,
          name: MERCHANT_NAME,
          websiteUrl: null,
          status: 'ACTIVE',
          pilotType: 'LIVE',
          referenceData: false,
          classification: 'REAL',
          classificationSource: DISCOVERY_CANARY_SOURCE,
          classificationReason: DISCOVERY_CANARY_REASON,
          defaultSource: 'visutry',
          defaultCampaign: 'visutry-demo',
          tryOnEnabled: true,
          compareEnabled: true,
          maxCompareFrames: 2,
          inquiryEnabled: false,
          sponsoredUsagePolicyKey: SPONSORED_POLICY_KEY,
        },
        update: {
          name: MERCHANT_NAME,
          websiteUrl: null,
          status: 'ACTIVE',
          pilotType: 'LIVE',
          referenceData: false,
          classification: 'REAL',
          classificationSource: DISCOVERY_CANARY_SOURCE,
          classificationReason: DISCOVERY_CANARY_REASON,
          defaultSource: 'visutry',
          defaultCampaign: 'visutry-demo',
          tryOnEnabled: true,
          compareEnabled: true,
          maxCompareFrames: 2,
          inquiryEnabled: false,
          sponsoredUsagePolicyKey: SPONSORED_POLICY_KEY,
        },
        select: { id: true, slug: true, name: true, sponsoredUsagePolicyKey: true },
      })

      await tx.merchantFrame.updateMany({
        where: {
          merchantId: merchant.id,
          source: 'SEED',
          status: 'ACTIVE',
          sku: { notIn: FRAME_DEFINITIONS.map((frame) => frame.sku) },
        },
        data: { status: 'INACTIVE' },
      })

      const frames = []
      for (const frame of FRAME_DEFINITIONS) {
        const saved = await tx.merchantFrame.upsert({
          where: { merchantId_sku: { merchantId: merchant.id, sku: frame.sku } },
          create: {
            merchantId: merchant.id,
            sku: frame.sku,
            name: frame.name,
            brand: 'VisuTry',
            imageUrl: frame.imageUrl,
            productUrl: `https://www.visutry.com/en/demo/frames/${frame.slug}`,
            shape: frame.shape,
            material: frame.material,
            color: frame.color,
            widthClass: frame.widthClass,
            styleTags: [...frame.styleTags],
            collectionTags: ['visutry-demo', 'discovery-canary'],
            sourceNotes: 'VisuTry-owned first-party demo inventory; not offered for sale.',
            source: 'SEED',
            externalId: frame.sku,
            enrichmentStatus: 'NOT_REQUIRED',
            status: 'ACTIVE',
          },
          update: {
            name: frame.name,
            brand: 'VisuTry',
            imageUrl: frame.imageUrl,
            productUrl: `https://www.visutry.com/en/demo/frames/${frame.slug}`,
            shape: frame.shape,
            material: frame.material,
            color: frame.color,
            widthClass: frame.widthClass,
            styleTags: [...frame.styleTags],
            collectionTags: ['visutry-demo', 'discovery-canary'],
            sourceNotes: 'VisuTry-owned first-party demo inventory; not offered for sale.',
            source: 'SEED',
            externalId: frame.sku,
            enrichmentStatus: 'NOT_REQUIRED',
            status: 'ACTIVE',
          },
          select: { id: true, sku: true, status: true },
        })
        frames.push(saved)
      }

      const experiences = []
      for (const definition of EXPERIENCE_DEFINITIONS) {
        const selectedFrames = definition.frameCount === FRAME_DEFINITIONS.length
          ? frames
          : frames.slice(0, definition.frameCount)
        const experience = await tx.experience.upsert({
          where: { merchantId_slug: { merchantId: merchant.id, slug: definition.slug } },
          create: {
            merchantId: merchant.id,
            type: definition.type,
            slug: definition.slug,
            name: definition.name,
            status: 'ACTIVE',
            headline: definition.headline,
            description: definition.description,
            referenceData: false,
            defaultSource: 'visutry',
            defaultCampaign: definition.campaign,
            referenceMetadata: CANARY_METADATA,
          },
          update: {
            type: definition.type,
            name: definition.name,
            status: 'ACTIVE',
            headline: definition.headline,
            description: definition.description,
            referenceData: false,
            defaultSource: 'visutry',
            defaultCampaign: definition.campaign,
            referenceMetadata: CANARY_METADATA,
          },
          select: { id: true, slug: true, type: true, merchantId: true },
        })

        await tx.experienceFrame.deleteMany({
          where: { merchantId: merchant.id, experienceId: experience.id },
        })
        await tx.experienceFrame.createMany({
          data: selectedFrames.map((frame, sortOrder) => ({
            experienceId: experience.id,
            merchantId: merchant.id,
            merchantFrameId: frame.id,
            sortOrder,
            active: true,
          })),
        })
        experiences.push({ ...experience, frameCount: selectedFrames.length })
      }

      return { merchant, frames, experiences }
    }, {
      maxWait: 10_000,
      timeout: 30_000,
    })

    console.log(JSON.stringify({
      merchant: result.merchant,
      frames: { count: result.frames.length, ids: result.frames.map((frame) => frame.id) },
      experiences: result.experiences,
      globalFlagRequired: true,
      note: 'Merchant policy is explicit; global MERCHANT_SPONSORED_USAGE_ENABLED remains a separate rollout control.',
    }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
