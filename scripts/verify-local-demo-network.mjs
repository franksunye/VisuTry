import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { build } from 'esbuild'

const root = process.cwd()
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/assets/local-demo/visutry-demo-catalog-v1.json'), 'utf8'))
const appOrigin = 'http://127.0.0.1:3001'
const mediaPipeOrigin = 'http://127.0.0.1:4100'
const storeUrl = `${appOrigin}/en/store/visutry-demo-optical`
const allowedOrigins = new Set([appOrigin, mediaPipeOrigin])
const traffic = []
const blockedExternal = []
const unexpectedLocal = []
const consoleErrors = []
const runtimeInfo = []
const pageErrors = []
const webSockets = []

function describeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return { protocol: url.protocol, host: url.host, path: url.pathname }
  } catch {
    return { protocol: 'unknown', host: 'unknown', path: 'unknown' }
  }
}

function bucket(rawUrl) {
  const { host, protocol } = describeUrl(rawUrl)
  if (protocol === 'http:' && host === '127.0.0.1:3001') return 'LOCAL_APP'
  if (protocol === 'http:' && host === '127.0.0.1:4100') return 'LOCAL_MEDIAPIPE'
  return 'UNEXPECTED_EXTERNAL'
}

async function buildFaceRuntimeProbe() {
  const entry = `
    import { analyzeFaceLandmarkFile } from '../src/lib/face-landmark-client'
    ;(window).__visutryLocalFaceProbe = (file) => analyzeFaceLandmarkFile(file)
  `
  const result = await build({
    stdin: { contents: entry, resolveDir: path.join(root, 'scripts'), sourcefile: 'local-face-probe.ts', loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    write: false,
    logLevel: 'silent',
    define: {
      'process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL': JSON.stringify(`${mediaPipeOrigin}/0.10.35/wasm`),
      'process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_URL': JSON.stringify(`${mediaPipeOrigin}/0.10.35/models/face_landmarker.task`),
    },
    plugins: [{
      name: 'visutry-src-alias',
      setup(builder) {
        builder.onResolve({ filter: /^@\// }, (args) => {
          const basePath = path.join(root, 'src', args.path.slice(2))
          const candidate = [basePath, ...['.ts', '.tsx', '.js', '.jsx', '.json'].map((extension) => `${basePath}${extension}`)]
            .find((value) => fs.existsSync(value))
          return candidate ? { path: candidate } : { errors: [{ text: `Unable to resolve source alias ${args.path}` }] }
        })
      },
    }],
  })
  return result.outputFiles[0].text
}

if (process.env.VERCEL_ENV || (process.env.APP_ENV && process.env.APP_ENV !== 'local')) {
  throw new Error('Refusing network verification outside the Local environment.')
}
if (manifest.demoOnly !== true || manifest.forSale !== false || manifest.items.length !== 10) {
  throw new Error('Local demo manifest did not meet the non-sale 10-product contract.')
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ serviceWorkers: 'block' })
  await context.route('**/*', async (route) => {
    const request = route.request()
    const info = describeUrl(request.url())
    const target = bucket(request.url())
    traffic.push({ bucket: target, method: request.method(), host: info.host, path: info.path })
    if (allowedOrigins.has(`${info.protocol}//${info.host}`)) {
      await route.continue()
    } else {
      blockedExternal.push({ host: info.host, path: info.path })
      await route.abort('blockedbyclient')
    }
  })

  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text().slice(0, 240)
    if (text.startsWith('INFO: Created TensorFlow Lite XNNPACK delegate')) runtimeInfo.push(text)
    else consoleErrors.push(text)
  })
  page.on('pageerror', (error) => pageErrors.push(error.message.slice(0, 240)))
  page.on('websocket', (socket) => {
    const info = describeUrl(socket.url())
    webSockets.push({ host: info.host, path: info.path })
    if (info.host !== '127.0.0.1:3001') unexpectedLocal.push({ kind: 'WEBSOCKET', ...info })
  })

  const storeResponse = await page.goto(storeUrl, { waitUntil: 'networkidle', timeout: 45_000 })
  if (!storeResponse || storeResponse.status() !== 200) {
    throw new Error(`Demo Store failed to load (HTTP ${storeResponse?.status() ?? 'no response'}).`)
  }
  const storePage = await page.evaluate(() => ({
    title: document.title,
    bodyHasDemo: document.body.innerText.includes('VisuTry Demo Optical'),
    frameImageCount: Array.from(document.images).filter((image) => image.alt.startsWith('VT ')).length,
    loadedFrameImageCount: Array.from(document.images).filter((image) => image.alt.startsWith('VT ') && image.complete && image.naturalWidth > 0).length,
  }))

  const assetChecks = await page.evaluate(async (items) => Promise.all(items.map(async (item) => {
    const response = await fetch(item.assetPath, { method: 'HEAD', cache: 'no-store' })
    return { sku: item.sku, status: response.status }
  })), manifest.items)

  const probeBundle = await buildFaceRuntimeProbe()
  await page.addScriptTag({ type: 'module', content: probeBundle })
  await page.waitForFunction(() => typeof (window).__visutryLocalFaceProbe === 'function')
  const faceRuntime = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 640
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable for synthetic runtime initialization probe.')
    context.fillStyle = '#e5e7eb'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#334155'
    for (let index = 0; index < 80; index += 1) {
      const x = (index * 67) % canvas.width
      const y = (index * 103) % canvas.height
      context.fillRect(x, y, 11, 7)
    }
    const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Synthetic canvas encoding failed.')), 'image/png'))
    const file = new File([blob], 'synthetic-local-runtime-check.png', { type: 'image/png' })
    const result = await (window).__visutryLocalFaceProbe(file)
    const modelInitialized = Boolean(result.detection) || result.geometry.failureReason === 'no_face'
    return {
      initialized: modelInitialized,
      geometryStatus: result.geometry.status,
      failureReason: result.geometry.failureReason ?? null,
      detectedFaceCount: result.detection?.faceCount ?? 0,
      usedLocalInputOnly: true,
      uploaded: false,
    }
  })

  const counts = traffic.reduce((acc, request) => ({ ...acc, [request.bucket]: (acc[request.bucket] || 0) + 1 }), {})
  const localAssetFailures = assetChecks.filter((asset) => asset.status !== 200)
  const unexpectedRequests = traffic.filter((request) => request.bucket === 'UNEXPECTED_EXTERNAL')
  const result = {
    environment: 'LOCAL',
    store: { url: storeUrl, status: storeResponse.status(), ...storePage },
    frameAssets: { checked: assetChecks.length, passed: assetChecks.length - localAssetFailures.length, failures: localAssetFailures },
    faceIntelligence: faceRuntime,
    network: {
      requestCounts: counts,
      externalRequestsBlocked: blockedExternal.length,
      blockedExternalHosts: [...new Set(blockedExternal.map((request) => request.host))],
      unexpectedRequests: unexpectedRequests.length + unexpectedLocal.length,
      externalWebSockets: webSockets.filter((socket) => socket.host !== '127.0.0.1:3001').length,
      grsaiGeminiBlobAnalyticsRequests: traffic.filter((request) => /grsai|gemini|vercel-storage|google-analytics|googletagmanager|axiom/i.test(request.host)).length,
    },
    browser: { consoleErrors, runtimeInfo, pageErrors },
    shopperSessionCreated: false,
    tryOnRequested: false,
    screenshotCaptured: false,
  }
  console.log(JSON.stringify(result, null, 2))

  if (storePage.frameImageCount !== 10 || storePage.loadedFrameImageCount !== 10
    || localAssetFailures.length || !faceRuntime.initialized
    || blockedExternal.length || unexpectedRequests.length || unexpectedLocal.length
    || consoleErrors.length || pageErrors.length) {
    process.exitCode = 1
  }
  await context.close()
} finally {
  await browser.close()
}
