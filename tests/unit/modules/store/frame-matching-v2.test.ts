import {
  mapGeometryToShopperSignals,
  rankMerchantFrames,
} from '@/modules/store/domain'
import { parseRecommendFramesRequest } from '@/modules/store/contracts'

const frame = (overrides: Partial<{
  id: string
  merchantId: string
  shape: string
  widthClass: string | null
  styleTags: string[]
  material: string | null
  color: string | null
}> = {}) => ({
  id: 'frame-1',
  merchantId: 'merchant-1',
  name: 'Frame',
  shape: 'rectangle',
  widthClass: 'medium',
  styleTags: [],
  material: null,
  color: null,
  ...overrides,
})

describe('Merchant frame matching v2 signal mapping', () => {
  it('maps high-confidence geometry into semantic shopper signals', () => {
    expect(mapGeometryToShopperSignals({
      status: 'measured',
      measuredShape: 'Round',
      alternativeShapes: ['oblong', 'round'],
      measuredConfidence: 0.91,
      qualityScore: 94,
      faceAspectRatio: 1.12,
      jawToCheekWidth: 0.74,
      foreheadToCheekWidth: 0.95,
    })).toMatchObject({
      faceShape: 'round',
      faceShapeConfidence: 0.91,
      alternativeFaceShapes: ['oblong'],
      preferredWidthClass: 'wide',
      faceAspectRatio: 1.12,
      jawProfile: 'tapered',
      upperFaceProfile: 'broad',
      geometryQualityScore: 94,
    })
  })

  it('uses shared thresholds for balanced and strong upper/lower profiles', () => {
    expect(mapGeometryToShopperSignals({
      jawToCheekWidth: 0.83,
      foreheadToCheekWidth: 0.88,
    })).toMatchObject({
      jawProfile: 'balanced',
      upperFaceProfile: 'balanced',
    })
    expect(mapGeometryToShopperSignals({
      jawToCheekWidth: 0.94,
      foreheadToCheekWidth: 0.93,
    })).toMatchObject({
      jawProfile: 'strong',
      upperFaceProfile: 'broad',
    })
  })

  it('does not invent face signals for unavailable or incomplete geometry', () => {
    expect(mapGeometryToShopperSignals({
      status: 'unavailable',
      measuredShape: 'round',
      faceAspectRatio: 1.1,
      qualityScore: 20,
    })).toMatchObject({
      faceShape: null,
      alternativeFaceShapes: [],
      preferredWidthClass: null,
      geometryQualityScore: null,
    })
    expect(mapGeometryToShopperSignals({
      status: 'measured',
      measuredShape: 'oval',
    })).toMatchObject({
      faceShape: 'oval',
      faceShapeConfidence: null,
      faceAspectRatio: null,
      jawProfile: null,
      upperFaceProfile: null,
    })
  })
})

describe('Merchant frame ranking v2', () => {
  it('keeps primary face compatibility ahead of unrelated silhouettes', () => {
    const result = rankMerchantFrames([
      frame({ id: 'rectangle', shape: 'rectangle' }),
      frame({ id: 'unrelated', shape: 'shield' }),
    ], {
      faceShape: 'round',
      faceShapeConfidence: 0.92,
      geometryQualityScore: 94,
    }, { merchantId: 'merchant-1', limit: 6 })

    expect(result.rankingVersion).toBe('store-rank-v2')
    expect(result.frames[0]?.frameId).toBe('rectangle')
    expect(result.frames[0]?.score).toBeGreaterThanOrEqual(0)
    expect(result.frames[0]?.score).toBeLessThanOrEqual(100)
    expect(result.frames[0]?.reason).toMatch(/Balances your round face/)
  })

  it('gives an alternative face shape partial credit', () => {
    const result = rankMerchantFrames([
      frame({ id: 'alternative', shape: 'aviator' }),
      frame({ id: 'unrelated', shape: 'shield' }),
    ], {
      faceShape: 'round',
      alternativeFaceShapes: ['oblong'],
      faceShapeConfidence: 0.8,
      geometryQualityScore: 82,
    }, { merchantId: 'merchant-1', limit: 6 })

    expect(result.frames[0]?.frameId).toBe('alternative')
    expect(result.frames[0]?.usedAlternativeShape).toBe(true)
    expect(result.frames[0]?.score).toBeLessThan(70)
  })

  it('uses width, structural, and style signals as bounded secondary dimensions', () => {
    const exactWidth = rankMerchantFrames([
      frame({ id: 'exact', shape: 'shield', widthClass: 'wide', styleTags: ['minimal'] }),
      frame({ id: 'other', shape: 'shield', widthClass: 'narrow', styleTags: [] }),
    ], {
      preferredWidthClass: 'wide',
      jawProfile: 'tapered',
      upperFaceProfile: 'narrower',
      styleHints: ['minimal'],
    }, { merchantId: 'merchant-1', limit: 6 })

    expect(exactWidth.frames[0]?.frameId).toBe('exact')
    expect(exactWidth.frames[0]?.reason).toContain('wide-width')
    expect(exactWidth.frames.every((item) => item.score <= 100)).toBe(true)
  })

  it('reduces geometry dominance when quality is low but keeps catalog ranking alive', () => {
    const high = rankMerchantFrames([
      frame({ id: 'primary', shape: 'rectangle' }),
      frame({ id: 'other', shape: 'round' }),
    ], {
      faceShape: 'round',
      faceShapeConfidence: 0.92,
      geometryQualityScore: 94,
    }, { merchantId: 'merchant-1', limit: 6 })
    const low = rankMerchantFrames([
      frame({ id: 'primary', shape: 'rectangle' }),
      frame({ id: 'other', shape: 'round' }),
    ], {
      faceShape: 'round',
      faceShapeConfidence: 0.42,
      geometryQualityScore: 45,
    }, { merchantId: 'merchant-1', limit: 6 })

    const highGap = high.frames[0]!.score - high.frames[1]!.score
    const lowGap = low.frames[0]!.score - low.frames[1]!.score
    expect(high.frames).toHaveLength(2)
    expect(low.frames).toHaveLength(2)
    expect(highGap).toBeGreaterThan(lowGap)
  })

  it('stays deterministic, tenant-scoped, and tolerant of sparse metadata', () => {
    const frames = [
      frame({ id: 'merchant-one', merchantId: 'merchant-1', shape: '', widthClass: null }),
      frame({ id: 'merchant-two', merchantId: 'merchant-2', shape: 'rectangle' }),
    ]
    const signals = { faceShape: 'round', faceShapeConfidence: 0.8, geometryQualityScore: 80 }
    const first = rankMerchantFrames(frames, signals, { merchantId: 'merchant-1', limit: 6 })
    const second = rankMerchantFrames(frames, signals, { merchantId: 'merchant-1', limit: 6 })

    expect(first).toEqual(second)
    expect(first.frames.map((item) => item.frameId)).toEqual(['merchant-one'])
    expect(first.frames[0]?.reason).toBeTruthy()
  })
})

describe('Merchant recommendation geometry transport', () => {
  it('accepts and clamps the allowed geometry subset while ignoring unknown fields', () => {
    const result = parseRecommendFramesRequest({
      merchantSlug: 'merchant-1',
      merchantSessionId: 'session-1',
      measuredShape: 'round',
      geometryAnalysis: {
        status: 'measured',
        measuredShape: 'oval',
        alternativeShapes: ['oblong', 'diamond', 'ignored-third'],
        measuredConfidence: 4,
        qualityScore: -10,
        ratios: {
          faceAspectRatio: 9,
          jawToCheekWidth: 0.83,
          foreheadToCheekWidth: 0.88,
          rawLandmarks: [[0.1, 0.2]],
        },
        score: 1000,
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.geometryAnalysis).toEqual({
        status: 'measured',
        measuredShape: 'oval',
        alternativeShapes: ['oblong', 'diamond'],
        measuredConfidence: 1,
        qualityScore: 0,
        ratios: {
          faceAspectRatio: 2.2,
          jawToCheekWidth: 0.83,
          foreheadToCheekWidth: 0.88,
        },
      })
    }
  })
})
