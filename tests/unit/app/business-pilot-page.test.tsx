import React from 'react'
import { render, screen } from '@testing-library/react'
import PilotPage from '@/app/[locale]/(business)/business/pilot/page'

jest.mock('next-intl/server', () => ({ setRequestLocale: jest.fn() }))

jest.mock('@/components/business/BusinessMarketingPage', () => ({
  BusinessMarketingPage: ({ pilotIntent }: { pilotIntent: string }) => <div data-testid="pilot-intent">{pilotIntent}</div>,
}))

describe('Business pilot page intent handoff', () => {
  it('preserves the Enterprise pricing intent for the inquiry form', () => {
    render(PilotPage({ params: { locale: 'en' }, searchParams: { plan: 'enterprise' } }))
    expect(screen.getByTestId('pilot-intent')).toHaveTextContent('enterprise_inquiry')
  })

  it('keeps the default Pilot flow when plan intent is absent or unrecognized', () => {
    render(PilotPage({ params: { locale: 'en' }, searchParams: {} }))
    expect(screen.getByTestId('pilot-intent')).toHaveTextContent('pilot_request')

    render(PilotPage({ params: { locale: 'en' }, searchParams: { plan: 'launch' } }))
    expect(screen.getAllByTestId('pilot-intent')[1]).toHaveTextContent('pilot_request')
  })
})
