import {
  buildAlgorithmOnlyFaceAnalysis,
  buildBasicResult,
  buildFullResult,
  buildLockedTeaser,
  parseFaceAnalysisContent,
} from '@/lib/face-analysis-parser'

describe('face-analysis-parser', () => {
  it('parses valid JSON content', () => {
    const raw = JSON.stringify({
      faceShape: 'square',
      confidence: 0.92,
      summary: 'Strong jawline with balanced proportions.',
      keyFeatures: ['Strong jawline', 'Wide forehead'],
      bestFrames: ['round frames', 'oval frames'],
      framesToAvoid: ['square frames'],
      styleGuide: 'Choose softer frame shapes to balance angles.',
    })

    const result = parseFaceAnalysisContent(raw)
    expect(result.faceShape).toBe('square')
    expect(result.confidence).toBe(0.92)
    expect(result.keyFeatures).toHaveLength(2)
  })

  it('parses JSON wrapped in markdown fences', () => {
    const raw = '```json\n{"faceShape":"oval","confidence":0.8,"summary":"Balanced","keyFeatures":["Balanced chin"],"bestFrames":["aviator"],"framesToAvoid":["narrow"],"styleGuide":"Try aviators."}\n```'
    const result = parseFaceAnalysisContent(raw)
    expect(result.faceShape).toBe('oval')
  })

  it('falls back invalid face shape to oval', () => {
    const raw = JSON.stringify({
      faceShape: 'hexagon',
      confidence: 1.5,
      summary: 'x',
      keyFeatures: [],
      bestFrames: [],
      framesToAvoid: [],
      styleGuide: '',
    })
    const result = parseFaceAnalysisContent(raw)
    expect(result.faceShape).toBe('oval')
    expect(result.confidence).toBe(1)
  })

  it('builds basic and full results with catalog enrichment', () => {
    const ai = parseFaceAnalysisContent(
      JSON.stringify({
        faceShape: 'square',
        confidence: 0.9,
        summary: 'Square face detected',
        keyFeatures: ['Angular jaw'],
        bestFrames: [],
        framesToAvoid: [],
        styleGuide: '',
      })
    )

    const basic = buildBasicResult(ai)
    expect(basic.faceShapeDisplayName).toBe('Square Face')
    expect(basic.keyFeatures).toContain('Angular jaw')

    const full = buildFullResult(ai)
    expect(full.bestFrames.length).toBeGreaterThan(0)
    expect(full.framesToAvoid.length).toBeGreaterThan(0)
  })


  it('uses measured geometry for provider-failure fallback and labels its provenance', () => {
    const geometry = {
      version: 'landmark-v1' as const,
      status: 'measured' as const,
      source: 'mediapipe-face-landmarker' as const,
      faceDetected: true,
      faceCount: 1,
      qualityScore: 82,
      measuredShape: 'heart' as const,
      measuredConfidence: 0.84,
      ratios: {
        faceAspectRatio: 1.28, cheekToFaceWidth: 0.89, jawToCheekWidth: 0.72,
        foreheadToCheekWidth: 0.91, eyeLineTiltDeg: 2, symmetryOffset: 0.03,
        noseBridgeToFaceWidth: 0.16,
      },
      signals: ['Forehead is wider than jaw'], warnings: [],
    }
    const result = buildAlgorithmOnlyFaceAnalysis(geometry)
    expect(result?.faceShape).toBe('heart')
    expect(result?.confidence).toBe(0.84)
    expect(result?.summary).toContain('AI interpretation is temporarily unavailable')
    const basic = buildBasicResult(result!, geometry, 'algorithm-only')
    const full = buildFullResult(result!, geometry, 'algorithm-only')
    expect(basic.analysisSource).toBe('algorithm-only')
    expect(full.analysisSource).toBe('algorithm-only')
    expect(full.frameRecommendations?.length).toBeGreaterThan(0)
    expect(full.geometry?.measuredShape).toBe('heart')
  })

  it('never fabricates a shape when landmark measurements are unreliable', () => {
    const valid = {
      version: 'landmark-v1' as const,
      status: 'measured' as const,
      source: 'mediapipe-face-landmarker' as const,
      faceDetected: true, faceCount: 1, qualityScore: 82,
      measuredShape: 'square' as const, measuredConfidence: 0.8,
      ratios: {
        faceAspectRatio: 1.2, cheekToFaceWidth: 0.9, jawToCheekWidth: 0.9,
        foreheadToCheekWidth: 0.88, eyeLineTiltDeg: 1, symmetryOffset: 0.02,
        noseBridgeToFaceWidth: 0.2,
      },
      signals: [], warnings: [],
    }
    expect(buildAlgorithmOnlyFaceAnalysis({ ...valid, status: 'unavailable' })).toBeNull()
    expect(buildAlgorithmOnlyFaceAnalysis({ ...valid, faceCount: 2 })).toBeNull()
    expect(buildAlgorithmOnlyFaceAnalysis({ ...valid, qualityScore: 45 })).toBeNull()
    expect(buildAlgorithmOnlyFaceAnalysis({ ...valid, measuredShape: undefined })).toBeNull()
    expect(buildAlgorithmOnlyFaceAnalysis({ ...valid, ratios: undefined })).toBeNull()
    expect(buildAlgorithmOnlyFaceAnalysis(null)).toBeNull()
  })

  it('throws on invalid JSON', () => {
    expect(() => parseFaceAnalysisContent('not json')).toThrow('AI response was not valid JSON')
  })

  it('builds locked teaser from full result preview fields', () => {
    const ai = parseFaceAnalysisContent(
      JSON.stringify({
        faceShape: 'round',
        confidence: 0.88,
        summary: 'Round face detected',
        keyFeatures: ['Soft jawline'],
        bestFrames: ['rectangular frames', 'square frames', 'aviator frames'],
        framesToAvoid: ['round frames', 'oversized frames'],
        styleGuide: 'Full style guide text.',
      })
    )
    const full = buildFullResult(ai)
    const teaser = buildLockedTeaser(full)

    expect(teaser.bestFrames).toEqual(['rectangular frames', 'square frames'])
    expect(teaser.framesToAvoid).toEqual(['round frames'])
    expect(teaser.catalogRecommendedStyles).toBeDefined()
  })
})
