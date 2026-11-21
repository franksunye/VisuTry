import { render, screen, within } from '@testing-library/react'
import { ExperienceDiscoveryContent } from '@/components/store/ExperienceDiscoveryContent'
import { makeCanaryEditorialDiscovery } from '../../../fixtures/merchant-discovery-editorial'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, sizes: _sizes, unoptimized: _unoptimized, ...props }: Record<string, unknown>) => <img {...props} />,
}))

jest.mock('@/components/store/MerchantShopperAccountControlSlot', () => ({
  MerchantShopperAccountControlSlot: () => <div data-testid="shopper-account-control" />,
}))

describe('Experience discovery acquisition example', () => {
  it('renders the short English comparison with real frame anchors and readable FAQs', () => {
    const { container } = render(<ExperienceDiscoveryContent discovery={makeCanaryEditorialDiscovery()} locale="en" pathname="/en/c/visutry-demo/everyday-fit" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Everyday Fit: round or rectangular?' })).toBeInTheDocument()
    const comparison = screen.getByRole('region', { name: 'Compare two frame outlines' })
    const link = within(comparison).getByRole('link', { name: 'See Canary round in the collection' })
    expect(link).toHaveAttribute('href', '#frame-canary-round')
    expect(container.querySelector('#frame-canary-round')).toHaveTextContent('Canary round')
    expect(within(comparison).getByRole('heading', { name: 'Can I buy the frames in this collection?' })).toBeInTheDocument()
    expect(comparison).toHaveTextContent('not offered for sale')
    expect(comparison).not.toHaveTextContent('Material:')
    expect(comparison.innerHTML).not.toMatch(/demo-optical|\/demo\/frames\//)
  })

  it('maps old product links to real Canary detail pages in both cards and public JSON-LD', () => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.frames[0].productUrl = 'https://www.visutry.com/en/demo/frames/round'
    discovery.frames[1].productUrl = 'https://www.visutry.com/en/demo/frames/rectangle'
    discovery.frames[2].productUrl = 'https://retailer.example/products/actual-frame'
    const { container } = render(<ExperienceDiscoveryContent discovery={discovery} locale="en" pathname="/en/c/visutry-demo/everyday-fit" />)
    expect(container.innerHTML).not.toContain('/en/demo/frames/')
    const productLinks = screen.getAllByRole('link', { name: /view product/i })
    expect(productLinks[0]).toHaveAttribute('href', expect.stringContaining('/en/discover/frames/canary-round'))
    expect(productLinks[2]).toHaveAttribute('href', expect.stringContaining('https://retailer.example/products/actual-frame'))
    expect(container.querySelector('script[type="application/ld+json"]')?.textContent).toContain('/en/discover/frames/canary-round')
    expect(discovery.frames[0].productUrl).toBe('https://www.visutry.com/en/demo/frames/round')
  })

  it.each(['ja', 'de'] as const)('keeps the existing content for the untranslated %s route', (locale) => {
    render(<ExperienceDiscoveryContent discovery={makeCanaryEditorialDiscovery()} locale={locale} pathname={`/${locale}/c/visutry-demo/everyday-fit`} />)
    expect(screen.getByRole('heading', { level: 1, name: 'The original Campaign headline' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Compare two frame outlines' })).not.toBeInTheDocument()
  })

  it.each(['ARCHIVED', 'DRAFT'] as const)('does not render acquisition content for a %s Campaign', (status) => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.experience.status = status
    render(<ExperienceDiscoveryContent discovery={discovery} locale="en" pathname="/en/c/visutry-demo/everyday-fit" />)
    expect(screen.queryByRole('region', { name: 'Compare two frame outlines' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'The original Campaign headline' })).toBeInTheDocument()
  })

  it('honors an existing Store headline without activating the Campaign example', () => {
    const discovery = makeCanaryEditorialDiscovery()
    discovery.experience.type = 'STORE'
    discovery.experience.headline = 'A factual merchant collection headline'
    render(<ExperienceDiscoveryContent discovery={discovery} locale="en" pathname="/en/store/visutry-demo" />)
    expect(screen.getByRole('heading', { level: 1, name: 'A factual merchant collection headline' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Compare two frame outlines' })).not.toBeInTheDocument()
  })
})
