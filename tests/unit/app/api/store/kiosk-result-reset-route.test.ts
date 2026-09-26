/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/store/results/[token]/kiosk-reset/route'
import { createMerchantSessionCapability, hashSessionCapability } from '@/modules/store/domain/session'

const mockShareFindUnique = jest.fn()
const mockTransaction = jest.fn()
const mockFindSession = jest.fn()
const mockUpdateSession = jest.fn()
const mockDeleteAsset = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    decisionResultShare: { findUnique: (...args: unknown[]) => mockShareFindUnique(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

jest.mock('@/modules/store/application/runtime', () => ({
  createStoreRuntime: () => ({ assets: { delete: (...args: unknown[]) => mockDeleteAsset(...args) } }),
}))

const token = 'decision-result-token'
const capability = createMerchantSessionCapability()

function makeRequest(withCapability?: string) {
  const request = new NextRequest(`http://localhost/api/store/results/${token}/kiosk-reset`, { method: 'POST' })
  if (withCapability) request.cookies.set('vt_store_cap', withCapability)
  return request
}

describe('Decision Result Kiosk reset capability boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockShareFindUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      result: {
        merchantId: 'merchant-1',
        merchantSessionId: 'session-1',
        expiresAt: new Date(Date.now() + 60_000),
        merchant: { status: 'ACTIVE' },
        experience: { deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 } },
      },
    })
    mockFindSession.mockResolvedValue({
      photoAssetId: 'photo-1',
      capabilityTokenHash: capability.tokenHash,
      experienceId: 'experience-1',
    })
    mockUpdateSession.mockResolvedValue({ count: 1 })
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      merchantSession: {
        findFirst: mockFindSession,
        updateMany: mockUpdateSession,
      },
    }))
  })

  it('does not allow a Result bearer token alone to reset its session', async () => {
    const response = await POST(makeRequest(), { params: { token } })

    expect(response.status).toBe(404)
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockUpdateSession).not.toHaveBeenCalled()
    expect(mockDeleteAsset).not.toHaveBeenCalled()
  })

  it('requires the capability cookie to match the Result MerchantSession', async () => {
    const response = await POST(makeRequest('different-session-capability'), { params: { token } })

    expect(response.status).toBe(404)
    expect(mockUpdateSession).not.toHaveBeenCalled()
    expect(mockDeleteAsset).not.toHaveBeenCalled()
  })

  it('allows the matching Kiosk capability to expire the session and detach its photo', async () => {
    const response = await POST(makeRequest(capability.token), { params: { token } })

    expect(response.status).toBe(200)
    expect(mockUpdateSession).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'session-1',
        merchantId: 'merchant-1',
        capabilityTokenHash: hashSessionCapability(capability.token),
      }),
      data: { status: 'EXPIRED', photoAssetId: null },
    }))
    expect(mockDeleteAsset).toHaveBeenCalledWith('photo-1', 'merchant-1')
  })
})
