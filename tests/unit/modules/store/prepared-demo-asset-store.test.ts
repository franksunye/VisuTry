import { createHash } from 'node:crypto'
import { BlobNotFoundError, get } from '@vercel/blob'
import { findPreparedDemoAssetForFrameSku, PREPARED_DEMO_RESULT_MANIFEST } from '@/modules/store/infrastructure/prepared-demo/prepared-result-manifest'
import { readPreparedDemoResultAsset } from '@/modules/store/infrastructure/prepared-demo/prepared-result-asset-store'

jest.mock('@vercel/blob', () => {
  class BlobNotFoundError extends Error {}
  return { BlobNotFoundError, get: jest.fn() }
})

const getBlob = get as jest.MockedFunction<typeof get>

describe('shared PREPARED_DEMO asset storage contract', () => {
  afterEach(() => jest.clearAllMocks())

  it('reads the checksum-verified QA fixture only inside guarded Local Demo', async () => {
    const descriptor = PREPARED_DEMO_RESULT_MANIFEST[0]
    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VERCEL_ENV: undefined,
    })
    expect(result?.contentType).toBe('image/svg+xml')
    expect(result?.body.toString()).toContain('QA FIXTURE')
    expect(result?.body.toString()).toContain('NOT A TRY-ON IMAGE')
    expect(getBlob).not.toHaveBeenCalled()
  })

  it('selects the Lead-approved Rowan and Lane outputs for guarded Local Demo, not the QA fixtures', () => {
    const localEnv = {
      APP_ENV: 'local',
      VISUTRY_LOCAL_DEMO_RUNTIME: '1',
      VERCEL_ENV: undefined,
    }
    expect(findPreparedDemoAssetForFrameSku('VT-DEMO-001', localEnv)).toMatchObject({
      assetClass: 'APPROVED_DEMO_OUTPUT',
      frameIdentity: 'ROWAN',
      reviewStatus: 'APPROVED',
    })
    expect(findPreparedDemoAssetForFrameSku('VT-DEMO-002', localEnv)).toMatchObject({
      assetClass: 'APPROVED_DEMO_OUTPUT',
      frameIdentity: 'LANE',
      reviewStatus: 'APPROVED',
    })
  })

  it('selects only approved private Production descriptors for the canonical Demo', () => {
    expect(findPreparedDemoAssetForFrameSku('VT-DEMO-001', {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })).toMatchObject({
      assetClass: 'APPROVED_DEMO_OUTPUT',
      frameIdentity: 'ROWAN',
      productionStorageKey: 'visutry-demo/prepared/v1/rowan-prepared-result.png',
    })
    expect(findPreparedDemoAssetForFrameSku('VT-DEMO-002', {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })).toMatchObject({
      assetClass: 'APPROVED_DEMO_OUTPUT',
      frameIdentity: 'LANE',
      productionStorageKey: 'visutry-demo/prepared/v1/lane-prepared-result.png',
    })
  })

  it('reads original approved Local PNG bytes and verifies their manifest checksums', async () => {
    const approved = [
      {
        assetKey: 'visutry-demo-v1-vt-rowan-approved-local',
        sha256: '504fced34e90922ffe162c4abe746178777b4241afc5f262d28e93dba703b28c',
      },
      {
        assetKey: 'visutry-demo-v1-vt-lane-approved-local',
        sha256: '1c6f03785756d230fb1806572e03e9acf9eda32f150acb84ee783ee8bfac7b71',
      },
    ]
    for (const expected of approved) {
      const descriptor = PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === expected.assetKey)!
      expect(descriptor.assetSha256).toBe(expected.sha256)
      const result = await readPreparedDemoResultAsset(descriptor, {
        APP_ENV: 'local',
        VISUTRY_LOCAL_DEMO_RUNTIME: '1',
        VERCEL_ENV: undefined,
      })
      expect(result?.contentType).toBe('image/png')
      expect(result && createHash('sha256').update(result.body).digest('hex')).toBe(expected.sha256)
    }
    expect(getBlob).not.toHaveBeenCalled()
  })

  it('refuses Local QA fixtures in Production and never exposes their repository path', async () => {
    const result = await readPreparedDemoResultAsset(PREPARED_DEMO_RESULT_MANIFEST[0], {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })
    expect(result).toBeNull()
    expect(getBlob).not.toHaveBeenCalled()
  })

  it('does not expose an approved Local path in Production when no Production storage key is configured', async () => {
    const descriptor = {
      ...PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === 'visutry-demo-v1-vt-rowan-approved-local')!,
      productionStorageKey: null,
    }
    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })
    expect(result).toBeNull()
    expect(getBlob).not.toHaveBeenCalled()
  })

  it('fails closed without the dedicated private-store token and never falls back to the default Blob token', async () => {
    const body = Buffer.from('approved private prepared result')
    const descriptor = {
      ...PREPARED_DEMO_RESULT_MANIFEST[2],
      assetSha256: createHash('sha256').update(body).digest('hex'),
    }
    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
      BLOB_READ_WRITE_TOKEN: 'public-poc-token-must-not-be-used',
    })
    expect(result).toBeNull()
    expect(getBlob).not.toHaveBeenCalled()
  })

  it('uses private Blob storage for the same approved prepared-result contract in Production', async () => {
    const body = Buffer.from('approved private prepared result')
    const descriptor = {
      ...PREPARED_DEMO_RESULT_MANIFEST[2],
      assetSha256: createHash('sha256').update(body).digest('hex'),
      contentType: 'image/png' as const,
    }
    getBlob.mockResolvedValue({
      stream: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: body })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
      blob: { contentType: 'image/png' },
    } as unknown as Awaited<ReturnType<typeof get>>)

    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
      RPIVATE_BLOB_READ_WRITE_TOKEN: 'private-demo-store-token',
    })
    expect(result).toMatchObject({ body, contentType: 'image/png', expiresAt: null })
    expect(getBlob).toHaveBeenCalledWith('visutry-demo/prepared/v1/rowan-prepared-result.png', {
      access: 'private',
      token: 'private-demo-store-token',
    })
  })

  it('rejects mismatched private bytes after reading the exact private pathname', async () => {
    const body = Buffer.from('different approved-looking bytes')
    const descriptor = PREPARED_DEMO_RESULT_MANIFEST[2]
    getBlob.mockResolvedValue({
      stream: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: body })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
      blob: { contentType: 'image/png' },
    } as unknown as Awaited<ReturnType<typeof get>>)
    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
      RPIVATE_BLOB_READ_WRITE_TOKEN: 'private-demo-store-token',
    })
    expect(result).toBeNull()
    expect(getBlob).toHaveBeenCalledWith(descriptor.productionStorageKey, {
      access: 'private',
      token: 'private-demo-store-token',
    })
  })

  it('fails closed when the private Production pathname is absent', async () => {
    getBlob.mockRejectedValue(new BlobNotFoundError())
    const result = await readPreparedDemoResultAsset(PREPARED_DEMO_RESULT_MANIFEST[2], {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
      RPIVATE_BLOB_READ_WRITE_TOKEN: 'private-demo-store-token',
    })
    expect(result).toBeNull()
  })

  it('fails closed when a private result is stored with the wrong content type', async () => {
    const body = Buffer.from('approved private prepared result')
    const descriptor = {
      ...PREPARED_DEMO_RESULT_MANIFEST[2],
      assetSha256: createHash('sha256').update(body).digest('hex'),
    }
    getBlob.mockResolvedValue({
      stream: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: body })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
      blob: { contentType: 'image/jpeg' },
    } as unknown as Awaited<ReturnType<typeof get>>)
    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
      RPIVATE_BLOB_READ_WRITE_TOKEN: 'private-demo-store-token',
    })
    expect(result).toBeNull()
  })
})
