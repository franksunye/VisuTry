import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { MerchantWorkspaceOnboarding } from '@/components/merchant/MerchantWorkspaceOnboarding'
import { analytics } from '@/lib/analytics'

jest.mock('@/lib/analytics', () => ({
  analytics: { trackCustomEvent: jest.fn() },
  getAcquisitionContext: jest.fn(() => ({ acquisition_source: 'linkedin', acquisition_medium: 'paid' })),
}))
jest.mock('@/lib/analytics-v2', () => ({
  getCampaignAnalyticsContext: jest.fn(() => ({ campaign_name: 'g1-launch' })),
}))

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const router = { push: jest.fn(), refresh: jest.fn() }

describe('MerchantWorkspaceOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(router)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { created: true, merchant: { id: 'merchant-new' }, membership: { role: 'OWNER' } } }),
    }) as jest.Mock
  })

  it('submits the workspace form and redirects to the created merchant', async () => {
    render(<MerchantWorkspaceOnboarding locale="en" />)
    fireEvent.change(screen.getByLabelText(/brand or store name/i), { target: { value: 'Golden Path Test' } })
    fireEvent.change(screen.getByLabelText(/^website$/i), { target: { value: 'https://example.test' } })
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/merchant/workspaces', expect.objectContaining({ method: 'POST' })))
    expect(JSON.parse(((global.fetch as jest.Mock).mock.calls[0][1] as RequestInit).body as string)).toEqual({
      name: 'Golden Path Test',
      websiteUrl: 'https://example.test',
      source: 'linkedin/paid',
      campaign: 'g1-launch',
    })
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/en/merchant?merchantId=merchant-new&onboarding=created'))
    expect(router.refresh).toHaveBeenCalled()
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith('merchant_onboarding_started', expect.objectContaining({ entry_point: 'b2b' }))
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith('merchant_workspace_created', expect.objectContaining({ merchant_id: 'merchant-new', created: true }))
  })

  it('continues a paid pricing intent to the canonical purchase summary after creation', async () => {
    render(<MerchantWorkspaceOnboarding locale="en" commercialIntent="FOUNDING_PILOT" />)
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/en/merchant/purchase?merchantId=merchant-new&commercialIntent=FOUNDING_PILOT'))
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith('merchant_workspace_created', expect.objectContaining({ commercial_intent: 'FOUNDING_PILOT' }))
  })

  it('shows a safe error and does not redirect when provisioning fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ code: 'INVALID_WEBSITE_URL', error: 'Please enter a valid http(s) website URL.' }) })
    render(<MerchantWorkspaceOnboarding locale="en" />)
    fireEvent.change(screen.getByLabelText(/brand or store name/i), { target: { value: 'Golden Path Test' } })
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid http(s) website URL.')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('does not issue a second request for a repeated submit while the first is pending', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))
    render(<MerchantWorkspaceOnboarding locale="en" />)
    fireEvent.change(screen.getByLabelText(/brand or store name/i), { target: { value: 'Golden Path Test' } })
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))

    expect(global.fetch).toHaveBeenCalledTimes(1)
    resolveRequest?.({ ok: true, json: async () => ({ data: { created: true, merchant: { id: 'merchant-new' } } }) })
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/en/merchant?merchantId=merchant-new&onboarding=created'))
  })
})
