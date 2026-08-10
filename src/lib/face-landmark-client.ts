import { analyzeFaceLandmarks } from '@/lib/face-landmark-metrics'
import { FaceShapeFailureReason } from '@/config/face-analysis'
import { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const MEDIAPIPE_VERSION = '0.10.35'
const PRIMARY_WASM_ASSET_URL = '/mediapipe/wasm'
const FALLBACK_WASM_ASSET_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const PRIMARY_MODEL_ASSET_URL = '/mediapipe/models/face_landmarker.task'
const FALLBACK_MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

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

const landmarkerPromises: Partial<Record<string, Promise<FaceLandmarkerInstance>>> = {}
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

export async function detectFaceLandmarksFromImage(
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

export async function analyzeFaceLandmarkFile(file: File): Promise<FaceLandmarkFileResult> {
  if (typeof window === 'undefined' || typeof createImageBitmap === 'undefined') {
    return {
      geometry: unavailableGeometry('unsupported_browser', 'Face landmark detection is not available in this browser.'),
      detection: null,
    }
  }

  let bitmap: ImageBitmap | null = null
  try {
    try {
      bitmap = await createImageBitmap(file)
    } catch (error) {
      return {
        geometry: unavailableGeometry(
          'image_decode_failed',
          error instanceof Error ? `Image could not be decoded: ${error.message}` : 'Image could not be decoded.',
        ),
        detection: null,
      }
    }

    const detection = await detectFaceLandmarksFromImage(bitmap)
    return {
      geometry: analyzeFaceLandmarks(detection?.landmarks, {
        faceCount: detection?.faceCount ?? 0,
        imageWidth: bitmap.width,
        imageHeight: bitmap.height,
      }),
      detection,
    }
  } catch (error) {
    const reason = error instanceof FaceLandmarkRuntimeError ? error.reason : 'unknown'
    return {
      geometry: unavailableGeometry(
        reason,
        error instanceof Error ? error.message : 'Face landmark detection failed.',
      ),
      detection: null,
    }
  } finally {
    bitmap?.close()
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
