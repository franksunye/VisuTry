import {
  analyzeFaceLandmarks,
  buildMeasuredFaceMetrics,
  classifyFaceGeometry,
  normalizeGeometryAnalysis,
} from '@/lib/face-landmark-metrics'
import { FaceLandmarkPoint } from '@/types/face-analysis'

const indices = {
  top: 10,
  chin: 152,
  leftFace: 234,
  rightFace: 454,
  leftCheek: 123,
  rightCheek: 352,
  leftJaw: 172,
  rightJaw: 397,
  leftForehead: 103,
  rightForehead: 332,
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  noseLeft: 98,
  noseRight: 327,
  noseBridge: 168,
}

function makeLandmarks(overrides: Partial<Record<keyof typeof indices, FaceLandmarkPoint>>) {
  const points: FaceLandmarkPoint[] = Array.from({ length: 455 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  const defaults: Record<keyof typeof indices, FaceLandmarkPoint> = {
    top: { x: 0.5, y: 0.12 },
    chin: { x: 0.5, y: 0.86 },
    leftFace: { x: 0.25, y: 0.5 },
    rightFace: { x: 0.75, y: 0.5 },
    leftCheek: { x: 0.28, y: 0.52 },
    rightCheek: { x: 0.72, y: 0.52 },
    leftJaw: { x: 0.32, y: 0.72 },
    rightJaw: { x: 0.68, y: 0.72 },
    leftForehead: { x: 0.32, y: 0.28 },
    rightForehead: { x: 0.68, y: 0.28 },
    leftEyeOuter: { x: 0.38, y: 0.4 },
    rightEyeOuter: { x: 0.62, y: 0.4 },
    noseLeft: { x: 0.47, y: 0.5 },
    noseRight: { x: 0.53, y: 0.5 },
    noseBridge: { x: 0.5, y: 0.42 },
  }

  Object.entries({ ...defaults, ...overrides }).forEach(([key, point]) => {
    points[indices[key as keyof typeof indices]] = point
  })

  return points
}

describe('face-landmark-metrics', () => {
  it('measures landmarks and derives a supported face shape', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({}), { faceCount: 1 })

    expect(geometry.status).toBe('measured')
    expect(geometry.faceDetected).toBe(true)
    expect(geometry.qualityScore).toBeGreaterThan(80)
    expect(geometry.ratios?.faceAspectRatio).toBeCloseTo(1.48, 2)
    expect(geometry.measuredShape).toBe('oblong')
    expect(geometry.signals.length).toBeGreaterThan(0)
  })

  it('classifies heart and triangle style proportions', () => {
    expect(classifyFaceGeometry({
      faceAspectRatio: 1.26,
      cheekToFaceWidth: 0.86,
      jawToCheekWidth: 0.7,
      foreheadToCheekWidth: 0.92,
      eyeLineTiltDeg: 0,
      symmetryOffset: 0.01,
      noseBridgeToFaceWidth: 0.12,
    }).shape).toBe('heart')

    expect(classifyFaceGeometry({
      faceAspectRatio: 1.18,
      cheekToFaceWidth: 0.85,
      jawToCheekWidth: 1.02,
      foreheadToCheekWidth: 0.82,
      eyeLineTiltDeg: 0,
      symmetryOffset: 0.01,
      noseBridgeToFaceWidth: 0.12,
    }).shape).toBe('triangle')
  })

  it('builds landmark-sourced metrics when geometry is measured', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({}), { faceCount: 1 })
    const metrics = buildMeasuredFaceMetrics('oblong', 0.82, geometry)

    expect(metrics).toHaveLength(6)
    expect(metrics?.every((metric) => metric.source === 'landmark')).toBe(true)
    expect(metrics?.find((metric) => metric.id === 'faceLength')?.caption).toContain(':1')
  })

  it('normalizes untrusted geometry input and rejects invalid versions', () => {
    expect(normalizeGeometryAnalysis({ version: 'old' })).toBeNull()

    const normalized = normalizeGeometryAnalysis({
      version: 'landmark-v1',
      status: 'measured',
      source: 'mediapipe-face-landmarker',
      faceDetected: true,
      faceCount: 100,
      qualityScore: 200,
      measuredShape: 'hexagon',
      ratios: {
        faceAspectRatio: 9,
        cheekToFaceWidth: 0.8,
        jawToCheekWidth: 0.9,
        foreheadToCheekWidth: 0.8,
        eyeLineTiltDeg: 90,
        symmetryOffset: 2,
        noseBridgeToFaceWidth: 0.1,
      },
      signals: ['one', 'two'],
      warnings: ['warn'],
    })

    expect(normalized?.faceCount).toBe(10)
    expect(normalized?.qualityScore).toBe(100)
    expect(normalized?.measuredShape).toBeUndefined()
    expect(normalized?.ratios?.faceAspectRatio).toBe(2.2)
    expect(normalized?.ratios?.eyeLineTiltDeg).toBe(35)
  })
})
