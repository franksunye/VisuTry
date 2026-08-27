import {
  assertCampaignPublishable,
  campaignReadinessForControlCenter,
  evaluateCampaignReadiness,
} from '@/modules/store/domain/campaign-readiness'

const readyFrame = { status: 'ACTIVE', valid: true }

describe('canonical Campaign readiness', () => {
  it('is ready only when name, headline, active valid frames, and publishable status are present', () => {
    const result = evaluateCampaignReadiness({
      name: 'Spring Edit',
      headline: 'Try the edit',
      status: 'DRAFT',
      startAt: null,
      endAt: null,
      primaryCtaUrl: null,
      secondaryCtaUrl: null,
      frames: [readyFrame],
    })
    expect(result).toEqual({ ready: true, blockingIssues: [], warnings: [] })
  })

  it('blocks missing headline even when frames are valid', () => {
    const result = evaluateCampaignReadiness({
      name: 'Spring Edit',
      headline: '  ',
      status: 'DRAFT',
      startAt: null,
      endAt: null,
      primaryCtaUrl: null,
      secondaryCtaUrl: null,
      frames: [readyFrame],
    })
    expect(result.ready).toBe(false)
    expect(result.blockingIssues).toContain('HEADLINE_REQUIRED')
  })

  it('blocks archived status from republish', () => {
    const result = evaluateCampaignReadiness({
      name: 'Spring Edit',
      headline: 'Try the edit',
      status: 'ARCHIVED',
      startAt: null,
      endAt: null,
      primaryCtaUrl: 'javascript:alert(1)',
      secondaryCtaUrl: null,
      frames: [readyFrame],
    })
    expect(result.blockingIssues).toEqual(expect.arrayContaining(['STATUS_NOT_PUBLISHABLE', 'INVALID_PRIMARY_CTA']))
  })

  it('requires explicit approval before readiness is even consulted', () => {
    try {
      assertCampaignPublishable({ ready: true, blockingIssues: [], warnings: [] }, false)
      throw new Error('expected approval error')
    } catch (error) {
      expect(error).toMatchObject({ code: 'PUBLISH_APPROVAL_REQUIRED' })
    }
    try {
      assertCampaignPublishable({ ready: false, blockingIssues: ['FRAMES_REQUIRED'], warnings: [] }, true)
      throw new Error('expected readiness error')
    } catch (error) {
      expect(error).toMatchObject({ code: 'CAMPAIGN_NOT_READY', httpStatus: 409 })
    }
  })

  it('maps empty frames to Control Center INCOMPLETE using the same blocking codes', () => {
    const readiness = evaluateCampaignReadiness({
      name: 'Historical Campaign',
      headline: null,
      status: 'ACTIVE',
      startAt: null,
      endAt: null,
      primaryCtaUrl: null,
      secondaryCtaUrl: null,
      frames: [],
    })
    expect(campaignReadinessForControlCenter(readiness, [])).toMatchObject({
      status: 'INCOMPLETE',
      issues: expect.arrayContaining(['HEADLINE_REQUIRED', 'FRAMES_REQUIRED']),
    })
  })
})
