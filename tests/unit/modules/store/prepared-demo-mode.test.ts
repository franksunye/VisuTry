import { resolveStoreTryOnExecutionMode } from '@/modules/store/application/resolve-demo-execution-mode'
import type { MerchantRecord } from '@/modules/store/application/ports/repositories'
import { VISUTRY_DEMO_MERCHANT_SLUG } from '@/modules/store/domain/visutry-demo-identity'

const merchant = (overrides: Record<string, unknown> = {}) => ({
  id: 'demo-merchant',
  slug: VISUTRY_DEMO_MERCHANT_SLUG,
  classification: 'TEST',
  pilotType: 'DEMO',
  commercialExceptionCode: 'VISUTRY_DEMO',
  ...overrides,
}) as MerchantRecord

describe('shared Demo Try-On execution mode', () => {
  it.each([
    ['local', { APP_ENV: 'local', VISUTRY_LOCAL_DEMO_RUNTIME: '1' }],
    ['production', { APP_ENV: 'production' }],
  ])('defaults canonical Demo to PREPARED_DEMO in %s', (_label, env) => {
    expect(resolveStoreTryOnExecutionMode(merchant(), env)).toBe('PREPARED_DEMO')
  })

  it.each([
    ['TEST only', { pilotType: null, commercialExceptionCode: null }],
    ['DEMO marker only', { classification: null, commercialExceptionCode: null }],
    ['commercial exception only', { classification: null, pilotType: null }],
    ['wrong canonical slug', { slug: 'another-demo' }],
  ])('does not enable prepared results for %s', (_label, overrides) => {
    expect(resolveStoreTryOnExecutionMode(merchant(overrides))).toBe('LIVE_TRYON')
  })

  it('allows LIVE_PROVIDER only through the existing authorized Local GrsAI smoke boundary', () => {
    const authorized = {
      APP_ENV: 'local',
      NODE_ENV: 'test',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VISUTRY_LOCAL_DEMO_EXECUTION_MODE: 'LIVE_PROVIDER',
      VISUTRY_LOCAL_DEMO_PROVIDER_MODE: 'grsai',
      VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE: '1',
      VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED: '1',
      GRSAI_API_KEY: 'test-only-secret',
      GRSAI_BASE_URL: 'https://grsaiapi.com',
    }
    expect(resolveStoreTryOnExecutionMode(merchant(), authorized)).toBe('LIVE_PROVIDER')
    expect(() => resolveStoreTryOnExecutionMode(merchant(), {
      ...authorized,
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })).toThrow('authorized Local provider-smoke command')
    expect(() => resolveStoreTryOnExecutionMode(merchant(), {
      ...authorized,
      VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED: '0',
    })).toThrow('authorized Local provider-smoke command')
  })
})
