import {
  assertDemoStoreIdentity,
  assertLocalDemoMerchantIdentity,
  assertLocalDemoSessionResetEnvironment,
  assertDemoServerStopped,
  isLocalDemoShopperMediaPathname,
  localDemoShopperMediaPathnameFromReference,
  localDemoShopperMediaPrefixes,
  localDemoTryOnTaskScope,
} from '../../../scripts/lib/local-demo-session-reset-contract'

const validEnvironment = {
  APP_ENV: 'local',
  ENABLE_MOCKS: 'true',
  VISUTRY_LOCAL_DEMO_RUNTIME: '1',
  VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'blocked',
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
    ['Vercel runtime marker', { ...validEnvironment, VERCEL: '1' }],
    ['Production database', { ...validEnvironment, DATABASE_URL: 'postgresql://remote.example/demo' }],
    ['unpooled remote database', { ...validEnvironment, DATABASE_URL_UNPOOLED: 'postgresql://remote.example/demo' }],
    ['wrong local database', { ...validEnvironment, DATABASE_URL: 'postgresql://local@127.0.0.1:5432/other' }],
    ['wrong environment marker', { ...validEnvironment, VISUTRY_DATABASE_IDENTITY: 'preview:branch/db' }],
    ['live Stripe mode', { ...validEnvironment, STRIPE_MERCHANT_BILLING_MODE: 'live' }],
    ['live Stripe key', { ...validEnvironment, STRIPE_SECRET_KEY: 'sk_live_never' }],
    ['remote auth URL', { ...validEnvironment, NEXTAUTH_URL: 'https://www.visutry.com' }],
    ['disabled mock auth', { ...validEnvironment, ENABLE_MOCKS: 'false' }],
    ['missing local demo runtime marker', { ...validEnvironment, VISUTRY_LOCAL_DEMO_RUNTIME: undefined }],
    ['provider mode not blocked', { ...validEnvironment, VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'deterministic' }],
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

  it('identifies only exact shopper media paths for the dedicated Merchant', () => {
    const merchantId = 'demo_merchant-1'
    const paths = [
      `store/${merchantId}/sessions/session_1/photo-123e4567-e89b-42d3-a456-426614174000.jpg`,
      `tryon/user/store/${merchantId}/task_1-v2-123e4567-e89b-42d3-a456-426614174000`,
      `tryon/item/store/${merchantId}/task_1-v2-123e4567-e89b-42d3-a456-426614174000`,
      `tryon/result/store/${merchantId}/task_1.png`,
    ]
    for (const pathname of paths) {
      expect(isLocalDemoShopperMediaPathname(pathname, merchantId)).toBe(true)
    }
    expect(isLocalDemoShopperMediaPathname(paths[0], 'other_merchant')).toBe(false)
    expect(isLocalDemoShopperMediaPathname(`store/${merchantId}/catalog/frame.png`, merchantId)).toBe(false)
    expect(localDemoShopperMediaPrefixes(merchantId)).toEqual([
      `store/${merchantId}/sessions/`,
      `tryon/user/store/${merchantId}/`,
      `tryon/item/store/${merchantId}/`,
      `tryon/result/store/${merchantId}/`,
    ])
  })

  it('parses only Local mock Blob references and ignores other providers', () => {
    const merchantId = 'demo_merchant-1'
    const pathname = `tryon/result/store/${merchantId}/task_1.png`
    expect(localDemoShopperMediaPathnameFromReference(pathname, merchantId)).toBe(pathname)
    expect(localDemoShopperMediaPathnameFromReference(
      `https://mock-blob-storage.vercel.app/${pathname}`,
      merchantId,
    )).toBe(pathname)
    expect(localDemoShopperMediaPathnameFromReference('https://blob.vercel-storage.com/other.png', merchantId)).toBeNull()
    expect(localDemoShopperMediaPathnameFromReference(
      `https://mock-blob-storage.vercel.app/tryon/result/store/other_merchant/task_1.png`,
      merchantId,
    )).toBeNull()
    expect(() => localDemoShopperMediaPathnameFromReference(
      `https://mock-blob-storage.vercel.app/store/${merchantId}/sessions/session_1/not-a-photo.jpg`,
      merchantId,
    )).toThrow(/approved Local path shape/)
  })
})
