import {
  assertDemoStoreIdentity,
  assertLocalDemoMerchantIdentity,
  assertLocalDemoSessionResetEnvironment,
  assertDemoServerStopped,
  localDemoTryOnTaskScope,
} from '../../../scripts/lib/local-demo-session-reset-contract'

const validEnvironment = {
  APP_ENV: 'local',
  ENABLE_MOCKS: 'true',
  DATABASE_URL: 'postgresql://local@127.0.0.1:5433/visutry_local',
  DATABASE_URL_UNPOOLED: 'postgresql://local@127.0.0.1:5433/visutry_local',
  VISUTRY_DATABASE_IDENTITY: 'local:127.0.0.1:5433/visutry_local',
  NEXTAUTH_URL: 'http://127.0.0.1:3001',
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3001',
  STRIPE_MERCHANT_BILLING_MODE: 'test',
}

describe('Local Demo shopper-session reset safety contract', () => {
  it('accepts only the explicit Local loopback TEST environment', () => {
    expect(() => assertLocalDemoSessionResetEnvironment(validEnvironment)).not.toThrow()
  })

  it.each([
    ['Preview', { ...validEnvironment, APP_ENV: 'preview' }],
    ['Vercel', { ...validEnvironment, VERCEL_ENV: 'preview' }],
    ['Production database', { ...validEnvironment, DATABASE_URL: 'postgresql://remote.example/demo' }],
    ['unpooled remote database', { ...validEnvironment, DATABASE_URL_UNPOOLED: 'postgresql://remote.example/demo' }],
    ['wrong local database', { ...validEnvironment, DATABASE_URL: 'postgresql://local@127.0.0.1:5432/other' }],
    ['wrong environment marker', { ...validEnvironment, VISUTRY_DATABASE_IDENTITY: 'preview:branch/db' }],
    ['live Stripe mode', { ...validEnvironment, STRIPE_MERCHANT_BILLING_MODE: 'live' }],
    ['live Stripe key', { ...validEnvironment, STRIPE_SECRET_KEY: 'sk_live_never' }],
    ['remote auth URL', { ...validEnvironment, NEXTAUTH_URL: 'https://www.visutry.com' }],
    ['disabled mock auth', { ...validEnvironment, ENABLE_MOCKS: 'false' }],
  ])('rejects %s', (_description, env) => {
    expect(() => assertLocalDemoSessionResetEnvironment(env)).toThrow()
  })

  it('accepts only the dedicated TEST Demo Merchant identity', () => {
    expect(() => assertLocalDemoMerchantIdentity({
      slug: 'visutry-demo-optical',
      name: 'VisuTry Demo Optical',
      classification: 'TEST',
      classificationSource: 'LOCAL_DEMO_FIXTURE',
      pilotType: 'DEMO',
      referenceData: false,
    })).not.toThrow()
    expect(() => assertLocalDemoMerchantIdentity({
      slug: 'another-merchant',
      name: 'Other',
      classification: 'TEST',
      classificationSource: 'LOCAL_DEMO_FIXTURE',
      pilotType: 'DEMO',
      referenceData: false,
    })).toThrow()
    expect(() => assertLocalDemoMerchantIdentity({
      slug: 'visutry-demo-optical',
      name: 'VisuTry Demo Optical',
      classification: 'REAL',
      classificationSource: 'LOCAL_DEMO_FIXTURE',
      pilotType: 'DEMO',
      referenceData: false,
    })).toThrow()
  })

  it('accepts only the managed Store identity', () => {
    expect(() => assertDemoStoreIdentity({
      slug: 'store',
      type: 'STORE',
      referenceMetadata: { ownership: 'VISUTRY', purpose: 'LOCAL_DEMO' },
    })).not.toThrow()
    expect(() => assertDemoStoreIdentity({
      slug: 'store',
      type: 'CAMPAIGN',
      referenceMetadata: { ownership: 'VISUTRY', purpose: 'LOCAL_DEMO' },
    })).toThrow()
  })

  it('refuses reset while the Local Demo server may retain shopper media in memory', async () => {
    await expect(assertDemoServerStopped(async () => true)).rejects.toThrow(/stop the Local Demo app/)
    await expect(assertDemoServerStopped(async () => false)).resolves.toBeUndefined()
  })

  it('limits provider telemetry cleanup to selected shopper Try-On tasks', () => {
    expect(localDemoTryOnTaskScope('demo-merchant', ['shopper-task-1', 'shopper-task-2'])).toEqual({
      merchantId: 'demo-merchant',
      tryOnTaskId: { in: ['shopper-task-1', 'shopper-task-2'] },
    })
    expect(localDemoTryOnTaskScope('demo-merchant', [])).toEqual({
      merchantId: 'demo-merchant',
      tryOnTaskId: { in: [] },
    })
  })
})
