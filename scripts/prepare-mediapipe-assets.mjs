import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const version = '0.10.35'
const outputRoot = resolve(process.cwd(), '.local/mediapipe-assets', version)
const assets = [
  {
    relativePath: 'wasm/vision_wasm_internal.js',
    url: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${version}/wasm/vision_wasm_internal.js`,
    sha256: 'e7fd9858e8e8f221d9b96eddc11f8e077f263e0b7bbd79d3cbe882b134274f8c',
  },
  {
    relativePath: 'wasm/vision_wasm_internal.wasm',
    url: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${version}/wasm/vision_wasm_internal.wasm`,
    sha256: '6a5c64584c2ab61c763b6e204afbdbc7ce1caf7f5216187322bca8df94f646bc',
  },
  {
    relativePath: 'models/face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    sha256: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
  },
]

async function download(url) {
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.warn(`Node fetch failed for ${url}; retrying with curl -4 (${error.message})`)
    return execFileSync('curl', ['-4', '-L', '--fail', '--silent', '--show-error', url], {
      maxBuffer: 64 * 1024 * 1024,
    })
  }
}

for (const asset of assets) {
  const bytes = await download(asset.url)
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== asset.sha256) {
    throw new Error(`SHA-256 mismatch for ${asset.relativePath}: expected ${asset.sha256}, received ${digest}`)
  }
  const destination = resolve(outputRoot, asset.relativePath)
  const temporaryDestination = `${destination}.partial`
  await mkdir(dirname(destination), { recursive: true })
  try {
    await writeFile(temporaryDestination, bytes)
    await rename(temporaryDestination, destination)
  } catch (error) {
    await unlink(temporaryDestination).catch(() => {})
    throw error
  }
  console.log(`${asset.relativePath}\t${bytes.byteLength} bytes\tsha256=${digest}\tfrom=${asset.url}`)
}

console.log(`Local MediaPipe assets written to ${outputRoot}`)
