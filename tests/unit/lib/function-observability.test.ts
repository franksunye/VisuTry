/** @jest-environment node */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

import { logger } from '@/lib/logger'
import { withFunctionObservation } from '@/lib/function-observability'

const info = logger.info as jest.Mock
const warn = logger.warn as jest.Mock
const sha = 'a'.repeat(40)
const envKeys = ['APP_ENV', 'VISUTRY_CPU_OBSERVABILITY', 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_SHA'] as const
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

function enable(environment: 'production' | 'preview' = 'production') {
  delete process.env.APP_ENV
  process.env.VISUTRY_CPU_OBSERVABILITY = '1'
  process.env.VERCEL_ENV = environment
  process.env.VERCEL_GIT_COMMIT_SHA = sha
}

function observationEnvelope(): Record<string, unknown> {
  const message = info.mock.calls[0]?.[1] as string
  expect(message).toMatch(/^cpu_observation:/)
  return JSON.parse(message.slice('cpu_observation:'.length))
}

beforeEach(() => {
  for (const key of envKeys) delete process.env[key]
  info.mockReset()
  warn.mockReset()
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(() => {
  for (const key of envKeys) {
    const original = originalEnv[key]
    if (original === undefined) delete process.env[key]
    else process.env[key] = original
  }
})

describe('opt-in Function request observation', () => {
  it('preserves response and produces no record when disabled by default', async () => {
    const response = new Response('unchanged', { status: 201 })
    const handler = jest.fn(async (_request: Request) => response)
    const observed = withFunctionObservation('api.consumer.try_on.submit', 'consumer', handler)

    await expect(observed(new Request('https://www.visutry.com/api/try-on/submit'))).resolves.toBe(response)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(info).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it.each([
    ['explicit local', { APP_ENV: 'local' }],
    ['missing flag', { VISUTRY_CPU_OBSERVABILITY: undefined }],
    ['invalid flag', { VISUTRY_CPU_OBSERVABILITY: 'true' }],
    ['non-Vercel environment', { VERCEL_ENV: 'development' }],
    ['missing SHA', { VERCEL_GIT_COMMIT_SHA: undefined }],
    ['invalid SHA', { VERCEL_GIT_COMMIT_SHA: 'short' }],
  ])('fails closed with %s', async (_label, overrides) => {
    enable()
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }

    const handler = jest.fn(async (_request: Request) => new Response('ok'))
    const observed = withFunctionObservation('api.consumer.face_analysis.submit', 'consumer', handler)
    await expect(observed(new Request('https://www.visutry.com/api/face-analysis/submit'))).resolves.toHaveProperty('status', 200)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(info).not.toHaveBeenCalled()
  })

  it('emits only bounded stable fields, with the expected preview SHA, method and status', async () => {
    enable('preview')
    jest.spyOn(Math, 'random').mockReturnValue(0.99)
    const request = new Request('https://www.visutry.com/api/try-on/submit?email=secret@example.com', {
      method: 'POST',
      headers: {
        authorization: 'Bearer private-token',
        cookie: 'session=private-cookie',
        'x-forwarded-for': '203.0.113.12',
        'content-length': '42',
      },
    })
    const response = new Response('created', { status: 201 })
    const observed = withFunctionObservation('api.consumer.try_on.submit', 'consumer', async (_req: Request) => response)

    await expect(observed(request)).resolves.toBe(response)
    expect(info).toHaveBeenCalledTimes(1)
    expect(info.mock.calls[0][0]).toBe('api')
    const envelope = observationEnvelope()
    expect(envelope).toEqual({
      schema_version: 1,
      route: 'api.consumer.try_on.submit',
      actor: 'consumer',
      environment: 'preview',
      deployment_sha: sha,
      sample_rate: 1,
      method: 'POST',
      http_status: 201,
      handler_duration_ms: expect.any(Number),
      request_bytes: 42,
    })
    expect(info.mock.calls[0][2]).toEqual({
      event: 'function_request_observation',
      route: 'api.consumer.try_on.submit',
      role: 'consumer',
      httpStatus: 201,
      durationMs: expect.any(Number),
      contentLength: 42,
      environment: 'preview',
    })
    expect(info.mock.calls[0][3]).toEqual({ method: 'POST' })
    const serialized = JSON.stringify(info.mock.calls[0])
    for (const secret of ['secret@example.com', 'private-token', 'private-cookie', '203.0.113.12']) {
      expect(serialized).not.toContain(secret)
    }
    expect(warn).not.toHaveBeenCalled()
  })

  it('uses route-level sampling: low-volume AI requests are complete and high-volume Auth is sampled', async () => {
    enable()
    jest.spyOn(Math, 'random').mockReturnValue(0.9)
    const request = new Request('https://www.visutry.com/api/face-analysis/submit', { method: 'POST' })
    const aiHandler = jest.fn(async (_request: Request) => new Response('ok'))
    const authHandler = jest.fn(async (_request: Request) => new Response('ok'))

    await withFunctionObservation('api.consumer.face_analysis.submit', 'consumer', aiHandler)(request)
    await withFunctionObservation('api.auth.nextauth', 'shared', authHandler)(request)

    expect(aiHandler).toHaveBeenCalledTimes(1)
    expect(authHandler).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(1)
    expect(observationEnvelope()).toMatchObject({ route: 'api.consumer.face_analysis.submit', sample_rate: 1 })
  })

  it('samples high-frequency Store sessions at 10 percent, including its boundary', async () => {
    enable()
    const random = jest.spyOn(Math, 'random').mockReturnValueOnce(0.09).mockReturnValueOnce(0.1)
    const handler = jest.fn(async (_request: Request) => new Response('ok'))
    const observed = withFunctionObservation('api.consumer.store_session.create', 'consumer', handler)
    const request = new Request('https://www.visutry.com/api/store/sessions', { method: 'POST' })

    await observed(request)
    await observed(request)

    expect(random).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(2)
    expect(info).toHaveBeenCalledTimes(1)
    expect(observationEnvelope()).toMatchObject({ sample_rate: 0.1 })
  })

  it('preserves parameters, response identity and errors when logging fails', async () => {
    enable()
    info.mockImplementation(() => { throw new Error('synthetic logger failure') })
    const response = new Response('ok', { status: 202 })
    const handler = jest.fn(async (_request: Request, context: { params: { merchantId: string } }) => {
      expect(context.params.merchantId).toBe('merchant-private')
      return response
    })
    const observed = withFunctionObservation('api.merchant.billing.checkout', 'merchant', handler)

    await expect(observed(new Request('https://www.visutry.com/api/merchant/private/billing/checkout'), {
      params: { merchantId: 'merchant-private' },
    })).resolves.toBe(response)
    expect(info).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('preserves the original handler exception and records a synthetic 500 without exposing it', async () => {
    enable()
    const originalError = new Error('sensitive exception details')
    const observed = withFunctionObservation('api.cron.cleanup_expired_tasks', 'system', async (_request: Request): Promise<Response> => {
      throw originalError
    })

    await expect(observed(new Request('https://www.visutry.com/api/cron/cleanup-expired-tasks'))).rejects.toBe(originalError)
    expect(info).toHaveBeenCalledTimes(1)
    expect(observationEnvelope()).toMatchObject({ http_status: 500, actor: 'system' })
    expect(JSON.stringify(info.mock.calls[0])).not.toContain(originalError.message)
  })

  it('caps burst logging per warm instance and never changes return values at the limit', async () => {
    enable()
    const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-28T05:00:00Z').getTime())
    const response = new Response('ok')
    const handler = jest.fn(async (_request: Request) => response)
    const observed = withFunctionObservation('api.cron.cleanup_store_assets', 'system', handler)
    const request = new Request('https://www.visutry.com/api/cron/cleanup-store-assets')

    for (let i = 0; i < 125; i++) {
      await expect(observed(request)).resolves.toBe(response)
    }

    expect(handler).toHaveBeenCalledTimes(125)
    expect(info).toHaveBeenCalledTimes(120)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][1]).toMatch(/^cpu_observation_capped:/)
    expect(warn.mock.calls[0][2]).toMatchObject({ event: 'function_request_observation_capped' })

    now.mockReturnValue(new Date('2026-10-28T05:01:00Z').getTime())
    await expect(observed(request)).resolves.toBe(response)
    expect(info).toHaveBeenCalledTimes(121)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not change handler failure semantics when a capped marker sink throws', async () => {
    enable()
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-28T06:00:00Z').getTime())
    const failure = new Error('business failure')
    const observed = withFunctionObservation('api.cron.retention_notifications', 'system', async (_request: Request): Promise<Response> => {
      throw failure
    })
    const request = new Request('https://www.visutry.com/api/cron/retention-notifications')

    for (let i = 0; i < 120; i++) {
      await expect(observed(request)).rejects.toBe(failure)
    }
    warn.mockImplementation(() => { throw new Error('cap logger failed') })
    await expect(observed(request)).rejects.toBe(failure)
    expect(info).toHaveBeenCalledTimes(120)
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
