/** @jest-environment node */

const originalEnv = { ...process.env }

function loadStripeClient() {
  let client: unknown
  jest.isolateModules(() => {
    client = require('@/lib/stripe').stripe
  })
  return client as { VERSION?: string; _api?: unknown }
}

describe('local real Stripe Test Mode override', () => {
  beforeEach(() => {
    process.env.APP_ENV = 'local'
    process.env.ENABLE_MOCKS = 'true'
    process.env.TEST_MODE = 'true'
    process.env.STRIPE_MERCHANT_BILLING_MODE = 'test'
    process.env.STRIPE_SECRET_KEY = 'sk_test_local_qa_placeholder'
    process.env.STRIPE_REAL_TEST_MODE = 'true'
    delete process.env.VERCEL_ENV
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses the Stripe SDK with local mock services', () => {
    expect(loadStripeClient()).toMatchObject({ VERSION: expect.any(String), _api: expect.any(Object) })
  })

  it('refuses a live Stripe key', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_forbidden'
    expect(loadStripeClient).toThrow('STRIPE_REAL_TEST_MODE requires local Stripe Test Mode configuration')
  })

  it('refuses the override outside local billing test mode', () => {
    process.env.APP_ENV = 'production'
    expect(loadStripeClient).toThrow('STRIPE_REAL_TEST_MODE requires local Stripe Test Mode configuration')
    process.env.APP_ENV = 'local'
    process.env.STRIPE_MERCHANT_BILLING_MODE = 'live'
    expect(loadStripeClient).toThrow('STRIPE_REAL_TEST_MODE requires local Stripe Test Mode configuration')
    process.env.STRIPE_MERCHANT_BILLING_MODE = 'test'
    process.env.VERCEL_ENV = 'preview'
    expect(loadStripeClient).toThrow('STRIPE_REAL_TEST_MODE requires local Stripe Test Mode configuration')
  })
})
