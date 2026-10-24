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
  'BLOB_READ_WRITE_TOKEN',
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
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_tryon_synthetic'

    const expected = {
      access: 'private',
      storeId: 'store_tryon',
      token: 'vercel_blob_rw_tryon_synthetic',
    }
    expect(getTryOnSourceBlobOptions()).toEqual(expected)
    expect(getTryOnResultBlobOptions()).toEqual(expected)
    expect(getTryOnBlobStoreId()).toBe('store_tryon')
  })

  it('can reuse the established Face Analysis private store during rollout', () => {
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_face_analysis'
    process.env.RPIVATE_BLOB_STORE_ID = 'store_legacy'
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_legacy_synthetic'

    const expected = {
      access: 'private',
      storeId: 'store_legacy',
      token: 'vercel_blob_rw_legacy_synthetic',
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
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_legacy_synthetic'
    expect(() => getPrivateTryOnBlobOptions()).toThrow('must be configured together')
    expect(hasPrivateTryOnBlobIdentity()).toBe(false)
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_explicit_synthetic'
    expect(getPrivateTryOnBlobOptions()).toEqual({
      access: 'private', storeId: 'store_explicit', token: 'vercel_blob_rw_explicit_synthetic',
    })
  })
  it.each([
    ['store_wrong', 'vercel_blob_rw_tryon_secret'],
    ['store_tryon', 'vercel_blob_rw_wrong_secret'],
    ['store_tryon', 'vercel_blob_rw_Tryon_secret'],
    ['store_tryon', 'malformed-token'],
    ['store_tryon', 'vercel_blob_rw_tryon_'],
    ['store_tryon', 'vercel_blob_rw__secret'],
    ['store_tryon', 'vercel_blob_rw_tryon'],
    ['store_tryon_extra', 'vercel_blob_rw_tryon_secret'],
    ['store_tryon', 'vercel_blob_ro_tryon_secret'],
  ])('fails closed for mismatched or malformed explicit identity %s', (id, token) => {
    process.env.TRY_ON_BLOB_STORE_ID = id
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = token
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_public_synthetic'
    expect(() => getPrivateTryOnBlobOptions()).toThrow('identity do not match or have invalid format')
    expect(hasPrivateTryOnBlobIdentity()).toBe(false)
    try {
      getPrivateTryOnBlobOptions()
    } catch (error) {
      expect(String(error)).not.toContain(token)
    }
    delete process.env.BLOB_READ_WRITE_TOKEN
  })

  it('accepts a bare store ID and preserves case-sensitive normalization', () => {
    process.env.TRY_ON_BLOB_STORE_ID = 'QaStore'
    process.env.TRY_ON_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_QaStore_synthetic'
    expect(getPrivateTryOnBlobOptions()).toEqual({
      access: 'private', storeId: 'QaStore', token: 'vercel_blob_rw_QaStore_synthetic',
    })
    process.env.TRY_ON_BLOB_STORE_ID = 'store_QaStore'
    expect(hasPrivateTryOnBlobIdentity()).toBe(true)
  })

  it('fails closed for mismatched legacy private store without an explicit Try-On pair', () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.RPIVATE_BLOB_STORE_ID = 'store_legacy'
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_other_synthetic'
    expect(() => getTryOnResultBlobOptions()).toThrow('identity do not match')
    expect(hasPrivateTryOnBlobIdentity()).toBe(false)
  })
})
