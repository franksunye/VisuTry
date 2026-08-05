/**
 * Seed Luna Optical sample merchant + 16 representative frames.
 *
 * Safety:
 * - upsert by stable slug / SKU (non-destructive)
 * - does NOT call deleteMany on shared tables
 * - refuses production unless STORE_SEED_CONFIRM=yes
 *
 * Usage:
 *   npx tsx scripts/seed-store-luna.ts
 *   STORE_SEED_CONFIRM=yes npx tsx scripts/seed-store-luna.ts   # production guard override
 */

import 'dotenv/config'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'

const LUNA_SLUG = 'luna-optical'

type SeedFrame = {
  sku: string
  name: string
  imageUrl: string
  productUrl: string
  price: number
  currency: string
  shape: string
  material: string
  color: string
  widthClass: string
  styleTags: string[]
}

const FRAMES: SeedFrame[] = [
  {
    sku: 'LUNA-RECT-01',
    name: 'Harbor Rectangle',
    imageUrl: '/assets/glasses-presets/rectangle-classic.jpg',
    productUrl: 'https://example.com/luna/harbor-rectangle',
    price: 12800,
    currency: 'usd',
    shape: 'rectangle',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['classic', 'professional'],
  },
  {
    sku: 'LUNA-RECT-02',
    name: 'Crystal Bay Soft Square',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-clear-soft-square.jpg',
    productUrl: 'https://example.com/luna/crystal-bay-soft-square',
    price: 14200,
    currency: 'usd',
    shape: 'soft-square',
    material: 'acetate',
    color: 'crystal',
    widthClass: 'narrow',
    styleTags: ['minimal', 'lightweight'],
  },
  {
    sku: 'LUNA-ROUND-01',
    name: 'Orbit Round',
    imageUrl: '/assets/glasses-presets/round-classic.jpg',
    productUrl: 'https://example.com/luna/orbit-round',
    price: 11800,
    currency: 'usd',
    shape: 'round',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['vintage', 'classic'],
  },
  {
    sku: 'LUNA-ROUND-02',
    name: 'Solstice Gold Oval',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-thin-gold-oval.jpg',
    productUrl: 'https://example.com/luna/solstice-gold-oval',
    price: 13500,
    currency: 'usd',
    shape: 'oval',
    material: 'metal',
    color: 'gold',
    widthClass: 'wide',
    styleTags: ['minimal', 'vintage'],
  },
  {
    sku: 'LUNA-CAT-01',
    name: 'Luna Cat-Eye',
    imageUrl: '/assets/glasses-presets/cat-eye-classic.jpg',
    productUrl: 'https://example.com/luna/cat-eye',
    price: 15600,
    currency: 'usd',
    shape: 'cat-eye',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['bold', 'fashion'],
  },
  {
    sku: 'LUNA-CAT-02',
    name: 'Merlot Statement Square',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-statement-color.jpg',
    productUrl: 'https://example.com/luna/merlot-statement-square',
    price: 16800,
    currency: 'usd',
    shape: 'square',
    material: 'acetate',
    color: 'burgundy',
    widthClass: 'narrow',
    styleTags: ['fashion', 'bold'],
  },
  {
    sku: 'LUNA-AVI-01',
    name: 'Northline Aviator',
    imageUrl: '/assets/glasses-presets/aviator-classic.jpg',
    productUrl: 'https://example.com/luna/northline-aviator',
    price: 14900,
    currency: 'usd',
    shape: 'aviator',
    material: 'metal',
    color: 'black',
    widthClass: 'wide',
    styleTags: ['classic', 'sport'],
  },
  {
    sku: 'LUNA-AVI-02',
    name: 'Facet Geometric',
    imageUrl: '/assets/glasses-presets/geometric-classic.jpg',
    productUrl: 'https://example.com/luna/facet-geometric',
    price: 13900,
    currency: 'usd',
    shape: 'geometric',
    material: 'metal',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['minimal', 'architectural'],
  },
  {
    sku: 'LUNA-BROW-01',
    name: 'Ridge Browline',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-slim-browline.jpg',
    productUrl: 'https://example.com/luna/ridge-browline',
    price: 15400,
    currency: 'usd',
    shape: 'browline',
    material: 'mixed',
    color: 'black-gold',
    widthClass: 'medium',
    styleTags: ['classic', 'professional'],
  },
  {
    sku: 'LUNA-BROW-02',
    name: 'Prism Rimless Geometric',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-rimless-geometric.jpg',
    productUrl: 'https://example.com/luna/prism-rimless',
    price: 16200,
    currency: 'usd',
    shape: 'geometric',
    material: 'titanium',
    color: 'silver',
    widthClass: 'wide',
    styleTags: ['rimless', 'minimal'],
  },
  {
    sku: 'LUNA-GEO-01',
    name: 'Cove Keyhole Tortoise',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-warm-tortoise.jpg',
    productUrl: 'https://example.com/luna/cove-keyhole-tortoise',
    price: 14500,
    currency: 'usd',
    shape: 'keyhole',
    material: 'acetate',
    color: 'tortoise',
    widthClass: 'medium',
    styleTags: ['classic', 'warm'],
  },
  {
    sku: 'LUNA-GEO-02',
    name: 'Noir Slim Oval',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-slim-black-oval.jpg',
    productUrl: 'https://example.com/luna/noir-slim-oval',
    price: 15100,
    currency: 'usd',
    shape: 'oval',
    material: 'acetate',
    color: 'black',
    widthClass: 'narrow',
    styleTags: ['minimal', 'editorial'],
  },
  {
    sku: 'LUNA-OVAL-01',
    name: 'Crystal Facet',
    imageUrl: '/assets/glasses-presets/style-explorer/optical-transparent-geometric.jpg',
    productUrl: 'https://example.com/luna/crystal-facet',
    price: 12200,
    currency: 'usd',
    shape: 'geometric',
    material: 'acetate',
    color: 'crystal',
    widthClass: 'narrow',
    styleTags: ['minimal', 'fashion'],
  },
  {
    sku: 'LUNA-SQ-01',
    name: 'Clearline Rimless',
    imageUrl: '/assets/glasses-presets/rimless-light.jpg',
    productUrl: 'https://example.com/luna/clearline-rimless',
    price: 13300,
    currency: 'usd',
    shape: 'rimless',
    material: 'titanium',
    color: 'silver',
    widthClass: 'wide',
    styleTags: ['minimal', 'lightweight'],
  },
  {
    sku: 'LUNA-SQ-02',
    name: 'Block Square',
    imageUrl: '/assets/glasses-presets/square-classic.jpg',
    productUrl: 'https://example.com/luna/block-square',
    price: 17800,
    currency: 'usd',
    shape: 'square',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['bold', 'professional'],
  },
  {
    sku: 'LUNA-ROUND-03',
    name: 'Metro Wayfarer',
    imageUrl: '/assets/glasses-presets/wayfarer-classic.jpg',
    productUrl: 'https://example.com/luna/metro-wayfarer',
    price: 14100,
    currency: 'usd',
    shape: 'wayfarer',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['classic', 'everyday'],
  },
]

function assertSeedEnvironment() {
  const nodeEnv = process.env.NODE_ENV
  const vercelEnv = process.env.VERCEL_ENV
  const isProd =
    nodeEnv === 'production' || vercelEnv === 'production' || process.env.STORE_SEED_FORCE_PROD === '1'

  if (isProd && process.env.STORE_SEED_CONFIRM !== 'yes') {
    throw new Error(
      'Refusing to seed Store merchants in production without STORE_SEED_CONFIRM=yes',
    )
  }
}

async function main() {
  assertSeedEnvironment()
  console.log('Seeding Luna Optical Store catalog...')

  const merchant = await prisma.merchant.upsert({
    where: { slug: LUNA_SLUG },
    create: {
      slug: LUNA_SLUG,
      name: 'Luna Optical',
      logoUrl: '/images/store/luna-optical-mark.svg',
      websiteUrl: 'https://example.com/luna',
      contactEmail: 'demo@luna-optical.example',
      accentColor: '#1F4B5A',
      status: 'ACTIVE',
    },
    update: {
      name: 'Luna Optical',
      logoUrl: '/images/store/luna-optical-mark.svg',
      websiteUrl: 'https://example.com/luna',
      contactEmail: 'demo@luna-optical.example',
      accentColor: '#1F4B5A',
      status: 'ACTIVE',
    },
  })

  let upserted = 0
  const frameIdsBySku = new Map<string, string>()
  for (const frame of FRAMES) {
    const record = await prisma.merchantFrame.upsert({
      where: {
        merchantId_sku: {
          merchantId: merchant.id,
          sku: frame.sku,
        },
      },
      create: {
        merchantId: merchant.id,
        sku: frame.sku,
        name: frame.name,
        imageUrl: frame.imageUrl,
        productUrl: frame.productUrl,
        price: frame.price,
        currency: frame.currency,
        shape: frame.shape,
        material: frame.material,
        color: frame.color,
        widthClass: frame.widthClass,
        styleTags: frame.styleTags,
        source: 'SEED',
        externalId: frame.sku,
        enrichmentStatus: 'APPROVED',
        status: 'ACTIVE',
      },
      update: {
        name: frame.name,
        imageUrl: frame.imageUrl,
        productUrl: frame.productUrl,
        price: frame.price,
        currency: frame.currency,
        shape: frame.shape,
        material: frame.material,
        color: frame.color,
        widthClass: frame.widthClass,
        styleTags: frame.styleTags,
        enrichmentStatus: 'APPROVED',
        status: 'ACTIVE',
        externalId: frame.sku,
      },
    })
    frameIdsBySku.set(frame.sku, record.id)
    upserted += 1
  }

  const frameIds = FRAMES.flatMap((frame) => {
    const id = frameIdsBySku.get(frame.sku)
    return id ? [id] : []
  })
  if (frameIds.length !== FRAMES.length) {
    throw new Error(`Expected ${FRAMES.length} seeded frames, resolved ${frameIds.length}`)
  }
  const demoNames = ['Sarah J.', 'David L.', 'Emily R.', 'Jessica M.', 'Michael T.', 'Priya S.']
  const dailySessionCounts = [2, 3, 2, 3, 3, 4, 3, 4, 5, 4, 5, 6, 5, 7]
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  let demoSessions = 0
  let demoEvents = 0
  let demoIntents = 0

  for (let dayIndex = 0; dayIndex < dailySessionCounts.length; dayIndex += 1) {
    const daysAgo = dailySessionCounts.length - 1 - dayIndex
    const sessionCount = dailySessionCounts[dayIndex]

    for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
      const sessionId = `demo_luna_${String(dayIndex).padStart(2, '0')}_${String(sessionIndex).padStart(2, '0')}`
      const createdAt = new Date(
        todayUtc.getTime() - daysAgo * 24 * 60 * 60 * 1000 + (9 + sessionIndex) * 60 * 60 * 1000,
      )
      const expiresAt = new Date(createdAt.getTime() + 45 * 24 * 60 * 60 * 1000)
      const primaryFrameId = frameIds[(dayIndex + sessionIndex) % frameIds.length]
      const hasPhoto = (dayIndex + sessionIndex) % 5 !== 0
      const hasTryOn = hasPhoto && (dayIndex + sessionIndex) % 3 !== 0
      const selectionCount = hasPhoto ? 2 + ((dayIndex + sessionIndex) % 3) : 0
      const tryOnCount = hasTryOn ? 1 + ((dayIndex + sessionIndex) % 2) : 0
      const fitScore = 78 + ((dayIndex * 3 + sessionIndex * 5) % 19)

      await prisma.merchantSession.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          merchantId: merchant.id,
          capabilityTokenHash: `${dayIndex}${sessionIndex}`.padEnd(64, '0'),
          locale: 'en',
          status: 'ACTIVE',
          createdAt,
          lastActiveAt: createdAt,
          expiresAt,
        },
        update: {
          createdAt,
          lastActiveAt: createdAt,
          expiresAt,
          status: 'ACTIVE',
        },
      })
      demoSessions += 1

      const eventInputs: Array<{
        suffix: string
        type: string
        merchantFrameId?: string
        metadata?: Prisma.InputJsonValue
        minute: number
      }> = []
      if (hasPhoto) {
        eventInputs.push({ suffix: 'photo', type: 'merchant_photo_uploaded', minute: 2 })
        eventInputs.push({
          suffix: 'recommend',
          type: 'merchant_recommendation_completed',
          metadata: {
            rankingVersion: 'store-rank-v1',
            resultCount: 6,
            topMatchScore: fitScore,
            averageMatchScore: fitScore - 8,
            demoSeed: true,
          },
          minute: 3,
        })
      }
      for (let index = 0; index < selectionCount; index += 1) {
        eventInputs.push({
          suffix: `selected-${index}`,
          type: 'merchant_frame_selected',
          merchantFrameId: frameIds[(dayIndex + sessionIndex + index) % frameIds.length],
          minute: 4 + index,
        })
      }
      for (let index = 0; index < tryOnCount; index += 1) {
        eventInputs.push({
          suffix: `tryon-${index}`,
          type: 'merchant_tryon_completed',
          merchantFrameId: frameIds[(dayIndex + sessionIndex + index) % frameIds.length],
          minute: 8 + index,
        })
      }
      if (tryOnCount >= 2) {
        eventInputs.push({ suffix: 'compare', type: 'merchant_compare_started', minute: 12 })
      }

      for (const event of eventInputs) {
        const eventId = `demo:luna:${sessionId}:${event.suffix}`
        await prisma.merchantEvent.upsert({
          where: { eventId },
          create: {
            eventId,
            type: event.type,
            merchantId: merchant.id,
            merchantSessionId: sessionId,
            merchantFrameId: event.merchantFrameId,
            source: 'SERVER',
            locale: 'en',
            deviceType: sessionIndex % 3 === 0 ? 'mobile' : 'desktop',
            metadata: event.metadata ?? { demoSeed: true },
            createdAt: new Date(createdAt.getTime() + event.minute * 60 * 1000),
          },
          update: {
            merchantFrameId: event.merchantFrameId,
            metadata: event.metadata ?? { demoSeed: true },
            createdAt: new Date(createdAt.getTime() + event.minute * 60 * 1000),
          },
        })
        demoEvents += 1
      }

      const intentInputs: Array<{ type: 'FAVORITE' | 'PRODUCT_CLICK' | 'INQUIRY'; minute: number }> = []
      if (hasTryOn && (dayIndex + sessionIndex) % 2 === 0) intentInputs.push({ type: 'FAVORITE', minute: 14 })
      if (hasTryOn && (dayIndex + sessionIndex) % 4 === 0) intentInputs.push({ type: 'PRODUCT_CLICK', minute: 15 })
      if (hasTryOn && (sessionIndex === 0 || (dayIndex >= 10 && sessionIndex === 3))) {
        intentInputs.push({ type: 'INQUIRY', minute: 16 })
      }

      for (const intent of intentInputs) {
        const idempotencyKey = `demo:intent:${intent.type}:${sessionId}`
        const shopperName = demoNames[(dayIndex + sessionIndex) % demoNames.length]
        await prisma.merchantIntent.upsert({
          where: { idempotencyKey },
          create: {
            merchantId: merchant.id,
            merchantSessionId: sessionId,
            merchantFrameId: primaryFrameId,
            type: intent.type,
            idempotencyKey,
            email: intent.type === 'INQUIRY' ? `${shopperName.toLowerCase().replace(/[^a-z]/g, '')}@example.com` : null,
            name: intent.type === 'INQUIRY' ? shopperName : null,
            note: intent.type === 'INQUIRY' ? 'Interested in availability, color options, and delivery timing.' : null,
            createdAt: new Date(createdAt.getTime() + intent.minute * 60 * 1000),
          },
          update: {
            merchantFrameId: primaryFrameId,
            email: intent.type === 'INQUIRY' ? `${shopperName.toLowerCase().replace(/[^a-z]/g, '')}@example.com` : null,
            name: intent.type === 'INQUIRY' ? shopperName : null,
            note: intent.type === 'INQUIRY' ? 'Interested in availability, color options, and delivery timing.' : null,
            createdAt: new Date(createdAt.getTime() + intent.minute * 60 * 1000),
          },
        })
        demoIntents += 1
      }
    }
  }

  const activeCount = await prisma.merchantFrame.count({
    where: { merchantId: merchant.id, status: 'ACTIVE' },
  })

  console.log(`Merchant: ${merchant.name} (${merchant.slug}) id=${merchant.id}`)
  console.log(`Frames upserted this run: ${upserted}`)
  console.log(`Active frames for merchant: ${activeCount}`)
  console.log(`Demo activity upserted: ${demoSessions} sessions, ${demoEvents} events, ${demoIntents} intents`)
  console.log('Verify: query Merchant by slug "luna-optical" and MerchantFrame where status=ACTIVE')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
