const { createHash, randomBytes } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { lstat, mkdir, readFile, rename, unlink, writeFile } = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const MEDIAPIPE_VERSION = '0.10.35'
const PINNED_MEDIAPIPE_ASSETS = Object.freeze([
  Object.freeze({
    relativePath: 'wasm/vision_wasm_internal.js',
    url: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm/vision_wasm_internal.js`,
    sha256: 'e7fd9858e8e8f221d9b96eddc11f8e077f263e0b7bbd79d3cbe882b134274f8c',
  }),
  Object.freeze({
    relativePath: 'wasm/vision_wasm_internal.wasm',
    url: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm/vision_wasm_internal.wasm`,
    sha256: '6a5c64584c2ab61c763b6e204afbdbc7ce1caf7f5216187322bca8df94f646bc',
  }),
  Object.freeze({
    relativePath: 'models/face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    sha256: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
  }),
])

function requireAbsolute(value, name) {
  if (!path.isAbsolute(value)) throw new Error(`${name} must be an absolute path.`)
  return path.resolve(value)
}

function resolveVisuTryCacheDir(env = process.env) {
  const override = env.VISUTRY_LOCAL_CACHE_DIR?.trim()
  if (override) return requireAbsolute(override, 'VISUTRY_LOCAL_CACHE_DIR')

  const xdgCacheHome = env.XDG_CACHE_HOME?.trim()
  if (xdgCacheHome) return path.join(requireAbsolute(xdgCacheHome, 'XDG_CACHE_HOME'), 'visutry')

  const home = env.HOME?.trim() || os.homedir()
  return path.join(requireAbsolute(home, 'HOME'), '.cache', 'visutry')
}

function resolveMediaPipeCacheRoot(env = process.env) {
  return path.join(resolveVisuTryCacheDir(env), 'mediapipe-assets')
}

function resolveMediaPipeVersionRoot(env = process.env) {
  return path.join(resolveMediaPipeCacheRoot(env), MEDIAPIPE_VERSION)
}

async function verifyAsset(root, asset) {
  const filePath = path.resolve(root, asset.relativePath)
  if (!filePath.startsWith(`${path.resolve(root)}${path.sep}`)) {
    return { relativePath: asset.relativePath, ok: false, reason: 'path escapes cache root' }
  }

  try {
    const info = await lstat(filePath)
    if (!info.isFile() || info.size === 0) {
      return { relativePath: asset.relativePath, ok: false, reason: 'missing, non-file, or empty' }
    }
    const bytes = await readFile(filePath)
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    if (sha256 !== asset.sha256) {
      return { relativePath: asset.relativePath, ok: false, reason: 'SHA-256 mismatch', sha256 }
    }
    return { relativePath: asset.relativePath, ok: true, bytes: info.size, sha256 }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { relativePath: asset.relativePath, ok: false, reason: 'missing' }
    }
    throw error
  }
}

async function verifyPinnedMediaPipeAssets({ env = process.env, root = resolveMediaPipeVersionRoot(env), assets = PINNED_MEDIAPIPE_ASSETS } = {}) {
  const files = await Promise.all(assets.map((asset) => verifyAsset(root, asset)))
  return { root, ok: files.every((file) => file.ok), files }
}

async function defaultDownload(asset) {
  try {
    const response = await fetch(asset.url, { redirect: 'follow' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.warn(`Node fetch failed for pinned MediaPipe asset; retrying with curl -4 (${error.message})`)
    return execFileSync('curl', ['-4', '-L', '--fail', '--silent', '--show-error', asset.url], {
      maxBuffer: 64 * 1024 * 1024,
    })
  }
}

async function ensurePinnedMediaPipeAssets({
  env = process.env,
  root = resolveMediaPipeVersionRoot(env),
  assets = PINNED_MEDIAPIPE_ASSETS,
  downloadAsset = defaultDownload,
} = {}) {
  const results = []
  for (const asset of assets) {
    const existing = await verifyAsset(root, asset)
    if (existing.ok) {
      results.push({ ...existing, action: 'reused' })
      continue
    }

    const destination = path.resolve(root, asset.relativePath)
    await mkdir(path.dirname(destination), { recursive: true })
    const temporaryDestination = `${destination}.${process.pid}.${randomBytes(8).toString('hex')}.partial`
    try {
      const bytes = Buffer.from(await downloadAsset(asset))
      if (bytes.byteLength === 0) throw new Error(`Downloaded pinned MediaPipe asset is empty: ${asset.relativePath}`)
      await writeFile(temporaryDestination, bytes, { flag: 'wx', mode: 0o644 })
      const stagedBytes = await readFile(temporaryDestination)
      const sha256 = createHash('sha256').update(stagedBytes).digest('hex')
      if (sha256 !== asset.sha256) {
        throw new Error(`SHA-256 mismatch for ${asset.relativePath}: expected ${asset.sha256}, received ${sha256}`)
      }
      await rename(temporaryDestination, destination)
      const verified = await verifyAsset(root, asset)
      if (!verified.ok) throw new Error(`Pinned MediaPipe asset failed verification after atomic install: ${asset.relativePath}`)
      results.push({ ...verified, action: 'downloaded' })
    } finally {
      await unlink(temporaryDestination).catch(() => {})
    }
  }
  return { root, files: results }
}

module.exports = {
  MEDIAPIPE_VERSION,
  PINNED_MEDIAPIPE_ASSETS,
  resolveVisuTryCacheDir,
  resolveMediaPipeCacheRoot,
  resolveMediaPipeVersionRoot,
  verifyPinnedMediaPipeAssets,
  ensurePinnedMediaPipeAssets,
}
