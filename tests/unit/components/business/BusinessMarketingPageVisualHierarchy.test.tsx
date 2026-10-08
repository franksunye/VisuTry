import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { BusinessMarketingPage } from '@/components/business/BusinessMarketingPage'
import { analytics } from '@/lib/analytics'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, prefetch: _prefetch, ...props }: React.PropsWithChildren<{ href: string; prefetch?: boolean }>) => <a href={href} {...props}>{children}</a>,
}))

jest.mock('@/lib/analytics', () => ({
  analytics: { trackBusinessCtaClicked: jest.fn(), trackCustomEvent: jest.fn() },
}))

describe('BusinessMarketingPage visual hierarchy', () => {
  it('uses one hero-priority image and lazy-loads supporting product proof', () => {
    const { container } = render(<BusinessMarketingPage locale="en" pageKey="store" />)

    const heroVisual = container.querySelector('[data-business-visual="B2B-VIS-03"] img[loading="eager"]')
    const supportingVisual = container.querySelector('[data-business-section="Shopper experience"] [data-business-visual="B2B-VIS-03"] img[loading="lazy"]')

    expect(heroVisual).toBeTruthy()
    expect(supportingVisual).toBeTruthy()
  })

  it('does not repeat the Campaign hero visual inside the Campaign page body', () => {
    const { container } = render(<BusinessMarketingPage locale="en" pageKey="campaigns" />)
    expect(container.querySelectorAll('[data-business-visual="B2B-VIS-04"]')).toHaveLength(1)
  })

  it('keeps Platform visuals focused on architecture and operations rather than repeating Store proof', () => {
    const { container } = render(<BusinessMarketingPage locale="en" pageKey="platform" />)

    expect(container.querySelector('[data-business-visual="B2B-VIS-02"]')).toBeTruthy()
    expect(container.querySelector('[data-business-section="Merchant Workspace"] [data-business-visual="B2B-VIS-05"]')).toBeTruthy()
    expect(container.querySelector('[data-business-section="Shared decision runtime"] [data-business-visual="B2B-VIS-03"]')).toBeNull()
  })

  it('uses contrast to emphasize evidence boundaries instead of making Commerce Intelligence one continuous dark page', () => {
    const { container } = render(<BusinessMarketingPage locale="en" pageKey="intelligence" />)

    const questions = container.querySelector('[data-business-section="Questions it answers"]')
    const boundary = container.querySelector('[data-business-section="Evidence boundary"]')

    expect(questions).toBeTruthy()
    expect(boundary).toBeTruthy()
    expect(questions?.className).not.toContain('bg-slate-950')
    expect(boundary?.className).toContain('bg-slate-950')
  })

  it('keeps Business Home proof aligned to product surfaces, operations, and intelligence', () => {
    const { container } = render(<BusinessMarketingPage locale="en" pageKey="overview" />)

    const surfaces = container.querySelector('[data-business-section="Product surfaces"]')
    const workspace = container.querySelector('[data-business-section="Merchant operating model"]')
    const intelligence = container.querySelector('[data-business-section="Commerce Intelligence"]')

    expect(within(surfaces as HTMLElement).getByText('Store for continuity. Campaigns for focus.')).toBeVisible()
    expect(surfaces?.querySelector('[data-business-visual="B2B-VIS-03"]')).toBeTruthy()
    expect(workspace?.querySelector('[data-business-visual="B2B-VIS-05"]')).toBeTruthy()
    expect(intelligence?.querySelector('[data-business-visual="B2B-VIS-06"]')).toBeTruthy()
  })

  it('measures hero and closing Pilot CTA clicks as distinct Business-site placements', () => {
    const { getAllByRole } = render(<BusinessMarketingPage locale="en" pageKey="overview" />)
    const pilotLinks = getAllByRole('link', { name: /Start 30-Day Pilot/ })

    fireEvent.click(pilotLinks[0])
    fireEvent.click(pilotLinks[1])

    expect(analytics.trackBusinessCtaClicked).toHaveBeenNthCalledWith(1, { locale: 'en', ctaLocation: 'hero_primary', intentType: 'pilot_request' })
    expect(analytics.trackBusinessCtaClicked).toHaveBeenNthCalledWith(2, { locale: 'en', ctaLocation: 'business_closing_cta', intentType: 'pilot_request' })
  })
})
