jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

jest.mock('next-intl/server', () => ({
  setRequestLocale: jest.fn(),
}))

jest.mock('@/i18n', () => ({
  getValidLocale: jest.fn((locale: string) => locale),
}))

jest.mock('@/modules/store/application/public-route-admission', () => ({
  isPublicStoreRouteAdmitted: jest.fn(),
  isPublicCampaignRouteAdmitted: jest.fn(),
}))

jest.mock('@/modules/store/application/get-public-experience-discovery-route', () => ({
  getPublicExperienceDiscoveryForRoute: jest.fn(),
}))

jest.mock('@/modules/store/infrastructure/config/store-asset-access-policy', () => ({
  resolveStoreAssetAccessPolicy: jest.fn(() => ({ publicPoc: false })),
}))

jest.mock('@/lib/store-discovery-seo', () => ({
  buildExperienceDiscoveryMetadata: jest.fn(() => ({ title: 'Public discovery' })),
  discoveryCanonicalUrl: jest.fn((pathname: string) => `https://example.test${pathname}`),
}))

jest.mock('@/components/store/ExperienceDiscoveryContent', () => ({
  ExperienceDiscoveryContent: () => null,
}))

jest.mock('@/components/store/InteractiveCommerceLauncher', () => ({
  InteractiveCommerceLauncher: () => null,
}))

jest.mock('@/components/store/StorePresentationDisclosure', () => ({
  StorePresentationDisclosure: () => null,
}))

import { notFound } from 'next/navigation'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import {
  isPublicCampaignRouteAdmitted,
  isPublicStoreRouteAdmitted,
} from '@/modules/store/application/public-route-admission'
import * as storePage from '@/app/[locale]/(store)/store/[merchantSlug]/page'
import * as campaignPage from '@/app/[locale]/(store)/c/[merchantSlug]/[experienceSlug]/page'

const discovery = {
  merchant: { referenceData: false },
  experience: { referenceData: false },
} as never

describe('public Store/Campaign route admission boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(isPublicStoreRouteAdmitted as jest.Mock).mockResolvedValue(false)
    ;(isPublicCampaignRouteAdmitted as jest.Mock).mockResolvedValue(false)
    ;(getPublicExperienceDiscoveryForRoute as jest.Mock).mockResolvedValue(discovery)
  })

  it('rejects invalid Store requests before discovery in metadata and Page', async () => {
    const params = { locale: 'en', merchantSlug: '.env' }

    const metadata = await storePage.generateMetadata({ params })
    expect(metadata.title).toBe('Store not found | VisuTry')
    await expect(storePage.default({ params })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(isPublicStoreRouteAdmitted).toHaveBeenCalledTimes(2)
    expect(getPublicExperienceDiscoveryForRoute).not.toHaveBeenCalled()
  })

  it('rejects invalid Campaign requests before discovery in metadata and Page', async () => {
    const params = { locale: 'en', merchantSlug: 'merchant-a', experienceSlug: 'wp-admin.php' }

    const metadata = await campaignPage.generateMetadata({ params })
    expect(metadata.title).toBe('Campaign not found | VisuTry')
    await expect(campaignPage.default({ params })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(isPublicCampaignRouteAdmitted).toHaveBeenCalledTimes(2)
    expect(getPublicExperienceDiscoveryForRoute).not.toHaveBeenCalled()
  })

  it('preserves admitted Store and Campaign discovery behavior', async () => {
    ;(isPublicStoreRouteAdmitted as jest.Mock).mockResolvedValue(true)
    ;(isPublicCampaignRouteAdmitted as jest.Mock).mockResolvedValue(true)

    const storeParams = { locale: 'en', merchantSlug: 'merchant-a' }
    const campaignParams = { locale: 'en', merchantSlug: 'merchant-a', experienceSlug: 'everyday-fit' }

    await storePage.generateMetadata({ params: storeParams })
    await storePage.default({ params: storeParams })
    await campaignPage.generateMetadata({ params: campaignParams })
    await campaignPage.default({ params: campaignParams })

    expect(getPublicExperienceDiscoveryForRoute).toHaveBeenNthCalledWith(1, 'merchant-a', null, 'en')
    expect(getPublicExperienceDiscoveryForRoute).toHaveBeenNthCalledWith(2, 'merchant-a', null, 'en')
    expect(getPublicExperienceDiscoveryForRoute).toHaveBeenNthCalledWith(3, 'merchant-a', 'everyday-fit', 'en')
    expect(getPublicExperienceDiscoveryForRoute).toHaveBeenNthCalledWith(4, 'merchant-a', 'everyday-fit', 'en')
  })
})
