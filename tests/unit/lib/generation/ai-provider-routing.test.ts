import { activeAiProvider, selectFaceAnalysisProvider, selectNewTryOnProvider } from '@/lib/generation/ai-provider-routing'

describe('single AI provider switch (no network calls)', () => {
  const keys = [
    'AI_PROVIDER', 'KIE_API_KEY', 'KIE_TRYON_FALLBACK_MODE',
    'KIE_MEDIA_EXPORT_APPROVED', 'TRY_ON_BLOB_ACCESS_MODE', 'FACE_ANALYSIS_BLOB_ACCESS_MODE',
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

  it('defaults both Try-On surfaces and Face Analysis to Grsai, even with a Kie key', () => {
    process.env.KIE_API_KEY = 'synthetic-key'
    expect(activeAiProvider()).toBe('grsai')
    expect(selectFaceAnalysisProvider()).toBe('grsai')
    expect(selectNewTryOnProvider('consumer')).toBe('grsai')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
  })

  it('routes all three Grsai-backed flows to Kie without Blob migration or extra approval env', () => {
    process.env.AI_PROVIDER = 'kie'
    process.env.KIE_API_KEY = 'synthetic-key'
    process.env.KIE_MEDIA_EXPORT_APPROVED = 'false'
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'public'
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'public'
    expect(activeAiProvider()).toBe('kie')
    expect(selectFaceAnalysisProvider()).toBe('kie')
    expect(selectNewTryOnProvider('consumer')).toBe('kie')
    expect(selectNewTryOnProvider('store')).toBe('kie')
  })

  it('ignores the deprecated Try-On-only flags', () => {
    process.env.KIE_API_KEY = 'synthetic-key'
    process.env.KIE_TRYON_FALLBACK_MODE = 'force-all'
    expect(selectFaceAnalysisProvider()).toBe('grsai')
    expect(selectNewTryOnProvider('store')).toBe('grsai')
  })

  it('fails closed on a missing Kie secret or invalid provider name', () => {
    process.env.AI_PROVIDER = 'kie'
    expect(() => selectFaceAnalysisProvider()).toThrow('requires KIE_API_KEY')
    process.env.AI_PROVIDER = 'automatic'
    expect(() => selectNewTryOnProvider('consumer')).toThrow('Invalid AI_PROVIDER')
  })
})
