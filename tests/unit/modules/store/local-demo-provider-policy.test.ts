import { submitStoreFrameTryOn } from '@/modules/store/application/submit-store-tryon'
import {
  localDemoGeminiDispatchAllowed,
  resolveLocalDemoProviderPolicy,
} from '@/lib/local-demo-provider-policy'

jest.mock('@/lib/prisma', () => ({ prisma: {} }))

describe('Local Demo provider policy', () => {
  it('defaults Local Demo to blocked even when provider credentials exist', () => {
    expect(resolveLocalDemoProviderPolicy({
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      GRSAI_API_KEY: 'grsai-secret',
      GRSAI_BASE_URL: 'https://grsaiapi.com',
    })).toEqual({ kind: 'blocked' })
  })

  it('requires an explicit GrsAI key and never accepts Gemini as its substitute', () => {
    expect(resolveLocalDemoProviderPolicy({
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'grsai',
      GEMINI_API_KEY: 'gemini-secret',
      GRSAI_BASE_URL: 'https://grsaiapi.com',
    })).toMatchObject({ kind: 'misconfigured', reason: expect.stringContaining('GRSAI_API_KEY') })
  })

  it('accepts only an explicitly configured GrsAI credential on the approved HTTPS host', () => {
    expect(resolveLocalDemoProviderPolicy({
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'grsai',
      GRSAI_API_KEY: 'grsai-secret',
      GRSAI_BASE_URL: 'https://grsaiapi.com/',
      GEMINI_API_KEY: 'must-not-be-used',
    })).toEqual({ kind: 'grsai', apiKey: 'grsai-secret', baseUrl: 'https://grsaiapi.com' })

    expect(resolveLocalDemoProviderPolicy({
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'grsai',
      GRSAI_API_KEY: 'grsai-secret',
      GRSAI_BASE_URL: 'https://attacker.example',
    })).toMatchObject({ kind: 'misconfigured' })
  })

  it('fails closed if the Local Demo marker is used outside APP_ENV=local', () => {
    expect(resolveLocalDemoProviderPolicy({
      APP_ENV: 'production',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'grsai',
      GRSAI_API_KEY: 'grsai-secret',
      GRSAI_BASE_URL: 'https://grsaiapi.com',
    })).toMatchObject({ kind: 'misconfigured' })
    expect(localDemoGeminiDispatchAllowed({ APP_ENV: 'local', VISUTRY_LOCAL_DEMO_RUNTIME: '1' })).toBe(false)
    expect(localDemoGeminiDispatchAllowed({ APP_ENV: 'local' })).toBe(true)
  })

  it('blocks Store Try-On before even resolving Merchant state or writing task/usage/telemetry', async () => {
    const keys = [
      'APP_ENV', 'VERCEL_ENV', 'VISUTRY_LOCAL_DEMO_RUNTIME', 'VISUTRY_LOCAL_DEMO_PROVIDER_MODE',
      'ENABLE_MOCKS', 'TEST_MODE', 'P1_M5_LOCAL_DECISION_RESULT_E2E',
    ] as const
    const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
    Object.assign(process.env, {
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'blocked',
      ENABLE_MOCKS: 'true',
      TEST_MODE: 'true',
      P1_M5_LOCAL_DECISION_RESULT_E2E: '0',
    })
    delete process.env.VERCEL_ENV

    const findBySlug = jest.fn()
    try {
      await expect(submitStoreFrameTryOn({ merchants: { findBySlug } } as never)).rejects.toMatchObject({
        code: 'CAPABILITY_DISABLED',
        httpStatus: 503,
        shopperMessage: expect.stringContaining('paused in this Local Demo'),
      })
      expect(findBySlug).not.toHaveBeenCalled()
    } finally {
      for (const key of keys) {
        const value = original[key]
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })
})
