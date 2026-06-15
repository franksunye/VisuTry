import {
  buildAvoidRecommendations,
  buildFaceMetrics,
  buildFrameRecommendations,
  buildReportStrengths,
  buildStyleTips,
  buildTryOnGuidance,
} from '@/lib/face-analysis-report'

describe('face-analysis-report', () => {
  it('builds deterministic metrics for a square face', () => {
    const metrics = buildFaceMetrics('square', 0.92)

    expect(metrics).toHaveLength(6)
    expect(metrics[0]).toMatchObject({
      id: 'faceShape',
      label: 'Face Shape',
      value: 'Square',
    })
    expect(metrics[0].source).toBe('ai-template')
    expect(metrics.every((metric) => metric.score >= 68 && metric.score <= 96)).toBe(true)
  })

  it('builds deterministic frame recommendations and avoid lists', () => {
    const recommended = buildFrameRecommendations('square')
    const avoid = buildAvoidRecommendations('square')

    expect(recommended[0]).toMatchObject({
      type: 'round',
      displayName: 'Round',
      score: 94,
    })
    expect(avoid[0]).toMatchObject({
      type: 'narrow-rectangle',
      displayName: 'Narrow Rectangle',
      score: 28,
    })
  })

  it('uses AI copy only when enough structured items exist', () => {
    expect(buildReportStrengths('oval', ['One', 'Two', 'Three'])).toEqual(['One', 'Two', 'Three'])
    expect(buildReportStrengths('oval', ['One'])).toHaveLength(3)

    expect(buildStyleTips('round', ['Tip 1', 'Tip 2', 'Tip 3'])).toHaveLength(3)
    expect(buildStyleTips('round', ['Tip 1'])[0].title).toBe('Add definition')
  })

  it('builds try-on guidance from top recommendations', () => {
    const guidance = buildTryOnGuidance('heart')

    expect(guidance.topStyles).toEqual(['Cat-Eye', 'Oval', 'Light Rimless', 'Bottom-Weighted'])
    expect(guidance.cta).toContain('Try')
  })
})
