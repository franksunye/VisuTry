/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/store/sessions/kiosk-reset/route'
import { createMerchantSessionCapability } from '@/modules/store/domain/session'

const mockFindMerchant = jest.fn()
const mockFindActiveCampaign = jest.fn()
const mockFindPublicCampaign = jest.fn()
const mockFindSession = jest.fn()
const mockMarkExpired = jest.fn()
const mockExpireAndDetachPhoto = jest.fn()
const mockDeleteAsset = jest.fn()

jest.mock('@/modules/store/application', () => ({
  createStoreRuntime: () => ({
    merchants: { findBySlug: (...args: unknown[]) => mockFindMerchant(...args) },
    experiences: {
      findDefaultStore: jest.fn(),
      findActiveCampaignByMerchantAndSlug: (...args: unknown[]) => mockFindActiveCampaign(...args),
      findPublicCampaignByMerchantAndSlug: (...args: unknown[]) => mockFindPublicCampaign(...args),
    },
    sessions: {
      findByMerchantAndId: (...args: unknown[]) => mockFindSession(...args),
      markExpired: (...args: unknown[]) => mockMarkExpired(...args),
      expireAndDetachPhoto: (...args: unknown[]) => mockExpireAndDetachPhoto(...args),
    },
    assets: { delete: (...args: unknown[]) => mockDeleteAsset(...args) },
  }),
  storeErrorResponse: jest.fn(),
}))

const capability = createMerchantSessionCapability()

function makeRequest(token?: string, merchantSessionId = 'session-1') {
  const request = new NextRequest('http://localhost/api/store/sessions/kiosk-reset', {
    method: 'POST',
    body: JSON.stringify({ merchantSlug: 'merchant-a', experienceSlug: 'campaign-a', merchantSessionId }),
  })
  if (token) request.cookies.set('vt_store_cap', token)
  return request
}

describe('archived Campaign Kiosk session cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindMerchant.mockResolvedValue({ id: 'merchant-1' })
    mockFindActiveCampaign.mockResolvedValue(null)
    mockFindPublicCampaign.mockResolvedValue({
      id: 'experience-1', merchantId: 'merchant-1', type: 'CAMPAIGN', status: 'ARCHIVED',
      deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 },
    })
    mockFindSession.mockResolvedValue({
      id: 'session-1', merchantId: 'merchant-1', experienceId: 'experience-1',
      capabilityTokenHash: capability.tokenHash, photoAssetId: 'photo-1',
    })
    mockMarkExpired.mockResolvedValue(undefined)
    mockExpireAndDetachPhoto.mockResolvedValue('photo-1')
    mockDeleteAsset.mockResolvedValue({ deleted: true, retryable: false })
  })

  it('keeps a token-only or cookie-less reset unauthorized', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(403)
    expect(mockMarkExpired).not.toHaveBeenCalled()
    expect(mockDeleteAsset).not.toHaveBeenCalled()
  })

  it('allows only the exact old session capability to delete its photo and clear cookies', async () => {
    const response = await POST(makeRequest(capability.token))
    expect(response.status).toBe(200)
    expect(mockFindPublicCampaign).toHaveBeenCalledWith('merchant-1', 'campaign-a')
    expect(mockMarkExpired).toHaveBeenCalledWith('merchant-1', 'session-1')
    expect(mockDeleteAsset).toHaveBeenCalledWith('photo-1', 'merchant-1')
    expect(mockExpireAndDetachPhoto).toHaveBeenCalledWith('merchant-1', 'session-1')
    expect(response.cookies.get('vt_store_cap')?.value).toBe('')
    expect(response.cookies.get('vt_store_visitor')?.value).toBe('')
  })

  it('rejects another Experience even when the session capability matches', async () => {
    mockFindSession.mockResolvedValueOnce({
      id: 'session-1', merchantId: 'merchant-1', experienceId: 'other-experience',
      capabilityTokenHash: capability.tokenHash, photoAssetId: 'photo-1',
    })
    const response = await POST(makeRequest(capability.token))
    expect(response.status).toBe(403)
    expect(mockMarkExpired).not.toHaveBeenCalled()
    expect(mockDeleteAsset).not.toHaveBeenCalled()
  })

  it('does not clear cookies or detach the photo when Blob deletion fails', async () => {
    mockDeleteAsset.mockResolvedValueOnce({ deleted: false, retryable: true })
    const response = await POST(makeRequest(capability.token))
    expect(response.status).toBe(503)
    expect(mockMarkExpired).toHaveBeenCalled()
    expect(mockExpireAndDetachPhoto).not.toHaveBeenCalled()
    expect(response.cookies.get('vt_store_cap')).toBeUndefined()
    expect(response.cookies.get('vt_store_visitor')).toBeUndefined()
  })
})
