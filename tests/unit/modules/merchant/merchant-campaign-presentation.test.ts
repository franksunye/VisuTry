import { merchantCampaignIssueCopy, merchantCampaignPolicyLabel, resolveMerchantCampaignPresentation } from '@/modules/merchant/domain/merchant-campaign-presentation'

describe('Merchant Campaign presentation', () => {
  it('keeps a healthy draft private and explicitly requires human publish approval', () => {
    expect(resolveMerchantCampaignPresentation({ status: 'DRAFT', readiness: { ready: true, blockingIssues: [] } })).toEqual({
      lifecycle: 'Draft', readiness: 'Ready to publish', visibility: 'Private draft', issues: [], primaryAction: 'Continue setup', canPublish: true, liveSaveWarning: null,
    })
  })

  it('presents blocking issues in merchant language instead of internal readiness codes', () => {
    const presentation = resolveMerchantCampaignPresentation({ status: 'DRAFT', readiness: { ready: false, blockingIssues: ['HEADLINE_REQUIRED', 'FRAMES_REQUIRED'] } })
    expect(presentation.issues).toEqual(['Add a shopper-facing headline.', 'Select at least one ready Catalog product.'])
    expect(presentation.canPublish).toBe(false)
    expect(merchantCampaignIssueCopy('SOME_FUTURE_CODE')).not.toContain('SOME_FUTURE_CODE')
  })

  it('describes immediate shopper visibility for Live saves and never offers republish', () => {
    expect(resolveMerchantCampaignPresentation({ status: 'ACTIVE', readiness: { ready: true, blockingIssues: [] } })).toMatchObject({
      lifecycle: 'Live', readiness: 'Ready', visibility: 'Public link available', primaryAction: 'View live Campaign', canPublish: false,
      liveSaveWarning: 'Saving changes updates the live Campaign visible to shoppers.',
    })
  })

  it('keeps Archived distinct from deleted and not publishable', () => {
    expect(resolveMerchantCampaignPresentation({ status: 'ARCHIVED', readiness: { ready: true, blockingIssues: [] } })).toMatchObject({
      lifecycle: 'Archived', readiness: 'Archived', visibility: 'Archived link may remain accessible', canPublish: false,
    })
  })

  it('maps current policy values to human-facing labels', () => {
    expect(merchantCampaignPolicyLabel({ objective: 'INTENT', gate: 'OPT_IN_AFTER_VALUE', presentationMode: 'EDITORIAL_FIRST' })).toEqual({
      objective: 'Encourage shopper interest', gate: 'Ask after shoppers see value', presentationMode: 'Story first',
    })
  })
})
