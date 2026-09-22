const issueCopy: Record<string, string> = {
  NAME_REQUIRED: 'Add a Campaign name.',
  HEADLINE_REQUIRED: 'Add a shopper-facing headline.',
  FRAMES_REQUIRED: 'Select at least one ready Catalog product.',
  INACTIVE_FRAMES: 'A selected product is no longer active.',
  INVALID_FRAMES: 'One or more selected products need attention in Catalog.',
  INVALID_DATE_RANGE: 'Check that the end date is after the start date.',
  INVALID_PRIMARY_CTA: 'Check the primary link.',
  INVALID_SECONDARY_CTA: 'Check the secondary link.',
  STATUS_NOT_PUBLISHABLE: 'This Campaign cannot be published in its current state.',
  FRAME_NOT_FOUND: 'A selected product is no longer available in Catalog.',
}

export type MerchantCampaignPresentation = {
  lifecycle: 'Draft' | 'Live' | 'Archived'
  readiness: 'Ready to publish' | 'Ready' | 'Needs attention' | 'Archived'
  visibility: 'Private draft' | 'Public link available' | 'Archived link may remain accessible'
  issues: string[]
  primaryAction: 'Continue setup' | 'View live Campaign' | 'Review archived Campaign'
  canPublish: boolean
  liveSaveWarning: string | null
}

export function merchantCampaignIssueCopy(code: string): string {
  return issueCopy[code] ?? 'Review this Campaign detail before publishing.'
}

export function resolveMerchantCampaignPresentation(campaign: {
  status: string
  readiness: { ready: boolean; blockingIssues: string[] }
}): MerchantCampaignPresentation {
  if (campaign.status === 'ARCHIVED') {
    return {
      lifecycle: 'Archived',
      readiness: 'Archived',
      visibility: 'Archived link may remain accessible',
      issues: [],
      primaryAction: 'Review archived Campaign',
      canPublish: false,
      liveSaveWarning: null,
    }
  }
  if (campaign.status === 'ACTIVE') {
    return {
      lifecycle: 'Live',
      readiness: campaign.readiness.ready ? 'Ready' : 'Needs attention',
      visibility: 'Public link available',
      issues: campaign.readiness.blockingIssues.map(merchantCampaignIssueCopy),
      primaryAction: 'View live Campaign',
      canPublish: false,
      liveSaveWarning: 'Saving changes updates the live Campaign visible to shoppers.',
    }
  }
  return {
    lifecycle: 'Draft',
    readiness: campaign.readiness.ready ? 'Ready to publish' : 'Needs attention',
    visibility: 'Private draft',
    issues: campaign.readiness.blockingIssues.map(merchantCampaignIssueCopy),
    primaryAction: 'Continue setup',
    canPublish: campaign.readiness.ready,
    liveSaveWarning: null,
  }
}

export function merchantCampaignPolicyLabel(input: { objective: string; gate: string; presentationMode: string }) {
  const objective: Record<string, string> = {
    TRAFFIC: 'Bring shoppers to products',
    INTENT: 'Encourage shopper interest',
    LEAD: 'Invite shoppers to get in touch',
  }
  const gate: Record<string, string> = {
    NONE: 'No sign-in prompt before exploring',
    OPT_IN_AFTER_VALUE: 'Ask after shoppers see value',
    OPT_IN_BEFORE_AI: 'Ask before AI-assisted features',
  }
  const presentationMode: Record<string, string> = {
    EDITORIAL_FIRST: 'Story first',
    PRODUCT_FIRST: 'Products first',
    ACTION_FIRST: 'Action first',
  }
  return {
    objective: objective[input.objective] ?? 'Encourage shopper interest',
    gate: gate[input.gate] ?? 'No sign-in prompt before exploring',
    presentationMode: presentationMode[input.presentationMode] ?? 'Story first',
  }
}
