import { analyzeFaceLandmarks } from '@/lib/face-landmark-metrics'
import { FaceShapeFailureReason } from '@/config/face-analysis'
import { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const MEDIAPIPE_VERSION = '0.10.35'
const PRIMARY_WASM_ASSET_URL = '/mediapipe/wasm'
const FALLBACK_WASM_ASSET_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const PRIMARY_MODEL_ASSET_URL = '/mediapipe/models/face_landmarker.task'
const FALLBACK_MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const MAX_IMAGE_DETECTION_CACHE_ENTRIES = 8

type FaceLandmarkerDelegate = 'GPU' | 'CPU'
type FaceLandmarkerAssetSource = 'primary' | 'fallback'

type FaceLandmarkerInstance = {
  detect: (image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks?: FaceLandmarkPoint[][]
  }
}

class FaceLandmarkRuntimeError extends Error {
  reason: FaceShapeFailureReason

  constructor(reason: FaceShapeFailureReason, message: string) {
    super(message)
    this.name = 'FaceLandmarkRuntimeError'
    this.reason = reason
  }
}

class FaceImageDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FaceImageDecodeError'
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
      error instanceof Error ? `Face detector runtime failed: ${error.message}` : 'Face detector runtime failed.',
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
    if (cpuError instanceof FaceLandmarkRuntimeError) throw cpuError
    if (gpuError instanceof FaceLandmarkRuntimeError) throw gpuError
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
    }
  } finally {
    decodedImage?.close()
  }
}

async function decodeImageFile(file: File): Promise<DecodedImageSource> {
  if (!file || file.size === 0) {
    throw new FaceImageDecodeError('Image file is empty.')
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
      close: () => {
        image.onload = null
        image.onerror = null
        image.src = ''
      },
    }
  } catch (imageError) {
    const bitmapMessage = bitmapError instanceof Error ? bitmapError.message : 'bitmap decoder rejected the file'
    const imageMessage = imageError instanceof Error ? imageError.message : 'image element decoder rejected the file'
    throw new FaceImageDecodeError(`Image could not be decoded (${bitmapMessage}; fallback: ${imageMessage}).`)
  } finally {
    URL.revokeObjectURL(objectUrl)
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
