import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { Prisma, PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment, databaseIdentityFromUrl, isLoopbackDatabaseUrl, requireExplicitAppEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'
import { mockModeEnabled } from '../src/lib/mocks'
import { validateMerchantFrameReadiness } from '../src/modules/merchant/domain/merchant-frame-readiness'
import { resolveMerchantCommercialState } from '../src/modules/store/domain/merchant-commercial-state'

const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false })

const MERCHANT_IDENTITY = {
  slug: 'visutry-demo-optical',
  name: 'VisuTry Demo Optical',
  ownerUserId: 'mock-user-1',
  commercialExceptionCode: 'VISUTRY_DEMO',
  classificationSource: 'LOCAL_DEMO_FIXTURE',
  classificationReason: 'VisuTry-owned local demo Merchant and non-sale synthetic catalog for reusable product and experience QA.',
} as const

const LEGACY_CLASSIFICATION_SOURCE = 'WHITEPAPER_DEMO_PHASE_2B_2B'
const LEGACY_CLASSIFICATION_REASON = 'VisuTry-owned first-party demo Merchant and non-sale catalog for local white paper evidence capture.'
const DEMO_SOURCE_NOTES = 'VisuTry-owned synthetic local demo inventory; not offered for sale. Material and color labels describe visual appearance only.'
const LEGACY_DEMO_SOURCE_NOTES = 'VisuTry-owned synthetic demo inventory; not offered for sale. Material and color labels describe visual appearance only.'
const STORE_REFERENCE_METADATA = {
  ownership: 'VISUTRY',
  purpose: 'LOCAL_DEMO',
  disclosure: 'VisuTry-owned demo Store and synthetic demo products; not an external retailer and not offered for sale.',
  catalogId: 'visutry-demo-catalog-v1',
} as const
const LEGACY_STORE_PURPOSE = 'WHITE_PAPER_DEMO'

type CatalogItem = {
  id: string
  sku: string
  name: string
  assetPath: string
  shape: string
  visualColor: string
  materialAppearance: string
  styleTags: string[]
  demoOnly: boolean
  forSale: boolean
}

function requireLocalSafety(): { databaseUrl: string; expectedIdentity: string } {
  const env = process.env
  if (requireExplicitAppEnvironment(env) !== 'local' || env.VERCEL_ENV) {
    throw new Error('Refusing: this seed is allowed only in an explicitly selected non-Vercel Local environment.')
  }
  if (env.NODE_ENV === 'production') throw new Error('Refusing: NODE_ENV=production is not allowed for the Local demo seed.')
  if (!mockModeEnabled(env)) throw new Error('Refusing: Local mock authentication must be enabled.')
  if (resolveRuntimePostgresProvider(env) !== 'PRISMA_PG') throw new Error('Refusing: Local PrismaPg runtime was not selected.')
  if (env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase() !== 'test') {
    throw new Error('Refusing: Local Stripe mode must be test, even though this seed never calls Stripe.')
  }
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('Refusing: only a Stripe TEST key may be present in the Local environment.')
  }

  const databaseUrl = env.DATABASE_URL
  if (!databaseUrl) throw new Error('Refusing: DATABASE_URL is required for the Local demo seed.')
  const parsed = (() => {
    try { return new URL(databaseUrl) } catch { return null }
  })()
  if (!parsed || !isLoopbackDatabaseUrl(databaseUrl)
    || parsed.hostname !== '127.0.0.1'
    || parsed.port !== '5433'
    || parsed.pathname !== '/visutry_local') {
    throw new Error('Refusing: DATABASE_URL must target 127.0.0.1:5433/visutry_local.')
  }

  const unpooledUrl = env.DATABASE_URL_UNPOOLED
  if (unpooledUrl) {
    let unpooled: URL
    try { unpooled = new URL(unpooledUrl) } catch { throw new Error('Refusing: DATABASE_URL_UNPOOLED is invalid.') }
    if (!isLoopbackDatabaseUrl(unpooledUrl) || unpooled.hostname !== '127.0.0.1'
      || unpooled.port !== '5433' || unpooled.pathname !== '/visutry_local') {
      throw new Error('Refusing: DATABASE_URL_UNPOOLED must target 127.0.0.1:5433/visutry_local.')
    }
  }

  const productionHosts = ['www.visutry.com', 'visutry-pre.vercel.app']
  const configuredDestinations = [env.NEXTAUTH_URL, env.NEXT_PUBLIC_SITE_URL, env.MCP_RESOURCE_URL]
  if (configuredDestinations.some((value) => productionHosts.some((host) => value?.includes(host)))) {
    throw new Error('Refusing: a Production or Preview application destination is configured in this Local process.')
  }
  if (env.APP_ENV !== 'local') throw new Error('Refusing: Local analytics isolation is not active.')

  const expectedIdentity = env.VISUTRY_DATABASE_IDENTITY || 'local:127.0.0.1:5433/visutry_local'
  if (expectedIdentity !== 'local:127.0.0.1:5433/visutry_local'
    || databaseIdentityFromUrl(databaseUrl) !== '127.0.0.1/visutry_local') {
    throw new Error('Refusing: the configured Local database identity is not the canonical Local database.')
  }

  return { databaseUrl, expectedIdentity }
}

function loadCatalog(): CatalogItem[] {
  const manifestPath = path.join(process.cwd(), 'docs/assets/local-demo/visutry-demo-catalog-v1.json')
  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { catalogId?: unknown; demoOnly?: unknown; forSale?: unknown; items?: unknown }
  if (parsed.catalogId !== 'visutry-demo-catalog-v1' || parsed.demoOnly !== true || parsed.forSale !== false || !Array.isArray(parsed.items)) {
    throw new Error('Refusing: canonical demo catalog manifest is missing or does not declare a non-sale demo catalog.')
  }
  if (parsed.items.length !== 10) throw new Error(`Refusing: expected exactly 10 catalog items; found ${parsed.items.length}.`)

  const items = parsed.items as CatalogItem[]
  const skuSet = new Set<string>()
  for (const item of items) {
    if (!item.sku.startsWith('VT-DEMO-') || !item.name.startsWith('VT ')
      || !item.demoOnly || item.forSale || !item.shape || !item.visualColor
      || !item.materialAppearance || !Array.isArray(item.styleTags)) {
      throw new Error(`Refusing: catalog item ${item.sku || '(missing SKU)'} is incomplete or not explicitly non-sale demo inventory.`)
    }
    if (skuSet.has(item.sku)) throw new Error(`Refusing: duplicate SKU ${item.sku} in canonical demo catalog.`)
    skuSet.add(item.sku)
    const localAssetPath = path.join(process.cwd(), 'public', item.assetPath.replace(/^\/+/, ''))
    if (!fs.existsSync(localAssetPath)) throw new Error(`Refusing: catalog asset is missing: ${item.assetPath}`)
  }
  return items
}

async function main() {
  const { expectedIdentity } = requireLocalSafety()
  const items = loadCatalog()
  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(process.env) })

  try {
    const marker = await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity: expectedIdentity,
    })
    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({ where: { id: MERCHANT_IDENTITY.ownerUserId }, select: { id: true } })
      if (!owner) throw new Error('Refusing: the existing Local QA owner identity mock-user-1 is missing; no new auth identity will be created.')

      const existingMerchant = await tx.merchant.findUnique({
        where: { slug: MERCHANT_IDENTITY.slug },
        select: { id: true, name: true, classification: true, classificationSource: true, classificationReason: true, pilotType: true, referenceData: true },
      })
      if (existingMerchant && (
        existingMerchant.name !== MERCHANT_IDENTITY.name
        || existingMerchant.classification !== 'TEST'
        || !(
          (existingMerchant.classificationSource === MERCHANT_IDENTITY.classificationSource
            && existingMerchant.classificationReason === MERCHANT_IDENTITY.classificationReason)
          || (existingMerchant.classificationSource === LEGACY_CLASSIFICATION_SOURCE
            && existingMerchant.classificationReason === LEGACY_CLASSIFICATION_REASON)
        )
        || existingMerchant.pilotType !== 'DEMO'
      )) {
        throw new Error(`Refusing to reuse ${MERCHANT_IDENTITY.slug}: existing row does not carry this seed's dedicated Local TEST identity.`)
      }

      const merchant = existingMerchant
        ? await tx.merchant.update({
          where: { id: existingMerchant.id },
          data: {
            status: 'ACTIVE',
            classificationSource: MERCHANT_IDENTITY.classificationSource,
            classificationReason: MERCHANT_IDENTITY.classificationReason,
            commercialExceptionCode: MERCHANT_IDENTITY.commercialExceptionCode,
            referenceData: false,
            tryOnEnabled: true,
            compareEnabled: true,
            maxCompareFrames: 2,
            inquiryEnabled: false,
            websiteUrl: null,
          },
          select: { id: true, slug: true, name: true, classification: true, pilotType: true, commercialExceptionCode: true, planCode: true, commercialStatus: true, billingPeriodEnd: true },
        })
        : await tx.merchant.create({
          data: {
            slug: MERCHANT_IDENTITY.slug,
            name: MERCHANT_IDENTITY.name,
            status: 'ACTIVE',
            pilotType: 'DEMO',
            referenceData: false,
            classification: 'TEST',
            classificationSource: MERCHANT_IDENTITY.classificationSource,
            classificationReason: MERCHANT_IDENTITY.classificationReason,
            commercialExceptionCode: MERCHANT_IDENTITY.commercialExceptionCode,
            websiteUrl: null,
            tryOnEnabled: true,
            compareEnabled: true,
            maxCompareFrames: 2,
            inquiryEnabled: false,
          },
          select: { id: true, slug: true, name: true, classification: true, pilotType: true, commercialExceptionCode: true, planCode: true, commercialStatus: true, billingPeriodEnd: true },
        })

      const memberships = await tx.merchantMembership.findMany({
        where: { merchantId: merchant.id },
        select: { userId: true, role: true },
      })
      if (memberships.some((membership) => membership.userId !== owner.id || membership.role !== 'OWNER')) {
        throw new Error('Refusing: the dedicated demo Merchant has an unexpected owner/member; no membership was changed.')
      }
      await tx.merchantMembership.upsert({
        where: { userId_merchantId: { userId: owner.id, merchantId: merchant.id } },
        create: { userId: owner.id, merchantId: merchant.id, role: 'OWNER' },
        update: { role: 'OWNER' },
      })

      const experiences = await tx.experience.findMany({
        where: { merchantId: merchant.id },
        select: { id: true, slug: true, type: true, referenceData: true, referenceMetadata: true },
      })
      if (experiences.some((experience) => experience.type !== 'STORE' || experience.slug !== 'store')) {
        throw new Error('Refusing: the dedicated demo Merchant has an unexpected non-Store experience; nothing will be deleted.')
      }
      if (experiences.length > 1) throw new Error('Refusing: the dedicated demo Merchant has more than one experience; nothing will be deleted.')
      const existingStore = experiences[0]
      if (existingStore && (
        !existingStore.referenceMetadata
        || typeof existingStore.referenceMetadata !== 'object'
        || !('ownership' in existingStore.referenceMetadata)
        || existingStore.referenceMetadata.ownership !== 'VISUTRY'
        || !('purpose' in existingStore.referenceMetadata)
        || ![STORE_REFERENCE_METADATA.purpose, LEGACY_STORE_PURPOSE].includes(String(existingStore.referenceMetadata.purpose))
      )) {
        throw new Error('Refusing to reuse the existing Store: its provenance marker is not the expected VisuTry demo marker.')
      }

      const existingFrames = await tx.merchantFrame.findMany({
        where: { merchantId: merchant.id },
        select: { id: true, sku: true, source: true, sourceNotes: true },
      })
      const itemBySku = new Map(items.map((item) => [item.sku, item]))
      for (const frame of existingFrames) {
        if (!frame.sku || !itemBySku.has(frame.sku)
          || frame.source !== 'SEED' || ![DEMO_SOURCE_NOTES, LEGACY_DEMO_SOURCE_NOTES].includes(frame.sourceNotes || '')) {
          throw new Error(`Refusing: unexpected existing catalog row ${frame.sku ?? frame.id} under the dedicated demo Merchant; no rows will be deleted.`)
        }
      }

      const store = await tx.experience.upsert({
        where: { merchantId_slug: { merchantId: merchant.id, slug: 'store' } },
        create: {
          merchantId: merchant.id,
          type: 'STORE',
          slug: 'store',
          name: 'VisuTry Demo Optical',
          status: 'ACTIVE',
          headline: 'Explore the VisuTry demo eyewear collection',
          description: 'A VisuTry-owned demo experience featuring synthetic, non-sale eyewear assets.',
          referenceData: false,
          referenceMetadata: STORE_REFERENCE_METADATA,
          defaultSource: 'visutry-local-demo',
          defaultCampaign: 'local-demo-catalog-v1',
          presentationMode: 'PRODUCT_FIRST',
        },
        update: {
          type: 'STORE',
          name: 'VisuTry Demo Optical',
          status: 'ACTIVE',
          headline: 'Explore the VisuTry demo eyewear collection',
          description: 'A VisuTry-owned demo experience featuring synthetic, non-sale eyewear assets.',
          referenceData: false,
          referenceMetadata: STORE_REFERENCE_METADATA,
          defaultSource: 'visutry-local-demo',
          defaultCampaign: 'local-demo-catalog-v1',
          presentationMode: 'PRODUCT_FIRST',
        },
        select: { id: true, slug: true, status: true },
      })

      const existingStoreFrames = await tx.experienceFrame.findMany({
        where: { merchantId: merchant.id, experienceId: store.id },
        select: { merchantFrameId: true },
      })
      const managedFrameIds = new Set(existingFrames.map((frame) => frame.id))
      if (existingStoreFrames.some((join) => !managedFrameIds.has(join.merchantFrameId))) {
        throw new Error('Refusing: Store selection contains a frame outside the managed demo catalog; nothing will be detached.')
      }

      const storedFrames = []
      for (const [sortOrder, item] of items.entries()) {
        const frameData = {
          name: item.name,
          brand: 'VisuTry',
          imageUrl: item.assetPath,
          productUrl: null,
          price: null,
          currency: null,
          shape: item.shape,
          material: item.materialAppearance,
          color: item.visualColor,
          widthClass: null,
          styleTags: item.styleTags,
          collectionTags: ['visutry-demo', 'local-demo-catalog-v1'],
          sourceNotes: DEMO_SOURCE_NOTES,
          source: 'SEED' as const,
          externalId: item.sku,
          enrichmentStatus: 'APPROVED' as const,
          status: 'ACTIVE' as const,
        }
        const frame = await tx.merchantFrame.upsert({
          where: { merchantId_sku: { merchantId: merchant.id, sku: item.sku } },
          create: { merchantId: merchant.id, sku: item.sku, ...frameData },
          update: frameData,
          select: { id: true, sku: true, name: true, imageUrl: true, shape: true, color: true, material: true, styleTags: true, source: true, status: true, enrichmentStatus: true, productUrl: true, price: true },
        })
        await tx.experienceFrame.upsert({
          where: { experienceId_merchantFrameId: { experienceId: store.id, merchantFrameId: frame.id } },
          create: { experienceId: store.id, merchantId: merchant.id, merchantFrameId: frame.id, sortOrder, active: true },
          update: { merchantId: merchant.id, sortOrder, active: true },
        })
        storedFrames.push(frame)
      }

      const recommendationMatrix = storedFrames.map((frame) => {
        const readiness = validateMerchantFrameReadiness({
          sku: frame.sku,
          externalId: itemBySku.get(frame.sku ?? '')?.sku,
          name: frame.name,
          imageUrl: frame.imageUrl,
          productUrl: frame.productUrl,
          shape: frame.shape,
          source: frame.source,
          status: frame.status,
          enrichmentStatus: frame.enrichmentStatus,
        })
        return {
          sku: frame.sku,
          name: frame.name,
          active: frame.status === 'ACTIVE',
          storeSelected: true,
          recommendationEligible: readiness.recommendationReady,
          missingFields: readiness.issues,
          exclusionReason: readiness.recommendationReady ? null : readiness.issues.join(', ') || 'NOT_RECOMMENDATION_READY',
          assetPath: frame.imageUrl,
          price: frame.price,
          productUrl: frame.productUrl,
        }
      })

      return {
        merchant: { id: merchant.id, slug: merchant.slug, name: merchant.name, classification: merchant.classification, pilotType: merchant.pilotType, commercialExceptionCode: merchant.commercialExceptionCode, planCode: merchant.planCode, commercialStatus: merchant.commercialStatus, billingPeriodEnd: merchant.billingPeriodEnd },
        ownerUserId: owner.id,
        store: { id: store.id, slug: store.slug, status: store.status },
        frames: recommendationMatrix,
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    const commercialState = resolveMerchantCommercialState(result.merchant)
    if (commercialState.commercialState !== 'DEMO' || commercialState.status !== 'DEMO_ACTIVE' || commercialState.planCode !== null) {
      throw new Error('Local Demo fixture failed the explicit Demo commercial entitlement contract.')
    }

    console.log(JSON.stringify({
      environment: marker.environment,
      databaseIdentity: marker.databaseIdentity,
      merchant: result.merchant,
      commercialState: commercialState.commercialState,
      commercialMarkers: {
        classification: result.merchant.classification,
        pilotType: result.merchant.pilotType,
        commercialExceptionCode: result.merchant.commercialExceptionCode,
      },
      ownerIdentityClass: 'LOCAL QA EXISTING MERCHANT (mock-user-1)',
      store: result.store,
      catalogCount: result.frames.length,
      recommendationReadyCount: result.frames.filter((frame) => frame.recommendationEligible).length,
      frames: result.frames,
      mutations: 'dedicated visutry-demo-optical tenant only; no deletes',
      externalProviderCalls: 0,
      stripeCalls: 0,
      blobUploads: 0,
      result: 'PASS',
    }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
