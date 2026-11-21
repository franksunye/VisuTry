import {
  analyzeFaceLandmarks,
  classifyFaceGeometry,
  classifyJawProfile,
  classifyUpperFaceProfile,
} from '@/lib/face-landmark-metrics'
import type { FaceLandmarkPoint } from '@/types/face-analysis'
import {
  classifyFaceGeometry as sdkClassifyFaceGeometry,
  classifyJawProfile as sdkClassifyJawProfile,
  classifyUpperFaceProfile as sdkClassifyUpperFaceProfile,
} from '@visutry/tryon-core'
import baseline from './fixtures/face-geometry-pre-sdk.json'

/**
 * Expected values were captured from VisuTry main before the SDK migration.
 * This fixture stores outputs, not a second production implementation.
 * All points are synthetic; no customer photos or biometric records are used.
 */
function landmarksFor(fixture: (typeof baseline.measurementCases)[number]): FaceLandmarkPoint[] | null {
  if (fixture.absent) return null
  const points = Array.from({ length: fixture.count }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  const selected = { ...baseline.defaultPoints, ...fixture.overrides }
  for (const key of Object.keys(baseline.indices) as (keyof typeof baseline.indices)[]) {
    const index = baseline.indices[key]
    if (index >= points.length) continue
    const point = selected[key]
    if (point) points[index] = { ...point, z: 'z' in point ? Number(point.z) : 0 }
    else delete points[index]
  }
  return points
}

describe('shared SDK compatibility with frozen consumer geometry', () => {
  it('exports the installed SDK functions directly, without a local algorithm copy', () => {
    expect(classifyFaceGeometry).toBe(sdkClassifyFaceGeometry)
    expect(classifyJawProfile).toBe(sdkClassifyJawProfile)
    expect(classifyUpperFaceProfile).toBe(sdkClassifyUpperFaceProfile)
  })

  it('pins the independent pre-migration source revision', () => {
    expect(baseline.source.commit).toBe('66381dc7d7ccd053414a1c9069355c3ecef3e21c')
    expect(baseline.source.sha256).toBe('019cb6a5aa6bf51492f92c730adb9ab83c8203726e62204f44c83d2a22104901')
  })

  it.each(baseline.measurementCases)('preserves the public measurement contract: $name', (fixture) => {
    expect(analyzeFaceLandmarks(landmarksFor(fixture), fixture.options)).toEqual(fixture.expected)
  })

  it('preserves classifications, alternatives, confidence and tie order across 1,440 boundary combinations', () => {
    for (const fixture of baseline.classificationCases) {
      const [faceAspectRatio, jawToCheekWidth, foreheadToCheekWidth] = fixture.input
      const { shape, alternatives, confidence } = classifyFaceGeometry({
        faceAspectRatio,
        cheekToFaceWidth: 0.88,
        jawToCheekWidth,
        foreheadToCheekWidth,
        eyeLineTiltDeg: 0,
        symmetryOffset: 0,
        noseBridgeToFaceWidth: 0.12,
      })
      expect({ input: fixture.input, result: { shape, alternatives, confidence } }).toEqual({
        input: fixture.input,
        result: fixture.expected,
      })
    }
  })

  it('preserves all geometry signal text across length, jaw and upper-face boundaries', () => {
    for (const fixture of baseline.signalCases) {
      expect({ ratios: fixture.ratios, signals: classifyFaceGeometry(fixture.ratios).signals }).toEqual({
        ratios: fixture.ratios,
        signals: fixture.expected,
      })
    }
  })

  it('preserves profile semantics used by Store recommendations', () => {
    for (const fixture of baseline.profileCases) {
      expect({ value: fixture.value, jaw: classifyJawProfile(fixture.value), upper: classifyUpperFaceProfile(fixture.value) }).toEqual(fixture)
    }
    for (const invalid of [undefined, null, Number.NaN, Infinity, -Infinity]) {
      expect(classifyJawProfile(invalid)).toBeNull()
      expect(classifyUpperFaceProfile(invalid)).toBeNull()
    }
  })

  it.each([
    ['missing', undefined, undefined],
    ['zero width', 0, 1000],
    ['negative height', 1000, -1],
    ['non-finite width', Infinity, 1000],
    ['non-finite height', 1000, Number.NaN],
  ])('rejects %s image dimensions instead of assuming a square image', (_name, imageWidth, imageHeight) => {
    const geometry = analyzeFaceLandmarks(landmarksFor(baseline.measurementCases[0]), {
      faceCount: 1,
      imageWidth: imageWidth as number | undefined,
      imageHeight: imageHeight as number | undefined,
    })
    expect(geometry.status).toBe('unavailable')
    expect(geometry.failureReason).toBe('geometry_error')
    expect(geometry.measuredShape).toBeUndefined()
    expect(geometry.ratios).toBeUndefined()
    expect(geometry.qualityScore).toBe(0)
  })

  it.each([Number.NaN, Infinity, -Infinity])('rejects non-finite detector coordinates (%s)', (value) => {
    const points = landmarksFor(baseline.measurementCases[0])!
    points[baseline.indices.noseBridge].x = value
    const geometry = analyzeFaceLandmarks(points, baseline.measurementCases[0].options)
    expect(geometry.failureReason).toBe('geometry_error')
    expect(geometry.measuredShape).toBeUndefined()
    expect(JSON.stringify(geometry)).not.toContain('null')
  })

  it('rejects coincident outer eye points instead of treating atan2(0, 0) as a valid eye line', () => {
    const points = landmarksFor(baseline.measurementCases[0])!
    points[baseline.indices.rightEyeOuter] = { ...points[baseline.indices.leftEyeOuter] }
    const geometry = analyzeFaceLandmarks(points, baseline.measurementCases[0].options)
    expect(geometry.failureReason).toBe('geometry_error')
    expect(geometry.measuredShape).toBeUndefined()
  })

  it('honors an explicit no-face result even if stale landmarks remain', () => {
    const geometry = analyzeFaceLandmarks(landmarksFor(baseline.measurementCases[0]), {
      ...baseline.measurementCases[0].options,
      faceCount: 0,
    })
    expect(geometry.failureReason).toBe('no_face')
    expect(geometry.measuredShape).toBeUndefined()
  })

  it.each([Number.NaN, Infinity, -Infinity, -1, 0.5])('rejects an invalid detector face count (%s)', (faceCount) => {
    const geometry = analyzeFaceLandmarks(landmarksFor(baseline.measurementCases[0]), {
      ...baseline.measurementCases[0].options,
      faceCount,
    })
    expect(geometry.status).toBe('unavailable')
    expect(geometry.failureReason).toBe('geometry_error')
    expect(geometry.faceCount).toBe(0)
    expect(geometry.faceDetected).toBe(false)
    expect(geometry.measuredShape).toBeUndefined()
  })
})
