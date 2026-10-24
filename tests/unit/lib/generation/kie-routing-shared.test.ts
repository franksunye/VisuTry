import { kieFallbackMode, selectNewTryOnProvider } from '@/lib/generation/kie-routing'

describe('shared new-task Kie routing policy (no provider/network calls)', () => {
  const keys = [
    'KIE_API_KEY', 'KIE_MEDIA_EXPORT_APPROVED', 'TRY_ON_BLOB_ACCESS_MODE',
    'FACE_ANALYSIS_BLOB_ACCESS_MODE', 'KIE_TRYON_FALLBACK_MODE',
    'TRY_ON_BLOB_STORE_ID', 'TRY_ON_BLOB_READ_WRITE_TOKEN',
    'RPIVATE_BLOB_STORE_ID', 'RPIVATE_BLOB_READ_WRITE_TOKEN',
  ] as const
  const before = Object.fromEntries(keys.map(key => [key, process.env[key]])) as Record<string, string | undefined>

  beforeEach(() => {
    for (const key of keys) delete process.env[key]
  })

  afterAll(() => {
    for (const key of keys) {
      const original = before[key]
      if (original === undefined) delete process.env[key]
      else process.env[key] = original
    }
  })

  function enablePrivateKie(mode: string) {
    process.env.KIE_API_KEY = 'synthetic-test-key'
    process.env.KIE_MEDIA_EXPORT_APPROVED = 'true'
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_qa'
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'synthetic-qa-token'
    process.env.KIE_TRYON_FALLBACK_MODE = mode
  }

  it('keeps both surfaces on Grsai by default', () => {
    expect(kieFallbackMode()).toBe('off')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('grsai')
  })

  it('keeps existing force-consumer confined to Consumer', () => {
    enablePrivateKie('force-consumer')
    expect(selectNewTryOnProvider('consumer')).toBe('kie')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('grsai')
  })

  it('routes future Consumer and private-asset Store tasks to Kie in force-all mode', () => {
    enablePrivateKie('force-all')
    expect(kieFallbackMode()).toBe('force-all')
    expect(selectNewTryOnProvider('consumer')).toBe('kie')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('kie')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: false })).toBe('grsai')
  })

  it('preserves auto-definitive: initial provider stays Grsai', () => {
    enablePrivateKie('auto-definitive')
    expect(kieFallbackMode()).toBe('auto-definitive')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('grsai')
  })

  it('fails closed without image-transfer approval', () => {
    enablePrivateKie('force-all')
    delete process.env.KIE_MEDIA_EXPORT_APPROVED
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('grsai')
  })

  it('fails closed without a key or private Consumer media store', () => {
    enablePrivateKie('force-all')
    delete process.env.KIE_API_KEY
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    enablePrivateKie('force-all')
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'public'
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('grsai')
  })

  it('rejects unsupported routing modes', () => {
    enablePrivateKie('automatic-circuit-breaker')
    expect(kieFallbackMode()).toBe('off')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
  })
  it('keeps Kie disabled when private mode has no complete store identity', () => {
    enablePrivateKie('force-all')
    delete process.env.TRY_ON_BLOB_READ_WRITE_TOKEN
    expect(kieFallbackMode()).toBe('off')
    expect(selectNewTryOnProvider('store', { storePrivateAssets: true })).toBe('grsai')
  })
})
