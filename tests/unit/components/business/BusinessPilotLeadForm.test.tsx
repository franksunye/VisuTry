import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BusinessPilotLeadForm } from '@/components/business/BusinessPilotLeadForm'
import { analytics, getAcquisitionContext } from '@/lib/analytics'

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackBusinessPilotLeadFormStarted: jest.fn(),
    trackBusinessPilotLeadCreated: jest.fn(),
  },
  getAcquisitionContext: jest.fn(() => ({
    landing_page: '/en/business',
    acquisition_source: 'organic',
    acquisition_medium: 'search',
    utm_campaign: 'fall-pilot',
  })),
}))

describe('BusinessPilotLeadForm measurement', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ success: true }) }) as jest.Mock
    window.history.pushState({}, '', '/en/business/pilot?utm_source=partner')
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('records form start once and records a bounded Pilot submission only after API success', async () => {
    const user = userEvent.setup()
    render(<BusinessPilotLeadForm locale="en" />)

    await user.click(screen.getByLabelText('Your name'))
    await user.type(screen.getByLabelText('Your name'), 'Test Merchant')
    await user.type(screen.getByLabelText('Work email'), 'merchant@example.test')
    await user.type(screen.getByLabelText('Business name'), 'Test Eyewear Shop')
    await user.selectOptions(screen.getByLabelText('Business type'), 'eyewear-brand')
    await user.selectOptions(screen.getByLabelText('Approximate frame count'), '21-50')
    await user.selectOptions(screen.getByLabelText('What do you want to start with?'), 'campaign')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Request Pilot review/i }))

    await waitFor(() => expect(analytics.trackBusinessPilotLeadCreated).toHaveBeenCalledWith({
      locale: 'en',
      businessType: 'eyewear-brand',
      goal: 'campaign',
      frameCount: '21-50',
    }))
    expect(analytics.trackBusinessPilotLeadFormStarted).toHaveBeenCalledTimes(1)
    expect(getAcquisitionContext).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/business/pilot-leads', expect.objectContaining({ method: 'POST' }))
  })

  it('does not report a Pilot lead when the persistence request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Unavailable' }) }) as jest.Mock
    const user = userEvent.setup()
    render(<BusinessPilotLeadForm locale="en" />)
    await user.click(screen.getByLabelText('Your name'))
    await user.type(screen.getByLabelText('Your name'), 'Test Merchant')
    await user.type(screen.getByLabelText('Work email'), 'merchant@example.test')
    await user.type(screen.getByLabelText('Business name'), 'Test Eyewear Shop')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Request Pilot review/i }))

    await screen.findByRole('alert')
    expect(analytics.trackBusinessPilotLeadCreated).not.toHaveBeenCalled()
  })
})
