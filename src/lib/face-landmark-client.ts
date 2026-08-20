import { analyzeFaceLandmarks } from '@/lib/face-landmark-metrics'
import { FaceShapeFailureReason } from '@/config/face-analysis'
import { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const MEDIAPIPE_VERSION = '0.10.35'
const FALLBACK_WASM_ASSET_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const FALLBACK_MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const MAX_IMAGE_DETECTION_CACHE_ENTRIES = 8

export type MediaPipeAssetUrlConfig = {
  wasmBaseUrl?: string
  modelUrl?: string
}

export function resolveMediaPipeAssetUrls(
  config: MediaPipeAssetUrlConfig = {
    wasmBaseUrl: process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL,
    modelUrl: process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_URL,
  },
) {
  const wasmBaseUrl = config.wasmBaseUrl?.trim().replace(/\/+$/, '')
  const modelUrl = config.modelUrl?.trim().replace(/\/+$/, '')

  return {
    wasm: wasmBaseUrl || '/mediapipe/wasm',
    model: modelUrl || '/mediapipe/models/face_landmarker.task',
  }
}

const PRIMARY_ASSET_URLS = resolveMediaPipeAssetUrls()
const PRIMARY_WASM_ASSET_URL = PRIMARY_ASSET_URLS.wasm
const PRIMARY_MODEL_ASSET_URL = PRIMARY_ASSET_URLS.model

type FaceLandmarkerDelegate = 'GPU' | 'CPU'
type FaceLandmarkerAssetSource = 'primary' | 'fallback'

type FaceLandmarkerInstance = {
  detect: (image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks?: FaceLandmarkPoint[][]
  }
}

export type FaceRuntimeDiagnostics = {
  gpuRuntimeErrorName?: string
  gpuRuntimeErrorMessage?: string
  cpuRuntimeErrorName?: string
  cpuRuntimeErrorMessage?: string
}

class FaceLandmarkRuntimeError extends Error {
  reason: FaceShapeFailureReason
  runtimeDiagnostics?: FaceRuntimeDiagnostics

  constructor(
    reason: FaceShapeFailureReason,
    message: string,
    runtimeDiagnostics?: FaceRuntimeDiagnostics,
  ) {
    super(message)
    this.name = 'FaceLandmarkRuntimeError'
    this.reason = reason
    this.runtimeDiagnostics = runtimeDiagnostics
  }
}

export type FaceImageDecodeDiagnostics = {
  detectedFileFormat?: string
  bitmapDecodeErrorName?: string
  bitmapDecodeErrorMessage?: string
  htmlImageDecodeErrorName?: string
  htmlImageDecodeErrorMessage?: string
  // Runtime diagnostics share the existing failure-diagnostics envelope so
  // callers can forward one privacy-safe object without changing the user flow.
  gpuRuntimeErrorName?: string
  gpuRuntimeErrorMessage?: string
  cpuRuntimeErrorName?: string
  cpuRuntimeErrorMessage?: string
}

class FaceImageDecodeError extends Error {
  diagnostics: FaceImageDecodeDiagnostics

  constructor(message: string, diagnostics: FaceImageDecodeDiagnostics = {}) {
    super(message)
    this.name = 'FaceImageDecodeError'
    this.diagnostics = diagnostics
  }
}

type DecodedImageSource = {
  image: ImageBitmap | HTMLImageElement
  width: number
  height: number
  close: () => void
}

const landmarkerPromises: Partial<Record<string, Promise<FaceLandmarkerInstance>>> = {}
const imageDetectionPromises = new Map<string, Promise<FaceLandmarkDetectionResult | null>>()
let visionPromise: Promise<typeof import('@mediapipe/tasks-vision')> | null = null

function loadVisionTasks() {
  if (!visionPromise) {
    visionPromise = import('@mediapipe/tasks-vision')
  }
  return visionPromise
}

function assetUrls(source: FaceLandmarkerAssetSource) {
  return source === 'primary'
    ? { wasm: PRIMARY_WASM_ASSET_URL, model: PRIMARY_MODEL_ASSET_URL }
    : { wasm: FALLBACK_WASM_ASSET_URL, model: FALLBACK_MODEL_ASSET_URL }
}

function normalizeRuntimeError(error: unknown) {
  const name = error instanceof Error && error.name ? error.name.slice(0, 64) : 'UnknownError'
  const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''

  let message = 'other'
  if (rawMessage.includes('context lost') || rawMessage.includes('webgl')) message = 'graphics_context_error'
  else if (rawMessage.includes('wasm') || rawMessage.includes('webassembly')) message = 'wasm_runtime_error'
  else if (rawMessage.includes('memory') || rawMessage.includes('allocation')) message = 'memory_error'
  else if (rawMessage.includes('unsupported') || rawMessage.includes('not supported')) message = 'unsupported_runtime'
  else if (rawMessage.includes('abort')) message = 'aborted'
  else if (rawMessage.includes('invalid') || rawMessage.includes('tensor')) message = 'invalid_runtime_input'
  else if (rawMessage.includes('assert') || rawMessage.includes('internal')) message = 'internal_runtime_error'

  return { name, message }
}

function diagnosticsForDelegate(
  delegate: FaceLandmarkerDelegate,
  error: unknown,
): FaceRuntimeDiagnostics {
  const normalized = normalizeRuntimeError(error)
  return delegate === 'GPU'
    ? {
        gpuRuntimeErrorName: normalized.name,
        gpuRuntimeErrorMessage: normalized.message,
      }
    : {
        cpuRuntimeErrorName: normalized.name,
        cpuRuntimeErrorMessage: normalized.message,
      }
}

function mergeRuntimeDiagnostics(
  ...errors: unknown[]
): FaceRuntimeDiagnostics | undefined {
  const merged: FaceRuntimeDiagnostics = {}
  for (const error of errors) {
    if (error instanceof FaceLandmarkRuntimeError && error.runtimeDiagnostics) {
      Object.assign(merged, error.runtimeDiagnostics)
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}

async function createFaceLandmarker(
  delegate: FaceLandmarkerDelegate,
  source: FaceLandmarkerAssetSource,
): Promise<FaceLandmarkerInstance> {
  const vision = await loadVisionTasks()
  const urls = assetUrls(source)

  let fileset: Awaited<ReturnType<typeof vision.FilesetResolver.forVisionTasks>>
  try {
    fileset = await vision.FilesetResolver.forVisionTasks(urls.wasm)
  } catch (error) {
    throw new FaceLandmarkRuntimeError(
      'wasm_load_failed',
      error instanceof Error ? `MediaPipe WASM failed to load: ${error.message}` : 'MediaPipe WASM failed to load.',
    )
  }

  try {
    return (await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: urls.model,
        delegate,
      },
      runningMode: 'IMAGE' as const,
      numFaces: 2,
    })) as FaceLandmarkerInstance
  } catch (error) {
    throw new FaceLandmarkRuntimeError(
      'runtime_init_failed',
      error instanceof Error
        ? `Face detector initialization failed: ${error.message}`
        : 'Face detector initialization failed.',
    )
  }
}

async function getFaceLandmarker(delegate: FaceLandmarkerDelegate): Promise<FaceLandmarkerInstance> {
  const key = `${delegate}:resilient`
  if (!landmarkerPromises[key]) {
    landmarkerPromises[key] = (async () => {
      try {
        return await createFaceLandmarker(delegate, 'primary')
      } catch (primaryError) {
        try {
          return await createFaceLandmarker(delegate, 'fallback')
        } catch (fallbackError) {
          if (fallbackError instanceof FaceLandmarkRuntimeError) throw fallbackError
          if (primaryError instanceof FaceLandmarkRuntimeError) throw primaryError
          throw fallbackError
        }
      }
    })()
  }

  return landmarkerPromises[key]!
}

export interface FaceLandmarkDetectionResult {
  landmarks: FaceLandmarkPoint[]
  faceCount: number
  delegate: FaceLandmarkerDelegate
  fallbackUsed: boolean
  connections: {
    tesselation: Array<{ start: number; end: number }>
    contours: Array<{ start: number; end: number }>
    irises: Array<{ start: number; end: number }>
  }
}

export interface FaceLandmarkFileResult {
  geometry: FaceGeometryAnalysis
  detection: FaceLandmarkDetectionResult | null
  decodeDiagnostics?: FaceImageDecodeDiagnostics
}

async function detectWithDelegate(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
  delegate: FaceLandmarkerDelegate,
  fallbackUsed: boolean,
): Promise<FaceLandmarkDetectionResult | null> {
  const [vision, landmarker] = await Promise.all([loadVisionTasks(), getFaceLandmarker(delegate)])

  let result: ReturnType<FaceLandmarkerInstance['detect']>
  try {
    result = landmarker.detect(image)
  } catch (error) {
    throw new FaceLandmarkRuntimeError(
      'runtime_failed',
      'Face detector runtime failed.',
      diagnosticsForDelegate(delegate, error),
    )
  }

  const faces = result.faceLandmarks ?? []
  const firstFace = faces[0]
  if (!firstFace) return null

  const FaceLandmarker = vision.FaceLandmarker as unknown as {
    FACE_LANDMARKS_TESSELATION?: Array<{ start: number; end: number }>
    FACE_LANDMARKS_CONTOURS?: Array<{ start: number; end: number }>
    FACE_LANDMARKS_IRISES?: Array<{ start: number; end: number }>
  }

  return {
    landmarks: firstFace,
    faceCount: faces.length,
    delegate,
    fallbackUsed,
    connections: {
      tesselation: FaceLandmarker.FACE_LANDMARKS_TESSELATION ?? [],
      contours: FaceLandmarker.FACE_LANDMARKS_CONTOURS ?? [],
      irises: FaceLandmarker.FACE_LANDMARKS_IRISES ?? [],
    },
  }
}

async function detectFaceLandmarksUncached(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
): Promise<FaceLandmarkDetectionResult | null> {
  let gpuError: unknown = null

  try {
    const gpuDetection = await detectWithDelegate(image, 'GPU', false)
    if (gpuDetection) return gpuDetection
  } catch (error) {
    gpuError = error
  }

  try {
    return await detectWithDelegate(image, 'CPU', true)
  } catch (cpuError) {
    const runtimeDiagnostics = mergeRuntimeDiagnostics(gpuError, cpuError)

    if (cpuError instanceof FaceLandmarkRuntimeError) {
      if (cpuError.reason === 'runtime_failed' && runtimeDiagnostics) {
        throw new FaceLandmarkRuntimeError('runtime_failed', cpuError.message, runtimeDiagnostics)
      }
      throw cpuError
    }
    if (gpuError instanceof FaceLandmarkRuntimeError) {
      if (gpuError.reason === 'runtime_failed' && runtimeDiagnostics) {
        throw new FaceLandmarkRuntimeError('runtime_failed', gpuError.message, runtimeDiagnostics)
      }
      throw gpuError
    }
    throw cpuError
  }
}

function getImageDetectionCacheKey(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
): string | null {
  if (typeof HTMLImageElement === 'undefined' || !(image instanceof HTMLImageElement)) {
    return null
  }

  return image.currentSrc || image.src || null
}

function rememberImageDetection(
  key: string,
  promise: Promise<FaceLandmarkDetectionResult | null>,
) {
  if (imageDetectionPromises.size >= MAX_IMAGE_DETECTION_CACHE_ENTRIES) {
    const oldestKey = imageDetectionPromises.keys().next().value
    if (oldestKey) imageDetectionPromises.delete(oldestKey)
  }
  imageDetectionPromises.set(key, promise)
}

export async function detectFaceLandmarksFromImage(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
): Promise<FaceLandmarkDetectionResult | null> {
  const cacheKey = getImageDetectionCacheKey(image)
  if (!cacheKey) {
    return detectFaceLandmarksUncached(image)
  }

  const cached = imageDetectionPromises.get(cacheKey)
  if (cached) return cached

  const detectionPromise = detectFaceLandmarksUncached(image)
  rememberImageDetection(cacheKey, detectionPromise)

  try {
    return await detectionPromise
  } catch (error) {
    imageDetectionPromises.delete(cacheKey)
    throw error
  }
}

export async function analyzeFaceLandmarkFile(file: File): Promise<FaceLandmarkFileResult> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return {
      geometry: unavailableGeometry('unsupported_browser', 'Face landmark detection is not available in this browser.'),
      detection: null,
    }
  }

  let decodedImage: DecodedImageSource | null = null
  try {
    decodedImage = await decodeImageFile(file)

    const detection = await detectFaceLandmarksFromImage(decodedImage.image)
    return {
      geometry: analyzeFaceLandmarks(detection?.landmarks, {
        faceCount: detection?.faceCount ?? 0,
        imageWidth: decodedImage.width,
        imageHeight: decodedImage.height,
      }),
      detection,
    }
  } catch (error) {
    const reason = error instanceof FaceLandmarkRuntimeError
      ? error.reason
      : error instanceof FaceImageDecodeError
        ? 'image_decode_failed'
        : 'unknown'
    return {
      geometry: unavailableGeometry(
        reason,
        error instanceof Error ? error.message : 'Face landmark detection failed.',
      ),
      detection: null,
      ...(error instanceof FaceImageDecodeError
        ? { decodeDiagnostics: error.diagnostics }
        : error instanceof FaceLandmarkRuntimeError && error.runtimeDiagnostics
          ? { decodeDiagnostics: error.runtimeDiagnostics }
          : {}),
    }
  } finally {
    decodedImage?.close()
  }
}

function normalizedError(error: unknown) {
  const name = error instanceof Error && error.name ? error.name.slice(0, 64) : 'UnknownError'
  const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''

  let message = 'other'
  if (rawMessage.includes('unsupported')) message = 'unsupported_image'
  else if (rawMessage.includes('decode')) message = 'decode_failed'
  else if (rawMessage.includes('invalid')) message = 'invalid_image'
  else if (rawMessage.includes('dimension')) message = 'invalid_dimensions'
  else if (rawMessage.includes('abort')) message = 'aborted'
  else if (rawMessage.includes('memory')) message = 'memory_error'

  return { name, message }
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  const blobWithArrayBuffer = blob as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> }
  if (typeof blobWithArrayBuffer.arrayBuffer === 'function') {
    return new Uint8Array(await blobWithArrayBuffer.arrayBuffer())
  }

  if (typeof FileReader !== 'undefined') {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result))
        } else {
          reject(new Error('FileReader returned an unexpected result.'))
        }
      }
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed.'))
      reader.readAsArrayBuffer(blob)
    })
  }

  throw new Error('Blob byte reading is unavailable.')
}

async function detectFileFormat(file: File): Promise<string> {
  try {
    const bytes = await readBlobBytes(file.slice(0, 32))
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    ) return 'png'
    if (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    ) return 'webp'
    if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp') {
      const brand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase()
      if (brand === 'avif' || brand === 'avis') return 'avif'
      if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) return 'heic'
      if (['mif1', 'msf1'].includes(brand)) return 'heif'
      return `iso-bmff:${brand}`
    }
    if (bytes.length >= 6) {
      const signature = String.fromCharCode(...bytes.slice(0, 6))
      if (signature === 'GIF87a' || signature === 'GIF89a') return 'gif'
    }
    return 'unknown'
  } catch {
    return 'unavailable'
  }
}

async function decodeImageFile(file: File): Promise<DecodedImageSource> {
  const detectedFileFormat = await detectFileFormat(file)
  if (!file || file.size === 0) {
    throw new FaceImageDecodeError('Image file is empty.', { detectedFileFormat })
  }

  let bitmapError: unknown
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch (error) {
      bitmapError = error
    }
  } else {
    bitmapError = new Error('createImageBitmap is unavailable')
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'

  const releaseObjectUrl = () => {
    image.onload = null
    image.onerror = null
    image.src = ''
    URL.revokeObjectURL(objectUrl)
  }

  try {
    if (typeof image.decode === 'function') {
      image.src = objectUrl
      await image.decode()
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Image element could not be decoded.'))
        image.src = objectUrl
      })
    }

    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (!width || !height) {
      throw new Error('Decoded image has no dimensions.')
    }

    return {
      image,
      width,
      height,
      close: releaseObjectUrl,
    }
  } catch (imageError) {
    releaseObjectUrl()
    const bitmap = normalizedError(bitmapError)
    const htmlImage = normalizedError(imageError)
    throw new FaceImageDecodeError(
      `Image could not be decoded (${bitmap.message}; fallback: ${htmlImage.message}).`,
      {
        detectedFileFormat,
        bitmapDecodeErrorName: bitmap.name,
        bitmapDecodeErrorMessage: bitmap.message,
        htmlImageDecodeErrorName: htmlImage.name,
        htmlImageDecodeErrorMessage: htmlImage.message,
      },
    )
  }
}

export async function analyzeFaceGeometryFromFile(file: File): Promise<FaceGeometryAnalysis> {
  const { geometry } = await analyzeFaceLandmarkFile(file)
  return geometry
}

function unavailableGeometry(
  reason: FaceShapeFailureReason,
  message: string,
): FaceGeometryAnalysis {
  return {
    version: 'landmark-v1',
    status: 'unavailable',
    source: 'ai-fallback',
    faceDetected: false,
    faceCount: 0,
    qualityScore: 0,
    signals: [],
    warnings: [message],
    failureReason: reason,
  }
}
