/** @jest-environment node */

import { POST } from '@/app/api/face-shape-detector/usage/route'
import { logger } from '@/lib/logger'

describe('free face-shape detector usage route', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns a success response without a PostgreSQL usage write', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined)

    const response = await POST(new Request('http://localhost/api/face-shape-detector/usage', {
      method: 'POST',
      body: JSON.stringify({ status: 'COMPLETED', siteLocale: 'en' }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(204)
    expect(info).toHaveBeenCalledWith(
      'face-shape',
      'Free face shape detection completed',
      { site_locale: 'en' },
      expect.anything(),
    )
  })

  it('keeps the detector success response when observability fails', async () => {
    jest.spyOn(logger, 'warn').mockImplementation(() => {
      throw new Error('Axiom unavailable')
    })

    const response = await POST(new Request('http://localhost/api/face-shape-detector/usage', {
      method: 'POST',
      body: JSON.stringify({
        status: 'FAILED',
        failureReason: 'GPU_RUNTIME_ERROR',
        diagnostics: {
          gpuRuntimeErrorName: 'RuntimeError',
          imageUrl: 'must-not-be-logged',
          faceLandmarks: [[1, 2, 3]],
        },
      }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(204)
  })

  it('accepts only the telemetry status values', async () => {
    const response = await POST(new Request('http://localhost/api/face-shape-detector/usage', {
      method: 'POST',
      body: JSON.stringify({ status: 'RUNNING' }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(400)
  })
})
