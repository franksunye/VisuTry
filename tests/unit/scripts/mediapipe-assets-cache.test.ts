import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
type MediaPipeAsset = { relativePath: string; url: string; sha256: string }
type RuntimeEnv = Record<string, string | undefined>
type MediaPipeAssetModule = {
  MEDIAPIPE_VERSION: string
  PINNED_MEDIAPIPE_ASSETS: readonly MediaPipeAsset[]
  resolveVisuTryCacheDir: (env?: RuntimeEnv) => string
  resolveMediaPipeCacheRoot: (env?: RuntimeEnv) => string
  resolveMediaPipeVersionRoot: (env?: RuntimeEnv) => string
  verifyPinnedMediaPipeAssets: (options?: {
    env?: RuntimeEnv
    root?: string
    assets?: readonly MediaPipeAsset[]
  }) => Promise<{ root: string; ok: boolean; files: Array<Record<string, unknown>> }>
  ensurePinnedMediaPipeAssets: (options?: {
    env?: RuntimeEnv
    root?: string
    assets?: readonly MediaPipeAsset[]
    downloadAsset?: (asset: MediaPipeAsset) => Promise<Buffer>
  }) => Promise<{ root: string; files: Array<Record<string, unknown>> }>
}
const mediaPipeAssets = require('../../../scripts/lib/mediapipe-assets.cjs') as MediaPipeAssetModule

const {
  MEDIAPIPE_VERSION,
  PINNED_MEDIAPIPE_ASSETS,
  resolveVisuTryCacheDir,
  resolveMediaPipeCacheRoot,
  resolveMediaPipeVersionRoot,
  verifyPinnedMediaPipeAssets,
  ensurePinnedMediaPipeAssets,
} = mediaPipeAssets

describe('shared Local MediaPipe cache', () => {
  let temporaryRoot: string

  beforeEach(() => {
    temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'visutry-mediapipe-cache-'))
  })

  afterEach(() => {
    rmSync(temporaryRoot, { recursive: true, force: true })
  })

  it('uses the portable per-user cache contract and an absolute explicit override', () => {
    expect(resolveVisuTryCacheDir({ HOME: '/home/qa' })).toBe('/home/qa/.cache/visutry')
    expect(resolveVisuTryCacheDir({ HOME: '/home/qa', XDG_CACHE_HOME: '/var/cache/qa' }))
      .toBe('/var/cache/qa/visutry')
    expect(resolveVisuTryCacheDir({ HOME: '/home/qa', VISUTRY_LOCAL_CACHE_DIR: '/shared/visutry-cache' }))
      .toBe('/shared/visutry-cache')
    expect(() => resolveVisuTryCacheDir({ VISUTRY_LOCAL_CACHE_DIR: 'relative/cache' }))
      .toThrow('VISUTRY_LOCAL_CACHE_DIR must be an absolute path.')
    expect(resolveMediaPipeCacheRoot({ HOME: '/home/qa' }))
      .toBe(`/home/qa/.cache/visutry/mediapipe-assets`)
    expect(resolveMediaPipeVersionRoot({ HOME: '/home/qa' }))
      .toBe(`/home/qa/.cache/visutry/mediapipe-assets/${MEDIAPIPE_VERSION}`)
  })

  it('pins the exact runtime version and the three required assets', () => {
    expect(MEDIAPIPE_VERSION).toBe('0.10.35')
    expect(PINNED_MEDIAPIPE_ASSETS.map(({ relativePath }) => relativePath)).toEqual([
      'wasm/vision_wasm_internal.js',
      'wasm/vision_wasm_internal.wasm',
      'models/face_landmarker.task',
    ])
    expect(PINNED_MEDIAPIPE_ASSETS.map(({ sha256 }) => sha256)).toEqual([
      'e7fd9858e8e8f221d9b96eddc11f8e077f263e0b7bbd79d3cbe882b134274f8c',
      '6a5c64584c2ab61c763b6e204afbdbc7ce1caf7f5216187322bca8df94f646bc',
      '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
    ])
  })

  it('resolves the same shared cache from separate worktree directories', () => {
    const worktreeA = path.join(temporaryRoot, 'worktree-a')
    const worktreeB = path.join(temporaryRoot, 'worktree-b')
    mkdirSync(worktreeA)
    mkdirSync(worktreeB)
    const env = { HOME: path.join(temporaryRoot, 'home') }
    const originalCwd = process.cwd()

    try {
      process.chdir(worktreeA)
      const rootA = resolveMediaPipeVersionRoot(env)
      process.chdir(worktreeB)
      const rootB = resolveMediaPipeVersionRoot(env)
      expect(rootA).toBe(rootB)
      expect(rootA).not.toContain(worktreeA)
      expect(rootB).not.toContain(worktreeB)
    } finally {
      process.chdir(originalCwd)
    }
  })

  it('downloads once, atomically installs verified bytes, and reuses them without network access', async () => {
    const payload = Buffer.from('pinned test MediaPipe bytes')
    const assets = [{
      relativePath: 'wasm/test.bin',
      url: 'https://assets.invalid/test.bin',
      sha256: createHash('sha256').update(payload).digest('hex'),
    }]
    const env = { VISUTRY_LOCAL_CACHE_DIR: path.join(temporaryRoot, 'shared-cache') }
    const downloaded: string[] = []
    const downloader = jest.fn(async (asset: { url: string }) => {
      downloaded.push(asset.url)
      return payload
    })

    const first = await ensurePinnedMediaPipeAssets({ env, assets, downloadAsset: downloader })
    expect(first.files).toMatchObject([{ ok: true, action: 'downloaded', sha256: assets[0].sha256 }])
    expect(downloaded).toEqual([assets[0].url])
    expect(readFileSync(path.join(first.root, assets[0].relativePath))).toEqual(payload)

    const second = await ensurePinnedMediaPipeAssets({ env, assets, downloadAsset: downloader })
    expect(second.files).toMatchObject([{ ok: true, action: 'reused', sha256: assets[0].sha256 }])
    expect(downloader).toHaveBeenCalledTimes(1)
    expect(await verifyPinnedMediaPipeAssets({ env, root: first.root, assets })).toMatchObject({ ok: true })
  })

  it('repairs checksum-invalid cache files and refuses checksum drift without leaving partial files', async () => {
    const payload = Buffer.from('verified bytes')
    const invalid = Buffer.from('corrupted bytes')
    const asset = {
      relativePath: 'models/test.task',
      url: 'https://assets.invalid/test.task',
      sha256: createHash('sha256').update(payload).digest('hex'),
    }
    const env = { VISUTRY_LOCAL_CACHE_DIR: path.join(temporaryRoot, 'shared-cache') }
    const root = resolveMediaPipeVersionRoot(env)
    const destination = path.join(root, asset.relativePath)
    mkdirSync(path.dirname(destination), { recursive: true })
    writeFileSync(destination, invalid)

    await ensurePinnedMediaPipeAssets({ env, assets: [asset], downloadAsset: async () => payload })
    expect(readFileSync(destination)).toEqual(payload)

    writeFileSync(destination, invalid)
    await expect(ensurePinnedMediaPipeAssets({
      env,
      assets: [asset],
      downloadAsset: async () => Buffer.from('drifted upstream bytes'),
    })).rejects.toThrow('SHA-256 mismatch')
    expect(readFileSync(destination)).toEqual(invalid)
    expect(readdirSync(path.dirname(destination)).filter((name) => name.endsWith('.partial'))).toEqual([])
  })
})
