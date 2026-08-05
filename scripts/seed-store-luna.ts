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
    imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=800&fit=crop',
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
    name: 'Slate Soft Rectangle',
    imageUrl: 'https://images.unsplash.com/photo-1556306535-38febf6782e7?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/slate-soft-rectangle',
    price: 14200,
    currency: 'usd',
    shape: 'rectangle',
    material: 'metal',
    color: 'gold',
    widthClass: 'narrow',
    styleTags: ['minimal', 'professional'],
  },
  {
    sku: 'LUNA-ROUND-01',
    name: 'Orbit Round',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/orbit-round',
    price: 11800,
    currency: 'usd',
    shape: 'round',
    material: 'metal',
    color: 'silver',
    widthClass: 'medium',
    styleTags: ['vintage', 'classic'],
  },
  {
    sku: 'LUNA-ROUND-02',
    name: 'Cascade Round Acetate',
    imageUrl: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/cascade-round',
    price: 13500,
    currency: 'usd',
    shape: 'round',
    material: 'acetate',
    color: 'tortoise',
    widthClass: 'wide',
    styleTags: ['bold', 'vintage'],
  },
  {
    sku: 'LUNA-CAT-01',
    name: 'Luna Cat-Eye',
    imageUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/cat-eye',
    price: 15600,
    currency: 'usd',
    shape: 'cat-eye',
    material: 'acetate',
    color: 'burgundy',
    widthClass: 'medium',
    styleTags: ['bold', 'fashion'],
  },
  {
    sku: 'LUNA-CAT-02',
    name: 'Ember Cat-Eye Metal',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/ember-cat-eye',
    price: 16800,
    currency: 'usd',
    shape: 'cat-eye',
    material: 'metal',
    color: 'rose-gold',
    widthClass: 'narrow',
    styleTags: ['fashion', 'minimal'],
  },
  {
    sku: 'LUNA-AVI-01',
    name: 'Northline Aviator',
    imageUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/northline-aviator',
    price: 14900,
    currency: 'usd',
    shape: 'aviator',
    material: 'metal',
    color: 'gold',
    widthClass: 'wide',
    styleTags: ['classic', 'sport'],
  },
  {
    sku: 'LUNA-AVI-02',
    name: 'Drift Aviator Matte',
    imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=800&fit=crop&sat=-40',
    productUrl: 'https://example.com/luna/drift-aviator',
    price: 13900,
    currency: 'usd',
    shape: 'aviator',
    material: 'metal',
    color: 'gunmetal',
    widthClass: 'medium',
    styleTags: ['minimal', 'sport'],
  },
  {
    sku: 'LUNA-BROW-01',
    name: 'Ridge Browline',
    imageUrl: 'https://images.unsplash.com/photo-1556306535-38febf6782e7?w=800&h=800&fit=crop&sat=-20',
    productUrl: 'https://example.com/luna/ridge-browline',
    price: 15400,
    currency: 'usd',
    shape: 'browline',
    material: 'acetate',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['classic', 'professional'],
  },
  {
    sku: 'LUNA-BROW-02',
    name: 'Harbor Browline Two-Tone',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop&sat=-30',
    productUrl: 'https://example.com/luna/harbor-browline',
    price: 16200,
    currency: 'usd',
    shape: 'browline',
    material: 'acetate',
    color: 'tortoise',
    widthClass: 'wide',
    styleTags: ['vintage', 'bold'],
  },
  {
    sku: 'LUNA-GEO-01',
    name: 'Facet Geometric',
    imageUrl: 'https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=800&h=800&fit=crop',
    productUrl: 'https://example.com/luna/facet-geometric',
    price: 14500,
    currency: 'usd',
    shape: 'geometric',
    material: 'acetate',
    color: 'clear',
    widthClass: 'medium',
    styleTags: ['fashion', 'minimal'],
  },
  {
    sku: 'LUNA-GEO-02',
    name: 'Prism Hex',
    imageUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&h=800&fit=crop&sat=-50',
    productUrl: 'https://example.com/luna/prism-hex',
    price: 15100,
    currency: 'usd',
    shape: 'geometric',
    material: 'acetate',
    color: 'olive',
    widthClass: 'narrow',
    styleTags: ['bold', 'fashion'],
  },
  {
    sku: 'LUNA-OVAL-01',
    name: 'Soft Oval Wire',
    imageUrl: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&h=800&fit=crop&sat=-10',
    productUrl: 'https://example.com/luna/soft-oval',
    price: 12200,
    currency: 'usd',
    shape: 'oval',
    material: 'metal',
    color: 'silver',
    widthClass: 'narrow',
    styleTags: ['minimal', 'classic'],
  },
  {
    sku: 'LUNA-SQ-01',
    name: 'Block Square',
    imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=800&fit=crop&sat=-60',
    productUrl: 'https://example.com/luna/block-square',
    price: 13300,
    currency: 'usd',
    shape: 'square',
    material: 'acetate',
    color: 'navy',
    widthClass: 'wide',
    styleTags: ['bold', 'professional'],
  },
  {
    sku: 'LUNA-SQ-02',
    name: 'Line Square Titanium',
    imageUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&h=800&fit=crop&sat=-25',
    productUrl: 'https://example.com/luna/line-square',
    price: 17800,
    currency: 'usd',
    shape: 'square',
    material: 'metal',
    color: 'black',
    widthClass: 'medium',
    styleTags: ['minimal', 'professional'],
  },
  {
    sku: 'LUNA-ROUND-03',
    name: 'Cove Keyhole Round',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop&sat=-15',
    productUrl: 'https://example.com/luna/cove-keyhole',
    price: 14100,
    currency: 'usd',
    shape: 'round',
    material: 'acetate',
    color: 'crystal',
    widthClass: 'medium',
    styleTags: ['fashion', 'classic'],
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
      logoUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=200&h=200&fit=crop',
      websiteUrl: 'https://example.com/luna',
      contactEmail: 'demo@luna-optical.example',
      accentColor: '#1F4B5A',
      status: 'ACTIVE',
    },
    update: {
      name: 'Luna Optical',
      logoUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=200&h=200&fit=crop',
      websiteUrl: 'https://example.com/luna',
      contactEmail: 'demo@luna-optical.example',
      accentColor: '#1F4B5A',
      status: 'ACTIVE',
    },
  })

  let upserted = 0
  for (const frame of FRAMES) {
    await prisma.merchantFrame.upsert({
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
    upserted += 1
  }

  const activeCount = await prisma.merchantFrame.count({
    where: { merchantId: merchant.id, status: 'ACTIVE' },
  })

  console.log(`Merchant: ${merchant.name} (${merchant.slug}) id=${merchant.id}`)
  console.log(`Frames upserted this run: ${upserted}`)
  console.log(`Active frames for merchant: ${activeCount}`)
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
