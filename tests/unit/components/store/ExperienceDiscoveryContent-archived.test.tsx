import { render, screen } from '@testing-library/react'
import { ExperienceDiscoveryContent } from '@/components/store/ExperienceDiscoveryContent'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, sizes: _sizes, unoptimized: _unoptimized, ...props }: Record<string, unknown>) => <img {...props} />,
}))

jest.mock('@/components/store/MerchantShopperAccountControlSlot', () => ({
  MerchantShopperAccountControlSlot: () => <div data-testid="shopper-account-control" />,
}))

const date = new Date('2026-10-01T00:00:00.000Z')

function discovery(status: 'ACTIVE' | 'ARCHIVED'): PublicExperienceDiscovery {
  return {
    merchant: {
      id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', logoUrl: null,
      websiteUrl: 'https://merchant.example.test', hasActivePublicStore: true, accentColor: '#123456',
      generativeTryOnAvailable: true, referenceData: false, pilotType: 'LIVE', updatedAt: date,
    },
    experience: {
      id: 'campaign-a', merchantId: 'merchant-a', type: 'CAMPAIGN', slug: 'spring-edit',
      name: 'Spring edit', status, headline: 'Spring eyewear edit', description: 'A seasonal selection.',
      heroAssetUrl: 'https://cdn.example.test/hero.jpg',
      primaryHandoff: { action: 'CUSTOM_LINK', label: 'Shop now', url: 'https://merchant.example.test/shop' },
      secondaryHandoff: null,
      deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 },
      referenceData: false, updatedAt: date,
    },
    frames: [{
      id: 'frame-a', name: 'Aster', brand: 'Aster', imageUrl: 'https://cdn.example.test/aster.jpg',
      productUrl: 'https://merchant.example.test/aster', price: 12900, currency: 'usd',
      shape: 'round', material: 'acetate', color: 'black', widthClass: 'medium', updatedAt: date,
    }],
    experiencePolicy: { tryOnEnabled: true, compareEnabled: true, maxCompareFrames: 2, inquiryEnabled: true },
    decisionJourney: { enabledStages: ['RECOMMENDATION', 'TRY_ON', 'COMPARE'] } as never,
    guestSponsoredTryOnLimit: null,
    visibility: status === 'ARCHIVED' ? 'PUBLIC_NOINDEX' : 'PUBLIC_INDEX',
    lastModified: date,
  }
}

const archivedCopy = {
  title: 'Campaign ended',
  body: 'This campaign has ended. You can still browse its selected frames below.',
  storeLink: 'Visit the current Store',
}

describe('ExperienceDiscoveryContent archived Campaign', () => {
  it('keeps a read-only historical page and only links back to the current same-merchant Store', () => {
    const { container } = render(
      <ExperienceDiscoveryContent discovery={discovery('ARCHIVED')} locale="en" pathname="/en/c/merchant-a/spring-edit" archivedCampaignCopy={archivedCopy} />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Campaign ended')
    expect(screen.getByRole('heading', { name: 'Spring eyewear edit' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aster' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Visit the current Store' })).toHaveAttribute('href', '/en/store/merchant-a')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /shop now|view product|visit merchant a/i })).not.toBeInTheDocument()
    expect(container.querySelector('[data-archived-campaign="true"]')).toBeInTheDocument()
    expect(container.innerHTML).not.toContain('merchant.example.test')
    expect(container.innerHTML).not.toContain('merchant.example.test/aster')
  })

  it('preserves normal Active Campaign product and handoff links', () => {
    render(<ExperienceDiscoveryContent discovery={discovery('ACTIVE')} locale="en" pathname="/en/c/merchant-a/spring-edit" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', expect.stringContaining('merchant.example.test/shop'))
    expect(screen.getByRole('link', { name: /view product/i })).toHaveAttribute('href', expect.stringContaining('merchant.example.test/aster'))
  })
})
