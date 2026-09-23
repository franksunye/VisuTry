/** @jest-environment node */

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
jest.mock('@/modules/merchant/application/merchant-workspace-context', () => ({
  requireMerchantWorkspaceContext: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-operating-reads', () => ({
  getMerchantWorkspaceMode: jest.fn(),
}))

import { getMerchantWorkspaceMode } from '@/modules/merchant/application/merchant-operating-reads'
import { requireMerchantWorkspaceContext } from '@/modules/merchant/application/merchant-workspace-context'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

const workspaceMode = getMerchantWorkspaceMode as jest.Mock
const workspaceContext = requireMerchantWorkspaceContext as jest.Mock

describe('requireOperatingMerchantPage shared lifecycle gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    workspaceContext.mockResolvedValue({ selectedMerchantId: 'merchant-a' })
  })

  it('allows Catalog, Store, and Campaign deep routes for the shared ACTIVE-Store Operating mode', async () => {
    workspaceMode.mockResolvedValue({ mode: 'OPERATING', reason: 'ACTIVE_STORE' })

    const result = await requireOperatingMerchantPage({ locale: 'en', merchantId: 'merchant-a' })

    expect(result.context.selectedMerchantId).toBe('merchant-a')
    expect(workspaceMode).toHaveBeenCalledWith({ merchantId: 'merchant-a' })
  })

  it('keeps a pre-First-Value DRAFT workspace on Activation and redirects operating routes home', async () => {
    workspaceMode.mockResolvedValue({ mode: 'ACTIVATION', reason: 'FIRST_VALUE_NOT_REACHED' })

    await expect(requireOperatingMerchantPage({ locale: 'en', merchantId: 'merchant-a' }))
      .rejects.toThrow('REDIRECT:/en/merchant?merchantId=merchant-a')
  })

  it('preserves the standard Preview-event First Value path as Operating', async () => {
    workspaceMode.mockResolvedValue({ mode: 'OPERATING', reason: 'STORE_PREVIEWED' })

    await expect(requireOperatingMerchantPage({ locale: 'en', merchantId: 'merchant-a' }))
      .resolves.toMatchObject({ context: { selectedMerchantId: 'merchant-a' } })
  })
})
