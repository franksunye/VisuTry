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

function makePixelScaledLandmarks(width: number, height: number) {
  const centerX = width / 2
  const centerY = height / 2
  const toPoint = (x: number, y: number): FaceLandmarkPoint => ({
    x: x / width,
    y: y / height,
  })

  return makeLandmarks({
    top: toPoint(centerX, centerY - 300),
    chin: toPoint(centerX, centerY + 300),
    leftFace: toPoint(centerX - 200, centerY),
    rightFace: toPoint(centerX + 200, centerY),
    leftCheek: toPoint(centerX - 180, centerY + 20),
    rightCheek: toPoint(centerX + 180, centerY + 20),
    leftJaw: toPoint(centerX - 150, centerY + 210),
    rightJaw: toPoint(centerX + 150, centerY + 210),
    leftForehead: toPoint(centerX - 160, centerY - 180),
    rightForehead: toPoint(centerX + 160, centerY - 180),
    leftEyeOuter: toPoint(centerX - 95, centerY - 80),
    rightEyeOuter: toPoint(centerX + 95, centerY - 80),
    noseLeft: toPoint(centerX - 25, centerY),
    noseRight: toPoint(centerX + 25, centerY),
    noseBridge: toPoint(centerX, centerY - 30),
  })
}

describe('face-landmark-metrics', () => {
  it('measures landmarks and derives a supported face shape', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({}), { faceCount: 1 })

    expect(geometry.status).toBe('measured')
    expect(geometry.faceDetected).toBe(true)
    expect(geometry.qualityScore).toBeGreaterThan(80)
    expect(geometry.ratios?.faceAspectRatio).toBeCloseTo(1.48, 2)
    expect(geometry.measuredShape).toBe('oblong')
    expect(geometry.alternativeShapes).toEqual(expect.any(Array))
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

  it('keeps face ratios stable across portrait and landscape image dimensions', () => {
    const portrait = analyzeFaceLandmarks(makePixelScaledLandmarks(800, 1200), {
      faceCount: 1,
      imageWidth: 800,
      imageHeight: 1200,
    })
    const landscape = analyzeFaceLandmarks(makePixelScaledLandmarks(1200, 800), {
      faceCount: 1,
      imageWidth: 1200,
      imageHeight: 800,
    })

    expect(portrait.status).toBe('measured')
    expect(landscape.status).toBe('measured')
    expect(portrait.ratios?.faceAspectRatio).toBeCloseTo(1.5, 2)
    expect(landscape.ratios?.faceAspectRatio).toBeCloseTo(1.5, 2)
    expect(portrait.measuredShape).toBe(landscape.measuredShape)
  })

  it('rejects photos containing more than one face', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({}), { faceCount: 2 })

    expect(geometry.status).toBe('unavailable')
    expect(geometry.faceCount).toBe(2)
    expect(geometry.warnings[0]).toContain('exactly one face')
    expect(geometry.failureReason).toBe('multiple_faces')
  })

  it('reports no_face when no landmarks are provided', () => {
    const geometry = analyzeFaceLandmarks(null, { faceCount: 0 })

    expect(geometry.status).toBe('unavailable')
    expect(geometry.failureReason).toBe('no_face')
  })

  it('reports missing_landmarks when face is detected but landmarks are insufficient', () => {
    const shortLandmarks = Array.from({ length: 100 }, (_, i) => ({ x: 0.5, y: 0.5, z: 0 }))
    const geometry = analyzeFaceLandmarks(shortLandmarks, { faceCount: 1 })

    expect(geometry.status).toBe('unavailable')
    expect(geometry.failureReason).toBe('missing_landmarks')
  })

  it('rejects a face that is too tilted for reliable measurement', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({
      leftEyeOuter: { x: 0.38, y: 0.34 },
      rightEyeOuter: { x: 0.62, y: 0.46 },
    }), { faceCount: 1 })

    expect(geometry.status).toBe('unavailable')
    expect(geometry.warnings[0]).toContain('too tilted')
    expect(geometry.failureReason).toBe('tilted')
  })

  it('rejects a face that is off-center', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({
      noseBridge: { x: 0.62, y: 0.42 },
    }), { faceCount: 1 })

    expect(geometry.status).toBe('unavailable')
    expect(geometry.warnings[0]).toContain('off-center')
    expect(geometry.failureReason).toBe('off_center')
  })

  it('rejects a face that occupies too little of the image', () => {
    const tiny = makeLandmarks({
      top: { x: 0.5, y: 0.43 },
      chin: { x: 0.5, y: 0.57 },
      leftFace: { x: 0.44, y: 0.5 },
      rightFace: { x: 0.56, y: 0.5 },
    })
    const geometry = analyzeFaceLandmarks(tiny, { faceCount: 1 })

    expect(geometry.status).toBe('unavailable')
    expect(geometry.warnings[0]).toContain('too small')
    expect(geometry.failureReason).toBe('too_small')
  })

  it('builds landmark-sourced metrics when geometry is measured', () => {
    const geometry = analyzeFaceLandmarks(makeLandmarks({}), { faceCount: 1 })
    const metrics = buildMeasuredFaceMetrics('oblong', 0.82, geometry, {
      interpretation: 'landmark-only',
    })

    expect(metrics).toHaveLength(6)
    expect(metrics?.every((metric) => metric.source === 'landmark')).toBe(true)
    expect(metrics?.find((metric) => metric.id === 'faceLength')?.caption).toContain(':1')
    expect(metrics?.find((metric) => metric.id === 'faceShape')?.caption).toBe('Geometry match')
    expect(metrics?.find((metric) => metric.id === 'faceShape')?.detail).not.toContain('AI')
    expect(metrics?.find((metric) => metric.id === 'symmetry')?.label).toBe('Photo Alignment')
    expect(metrics?.find((metric) => metric.id === 'symmetry')?.caption).toBe('Centered in photo')
    expect(metrics?.find((metric) => metric.id === 'symmetry')?.detail).toContain('does not measure facial symmetry')
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
      alternativeShapes: ['oval', 'round', 'hexagon'],
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
    expect(normalized?.alternativeShapes).toEqual(['oval', 'round'])
    expect(normalized?.ratios?.faceAspectRatio).toBe(2.2)
    expect(normalized?.ratios?.eyeLineTiltDeg).toBe(35)
    expect(normalized?.failureReason).toBeUndefined()
  })

  it('preserves failureReason for unavailable geometry and rejects invalid values', () => {
    const valid = normalizeGeometryAnalysis({
      version: 'landmark-v1',
      status: 'unavailable',
      source: 'ai-fallback',
      faceDetected: false,
      faceCount: 0,
      qualityScore: 0,
      signals: [],
      warnings: ['No face detected'],
      failureReason: 'no_face',
    })

    expect(valid?.failureReason).toBe('no_face')

    const invalid = normalizeGeometryAnalysis({
      version: 'landmark-v1',
      status: 'unavailable',
      source: 'ai-fallback',
      faceDetected: false,
      faceCount: 0,
      qualityScore: 0,
      signals: [],
      warnings: ['Something'],
      failureReason: 'bogus_reason',
    })

    expect(invalid?.failureReason).toBeUndefined()

    const measuredWithReason = normalizeGeometryAnalysis({
      version: 'landmark-v1',
      status: 'measured',
      source: 'mediapipe-face-landmarker',
      faceDetected: true,
      faceCount: 1,
      qualityScore: 90,
      signals: [],
      warnings: [],
      failureReason: 'no_face',
    })

    expect(measuredWithReason?.failureReason).toBeUndefined()
  })
})
