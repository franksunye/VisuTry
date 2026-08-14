import {
  getFaceAnalysisBlobOptions,
  getFaceAnalysisBlobStoreId,
  resolveFaceAnalysisBlobAccessMode,
} from '@/lib/face-analysis-blob-access'

describe('Face Analysis Blob access mode', () => {
  it('defaults to public for the current production store', () => {
    expect(resolveFaceAnalysisBlobAccessMode(undefined)).toBe('public')
  })

  it('accepts explicit private mode for a private Blob store', () => {
    expect(resolveFaceAnalysisBlobAccessMode(' private ')).toBe('private')
  })

  it('requires an explicit store binding for private mode', () => {
    const previousMode = process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE
    delete process.env.FACE_ANALYSIS_BLOB_STORE_ID
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'

    expect(() => getFaceAnalysisBlobOptions()).toThrow(
      'FACE_ANALYSIS_BLOB_STORE_ID is required',
    )

    if (previousMode === undefined) delete process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE
    else process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = previousMode
  })

  it('returns the configured private store binding', () => {
    const previousMode = process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE
    const previousStoreId = process.env.FACE_ANALYSIS_BLOB_STORE_ID
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'store_test'

    expect(getFaceAnalysisBlobOptions()).toEqual({
      access: 'private',
      storeId: 'store_test',
    })
    expect(getFaceAnalysisBlobStoreId()).toBe('store_test')

    if (previousMode === undefined) delete process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE
    else process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = previousMode
    if (previousStoreId === undefined) delete process.env.FACE_ANALYSIS_BLOB_STORE_ID
    else process.env.FACE_ANALYSIS_BLOB_STORE_ID = previousStoreId
  })

  it('rejects unknown modes instead of silently changing storage semantics', () => {
    expect(() => resolveFaceAnalysisBlobAccessMode('public-poc')).toThrow(
      'FACE_ANALYSIS_BLOB_ACCESS_MODE must be "public" or "private"',
    )
  })
})
