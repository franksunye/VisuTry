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
  },
}))

jest.mock('@/modules/store/application/runtime', () => ({
  createStoreRuntime: jest.fn(),
}))

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  buildPublicRouteAdmissionIndex,
  isPublicCampaignRouteAdmitted,
  isPublicExperienceSlug,
  isPublicMerchantSlug,
  isPublicStoreRouteAdmitted,
} from '@/modules/store/application/public-route-admission'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'

const admissionCacheSetup = (unstable_cache as jest.Mock).mock.calls.find(
  ([, key]) => JSON.stringify(key) === JSON.stringify(['public-route-admission-index']),
)

type AdmissionMerchant = Parameters<typeof buildPublicRouteAdmissionIndex>[0][number]
type AdmissionExperience = AdmissionMerchant['experiences'][number]

function makeExperience(overrides: Partial<AdmissionExperience> = {}): AdmissionExperience {
  return {
    type: 'CAMPAIGN',
    slug: 'campaign-a',
    name: 'Campaign A',
    status: 'ACTIVE',
    headline: null,
    description: null,
    referenceData: false,
    updatedAt: new Date('2026-08-14T00:00:00.000Z'),
    frames: [],
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
      ['public-route-admission-index'],
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

  it('rejects invalid syntax before constructing a discovery cache entry', async () => {
    const cacheCallsBefore = (unstable_cache as jest.Mock).mock.calls.length

    await expect(getPublicExperienceDiscoveryForRoute('__isr_audit_invalid_001__')).resolves.toBeNull()
    await expect(getPublicExperienceDiscoveryForRoute('merchant-a', 'wp-admin.php')).resolves.toBeNull()

    expect(prisma.merchant.findMany).not.toHaveBeenCalled()
    expect((unstable_cache as jest.Mock).mock.calls.length).toBe(cacheCallsBefore)
  })
})
