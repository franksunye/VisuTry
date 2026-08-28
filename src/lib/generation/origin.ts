export type GenerationTelemetryOriginName = 'CONSUMER' | 'STORE' | 'CAMPAIGN'

export function resolveStoreTelemetryAttribution(experience: { id: string; type: string } | null | undefined): {
  telemetryOrigin: Exclude<GenerationTelemetryOriginName, 'CONSUMER'>
  campaignId: string | null
  storeId: string | null
} {
  if (experience?.type === 'CAMPAIGN') {
    return {
      telemetryOrigin: 'CAMPAIGN',
      campaignId: experience.id,
      storeId: null,
    }
  }
  return {
    telemetryOrigin: 'STORE',
    campaignId: null,
    storeId: experience?.id ?? null,
  }
}

/**
 * Canonical QA/reference marker. Reuses Merchant / Experience / Session.referenceData.
 * Do not invent a parallel identity model.
 */
export function resolveTelemetryIsTest(input: {
  isTest?: boolean | null
  merchantReferenceData?: boolean | null
  experienceReferenceData?: boolean | null
  sessionReferenceData?: boolean | null
}): boolean {
  return Boolean(
    input.isTest ||
      input.merchantReferenceData ||
      input.experienceReferenceData ||
      input.sessionReferenceData,
  )
}

export function resolveGenerationEnvironment(): string {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
}

export function resolveTelemetryOriginFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  taskOrigin?: string | null,
): GenerationTelemetryOriginName {
  const recorded = metadata?.telemetryOrigin
  if (recorded === 'CAMPAIGN' || recorded === 'STORE' || recorded === 'CONSUMER') {
    return recorded
  }
  if (taskOrigin === 'CONSUMER') return 'CONSUMER'
  if (typeof metadata?.campaignId === 'string' && metadata.campaignId) return 'CAMPAIGN'
  if (typeof metadata?.storeId === 'string' && metadata.storeId) return 'STORE'
  return taskOrigin === 'CONSUMER' ? 'CONSUMER' : 'STORE'
}
