import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { MerchantWorkspaceOnboarding } from '@/components/merchant/MerchantWorkspaceOnboarding'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const router = { push: jest.fn(), refresh: jest.fn() }

describe('MerchantWorkspaceOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(router)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { merchant: { id: 'merchant-new' }, membership: { role: 'OWNER' } } }),
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
    })
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/en/merchant?merchantId=merchant-new'))
    expect(router.refresh).toHaveBeenCalled()
  })

  it('shows a safe error and does not redirect when provisioning fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'INVALID_WEBSITE_URL' }) })
    render(<MerchantWorkspaceOnboarding locale="en" />)
    fireEvent.change(screen.getByLabelText(/brand or store name/i), { target: { value: 'Golden Path Test' } })
    fireEvent.click(screen.getByRole('button', { name: /create workspace/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('INVALID_WEBSITE_URL')
    expect(router.push).not.toHaveBeenCalled()
  })
})
