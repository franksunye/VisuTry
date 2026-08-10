import React from 'react'
import { render, screen } from '@testing-library/react'
import { CreditExhaustedSurface } from '@/components/payments/CreditExhaustedBar'
import { QUOTA_CONFIG } from '@/config/pricing'

let mockLocale = 'en'

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: mockLocale }),
}))

describe('CreditExhaustedSurface', () => {
  beforeEach(() => {
    mockLocale = 'en'
  })

  it.each([
    ['style_explorer', 'Create these 4 looks'],
    ['frame_compare', 'Complete your 4-frame comparison'],
  ] as const)('keeps the new %s purchase CTA outside the legacy-link selector', (kind, title) => {
    const { container } = render(
      <CreditExhaustedSurface kind={kind} availableCredits={0} requiredCredits={4}>
        <a href="/en/pricing">Legacy pricing link</a>
      </CreditExhaustedSurface>,
    )

    const purchaseLink = screen.getByRole('link', { name: 'Get Credits · $2.99' })
    expect(purchaseLink).toHaveAttribute('data-credit-exhausted-cta')
    expect(screen.getByText(title)).toBeInTheDocument()

    const legacySelector = `[data-credit-exhausted-surface="${kind}"] a[href*="/pricing"]:not([data-credit-exhausted-cta])`
    expect(container.querySelectorAll(legacySelector)).toHaveLength(1)
    expect(container.querySelector(legacySelector)).toHaveTextContent('Legacy pricing link')
  })

  it('uses the configured credits-pack amount', () => {
    render(
      <CreditExhaustedSurface kind="try_on" availableCredits={0} requiredCredits={1}>
        <div>Try on</div>
      </CreditExhaustedSurface>,
    )

    expect(screen.getByText(`${QUOTA_CONFIG.CREDITS_PACK} non-expiring credits`)).toBeInTheDocument()
  })

  it('localizes the Arabic purchase summary without an English credits label', () => {
    mockLocale = 'ar'

    render(
      <CreditExhaustedSurface kind="try_on" availableCredits={0} requiredCredits={1}>
        <div>Try on</div>
      </CreditExhaustedSurface>,
    )

    expect(screen.getByText(`${QUOTA_CONFIG.CREDITS_PACK} رصيد لا تنتهي صلاحيته`)).toBeInTheDocument()
    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument()
  })
})
