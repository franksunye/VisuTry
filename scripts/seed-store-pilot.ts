/**
 * Import one standard Pilot Delivery Kit package into the existing Store core.
 *
 * Usage:
 *   npm run db:seed:pilot -- pilot/ello-sunglasses
 *
 * The importer is intentionally merchant-agnostic. It does not create demo
 * traffic, call an AI provider, or contain merchant-specific branching.
 */

import 'dotenv/config'
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma'
import {
  accentColorForToken,
  assertPilotCatalogSourceOwnership,
  experiencePolicyForPilotConfig,
  readPilotPackage,
} from '../src/modules/store/application/pilot-delivery-kit'

function assertSeedEnvironment() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  if (isProd && process.env.STORE_SEED_CONFIRM !== 'yes') {
    throw new Error('Refusing to seed Store pilots in production without STORE_SEED_CONFIRM=yes')
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) {
    const packagePath = process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
    const { runPilotSeedPlan } = await import('./pilot-seed-plan')
    const plan = await runPilotSeedPlan(packagePath)
    if (plan?.errors.length) process.exitCode = 1
    return
  }
  assertSeedEnvironment()
  const packageDir = resolve(process.argv[2] || 'pilot/ello-sunglasses')
  const { config, catalog, experiences } = await readPilotPackage(packageDir)
  const experiencePolicy = experiencePolicyForPilotConfig(config)
  console.log(`Importing ${config.pilotType} pilot package: ${config.displayName} (${config.merchantSlug})`)

  const existingMerchant = await prisma.merchant.findUnique({
    where: { slug: config.merchantSlug },
    select: { id: true },
  })
  if (existingMerchant) {
    const existingFrames = await prisma.merchantFrame.findMany({
      where: {
        merchantId: existingMerchant.id,
        sku: { in: catalog.map((row) => row.sku) },
      },
      select: { sku: true, source: true },
    })
    assertPilotCatalogSourceOwnership(existingFrames, catalog.map((row) => row.sku))
  }

  const merchant = await prisma.merchant.upsert({
    where: { slug: config.merchantSlug },
    create: {
      slug: config.merchantSlug,
      name: config.displayName,
      logoUrl: config.theme.logoUrl,
      websiteUrl: config.websiteUrl ?? null,
      accentColor: accentColorForToken(config.theme.accentToken),
      status: 'ACTIVE',
      pilotType: config.pilotType,
      referenceData: config.referenceData,
      defaultSource: config.measurement.defaultSource,
      defaultCampaign: config.measurement.defaultCampaign,
      ...experiencePolicy,
      planCode: 'FOUNDING_PILOT',
      commercialStage: 'MARKET_CAPTURE',
      pricingVersion: 'pilot-kit-v1',
      entitlementVersion: 'pilot-kit-v1',
      commerceSessionAllowance: 5000,
      standardRenderAllowance: 1000,
      premiumRenderAllowance: 0,
      campaignAllowance: 1,
    },
    update: {
      name: config.displayName,
      logoUrl: config.theme.logoUrl,
      websiteUrl: config.websiteUrl ?? null,
      accentColor: accentColorForToken(config.theme.accentToken),
      status: 'ACTIVE',
      pilotType: config.pilotType,
      referenceData: config.referenceData,
      defaultSource: config.measurement.defaultSource,
      defaultCampaign: config.measurement.defaultCampaign,
      ...experiencePolicy,
    },
  })

  const externalIds = catalog.map((row) => row.externalId)
  await prisma.merchantFrame.updateMany({
    where: {
      merchantId: merchant.id,
      source: 'CSV',
      status: 'ACTIVE',
      externalId: { notIn: externalIds },
    },
    data: { status: 'INACTIVE' },
  })

  for (const row of catalog) {
    await prisma.merchantFrame.upsert({
      where: { merchantId_sku: { merchantId: merchant.id, sku: row.sku } },
      create: {
        merchantId: merchant.id,
        sku: row.sku,
        name: row.name,
        variant: row.variant,
        imageUrl: row.imageUrl,
        productUrl: row.productUrl,
        price: row.price,
        currency: row.currency,
        shape: row.shape,
        material: row.material,
        color: row.color,
        widthClass: row.widthClass,
        lensWidthMm: row.lensWidthMm,
        bridgeWidthMm: row.bridgeWidthMm,
        templeLengthMm: row.templeLengthMm,
        frameWidthMm: row.frameWidthMm,
        styleTags: row.styleTags,
        collectionTags: row.collectionTags,
        sourceNotes: row.sourceNotes,
        source: 'CSV',
        externalId: row.externalId,
        enrichmentStatus: 'APPROVED',
        status: row.status,
      },
      update: {
        name: row.name,
        variant: row.variant,
        imageUrl: row.imageUrl,
        productUrl: row.productUrl,
        price: row.price,
        currency: row.currency,
        shape: row.shape,
        material: row.material,
        color: row.color,
        widthClass: row.widthClass,
        lensWidthMm: row.lensWidthMm,
        bridgeWidthMm: row.bridgeWidthMm,
        templeLengthMm: row.templeLengthMm,
        frameWidthMm: row.frameWidthMm,
        styleTags: row.styleTags,
        collectionTags: row.collectionTags,
        sourceNotes: row.sourceNotes,
        externalId: row.externalId,
        enrichmentStatus: 'APPROVED',
        status: row.status,
      },
    })
  }

  const importedFrames = await prisma.merchantFrame.findMany({
    where: { merchantId: merchant.id, externalId: { in: catalog.map((row) => row.externalId) } },
    select: { id: true, externalId: true, status: true },
  })
  const framesByExternalId = new Map(
    importedFrames.flatMap((frame) => frame.externalId ? [[frame.externalId, frame]] as const : []),
  )

  for (const experienceConfig of experiences) {
    const selectedExternalIds = experienceConfig.catalogSelection === 'ALL_ACTIVE'
      ? catalog.filter((row) => row.status === 'ACTIVE').map((row) => row.externalId)
      : experienceConfig.catalogSelection
    const selectedFrames = selectedExternalIds.map((externalId) => framesByExternalId.get(externalId))
    if (selectedFrames.some((frame) => !frame || frame.status !== 'ACTIVE')) {
      throw new Error(`Experience ${experienceConfig.experienceSlug} selects an unknown or inactive catalog row`)
    }

    const experience = await prisma.experience.upsert({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug: experienceConfig.experienceSlug,
        },
      },
      create: {
        merchantId: merchant.id,
        type: experienceConfig.type,
        slug: experienceConfig.experienceSlug,
        name: experienceConfig.name,
        status: experienceConfig.status,
        headline: experienceConfig.headline ?? null,
        description: experienceConfig.description ?? null,
        heroAssetUrl: experienceConfig.heroAsset ?? null,
        primaryCtaType: experienceConfig.primaryCta?.type ?? null,
        primaryCtaLabel: experienceConfig.primaryCta?.label ?? null,
        primaryCtaUrl: experienceConfig.primaryCta?.url ?? null,
        secondaryCtaType: experienceConfig.secondaryCta?.type ?? null,
        secondaryCtaLabel: experienceConfig.secondaryCta?.label ?? null,
        secondaryCtaUrl: experienceConfig.secondaryCta?.url ?? null,
        offerLabel: experienceConfig.offer?.label ?? null,
        offerCode: experienceConfig.offer?.code ?? null,
        offerTerms: experienceConfig.offer?.terms ?? null,
        startAt: experienceConfig.startAt ? new Date(experienceConfig.startAt) : null,
        endAt: experienceConfig.endAt ? new Date(experienceConfig.endAt) : null,
        referenceData: experienceConfig.referenceData ?? config.referenceData,
        defaultSource: experienceConfig.measurement?.defaultSource ?? config.measurement.defaultSource,
        defaultCampaign: experienceConfig.measurement?.defaultCampaign ?? config.measurement.defaultCampaign,
      },
      update: {
        type: experienceConfig.type,
        name: experienceConfig.name,
        status: experienceConfig.status,
        headline: experienceConfig.headline ?? null,
        description: experienceConfig.description ?? null,
        heroAssetUrl: experienceConfig.heroAsset ?? null,
        primaryCtaType: experienceConfig.primaryCta?.type ?? null,
        primaryCtaLabel: experienceConfig.primaryCta?.label ?? null,
        primaryCtaUrl: experienceConfig.primaryCta?.url ?? null,
        secondaryCtaType: experienceConfig.secondaryCta?.type ?? null,
        secondaryCtaLabel: experienceConfig.secondaryCta?.label ?? null,
        secondaryCtaUrl: experienceConfig.secondaryCta?.url ?? null,
        offerLabel: experienceConfig.offer?.label ?? null,
        offerCode: experienceConfig.offer?.code ?? null,
        offerTerms: experienceConfig.offer?.terms ?? null,
        startAt: experienceConfig.startAt ? new Date(experienceConfig.startAt) : null,
        endAt: experienceConfig.endAt ? new Date(experienceConfig.endAt) : null,
        referenceData: experienceConfig.referenceData ?? config.referenceData,
        defaultSource: experienceConfig.measurement?.defaultSource ?? config.measurement.defaultSource,
        defaultCampaign: experienceConfig.measurement?.defaultCampaign ?? config.measurement.defaultCampaign,
      },
    })

    await prisma.experienceFrame.deleteMany({ where: { experienceId: experience.id, merchantId: merchant.id } })
    if (selectedFrames.length > 0) {
      await prisma.experienceFrame.createMany({
        data: selectedFrames.map((frame, sortOrder) => ({
          experienceId: experience.id,
          merchantId: merchant.id,
          merchantFrameId: frame!.id,
          sortOrder,
          active: true,
        })),
      })
    }
  }

  const activeCount = await prisma.merchantFrame.count({ where: { merchantId: merchant.id, status: 'ACTIVE' } })
  console.log(`Merchant id=${merchant.id}; imported ${catalog.length} rows; active frames=${activeCount}`)
  console.log(`Reference data: ${config.referenceData}; route: /${config.defaultLocale}/store/${config.merchantSlug}`)
  console.log(`Experiences: ${experiences.map((experience) => experience.experienceSlug).join(', ')}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
