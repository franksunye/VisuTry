import { render, within } from '@testing-library/react'
import { BusinessMarketingPage } from '@/components/business/BusinessMarketingPage'

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
})
