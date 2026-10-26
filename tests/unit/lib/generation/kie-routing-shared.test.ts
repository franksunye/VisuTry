import { kieFallbackMode, selectNewTryOnProvider } from '@/lib/generation/kie-routing'

describe('shared new-task Kie routing policy (no provider/network calls)', () => {
  const keys = [
    'KIE_API_KEY', 'KIE_MEDIA_EXPORT_APPROVED', 'TRY_ON_BLOB_ACCESS_MODE',
    'FACE_ANALYSIS_BLOB_ACCESS_MODE', 'KIE_TRYON_FALLBACK_MODE',
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

  function enableKie(mode: string) {
    process.env.KIE_API_KEY = 'synthetic-test-key'
    process.env.KIE_TRYON_FALLBACK_MODE = mode
  }

  it('keeps both surfaces on Grsai by default', () => {
    expect(kieFallbackMode()).toBe('off')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
  })

  it('keeps existing force-consumer confined to Consumer', () => {
    enableKie('force-consumer')
    expect(selectNewTryOnProvider('consumer')).toBe('kie')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
  })

  it('routes new Consumer and public-poc Store tasks to Kie in force-all mode', () => {
    enableKie('force-all')
    process.env.KIE_MEDIA_EXPORT_APPROVED = 'false'
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'public'
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'public'
    expect(kieFallbackMode()).toBe('force-all')
    expect(selectNewTryOnProvider('consumer')).toBe('kie')
    expect(selectNewTryOnProvider('store')).toBe('kie')
  })

  it('preserves auto-definitive: initial provider stays Grsai', () => {
    enableKie('auto-definitive')
    expect(kieFallbackMode()).toBe('auto-definitive')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
  })

  it('does not arm Kie with a key alone, or without a key', () => {
    process.env.KIE_API_KEY = 'synthetic-test-key'
    expect(kieFallbackMode()).toBe('off')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    enableKie('force-all')
    delete process.env.KIE_API_KEY
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
  })

  it('rejects unsupported routing modes', () => {
    enableKie('automatic-circuit-breaker')
    expect(kieFallbackMode()).toBe('off')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
  })
})
