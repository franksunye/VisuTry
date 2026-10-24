import {
  getTryOnBlobStoreId,
  getPrivateTryOnBlobOptions,
  hasPrivateTryOnBlobIdentity,
  getTryOnResultBlobOptions,
  getTryOnSourceBlobOptions,
  resolveTryOnBlobAccessMode,
} from '@/lib/tryon-blob-access'

const ENV_KEYS = [
  'TRY_ON_BLOB_ACCESS_MODE',
  'TRY_ON_BLOB_STORE_ID',
  'TRY_ON_BLOB_READ_WRITE_TOKEN',
  'RPIVATE_BLOB_STORE_ID',
  'RPIVATE_BLOB_READ_WRITE_TOKEN',
  'FACE_ANALYSIS_BLOB_ACCESS_MODE',
  'FACE_ANALYSIS_BLOB_STORE_ID',
] as const

describe('Try-On Blob access policy', () => {
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

  it('defaults source and result media to public when no private policy is configured', () => {
    expect(resolveTryOnBlobAccessMode()).toBe('public')
    expect(getTryOnSourceBlobOptions()).toEqual({ access: 'public' })
    expect(getTryOnResultBlobOptions()).toEqual({ access: 'public' })
  })

  it('uses explicit Try-On private store configuration for source and result media', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'synthetic-token'

    const expected = {
      access: 'private',
      storeId: 'store_tryon',
      token: 'synthetic-token',
    }
    expect(getTryOnSourceBlobOptions()).toEqual(expected)
    expect(getTryOnResultBlobOptions()).toEqual(expected)
    expect(getTryOnBlobStoreId()).toBe('store_tryon')
  })

  it('can reuse the established Face Analysis private store during rollout', () => {
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_face_analysis'
    process.env.RPIVATE_BLOB_STORE_ID = 'store_legacy'
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'synthetic-legacy-token'

    const expected = {
      access: 'private',
      storeId: 'store_legacy',
      token: 'synthetic-legacy-token',
    }
    expect(getTryOnSourceBlobOptions()).toEqual(expected)
    expect(getTryOnResultBlobOptions()).toEqual(expected)
  })

  it('lets explicit Try-On configuration override the Face Analysis fallback', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'public'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_face_analysis'

    expect(getTryOnSourceBlobOptions()).toEqual({ access: 'public' })
    expect(getTryOnResultBlobOptions()).toEqual({ access: 'public' })
  })

  it('fails closed for an unknown access mode', () => {
    expect(() => resolveTryOnBlobAccessMode('private-ish')).toThrow(
      'TRY_ON_BLOB_ACCESS_MODE must be "public" or "private"',
    )
  })

  it('requires a store binding before private writes are enabled', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'

    expect(() => getTryOnSourceBlobOptions()).toThrow('Private Try-On Blob requires a complete')
    expect(() => getTryOnResultBlobOptions()).toThrow('Private Try-On Blob requires a complete')
  })
  it('rejects partial explicit identity even when the legacy store exists', () => {
    process.env.TRY_ON_BLOB_STORE_ID = 'store_explicit'
    process.env.RPIVATE_BLOB_STORE_ID = 'store_legacy'
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'synthetic-legacy-token'
    expect(() => getPrivateTryOnBlobOptions()).toThrow('must be configured together')
    expect(hasPrivateTryOnBlobIdentity()).toBe(false)
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'synthetic-explicit-token'
    expect(getPrivateTryOnBlobOptions()).toEqual({
      access: 'private', storeId: 'store_explicit', token: 'synthetic-explicit-token',
    })
  })
})
