/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantSupportHandoffExport } from '@/components/merchant/MerchantSupportHandoffExport'

describe('Merchant settings support handoff export', () => {
  let click: jest.SpyInstance
  let revoke: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    revoke = jest.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:local-handoff') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, json: async () => ({
        success: true,
        data: { version: 1, merchant: { slug: 'demo-shop' }, releaseReady: false },
      }),
    }) as jest.Mock
  })

  afterEach(() => click.mockRestore())

  it('downloads only the authenticated no-store, explicitly uncertified JSON receipt', async () => {
    render(<MerchantSupportHandoffExport merchantId="merchant-a" />)
    fireEvent.click(screen.getByRole('button', { name: 'Export support snapshot' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Support snapshot exported'))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/merchant/merchant-a/delivery-factory/handoff', { cache: 'no-store' },
    )
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:local-handoff')
    expect(screen.getByText(/not proof that shoppers can see/)).toBeInTheDocument()
  })

  it('does not export a 401/403/404 or unavailable Merchant handoff', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, json: async () => ({ success: false, error: 'RESOURCE_NOT_FOUND' }),
    })
    render(<MerchantSupportHandoffExport merchantId="foreign" />)
    fireEvent.click(screen.getByRole('button', { name: 'Export support snapshot' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not verify'))
    expect(click).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('refuses any misleading releaseReady true response even when HTTP returns 200', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true, data: { releaseReady: true } }),
    })
    render(<MerchantSupportHandoffExport merchantId="merchant-a" />)
    fireEvent.click(screen.getByRole('button', { name: 'Export support snapshot' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not verify'))
    expect(click).not.toHaveBeenCalled()
  })
})
