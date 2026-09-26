const mockPersistentCache = new Map<string, Promise<unknown>>()

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((callback: () => Promise<unknown>, key: string[]) => {
    const cacheKey = JSON.stringify(key)
    return async () => {
      const existing = mockPersistentCache.get(cacheKey)
      if (existing) return existing
      const pending = callback()
      mockPersistentCache.set(cacheKey, pending)
      return pending
    }
  }),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findMany: jest.fn() },
    experienceFrame: { groupBy: jest.fn() },
  },
}))

jest.mock('@/modules/store/application/runtime', () => ({
  createStoreRuntime: jest.fn(),
}))

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createStoreRuntime } from '@/modules/store/application/runtime'
import {
  buildPublicRouteAdmissionIndex,
  isPublicCampaignRouteAdmitted,
  isPublicExperienceSlug,
  isPublicMerchantSlug,
  isPublicStoreRouteAdmitted,
} from '@/modules/store/application/public-route-admission'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'

const admissionCacheSetup = (unstable_cache as jest.Mock).mock.calls.find(
  ([, key]) => Array.isArray(key) && key[0] === 'public-route-admission-index',
)

type AdmissionMerchant = Parameters<typeof buildPublicRouteAdmissionIndex>[0][number]
type AdmissionExperience = AdmissionMerchant['experiences'][number]

function makeExperience(overrides: Partial<AdmissionExperience> = {}): AdmissionExperience {
  return {
    id: 'campaign-a',
    type: 'CAMPAIGN',
    slug: 'campaign-a',
    name: 'Campaign A',
    status: 'ACTIVE',
    headline: null,
    description: null,
    referenceData: false,
    updatedAt: new Date('2026-08-14T00:00:00.000Z'),
    frameCount: 0,
    hasProductDestination: false,
    ...overrides,
  }
}

function makeMerchant(
  experiences: AdmissionExperience[] = [],
  overrides: Partial<AdmissionMerchant> = {},
): AdmissionMerchant {
  return {
    slug: 'merchant-a',
    name: 'Merchant A',
    status: 'ACTIVE',
    websiteUrl: null,
    pilotType: 'LIVE',
    referenceData: false,
    sponsoredUsagePolicyKey: null,
    experiences,
    ...overrides,
  }
}

describe('public route admission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPersistentCache.clear()
    ;(prisma.experienceFrame.groupBy as jest.Mock).mockResolvedValue([])
  })

  it('accepts only canonical lowercase ASCII slug syntax within existing limits', () => {
    expect(isPublicMerchantSlug('luna-optical')).toBe(true)
    expect(isPublicExperienceSlug('everyday-fit-2')).toBe(true)
    expect(isPublicMerchantSlug('__isr_audit_invalid_001__')).toBe(false)
    expect(isPublicMerchantSlug('.env')).toBe(false)
    expect(isPublicExperienceSlug('wp-admin.php')).toBe(false)
    expect(isPublicExperienceSlug('THIS-IS-UPPERCASE')).toBe(false)
    expect(isPublicMerchantSlug('a'.repeat(180))).toBe(true)
    expect(isPublicMerchantSlug('a'.repeat(181))).toBe(false)
    expect(isPublicExperienceSlug('a'.repeat(240))).toBe(true)
    expect(isPublicExperienceSlug('a'.repeat(241))).toBe(false)
  })

  it('keeps routable PUBLIC_NOINDEX and historical experiences while excluding PRIVATE drafts', () => {
    const index = buildPublicRouteAdmissionIndex([
      makeMerchant([
        makeExperience({ type: 'STORE', slug: 'store', status: 'ACTIVE' }),
        makeExperience({ slug: 'active-campaign', status: 'ACTIVE' }),
        makeExperience({ slug: 'ended-campaign', status: 'ENDED' }),
        makeExperience({ slug: 'draft-campaign', status: 'DRAFT' }),
      ]),
      makeMerchant([], { slug: 'inactive-merchant', status: 'INACTIVE' }),
    ])

    expect(index).toEqual({
      'merchant-a': {
        store: true,
        campaigns: ['active-campaign', 'ended-campaign'],
      },
    })
  })

  it('uses one fixed persistent cache key for arbitrary merchant and campaign probes', async () => {
    ;(prisma.merchant.findMany as jest.Mock).mockResolvedValue([makeMerchant()])

    const results = await Promise.all(Array.from({ length: 100 }, (_, index) => isPublicCampaignRouteAdmitted({
      merchantSlug: `random-merchant-${index}`,
      experienceSlug: `random-campaign-${index}`,
    })))

    expect(results.every(Boolean)).toBe(false)
    expect(prisma.merchant.findMany).toHaveBeenCalledTimes(1)
    expect(admissionCacheSetup).toEqual([
      expect.any(Function),
      ['public-route-admission-index', expect.stringMatching(/^public-discovery:/)],
      expect.objectContaining({ tags: ['public-discovery:route-admission'] }),
    ])
  })

  it('admits a valid public campaign through index membership', async () => {
    ;(prisma.merchant.findMany as jest.Mock).mockResolvedValue([
      makeMerchant([makeExperience({ slug: 'everyday-fit' })]),
    ])

    await expect(isPublicCampaignRouteAdmitted({
      merchantSlug: 'merchant-a',
      experienceSlug: 'everyday-fit',
    })).resolves.toBe(true)
    await expect(isPublicStoreRouteAdmitted({ merchantSlug: 'merchant-a' })).resolves.toBe(false)
  })

  it('maps aggregate frame counts and product destinations without frame rows', async () => {
    ;(prisma.merchant.findMany as jest.Mock).mockResolvedValue([
      makeMerchant([makeExperience({ id: 'indexable-campaign', slug: 'indexable-campaign' })]),
    ])
    ;(prisma.experienceFrame.groupBy as jest.Mock)
      .mockResolvedValueOnce([{ experienceId: 'indexable-campaign', _count: { _all: 4 } }])
      .mockResolvedValueOnce([{ experienceId: 'indexable-campaign', _count: { _all: 1 } }])

    await expect(isPublicCampaignRouteAdmitted({
      merchantSlug: 'merchant-a',
      experienceSlug: 'indexable-campaign',
    })).resolves.toBe(true)
    expect(prisma.experienceFrame.groupBy).toHaveBeenCalledTimes(2)
    expect(prisma.experienceFrame.groupBy).toHaveBeenLastCalledWith(expect.objectContaining({
      _count: { _all: true },
      where: expect.objectContaining({ merchantFrame: expect.objectContaining({ OR: expect.any(Array) }) }),
    }))
  })

  it('rejects invalid syntax before constructing a discovery cache entry', async () => {
    const cacheCallsBefore = (unstable_cache as jest.Mock).mock.calls.length

    await expect(getPublicExperienceDiscoveryForRoute('__isr_audit_invalid_001__')).resolves.toBeNull()
    await expect(getPublicExperienceDiscoveryForRoute('merchant-a', 'wp-admin.php')).resolves.toBeNull()

    expect(prisma.merchant.findMany).not.toHaveBeenCalled()
    expect((unstable_cache as jest.Mock).mock.calls.length).toBe(cacheCallsBefore)
  })

  it('refreshes the quota-sensitive public Store hint outside the persistent content cache', async () => {
    const storeExperience = makeExperience({
      id: 'store-route-a',
      type: 'STORE',
      slug: 'store',
      frameCount: 4,
      hasProductDestination: true,
    })
    ;(prisma.merchant.findMany as jest.Mock).mockResolvedValue([makeMerchant([storeExperience])])
    ;(prisma.experienceFrame.groupBy as jest.Mock).mockResolvedValue([
      { experienceId: 'store-route-a', _count: { _all: 4 } },
    ])

    const now = new Date()
    const merchant = {
      id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', status: 'ACTIVE',
      logoUrl: null, websiteUrl: null, accentColor: null, referenceData: false, pilotType: 'LIVE',
      planCode: 'LAUNCH', commercialStatus: 'PAID_ACTIVE',
      entitlementEffectiveFrom: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      billingPeriodEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: now, updatedAt: now,
    }
    const countAICommerceSessions = jest.fn().mockResolvedValue(0)
    const runtime = {
      merchants: {
        findPublicBySlug: jest.fn().mockResolvedValue(merchant),
        findBySlug: jest.fn().mockResolvedValue(merchant),
      },
      experiences: {
        findPublicStoreByMerchant: jest.fn().mockResolvedValue({
          ...storeExperience,
          merchantId: merchant.id,
          frameIds: ['frame-1', 'frame-2', 'frame-3', 'frame-4'],
          headline: null,
          description: null,
          heroAssetUrl: null,
          referenceData: false,
          updatedAt: now,
          deliveryPolicy: null,
        }),
      },
      frames: {
        findPublicActiveByMerchantAndExperience: jest.fn().mockResolvedValue(Array.from({ length: 4 }, (_, index) => ({
          id: `frame-${index + 1}`, name: `Frame ${index + 1}`, brand: null,
          imageUrl: `https://images.example.test/${index}.jpg`,
          productUrl: `https://shop.example.test/${index}`, price: null, currency: null,
          shape: 'round', material: null, color: null, widthClass: null, updatedAt: now,
        }))),
      },
      usage: { countAICommerceSessions },
    }
    ;(createStoreRuntime as jest.Mock).mockReturnValue(runtime)

    const withinLimit = await getPublicExperienceDiscoveryForRoute('merchant-a')
    expect(withinLimit?.merchant.generativeTryOnAvailable).toBe(true)

    countAICommerceSessions.mockResolvedValue(1000)
    const exhausted = await getPublicExperienceDiscoveryForRoute('merchant-a')
    expect(exhausted?.merchant.generativeTryOnAvailable).toBe(false)
    expect(countAICommerceSessions).toHaveBeenCalledTimes(2)
  })
})
