import { analyzeFaceLandmarks } from '@/lib/face-landmark-metrics'
import { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const WASM_ASSET_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'

type FaceLandmarkerInstance = {
  detect: (image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks?: FaceLandmarkPoint[][]
  }
}

let landmarkerPromise: Promise<FaceLandmarkerInstance> | null = null

async function getFaceLandmarker(): Promise<FaceLandmarkerInstance> {
  if (!landmarkerPromise) {
    landmarkerPromise = import('@mediapipe/tasks-vision').then(async (vision) => {
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
    const landmarker = await getFaceLandmarker()
    bitmap = await createImageBitmap(file)
    const result = landmarker.detect(bitmap)
    const faces = result.faceLandmarks ?? []
    return analyzeFaceLandmarks(faces[0], { faceCount: faces.length })
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
