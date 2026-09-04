/** @jest-environment node */

jest.mock('@/lib/traffic-telemetry', () => ({
  emitTrafficTelemetry: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analytics/consumer-funnel/route'
import { emitTrafficTelemetry } from '@/lib/traffic-telemetry'

const emitTraffic = emitTrafficTelemetry as jest.Mock

function request(body: unknown, cookie?: string) {
  return new NextRequest('http://localhost/api/analytics/consumer-funnel', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

const validBody = {
  event_id: 'evt_1234567890123456',
  event_name: 'tryon_completed',
  consumer_funnel_id: 'funnel_1234567890123456',
  traffic_class: 'test',
  acquisition_source: 'chatgpt.com',
  page_path: '/en/try-on/glasses',
  success: true,
  user_id: 'must-not-be-logged',
}

describe('Consumer funnel telemetry route', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts a valid event and server-classifies non-test traffic', async () => {
    const response = await POST(request(validBody))

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ accepted: true })
    expect(emitTraffic).toHaveBeenCalledWith(expect.objectContaining({
      event_name: 'tryon_completed',
      acquisition_source: 'chatgpt.com',
      source_class: 'agent',
      agent_source: 'chatgpt',
      traffic_class: 'production_candidate',
    }))
    expect(emitTraffic.mock.calls[0][0]).not.toHaveProperty('user_id')
  })

  it('keeps the server-side test boundary when the test cookie is present', async () => {
    const response = await POST(request(validBody, 'test-session=playwright'))

    expect(response.status).toBe(202)
    expect(emitTraffic.mock.calls[0][0]).toEqual(expect.objectContaining({ traffic_class: 'test' }))
  })

  it('keeps Reddit and YouTube as distinct supported source classes', async () => {
    await POST(request({ ...validBody, acquisition_source: 'reddit.com' }))
    expect(emitTraffic.mock.calls[0][0]).toEqual(expect.objectContaining({ source_class: 'reddit' }))

    await POST(request({ ...validBody, acquisition_source: null, referrer_host: 'www.youtube.com' }))
    expect(emitTraffic.mock.calls[1][0]).toEqual(expect.objectContaining({ source_class: 'youtube' }))
  })

  it('rejects unknown events and malformed identifiers', async () => {
    const response = await POST(request({
      ...validBody,
      event_name: 'synthetic_agent_conversion',
      event_id: 'short',
    }))

    expect(response.status).toBe(400)
    expect(emitTraffic).not.toHaveBeenCalled()
  })
})
