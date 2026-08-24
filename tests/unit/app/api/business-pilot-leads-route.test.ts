/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/business/pilot-leads/route'
import { createBusinessPilotLead } from '@/modules/business'

jest.mock('@/modules/business', () => ({
  assertBusinessLeadOrigin: jest.fn(),
  businessLeadIdentity: jest.fn(() => 'test-identity'),
  createBusinessPilotLead: jest.fn(),
  businessPilotLeadErrorResponse: jest.fn((error) => ({ status: error.status || 500, body: { success: false, error: error.code || 'INTERNAL_ERROR' }, retryAfterSeconds: error.retryAfterSeconds })),
}))

describe('POST /api/business/pilot-leads', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a lead and returns its public request id', async () => {
    ;(createBusinessPilotLead as jest.Mock).mockResolvedValue({ id: 'lead-1', requestId: 'request-1', accepted: true, duplicate: false })
    const response = await POST(new NextRequest('http://localhost/api/business/pilot-leads', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contactName: 'Alex' }),
    }))
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ success: true, data: { requestId: 'request-1' } })
  })

  it('rejects non-JSON submissions before application processing', async () => {
    const response = await POST(new NextRequest('http://localhost/api/business/pilot-leads', { method: 'POST', body: 'x' }))
    expect(response.status).toBe(415)
    expect(createBusinessPilotLead).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON as a client error', async () => {
    const response = await POST(new NextRequest('http://localhost/api/business/pilot-leads', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    }))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'INVALID_JSON' })
  })
})
