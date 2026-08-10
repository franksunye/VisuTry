import { analyzeFaceLandmarks } from '@/lib/face-landmark-metrics'
import { FaceShapeFailureReason } from '@/config/face-analysis'
import { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const MEDIAPIPE_VERSION = '0.10.35'
const WASM_ASSET_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

type FaceLandmarkerDelegate = 'GPU' | 'CPU'

type FaceLandmarkerInstance = {
  detect: (image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks?: FaceLandmarkPoint[][]
  }
}

const landmarkerPromises: Partial<Record<FaceLandmarkerDelegate, Promise<FaceLandmarkerInstance>>> = {}
let visionPromise: Promise<typeof import('@mediapipe/tasks-vision')> | null = null

function loadVisionTasks() {
  if (!visionPromise) {
    visionPromise = import('@mediapipe/tasks-vision')
  }
  return visionPromise
}

async function getFaceLandmarker(delegate: FaceLandmarkerDelegate): Promise<FaceLandmarkerInstance> {
  if (!landmarkerPromises[delegate]) {
    landmarkerPromises[delegate] = loadVisionTasks().then(async (vision) => {
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_ASSET_URL)
      return (await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_URL,
          delegate,
        },
        runningMode: 'IMAGE' as const,
        numFaces: 2,
      })) as FaceLandmarkerInstance
    })
  }

  return landmarkerPromises[delegate]!
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
  const result = landmarker.detect(image)
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
    // Preserve the CPU error when both paths fail because it reflects the
    // final fallback attempt. If GPU failed but CPU returned zero faces,
    // detectWithDelegate returns null and the caller correctly classifies
    // the result as a detection miss rather than a model-load failure.
    if (cpuError) throw cpuError
    if (gpuError) throw gpuError
    throw new Error('Face landmark detection failed on both GPU and CPU.')
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
    bitmap = await createImageBitmap(file)
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
    return {
      geometry: unavailableGeometry(
        'model_load_failed',
        error instanceof Error
          ? `Face landmark detection failed: ${error.message}`
          : 'Face landmark detection failed.',
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
