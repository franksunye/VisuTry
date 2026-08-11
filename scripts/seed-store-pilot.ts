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
import { accentColorForToken, readPilotPackage } from '../src/modules/store/application/pilot-delivery-kit'

function assertSeedEnvironment() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  if (isProd && process.env.STORE_SEED_CONFIRM !== 'yes') {
    throw new Error('Refusing to seed Store pilots in production without STORE_SEED_CONFIRM=yes')
  }
}

async function main() {
  assertSeedEnvironment()
  const packageDir = resolve(process.argv[2] || 'pilot/ello-sunglasses')
  const { config, catalog } = await readPilotPackage(packageDir)
  console.log(`Importing ${config.pilotType} pilot package: ${config.displayName} (${config.merchantSlug})`)

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

  const activeCount = await prisma.merchantFrame.count({ where: { merchantId: merchant.id, status: 'ACTIVE' } })
  console.log(`Merchant id=${merchant.id}; imported ${catalog.length} rows; active frames=${activeCount}`)
  console.log(`Reference data: ${config.referenceData}; route: /${config.defaultLocale}/store/${config.merchantSlug}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
