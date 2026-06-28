import { analyzeFaceLandmarks } from '@/lib/face-landmark-metrics'
import { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const MEDIAPIPE_VERSION = '0.10.35'
const WASM_ASSET_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

type FaceLandmarkerInstance = {
  detect: (image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks?: FaceLandmarkPoint[][]
  }
}

let landmarkerPromise: Promise<FaceLandmarkerInstance> | null = null
let visionPromise: Promise<typeof import('@mediapipe/tasks-vision')> | null = null

function loadVisionTasks() {
  if (!visionPromise) {
    visionPromise = import('@mediapipe/tasks-vision')
  }
  return visionPromise
}

async function getFaceLandmarker(): Promise<FaceLandmarkerInstance> {
  if (!landmarkerPromise) {
    landmarkerPromise = loadVisionTasks().then(async (vision) => {
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_ASSET_URL)
      const options = {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_URL,
          delegate: 'GPU' as const,
        },
        runningMode: 'IMAGE' as const,
        numFaces: 2,
      }

      try {
        return (await vision.FaceLandmarker.createFromOptions(
          fileset,
          options
        )) as FaceLandmarkerInstance
      } catch {
        return (await vision.FaceLandmarker.createFromOptions(fileset, {
          ...options,
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'CPU' as const,
          },
        })) as FaceLandmarkerInstance
      }
    })
  }

  return landmarkerPromise
}

export interface FaceLandmarkDetectionResult {
  landmarks: FaceLandmarkPoint[]
  faceCount: number
  connections: {
    tesselation: Array<{ start: number; end: number }>
    contours: Array<{ start: number; end: number }>
    irises: Array<{ start: number; end: number }>
  }
}

export async function detectFaceLandmarksFromImage(
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
): Promise<FaceLandmarkDetectionResult | null> {
  const [vision, landmarker] = await Promise.all([loadVisionTasks(), getFaceLandmarker()])
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
    connections: {
      tesselation: FaceLandmarker.FACE_LANDMARKS_TESSELATION ?? [],
      contours: FaceLandmarker.FACE_LANDMARKS_CONTOURS ?? [],
      irises: FaceLandmarker.FACE_LANDMARKS_IRISES ?? [],
    },
  }
}

export async function analyzeFaceGeometryFromFile(file: File): Promise<FaceGeometryAnalysis> {
  if (typeof window === 'undefined' || typeof createImageBitmap === 'undefined') {
    return {
      version: 'landmark-v1',
      status: 'unavailable',
      source: 'ai-fallback',
      faceDetected: false,
      faceCount: 0,
      qualityScore: 0,
      signals: [],
      warnings: ['Face landmark detection is not available in this browser.'],
    }
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const result = await detectFaceLandmarksFromImage(bitmap)
    return analyzeFaceLandmarks(result?.landmarks, {
      faceCount: result?.faceCount ?? 0,
      imageWidth: bitmap.width,
      imageHeight: bitmap.height,
    })
  } catch (error) {
    return {
      version: 'landmark-v1',
      status: 'unavailable',
      source: 'ai-fallback',
      faceDetected: false,
      faceCount: 0,
      qualityScore: 0,
      signals: [],
      warnings: [
        error instanceof Error
          ? `Face landmark detection failed: ${error.message}`
          : 'Face landmark detection failed.',
      ],
    }
  } finally {
    bitmap?.close()
  }
}
