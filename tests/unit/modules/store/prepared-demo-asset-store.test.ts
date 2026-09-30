import { createHash } from 'node:crypto'
import { get } from '@vercel/blob'
import { findPreparedDemoAssetForFrameSku, PREPARED_DEMO_RESULT_MANIFEST } from '@/modules/store/infrastructure/prepared-demo/prepared-result-manifest'
import { readPreparedDemoResultAsset } from '@/modules/store/infrastructure/prepared-demo/prepared-result-asset-store'

jest.mock('@vercel/blob', () => ({ get: jest.fn() }))

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

  it('keeps Production fail-closed until an approved private storage key is configured', () => {
    expect(findPreparedDemoAssetForFrameSku('VT-DEMO-001', {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })).toBeNull()
    expect(findPreparedDemoAssetForFrameSku('VT-DEMO-002', {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })).toBeNull()
  })

  it('reads original approved Local PNG bytes and verifies their manifest checksums', async () => {
    for (const assetKey of [
      'visutry-demo-v1-vt-rowan-approved-local',
      'visutry-demo-v1-vt-lane-approved-local',
    ]) {
      const descriptor = PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === assetKey)!
      const result = await readPreparedDemoResultAsset(descriptor, {
        APP_ENV: 'local',
        VISUTRY_LOCAL_DEMO_RUNTIME: '1',
        VERCEL_ENV: undefined,
      })
      expect(result?.contentType).toBe('image/png')
      expect(result && createHash('sha256').update(result.body).digest('hex')).toBe(descriptor.assetSha256)
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

  it('does not expose an approved Local path in Production when no private key is configured', async () => {
    const descriptor = PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === 'visutry-demo-v1-vt-rowan-approved-local')!
    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })
    expect(result).toBeNull()
    expect(getBlob).not.toHaveBeenCalled()
  })

  it('uses private Blob storage for the same approved prepared-result contract in Production', async () => {
    const body = Buffer.from('approved private prepared result')
    const descriptor = {
      ...PREPARED_DEMO_RESULT_MANIFEST[0],
      assetClass: 'APPROVED_DEMO_OUTPUT' as const,
      assetSha256: createHash('sha256').update(body).digest('hex'),
      productionStorageKey: 'private/demo/prepared/rowan.webp',
      contentType: 'image/webp' as const,
  }
  getBlob.mockResolvedValue({
      stream: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: body })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
      blob: { contentType: 'image/webp' },
    } as unknown as Awaited<ReturnType<typeof get>>)

    const result = await readPreparedDemoResultAsset(descriptor, {
      APP_ENV: 'production',
      VERCEL_ENV: 'production',
    })
    expect(result).toMatchObject({ body, contentType: 'image/webp', expiresAt: null })
    expect(getBlob).toHaveBeenCalledWith('private/demo/prepared/rowan.webp', { access: 'private' })
  })
})
