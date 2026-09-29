import {
  assertLocalSalesDemoCaptureEnvironment,
  assertTryOnSubmissionCount,
  LOCAL_SALES_DEMO_SCENES,
} from '../../../scripts/lib/local-sales-demo-capture-contract'

const safeEnvironment = {
  APP_ENV: 'local',
  NODE_ENV: 'test',
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

describe('Local sales-demo capture safety contract', () => {
  it('accepts only the guarded Local PrismaPg / blocked-provider / Stripe TEST runtime', () => {
    expect(() => assertLocalSalesDemoCaptureEnvironment(safeEnvironment)).not.toThrow()
  })

  it.each([
    ['CI', { ...safeEnvironment, CI: '1' }],
    ['Vercel Preview', { ...safeEnvironment, VERCEL_ENV: 'preview' }],
    ['Production app environment', { ...safeEnvironment, APP_ENV: 'production' }],
    ['Production Node runtime', { ...safeEnvironment, NODE_ENV: 'production' }],
    ['missing Local runtime marker', { ...safeEnvironment, VISUTRY_LOCAL_DEMO_RUNTIME: undefined }],
    ['provider mode armed', { ...safeEnvironment, VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'grsai' }],
    ['remote database', { ...safeEnvironment, DATABASE_URL: 'postgresql://remote.example/demo' }],
    ['remote unpooled database', { ...safeEnvironment, DATABASE_URL_UNPOOLED: 'postgresql://remote.example/demo' }],
    ['wrong LOCAL database marker', { ...safeEnvironment, VISUTRY_DATABASE_IDENTITY: 'production:neon' }],
    ['remote auth URL', { ...safeEnvironment, NEXTAUTH_URL: 'https://www.visutry.com' }],
    ['live Stripe mode', { ...safeEnvironment, STRIPE_MERCHANT_BILLING_MODE: 'live' }],
    ['live Stripe key', { ...safeEnvironment, STRIPE_SECRET_KEY: 'sk_live_never' }],
  ])('refuses %s', (_label, env) => {
    expect(() => assertLocalSalesDemoCaptureEnvironment(env)).toThrow()
  })

  it('never allows the recording journey to submit a Try-On generation', () => {
    expect(() => assertTryOnSubmissionCount(0)).not.toThrow()
    expect(() => assertTryOnSubmissionCount(1)).toThrow(/stop before Try-On submission/)
  })

  it('defines exactly the four approved deterministic scenes', () => {
    expect(LOCAL_SALES_DEMO_SCENES.map(({ file }) => file)).toEqual([
      '01-store-entry.webm',
      '02-face-intelligence.webm',
      '03-recommendation.webm',
      '04-frame-selection.webm',
    ])
  })
})
