import {
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
