import {
  DECISION_RESULT_MAX_FRAME_REFS,
  DECISION_RESULT_MAX_TRYON_REFS,
  decisionResultExpiresAt,
  sanitizeDecisionResultPayload,
} from '@/modules/store/domain/decision-result'

describe('canonical Decision Result payload', () => {
  it('keeps only bounded, non-photo decision references', () => {
    const payload = sanitizeDecisionResultPayload({
      journey: { experienceType: 'STORE', enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'NOT_A_STAGE'] },
      recommendation: {
        rankingVersion: 'rank-v1',
        frames: [
          {
            frameId: 'frame-1',
            sku: 'SKU-1',
            name: 'Round frame',
            productUrl: 'https://merchant.test/frame-1',
            score: 92,
            reason: 'Balanced proportions',
            imageUrl: 'https://private.test/shopper-photo.png',
          },
          { imageUrl: 'https://private.test/raw-face.png' },
        ],
      },
      tryOnResults: [
        { taskId: 'task-1', frameId: 'frame-1', status: 'COMPLETED', completedAt: '2026-09-26T00:00:00.000Z', resultImageUrl: 'data:image/png;base64,raw' },
        { taskId: 'task-2', frameId: 'frame-2', status: 'PROCESSING', completedAt: '2026-09-26T00:00:00.000Z' },
      ],
      rawPhotoUrl: 'https://private.test/raw-face.png',
    })

    expect(payload.recommendation?.frames).toEqual([{
      frameId: 'frame-1',
      sku: 'SKU-1',
      name: 'Round frame',
      productUrl: 'https://merchant.test/frame-1',
      score: 92,
      reason: 'Balanced proportions',
    }])
    expect(payload.tryOnResults).toEqual([{
      source: 'LIVE_TRYON',
      taskId: 'task-1',
      frameId: 'frame-1',
      status: 'COMPLETED',
      completedAt: '2026-09-26T00:00:00.000Z',
    }])
    expect(payload.journey.enabledStages).toEqual(['FACE_ANALYSIS', 'RECOMMENDATION'])
    expect(JSON.stringify(payload)).not.toContain('raw-face')
  })

  it('persists prepared provenance as a distinct typed source and rejects incomplete prepared references', () => {
    const payload = sanitizeDecisionResultPayload({
      tryOnResults: [
        {
          source: 'PREPARED_DEMO',
          sourceRef: {
            assetKey: 'demo-rowan-v1',
            provenanceId: 'reviewed-demo-rowan-v1',
            manifestVersion: '1',
            shopperProfileId: 'visutry-demo-shopper-v1',
            shopperProfileVersion: '1',
          },
          frameId: 'frame-rowan',
          status: 'PREPARED',
          presentedAt: '2026-09-30T00:00:00.000Z',
          taskId: 'must-not-become-a-task',
        },
        {
          source: 'PREPARED_DEMO',
          sourceRef: { assetKey: 'missing-provenance' },
          frameId: 'frame-lane',
          status: 'PREPARED',
          presentedAt: '2026-09-30T00:00:00.000Z',
        },
      ],
    })

    expect(payload.tryOnResults).toEqual([{
      source: 'PREPARED_DEMO',
      sourceRef: {
        assetKey: 'demo-rowan-v1',
        provenanceId: 'reviewed-demo-rowan-v1',
        manifestVersion: '1',
        shopperProfileId: 'visutry-demo-shopper-v1',
        shopperProfileVersion: '1',
      },
      frameId: 'frame-rowan',
      status: 'PREPARED',
      presentedAt: '2026-09-30T00:00:00.000Z',
    }])
    expect(JSON.stringify(payload)).not.toContain('must-not-become-a-task')
  })

  it('bounds all persisted shopper references', () => {
    const payload = sanitizeDecisionResultPayload({
      recommendation: {
        rankingVersion: 'rank-v1',
        frames: Array.from({ length: 20 }, (_, index) => ({
          frameId: `frame-${index}`,
          name: `Frame ${index}`,
          score: index,
          reason: 'reason',
        })),
      },
      tryOnResults: Array.from({ length: 20 }, (_, index) => ({
        taskId: `task-${index}`,
        frameId: `frame-${index}`,
        status: 'COMPLETED',
        completedAt: '2026-09-26T00:00:00.000Z',
      })),
    })

    expect(payload.recommendation?.frames).toHaveLength(DECISION_RESULT_MAX_FRAME_REFS)
    expect(payload.tryOnResults).toHaveLength(DECISION_RESULT_MAX_TRYON_REFS)
  })

  it('uses an explicit expiry boundary', () => {
    const from = new Date('2026-09-26T00:00:00.000Z')
    expect(decisionResultExpiresAt(from).getTime()).toBe(from.getTime() + 24 * 60 * 60 * 1000)
  })
})
