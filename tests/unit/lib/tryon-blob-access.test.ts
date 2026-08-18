import {
  getTryOnBlobStoreId,
  getTryOnSourceBlobOptions,
  resolveTryOnBlobAccessMode,
} from '@/lib/tryon-blob-access'

const ENV_KEYS = [
  'TRY_ON_BLOB_ACCESS_MODE',
  'TRY_ON_BLOB_STORE_ID',
  'FACE_ANALYSIS_BLOB_ACCESS_MODE',
  'FACE_ANALYSIS_BLOB_STORE_ID',
] as const

describe('Try-On source Blob access policy', () => {
  const originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

  beforeAll(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key]
  })

  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key]
  })

  afterAll(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('defaults to public when neither Try-On nor Face Analysis config is present', () => {
    expect(resolveTryOnBlobAccessMode()).toBe('public')
    expect(getTryOnSourceBlobOptions()).toEqual({ access: 'public' })
  })

  it('uses explicit Try-On private store configuration', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'

    expect(getTryOnSourceBlobOptions()).toEqual({
      access: 'private',
      storeId: 'store_tryon',
    })
    expect(getTryOnBlobStoreId()).toBe('store_tryon')
  })

  it('can reuse the established Face Analysis private store during rollout', () => {
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_face_analysis'

    expect(getTryOnSourceBlobOptions()).toEqual({
      access: 'private',
      storeId: 'store_face_analysis',
    })
  })

  it('lets explicit Try-On configuration override the Face Analysis fallback', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'public'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_face_analysis'

    expect(getTryOnSourceBlobOptions()).toEqual({ access: 'public' })
  })

  it('fails closed for an unknown access mode', () => {
    expect(() => resolveTryOnBlobAccessMode('private-ish')).toThrow(
      'TRY_ON_BLOB_ACCESS_MODE must be "public" or "private"',
    )
  })

  it('requires a store binding before private writes are enabled', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'

    expect(() => getTryOnSourceBlobOptions()).toThrow(
      'TRY_ON_BLOB_STORE_ID is required when Try-On Blob access is private',
    )
  })
})
