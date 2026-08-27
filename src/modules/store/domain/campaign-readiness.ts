export class CampaignServiceError extends Error {
  readonly code: string
  readonly httpStatus: number

  constructor(code: string, message: string, httpStatus = 400) {
    super(message)
    this.name = 'CampaignServiceError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

export type CampaignReadinessFrameInput = {
  status: string | null
  valid: boolean
}

export type CampaignReadinessInput = {
  name: string
  headline: string | null | undefined
  status: string
  startAt: Date | null
  endAt: Date | null
  primaryCtaUrl: string | null | undefined
  secondaryCtaUrl: string | null | undefined
  frames: CampaignReadinessFrameInput[]
}

export type CampaignReadiness = {
  ready: boolean
  blockingIssues: string[]
  warnings: string[]
}

export type CampaignControlReadiness = {
  status: 'VALID' | 'NEEDS_ATTENTION' | 'INCOMPLETE'
  validCount: number
  invalidCount: number
  issues: string[]
}

export function isSafeCampaignCtaUrl(value: string | null | undefined): boolean {
  if (!value) return true
  if (/\s|[\u0000-\u001f\u007f]/u.test(value)) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Canonical Campaign publish readiness. MCP preview/publish, Merchant Control
 * Center, and Admin must use this evaluator instead of surface-local subsets.
 */
export function evaluateCampaignReadiness(input: CampaignReadinessInput): CampaignReadiness {
  const blockingIssues = [
    ...(input.name.trim() ? [] : ['NAME_REQUIRED']),
    ...(input.headline?.trim() ? [] : ['HEADLINE_REQUIRED']),
    ...(input.frames.length > 0 ? [] : ['FRAMES_REQUIRED']),
    ...(input.frames.every((frame) => frame.status === 'ACTIVE') ? [] : ['INACTIVE_FRAMES']),
    ...(input.frames.every((frame) => frame.valid) ? [] : ['INVALID_FRAMES']),
    ...(input.status === 'DRAFT' || input.status === 'ACTIVE' ? [] : ['STATUS_NOT_PUBLISHABLE']),
    ...(input.startAt && input.endAt && input.startAt >= input.endAt ? ['INVALID_DATE_RANGE'] : []),
    ...(isSafeCampaignCtaUrl(input.primaryCtaUrl) ? [] : ['INVALID_PRIMARY_CTA']),
    ...(isSafeCampaignCtaUrl(input.secondaryCtaUrl) ? [] : ['INVALID_SECONDARY_CTA']),
  ]
  return { ready: blockingIssues.length === 0, blockingIssues, warnings: [] }
}

export function assertCampaignPublishable(readiness: CampaignReadiness, approved: boolean): void {
  if (!approved) {
    throw new CampaignServiceError('PUBLISH_APPROVAL_REQUIRED', 'Publishing requires explicit approval.')
  }
  if (!readiness.ready) {
    throw new CampaignServiceError('CAMPAIGN_NOT_READY', 'Campaign is not ready to publish.', 409)
  }
}

export function campaignReadinessForControlCenter(
  readiness: CampaignReadiness,
  frames: Array<{ validation: { valid: boolean } }>,
): CampaignControlReadiness {
  const validCount = frames.filter((frame) => frame.validation.valid).length
  const invalidCount = frames.length - validCount
  if (readiness.ready) return { status: 'VALID', validCount, invalidCount, issues: [] }
  if (readiness.blockingIssues.includes('FRAMES_REQUIRED')) {
    return { status: 'INCOMPLETE', validCount, invalidCount, issues: readiness.blockingIssues }
  }
  return { status: 'NEEDS_ATTENTION', validCount, invalidCount, issues: readiness.blockingIssues }
}
